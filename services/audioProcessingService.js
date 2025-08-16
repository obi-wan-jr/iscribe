const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs-extra');
const path = require('path');

class AudioProcessingService {
    constructor() {
        this.tempDir = process.env.TEMP_AUDIO_DIR || './uploads';
        this.outputDir = process.env.AUDIO_OUTPUT_DIR || './output';
    }

    /**
     * Merge multiple audio files into a single MP3
     * @param {Array<string>} audioPaths - Array of audio file paths to merge
     * @param {string} outputPath - Path for the merged output file
     * @param {Function} progressCallback - Progress callback function
     * @returns {Promise<Object>} - {success: boolean, outputPath?: string, error?: string}
     */
    async mergeAudioFiles(audioPaths, outputPath, progressCallback = null) {
        return new Promise((resolve, reject) => {
            try {
                if (!audioPaths || audioPaths.length === 0) {
                    return resolve({
                        success: false,
                        error: 'No audio files provided for merging'
                    });
                }

                if (audioPaths.length === 1) {
                    // If only one file, just copy it
                    return this.copyAudioFile(audioPaths[0], outputPath, progressCallback)
                        .then(resolve)
                        .catch(reject);
                }

                console.log(`Merging ${audioPaths.length} audio files...`);

                // Ensure output directory exists
                fs.ensureDirSync(path.dirname(outputPath));

                // Create FFmpeg command
                const command = ffmpeg();

                // Add all input files
                audioPaths.forEach(audioPath => {
                    if (fs.existsSync(audioPath)) {
                        command.addInput(audioPath);
                    } else {
                        console.warn(`Audio file not found: ${audioPath}`);
                    }
                });

                // Set output options - use libmp3lame codec and simpler concatenation
                command
                    .audioCodec('libmp3lame')
                    .audioBitrate('128k')
                    .audioChannels(1) // Mono for smaller file size
                    .audioFrequency(22050) // Standard quality
                    .format('mp3')
                    .complexFilter([
                        // Concatenate all inputs
                        `concat=n=${audioPaths.length}:v=0:a=1[out]`
                    ])
                    .map('[out]')
                    .output(outputPath);

                // Set up progress tracking
                command.on('start', (commandLine) => {
                    console.log('FFmpeg command:', commandLine);
                    if (progressCallback) {
                        progressCallback(0, 'Starting audio merge...');
                    }
                });

                command.on('progress', (progress) => {
                    if (progressCallback && progress.percent) {
                        const percent = Math.round(progress.percent);
                        progressCallback(percent, `Merging audio: ${percent}%`);
                    }
                });

                command.on('error', async (err) => {
                    console.error('FFmpeg complex filter failed:', err.message);
                    console.log('Attempting fallback method...');
                    
                    // Try fallback method with simpler approach
                    try {
                        const fallbackResult = await this.mergeAudioFilesSimple(audioPaths, outputPath, progressCallback);
                        resolve(fallbackResult);
                    } catch (fallbackError) {
                        console.error('Fallback method also failed:', fallbackError.message);
                        resolve({
                            success: false,
                            error: `Audio merge failed: ${err.message}. Fallback also failed: ${fallbackError.message}`
                        });
                    }
                });

                command.on('end', () => {
                    console.log(`Audio merge completed: ${outputPath}`);
                    if (progressCallback) {
                        progressCallback(100, 'Audio merge completed');
                    }
                    
                    resolve({
                        success: true,
                        outputPath: outputPath,
                        fileSize: this.getFileSize(outputPath)
                    });
                });

                // Start the process
                command.run();

            } catch (error) {
                console.error('Audio processing setup error:', error);
                resolve({
                    success: false,
                    error: error.message
                });
            }
        });
    }

