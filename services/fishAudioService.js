const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

class FishAudioService {
    constructor() {
        this.baseUrl = 'https://api.fish.audio/v1';
        this.maxChunkSize = parseInt(process.env.CHUNK_SIZE_LIMIT) || 4500;
    }

    /**
     * Generate speech from text using Fish.Audio TTS
     * @param {string} text - Text to convert to speech
     * @param {string} apiKey - Fish.Audio API key
     * @param {string} voiceModelId - Custom voice model ID
     * @param {string} outputPath - Path to save the audio file
     * @returns {Promise<Object>} - {success: boolean, audioPath?: string, error?: string}
     */
    async generateSpeech(text, apiKey, voiceModelId, outputPath) {
        try {
            console.log(`Generating speech for ${text.length} characters using Fish.Audio...`);
            
            const requestData = {
                text: text,
                reference_id: voiceModelId,
                format: 'mp3',
                mp3_bitrate: 128,
                normalize: true,
                latency: 'normal'
            };

            const response = await axios.post(`${this.baseUrl}/tts`, requestData, {
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json',
                    'Accept': 'audio/mpeg'
                },
                responseType: 'arraybuffer', // Important for binary audio data
                timeout: 60000 // 60 second timeout
            });

            if (response.status === 200) {
                // Ensure output directory exists
                await fs.ensureDir(path.dirname(outputPath));
                
                // Write audio data to file
                await fs.writeFile(outputPath, response.data);
                
                console.log(`Audio generated successfully: ${outputPath}`);
                
                return {
                    success: true,
                    audioPath: outputPath,
                    size: response.data.length
                };
            } else {
                throw new Error(`Fish.Audio API returned status ${response.status}`);
            }

        } catch (error) {
            console.error('Fish.Audio TTS error:', error.message);
            
            // Handle specific API errors
            if (error.response) {
                const status = error.response.status;
                const data = error.response.data;
                
                if (status === 401) {
                    return { success: false, error: 'Invalid Fish.Audio API key' };
                } else if (status === 400) {
                    return { success: false, error: 'Invalid request parameters' };
                } else if (status === 429) {
                    return { success: false, error: 'Rate limit exceeded. Please try again later.' };
                } else {
                    return { success: false, error: `API error: ${status} - ${data}` };
                }
            }
            
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Preprocess text to handle pauses and formatting
     * @param {string} text - The text to preprocess
     * @returns {string} Preprocessed text with pauses converted to SSML
     */
    preprocessText(text) {
        if (!text) return text;
        
        let processedText = text;
        
        // Convert pause markers to SSML breaks
        // Each / represents 0.5 seconds, // represents 1 second
        processedText = processedText.replace(/\/{3,}/g, '<break time="1.5s"/>'); // 3+ slashes = 1.5s
        processedText = processedText.replace(/\/\//g, '<break time="1s"/>'); // // = 1 second
        processedText = processedText.replace(/\//g, '<break time="0.5s"/>'); // / = 0.5 seconds
        
        // Convert markdown formatting to SSML
        processedText = processedText.replace(/\*\*(.*?)\*\*/g, '<emphasis level="strong">$1</emphasis>'); // Bold
        processedText = processedText.replace(/\*(.*?)\*/g, '<emphasis level="moderate">$1</emphasis>'); // Italic
        processedText = processedText.replace(/_(.*?)_/g, '<emphasis level="reduced">$1</emphasis>'); // Underline
        
        return processedText;
    }

    /**
     * Split text into chunks suitable for TTS processing
     * @param {string} text - Full text to chunk
     * @param {number|null} maxSentences - Maximum sentences per chunk (null for character-based chunking)
     * @returns {Array<string>} - Array of text chunks
     */
    chunkText(text, maxSentences = null) {
        // Preprocess text first to handle pauses and formatting
        const processedText = this.preprocessText(text);
        
        const chunks = [];
        
        console.log(`📄 FishAudioService.chunkText called with maxSentences: ${maxSentences}`);
        
        // First, split by sentences to maintain natural breaks
        const sentences = processedText.split(/([.!?]+\s*)/).filter(s => s.trim().length > 0);
        
        // If maxSentences is specified, use sentence-based chunking
        if (maxSentences && maxSentences > 0) {
            console.log(`✂️ Using sentence-based chunking with limit: ${maxSentences} sentences per chunk`);
            let currentChunk = '';
            let sentenceCount = 0;
            
            for (let i = 0; i < sentences.length; i += 2) {
                const sentence = sentences[i];
                const punctuation = sentences[i + 1] || '.';
                const fullSentence = sentence + punctuation;
                
                // If adding this sentence would exceed sentence limit, save current chunk
                if (sentenceCount >= maxSentences && currentChunk.length > 0) {
                    chunks.push(currentChunk.trim());
                    currentChunk = fullSentence;
                    sentenceCount = 1;
                } else {
                    currentChunk += fullSentence;
                    sentenceCount++;
                }
            }
            
            // Add the final chunk if it has content
            if (currentChunk.trim().length > 0) {
                chunks.push(currentChunk.trim());
            }
            
            console.log(`✅ Sentence-based chunking complete: ${chunks.length} chunks created (max ${maxSentences} sentences each)`);
        } else {
            // Use character-based chunking for API limits
            let currentChunk = '';
            
            for (let i = 0; i < sentences.length; i += 2) {
                const sentence = sentences[i];
                const punctuation = sentences[i + 1] || '.';
                const fullSentence = sentence + punctuation;
                
                // If adding this sentence would exceed chunk size, save current chunk
                if (currentChunk.length + fullSentence.length > this.maxChunkSize && currentChunk.length > 0) {
                    chunks.push(currentChunk.trim());
                    currentChunk = fullSentence;
                } else {
                    currentChunk += fullSentence;
                }
            }
            
            // Add the final chunk if it has content
            if (currentChunk.trim().length > 0) {
                chunks.push(currentChunk.trim());
            }
            
            console.log(`Text split into ${chunks.length} chunks (character-based)`);
        }
        
        return chunks;
    }

    /**
     * Generate speech with chapter introduction
     * @param {string} introText - Introduction text to speak
     * @param {string} apiKey - Fish.Audio API key
     * @param {string} voiceModelId - Custom voice model ID
     * @param {string} outputDir - Directory to save audio file
     * @returns {Promise<Object>} - {success: boolean, audioPath?: string, error?: string}
     */
    async generateChapterIntroduction(introText, apiKey, voiceModelId, outputDir) {
        try {
            const introPath = path.join(outputDir, 'intro.mp3');
            
            console.log(`Generating chapter introduction: "${introText}"`);
            
            const result = await this.generateSpeech(introText, apiKey, voiceModelId, introPath);
            return result;
            
        } catch (error) {
            console.error('Chapter introduction error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Generate speech for multiple text chunks
     * @param {Array<string>} textChunks - Array of text chunks
     * @param {string} apiKey - Fish.Audio API key
     * @param {string} voiceModelId - Custom voice model ID
     * @param {string} outputDir - Directory to save chunk audio files
     * @param {Function} progressCallback - Progress callback function
     * @returns {Promise<Object>} - {success: boolean, audioPaths?: Array<string>, error?: string}
     */
    async generateSpeechForChunks(textChunks, apiKey, voiceModelId, outputDir, progressCallback = null) {
        const audioPaths = [];
        const errors = [];
        
        try {
            await fs.ensureDir(outputDir);
            
            console.log(`Generating speech for ${textChunks.length} chunks...`);
            
            for (let i = 0; i < textChunks.length; i++) {
                const chunk = textChunks[i];
                const chunkFileName = `chunk_${i + 1}.mp3`;
                const chunkPath = path.join(outputDir, chunkFileName);
                
                // Update progress
                if (progressCallback) {
                    const progress = Math.round((i / textChunks.length) * 100);
                    progressCallback(progress, `Generating audio for chunk ${i + 1}/${textChunks.length}...`);
                }
                
                // Generate speech for this chunk
                const result = await this.generateSpeech(chunk, apiKey, voiceModelId, chunkPath);
                
                if (result.success) {
                    audioPaths.push(result.audioPath);
                    console.log(`Chunk ${i + 1}/${textChunks.length} completed`);
                } else {
                    errors.push(`Chunk ${i + 1}: ${result.error}`);
                    console.error(`Chunk ${i + 1} failed: ${result.error}`);
                }
                
                // Add small delay between requests to be respectful to the API
                if (i < textChunks.length - 1) {
                    await this.sleep(1000); // 1 second delay
                }
            }
            
            if (progressCallback) {
                progressCallback(100, 'All chunks processed');
            }
            
            if (errors.length > 0 && audioPaths.length === 0) {
                return {
                    success: false,
                    error: `All chunks failed: ${errors.join('; ')}`
                };
            } else if (errors.length > 0) {
                return {
                    success: true,
                    audioPaths,
                    warnings: errors
                };
            } else {
                return {
                    success: true,
                    audioPaths
                };
            }

        } catch (error) {
            console.error('Chunk processing error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Validate Fish.Audio API credentials
     * @param {string} apiKey - Fish.Audio API key
     * @param {string} voiceModelId - Voice model ID
     * @returns {Promise<Object>} - {valid: boolean, error?: string}
     */
    async validateCredentials(apiKey, voiceModelId) {
        try {
            // Test with a small text sample
            const testText = "Testing API credentials.";
            const tempDir = path.join(process.env.TEMP_AUDIO_DIR || './uploads', 'test');
            const testPath = path.join(tempDir, 'test.mp3');
            
            const result = await this.generateSpeech(testText, apiKey, voiceModelId, testPath);
            
            // Clean up test file
            try {
                await fs.remove(testPath);
                await fs.remove(tempDir);
            } catch (cleanupError) {
                console.warn('Failed to clean up test file:', cleanupError.message);
            }
            
            if (result.success) {
                return { valid: true };
            } else {
                return { valid: false, error: result.error };
            }

        } catch (error) {
            return { valid: false, error: error.message };
        }
    }

    /**
     * Get voice model information
     * @param {string} apiKey - Fish.Audio API key
     * @param {string} voiceModelId - Voice model ID
     * @returns {Promise<Object>} - Voice model details
     */
    async getVoiceModelInfo(apiKey, voiceModelId) {
        try {
            const response = await axios.get(`${this.baseUrl}/models/${voiceModelId}`, {
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.status === 200) {
                return {
                    success: true,
                    model: response.data
                };
            } else {
                throw new Error(`API returned status ${response.status}`);
            }

        } catch (error) {
            console.error('Voice model info error:', error.message);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Sleep utility
     * @param {number} ms - Milliseconds to sleep
     * @returns {Promise}
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Get estimated processing time
     * @param {string} text - Text to process
     * @returns {number} - Estimated time in seconds
     */
    getEstimatedProcessingTime(text) {
        const chunks = this.chunkText(text);
        const baseTimePerChunk = 5; // seconds
        const delayBetweenChunks = 1; // seconds
        
        return (chunks.length * baseTimePerChunk) + ((chunks.length - 1) * delayBetweenChunks);
    }

    /**
     * Calculate audio duration estimate
     * @param {string} text - Text to convert
     * @returns {number} - Estimated audio duration in seconds
     */
    getEstimatedAudioDuration(text) {
        // Average speaking rate is about 150-160 words per minute
        const wordsPerMinute = 155;
        const words = text.split(/\s+/).length;
        const minutes = words / wordsPerMinute;
        
        return Math.round(minutes * 60); // Return seconds
    }
}

module.exports = FishAudioService;