    /**
     * Simple audio merge fallback method (no complex filters)
     * @param {Array<string>} audioPaths - Array of audio file paths to merge
     * @param {string} outputPath - Path for the merged output file
     * @param {Function} progressCallback - Progress callback function
     * @returns {Promise<Object>} - {success: boolean, outputPath?: string, error?: string}
     */
    async mergeAudioFilesSimple(audioPaths, outputPath, progressCallback = null) {
        return new Promise((resolve, reject) => {
            try {
                if (!audioPaths || audioPaths.length === 0) {
                    return resolve({
                        success: false,
                        error: 'No audio files provided for merging'
                    });
                }

                if (audioPaths.length === 1) {
                    // If only one file, just copy it
                    return this.copyAudioFile(audioPaths[0], outputPath, progressCallback)
                        .then(resolve)
                        .catch(reject);
                }

                console.log(`Simple merge: ${audioPaths.length} audio files...`);

                // Ensure output directory exists
                fs.ensureDirSync(path.dirname(outputPath));

                // Create a simple concat input list for FFmpeg
                const inputList = audioPaths.map(file => `file '${file}'`).join('\n');
                const listFile = path.join(path.dirname(outputPath), 'concat_list.txt');
                
                fs.writeFileSync(listFile, inputList);

                // Use simple concat demuxer approach
                const command = ffmpeg()
                    .input(listFile)
                    .inputOptions(['-f', 'concat', '-safe', '0'])
                    .audioCodec('libmp3lame')
                    .audioBitrate('128k')
                    .output(outputPath);

                command.on('start', (commandLine) => {
                    console.log('Simple FFmpeg command:', commandLine);
                    if (progressCallback) {
                        progressCallback(0, 'Starting simple audio merge...');
                    }
                });

                command.on('progress', (progress) => {
                    if (progressCallback && progress.percent) {
                        const percent = Math.round(progress.percent);
                        progressCallback(percent, `Simple merging: ${percent}%`);
                    }
                });

                command.on('error', (err) => {
                    console.error('Simple merge error:', err.message);
                    // Clean up temp file
                    try { fs.unlinkSync(listFile); } catch (e) {}
                    resolve({
                        success: false,
                        error: `Simple audio merge failed: ${err.message}`
                    });
                });

                command.on('end', () => {
                    console.log(`Simple audio merge completed: ${outputPath}`);
                    
                    // Clean up temp file
                    try { fs.unlinkSync(listFile); } catch (e) {}
                    
                    if (progressCallback) {
                        progressCallback(100, 'Simple audio merge completed');
                    }
                    
                    resolve({
                        success: true,
                        outputPath: outputPath,
                        fileSize: this.getFileSize(outputPath)
                    });
                });

                // Start the process
                command.run();

            } catch (error) {
                console.error('Simple merge setup error:', error);
                resolve({
                    success: false,
                    error: error.message
                });
            }
        });
    }

    /**
     * Copy a single audio file (when only one chunk exists)
     * @param {string} sourcePath - Source audio file path
     * @param {string} outputPath - Destination path
     * @param {Function} progressCallback - Progress callback function
     * @returns {Promise<Object>} - {success: boolean, outputPath?: string, error?: string}
     */
    async copyAudioFile(sourcePath, outputPath, progressCallback = null) {
        try {
            console.log(`Copying single audio file: ${sourcePath} -> ${outputPath}`);
            
            if (progressCallback) {
                progressCallback(0, 'Copying audio file...');
            }

            // Ensure output directory exists
            await fs.ensureDir(path.dirname(outputPath));

            // Copy the file
            await fs.copy(sourcePath, outputPath);

            if (progressCallback) {
                progressCallback(100, 'Audio file copied');
            }

            return {
                success: true,
                outputPath: outputPath,
                fileSize: this.getFileSize(outputPath)
            };

        } catch (error) {
            console.error('Audio copy error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Process complete audio pipeline for Bible chapter with introduction
     * @param {string} introAudioPath - Path to chapter introduction audio
     * @param {Array<string>} chunkAudioPaths - Array of chunk audio file paths
     * @param {string} book - Bible book name
     * @param {number} chapter - Chapter number
     * @param {string} version - Bible version
     * @param {Function} progressCallback - Progress callback function
     * @returns {Promise<Object>} - {success: boolean, finalAudioPath?: string, metadata?: Object, error?: string}
     */
    async processChapterAudio(introAudioPath, chunkAudioPaths, book, chapter, version, progressCallback = null) {
        try {
            // Generate filename for final audio
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const filename = `${book}_${chapter}_${version}_${timestamp}.mp3`;
            const finalOutputPath = path.join(this.outputDir, filename);

            console.log(`Processing chapter audio: ${book} ${chapter} (${version})`);

            // Combine introduction with chapter chunks
            const allAudioPaths = [introAudioPath, ...chunkAudioPaths];
            console.log(`Merging introduction + ${chunkAudioPaths.length} content chunks`);

            // Merge introduction + all chunk audio files
            const mergeResult = await this.mergeAudioFiles(
                allAudioPaths, 
                finalOutputPath, 
                progressCallback
            );

            if (!mergeResult.success) {
                return mergeResult;
            }

            // Get audio metadata
            const metadata = await this.getAudioMetadata(finalOutputPath);

            // Clean up temporary chunk files (including intro)
            await this.cleanupChunkFiles([introAudioPath, ...chunkAudioPaths]);

            return {
                success: true,
                finalAudioPath: finalOutputPath,
                filename: filename,
                metadata: {
                    book,
                    chapter,
                    version,
                    duration: metadata.duration,
                    fileSize: metadata.fileSize,
                    bitrate: metadata.bitrate,
                    createdAt: new Date().toISOString()
                }
            };

        } catch (error) {
            console.error('Chapter audio processing error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Get audio file metadata
     * @param {string} audioPath - Path to audio file
     * @returns {Promise<Object>} - Audio metadata
     */
    async getAudioMetadata(audioPath) {
        return new Promise((resolve, reject) => {
            ffmpeg.ffprobe(audioPath, (err, metadata) => {
                if (err) {
                    console.error('FFprobe error:', err);
                    resolve({
                        duration: 0,
                        fileSize: this.getFileSize(audioPath),
                        bitrate: '128k'
                    });
                } else {
                    const duration = metadata.format.duration || 0;
                    const bitrate = metadata.format.bit_rate || '128000';
                    
                    resolve({
                        duration: Math.round(duration),
                        fileSize: this.getFileSize(audioPath),
                        bitrate: Math.round(bitrate / 1000) + 'k',
                        format: metadata.format.format_name
                    });
                }
            });
        });
    }

    /**
     * Clean up temporary chunk audio files
     * @param {Array<string>} chunkPaths - Array of chunk file paths to delete
     * @returns {Promise<void>}
     */
    async cleanupChunkFiles(chunkPaths) {
        try {
            console.log(`Cleaning up ${chunkPaths.length} temporary chunk files...`);
            
            for (const chunkPath of chunkPaths) {
                try {
                    if (await fs.pathExists(chunkPath)) {
                        await fs.remove(chunkPath);
                        console.log(`Deleted chunk: ${path.basename(chunkPath)}`);
                    }
                } catch (deleteError) {
                    console.warn(`Failed to delete chunk ${chunkPath}:`, deleteError.message);
                }
            }

            // Also try to remove the temporary directory if it's empty
            const tempChunkDir = path.dirname(chunkPaths[0]);
            try {
                const files = await fs.readdir(tempChunkDir);
                if (files.length === 0) {
                    await fs.remove(tempChunkDir);
                    console.log(`Removed empty temp directory: ${tempChunkDir}`);
                }
            } catch (dirError) {
                // Ignore directory cleanup errors
            }

        } catch (error) {
            console.warn('Cleanup error:', error.message);
        }
    }

    /**
     * Get file size in bytes
     * @param {string} filePath - Path to file
     * @returns {number} - File size in bytes
     */
    getFileSize(filePath) {
        try {
            const stats = fs.statSync(filePath);
            return stats.size;
        } catch (error) {
            return 0;
        }
    }

    /**
     * Format file size for display
     * @param {number} bytes - File size in bytes
     * @returns {string} - Formatted file size
     */
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    /**
     * Format duration for display
     * @param {number} seconds - Duration in seconds
     * @returns {string} - Formatted duration
     */
    formatDuration(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);
        
        if (hours > 0) {
            return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        } else {
            return `${minutes}:${secs.toString().padStart(2, '0')}`;
        }
    }

    /**
     * Validate FFmpeg installation and check codec support
     * @returns {Promise<Object>} - {available: boolean, version?: string, codecs?: Object, error?: string}
     */
    async validateFFmpeg() {
        return new Promise((resolve) => {
            ffmpeg.getAvailableFormats((err, formats) => {
                if (err) {
                    resolve({
                        available: false,
                        error: 'FFmpeg not found. Please install FFmpeg to use audio processing features.'
                    });
                } else {
                    // Check codec support
                    ffmpeg.getAvailableCodecs((codecErr, codecs) => {
                        const codecSupport = {
                            mp3: false,
                            libmp3lame: false,
                            aac: false
                        };
                        
                        if (!codecErr && codecs) {
                            codecSupport.mp3 = !!codecs.mp3;
                            codecSupport.libmp3lame = !!codecs.libmp3lame;
                            codecSupport.aac = !!codecs.aac;
                        }
                        
                        resolve({
                            available: true,
                            version: 'Available',
                            formats: Object.keys(formats).length,
                            codecs: codecSupport
                        });
                    });
                }
            });
        });
    }

    /**
     * Get list of generated audio files
     * @returns {Promise<Array>} - Array of audio file information
     */
    async getGeneratedAudioFiles() {
        try {
            await fs.ensureDir(this.outputDir);
            const files = await fs.readdir(this.outputDir);
            
            const audioFiles = files
                .filter(file => file.endsWith('.mp3'))
                .map(file => {
                    const filePath = path.join(this.outputDir, file);
                    const stats = fs.statSync(filePath);
                    
                    return {
                        filename: file,
                        path: filePath,
                        size: this.formatFileSize(stats.size),
                        created: stats.mtime.toISOString(),
                        downloadUrl: `/api/download/${file}`
                    };
                })
                .sort((a, b) => new Date(b.created) - new Date(a.created)); // Newest first

            return audioFiles;

        } catch (error) {
            console.error('Error reading audio files:', error);
            return [];
        }
    }
}

module.exports = AudioProcessingService;
