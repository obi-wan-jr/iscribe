const express = require('express');
const path = require('path');
const fs = require('fs-extra');
const multer = require('multer');
const router = express.Router();

// Import services
const BibleGatewayService = require('../services/bibleGatewayService');
const FishAudioService = require('../services/fishAudioService');
const AudioProcessingService = require('../services/audioProcessingService');
const VideoProcessingService = require('../services/videoProcessingService');
const jobQueueService = require('../services/jobQueueService');
const bibleBookData = require('../services/bibleBookData');

// Initialize services
const bibleService = new BibleGatewayService();
const fishAudioService = new FishAudioService();
const audioService = new AudioProcessingService();
const videoService = new VideoProcessingService();

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.join(process.env.TEMP_AUDIO_DIR || './uploads', 'images');
        fs.ensureDirSync(uploadDir);
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'bg-image-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    },
    fileFilter: function (req, file, cb) {
        // Accept image files only
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed!'), false);
        }
    }
});

/**
 * GET /api/health - Health check endpoint
 */
router.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        message: 'Audibible API is running',
        timestamp: new Date().toISOString(),
        services: {
            bibleGateway: 'available',
            fishAudio: 'available',
            audioProcessing: 'available'
        }
    });
});

/**
 * GET /api/bible/books - Get list of Bible books with chapter counts
 */
router.get('/bible/books', (req, res) => {
    try {
        const books = bibleBookData.getAllBooks();
        res.json({
            success: true,
            books: books,
            bookNames: bibleBookData.getBookNames()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/bible/validate/:book/:chapter - Validate book/chapter combination
 */
router.get('/bible/validate/:book/:chapter', (req, res) => {
    try {
        const { book, chapter } = req.params;
        const chapterNum = parseInt(chapter);
        
        const validation = bibleBookData.validateChapter(book, chapterNum);
        
        res.json({
            success: true,
            valid: validation.valid,
            book: book,
            chapter: chapterNum,
            maxChapters: bibleBookData.getChapterCount(book),
            message: validation.message || validation.error
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/config - Get configuration status
 */
router.get('/config', async (req, res) => {
    try {
        // Check FFmpeg availability
        const ffmpegStatus = await audioService.validateFFmpeg();
        
        const fishAudioConfigured = !!(process.env.FISH_AUDIO_API_KEY && process.env.FISH_AUDIO_VOICE_MODEL_ID);
        
        // Check video processing availability
        const videoAvailable = await videoService.validateImageFile('test').then(
            () => true,
            (err) => !err.message?.includes('Sharp library not installed')
        ).catch(() => false);

        res.json({
            fishAudioConfigured,
            voiceModelId: fishAudioConfigured ? process.env.FISH_AUDIO_VOICE_MODEL_ID : null,
            apiKeyConfigured: !!process.env.FISH_AUDIO_API_KEY,
            voiceModelConfigured: !!process.env.FISH_AUDIO_VOICE_MODEL_ID,
            maxChunkSize: process.env.CHUNK_SIZE_LIMIT || 4500,
            ffmpegAvailable: ffmpegStatus.available,
            ffmpegError: ffmpegStatus.error || null,
            videoProcessingAvailable: videoAvailable,
            port: process.env.PORT || 3005
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/bible/books - Get list of Bible books
 */
router.get('/bible/books', (req, res) => {
    try {
        const books = bibleService.getBibleBooks();
        res.json({ books });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/bible/versions - Get supported Bible versions
 */
router.get('/bible/versions', (req, res) => {
    try {
        const versions = bibleService.getSupportedVersions();
        res.json({ versions });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/validate-credentials - Validate Fish.Audio API credentials
 */
router.post('/validate-credentials', async (req, res) => {
    try {
        const { fishApiKey, voiceModelId } = req.body;
        
        if (!fishApiKey || !voiceModelId) {
            return res.status(400).json({ 
                error: 'Both fishApiKey and voiceModelId are required' 
            });
        }

        const validation = await fishAudioService.validateCredentials(fishApiKey, voiceModelId);
        
        if (validation.valid) {
            res.json({ valid: true, message: 'Credentials are valid' });
        } else {
            res.status(400).json({ valid: false, error: validation.error });
        }

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * DELETE /api/cleanup-image - Clean up persistent background image
 */
router.delete('/cleanup-image', async (req, res) => {
    try {
        const { imagePath } = req.body;
        
        if (imagePath && await fs.pathExists(imagePath)) {
            await fs.remove(imagePath);
            console.log('Cleaned up persistent image:', imagePath);
            res.json({ success: true, message: 'Image cleaned up' });
        } else {
            res.json({ success: true, message: 'Image already removed or not found' });
        }
    } catch (error) {
        console.error('Image cleanup error:', error);
        res.status(500).json({ error: 'Failed to cleanup image' });
    }
});

/**
 * POST /api/upload-image - Upload background image for video creation
 */
router.post('/upload-image', upload.single('backgroundImage'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No image file uploaded' });
        }

        // Validate the uploaded image
        const validation = await videoService.validateImageFile(req.file.path);
        
        if (!validation.valid) {
            // Clean up invalid file
            await fs.remove(req.file.path);
            
            // Check if this is a Sharp installation issue
            if (validation.error.includes('Sharp library not installed')) {
                return res.status(503).json({ 
                    error: 'Video processing not available',
                    details: 'Sharp image library not installed. Audio transcription is available.',
                    suggestion: 'Run: npm install sharp --build-from-source'
                });
            }
            
            return res.status(400).json({ error: validation.error });
        }

        // Create a persistent copy for multiple job usage
        const persistentDir = path.join(process.env.TEMP_AUDIO_DIR || './uploads', 'persistent_images');
        await fs.ensureDir(persistentDir);
        
        const persistentImagePath = path.join(persistentDir, `bg_${Date.now()}_${req.file.filename}`);
        await fs.copy(req.file.path, persistentImagePath);
        
        res.json({
            success: true,
            message: 'Image uploaded successfully',
            imageId: req.file.filename,
            imagePath: req.file.path, // Original path for immediate use
            persistentImagePath: persistentImagePath, // Persistent path for queued jobs
            imageInfo: {
                format: validation.format,
                width: validation.width,
                height: validation.height,
                size: req.file.size
            }
        });

    } catch (error) {
        console.error('Image upload error:', error);
        res.status(500).json({ error: 'Image upload failed: ' + error.message });
    }
});

/**
 * GET /api/queue - Get current queue status
 */
router.get('/queue', (req, res) => {
    try {
        const queueStatus = jobQueueService.getQueueStatus();
        res.json({
            success: true,
            ...queueStatus
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * DELETE /api/queue/:jobId - Cancel a job in queue
 */
router.delete('/queue/:jobId', (req, res) => {
    try {
        const { jobId } = req.params;
        const result = jobQueueService.cancelJob(jobId);
        
        if (result.success) {
            res.json({
                success: true,
                message: `Job ${jobId} cancelled`,
                job: result.job
            });
        } else {
            res.status(404).json({
                success: false,
                error: result.error
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/queue/clear-completed - Clear completed jobs history
 */
router.post('/queue/clear-completed', (req, res) => {
    try {
        jobQueueService.clearCompleted();
        res.json({
            success: true,
            message: 'Completed jobs history cleared'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/progress/:jobId - Server-Sent Events for real-time progress
 */
router.get('/progress/:jobId', (req, res) => {
    const { jobId } = req.params;
    
    // Set up Server-Sent Events
    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control'
    });

    // Store the response object for this job
    if (!global.progressStreams) {
        global.progressStreams = new Map();
    }
    global.progressStreams.set(jobId, res);

    // Send initial connection message
    res.write(`data: ${JSON.stringify({ 
        type: 'connected', 
        message: 'Progress stream connected',
        progress: 0 
    })}\n\n`);

    // Clean up on disconnect
    req.on('close', () => {
        global.progressStreams.delete(jobId);
    });

    req.on('aborted', () => {
        global.progressStreams.delete(jobId);
    });
});

// Helper function to send progress updates
function sendProgress(jobId, data) {
    if (global.progressStreams && global.progressStreams.has(jobId)) {
        const res = global.progressStreams.get(jobId);
        try {
            res.write(`data: ${JSON.stringify(data)}\n\n`);
        } catch (error) {
            console.error('Error sending progress:', error);
            global.progressStreams.delete(jobId);
        }
    }
}

/**
 * POST /api/transcribe - Main transcription endpoint (with optional video creation)
 */
router.post('/transcribe', async (req, res) => {
    try {
        const {
            book,
            chapter,
            version = 'WEB',
            maxSentences,
            fishApiKey: providedApiKey,
            voiceModelId: providedVoiceModelId,
            excludeVerseNumbers = true,
            createVideo = false,
            backgroundImagePath = null,
            transcribeFullBook = false
        } = req.body;

        // Use provided credentials or fall back to environment variables
        const fishApiKey = providedApiKey || process.env.FISH_AUDIO_API_KEY;
        const voiceModelId = providedVoiceModelId || process.env.FISH_AUDIO_VOICE_MODEL_ID;

        // Validate required parameters
        if (!book) {
            return res.status(400).json({
                error: 'Missing required parameter: book'
            });
        }
        
        // For single chapter, chapter is required. For full book, chapter should be null
        if (!transcribeFullBook && !chapter) {
            return res.status(400).json({
                error: 'Missing required parameter: chapter (or enable full book transcription)'
            });
        }

        if (!fishApiKey || !voiceModelId) {
            return res.status(400).json({
                error: 'Fish.Audio credentials not found. Please configure them in the .env file or via the web interface.'
            });
        }

        // Validate Bible reference
        if (!transcribeFullBook) {
            // Single chapter validation
            if (!bibleService.validateReference(book, parseInt(chapter))) {
                return res.status(400).json({
                    error: `Invalid Bible reference: ${book} ${chapter}`
                });
            }
        } else {
            // Full book validation - just check if book exists
            const bookNames = bibleService.getSupportedVersions().map(v => v.name); // This should be book names, but let's check if book is valid
            // For now, we'll validate the book exists by checking if it has chapters
            const chapterCount = bibleBookData.getChapterCount(book);
            if (!chapterCount) {
                return res.status(400).json({
                    error: `Invalid Bible book: ${book}`
                });
            }
        }

        // Generate unique job ID for progress tracking
        const jobId = `${book}_${transcribeFullBook ? 'FullBook' : chapter || 'Chapter'}_${Date.now()}`;
        
        console.log(`Queueing transcription job: ${book} ${transcribeFullBook ? 'Full Book' : (chapter || 'Unknown Chapter')} (${version}) [Job: ${jobId}]`);

        // Add job to queue
        const queueResult = jobQueueService.addJob({
            id: jobId,
            params: {
                book,
                chapter: transcribeFullBook ? null : parseInt(chapter),
                version,
                maxSentences,
                createVideo,
                backgroundImagePath,
                fishApiKey,
                voiceModelId,
                transcribeFullBook
            }
        });

        // Return job ID and queue status
        res.json({
            success: true,
            jobId: jobId,
            message: queueResult.position === 1 ? 'Transcription started' : `Job queued (position ${queueResult.position})`,
            progressUrl: `/api/progress/${jobId}`,
            queue: {
                position: queueResult.position,
                length: queueResult.queueLength,
                estimated_wait: queueResult.position > 1 ? `~${(queueResult.position - 1) * 3} minutes` : '0 minutes'
            }
        });

    } catch (error) {
        console.error('Transcription setup error:', error);
        res.status(500).json({
            error: 'Failed to start transcription',
            details: error.message
        });
    }
});

// Helper function to adjust progress for full book context
function adjustProgressForContext(progress, context) {
    if (!context || !context.isFullBookChapter) {
        return progress; // No adjustment needed for single chapter
    }
    
    // For full book: each chapter gets 1/totalChapters of the total progress
    const chapterWeight = 100 / context.totalChapters;
    const chapterProgress = (progress / 100) * chapterWeight;
    const baseProgress = (context.currentChapter - 1) * chapterWeight;
    
    return Math.round(baseProgress + chapterProgress);
}

// Helper function to send progress with context adjustment
function sendContextualProgress(jobId, data, context) {
    if (context && context.isFullBookChapter) {
        // Adjust progress for full book context
        data.progress = adjustProgressForContext(data.progress, context);
        data.message = `Chapter ${context.currentChapter}/${context.totalChapters}: ${data.message}`;
    }
    sendContextualProgress(jobId, data);
}

// Background transcription processing function
async function processTranscriptionInBackground(jobId, params, context = null) {
    try {
        const { book, chapter, version, maxSentences, createVideo, backgroundImagePath, fishApiKey, voiceModelId, transcribeFullBook } = params;

        // Handle full book transcription
        if (transcribeFullBook) {
            console.log(`Processing full book transcription for ${book}`);
            
            // Get total chapters for this book
            const totalChapters = bibleBookData.getChapterCount(book);
            if (!totalChapters) {
                sendProgress(jobId, {
                    type: 'error',
                    step: 'validation',
                    progress: 0,
                    message: `Invalid book: ${book}`,
                    error: `Book ${book} not found`
                });
                return;
            }
            
            console.log(`${book} has ${totalChapters} chapters to process`);
            
            // Process each chapter individually
            for (let chapterNum = 1; chapterNum <= totalChapters; chapterNum++) {
                const chapterProgress = Math.round((chapterNum - 1) / totalChapters * 100);
                
                sendProgress(jobId, {
                    type: 'progress',
                    step: 'book_progress',
                    progress: chapterProgress,
                    message: `Processing ${book} chapter ${chapterNum} of ${totalChapters}`,
                    details: `Full book transcription in progress`
                });
                
                // Process this chapter with the same parameters
                const chapterParams = {
                    ...params,
                    chapter: chapterNum,
                    transcribeFullBook: false // Process as individual chapter
                };
                
                try {
                    // Process this chapter but send progress updates to the main job ID
                    await processTranscriptionInBackground(jobId, chapterParams, {
                        isFullBookChapter: true,
                        currentChapter: chapterNum,
                        totalChapters: totalChapters,
                        baseProgress: chapterProgress
                    });
                } catch (error) {
                    console.error(`Failed to process ${book} chapter ${chapterNum}:`, error);
                    
                    sendProgress(jobId, {
                        type: 'warning',
                        step: 'chapter_error',
                        progress: chapterProgress,
                        message: `Warning: Failed to process chapter ${chapterNum}`,
                        details: error.message
                    });
                    // Continue with next chapter instead of stopping
                }
            }
            
            // Send completion for full book
            sendProgress(jobId, {
                type: 'completed',
                step: 'book_complete',
                progress: 100,
                message: `✅ Full book completed: ${book} (${totalChapters} chapters)`,
                details: `All ${totalChapters} chapters processed successfully`
            });
            
            return; // Exit here for full book processing
        }

        // Step 1: Fetch complete Bible chapter text (single chapter mode)
        sendContextualProgress(jobId, {
            type: 'progress',
            step: 'fetch_text',
            progress: 5,
            message: `Fetching ${book} ${chapter} (${version}) from BibleGateway...`,
            details: 'Downloading chapter text and cleaning verse numbers'
        }, context);

        const textResult = await bibleService.fetchChapter(book, chapter, version);

        if (!textResult.success) {
            sendContextualProgress(jobId, {
                type: 'error',
                step: 'fetch_text',
                progress: 5,
                message: 'Failed to fetch Bible text',
                error: textResult.error
            }, context);
            return;
        }

        const bibleText = textResult.text;
        console.log(`Fetched complete chapter: ${bibleText.length} characters, ${textResult.metadata.sentenceCount} sentences`);

        // Step 2: Chunk the text based on sentence limits for multiple files
        sendContextualProgress(jobId, {
            type: 'progress',
            step: 'chunk_text',
            progress: 10,
            message: 'Processing chapter text...',
            details: `Processing ${textResult.metadata.sentenceCount} sentences, ${bibleText.length} characters`
        }, context);

        const maxSentencesValue = maxSentences ? parseInt(maxSentences) : 5;
        console.log(`Chunking text with maxSentences: ${maxSentencesValue} (from job params: ${maxSentences})`);
        
        const textChunks = fishAudioService.chunkText(
            bibleText, 
            maxSentencesValue
        );
        console.log(`Text split into ${textChunks.length} chunks for processing with maxSentences=${maxSentencesValue}`);

        // Step 3: Create temporary directory for this job
        const tempDir = path.join(process.env.TEMP_AUDIO_DIR || './uploads', jobId);
        await fs.ensureDir(tempDir);

        // Step 4: Generate chapter introduction audio
        sendContextualProgress(jobId, {
            type: 'progress',
            step: 'generate_intro',
            progress: 15,
            message: `Creating chapter introduction...`,
            details: `Generating "${book}, Chapter ${chapter}" with Fish.Audio`
        }, context);

        console.log(`Generating chapter introduction: "${book}, Chapter ${chapter}"`);
        const introResult = await fishAudioService.generateChapterIntroduction(
            book,
            chapter,
            fishApiKey,
            voiceModelId,
            tempDir
        );

        if (!introResult.success) {
            await fs.remove(tempDir);
            sendContextualProgress(jobId, {
                type: 'error',
                step: 'generate_intro',
                progress: 15,
                message: 'Chapter introduction generation failed',
                error: introResult.error
            }, context);
            return;
        }

        console.log('Chapter introduction generated successfully');

        // Step 5: Generate audio for each text chunk
        sendContextualProgress(jobId, {
            type: 'progress',
            step: 'generate_chunks',
            progress: 20,
            message: `Generating audio for ${textChunks.length} text chunks...`,
            details: 'Creating speech audio with Fish.Audio TTS'
        }, context);

        const chunkResult = await fishAudioService.generateSpeechForChunks(
            textChunks,
            fishApiKey,
            voiceModelId,
            tempDir,
            (progress, message) => {
                console.log(`Content Progress: ${progress}% - ${message}`);
                // Clamp progress to 0-100 range and map to 20-70% range
                const clampedProgress = Math.min(100, Math.max(0, progress));
                const adjustedProgress = 20 + (clampedProgress * 0.5); // 20% to 70%
                sendContextualProgress(jobId, {
                    type: 'progress',
                    step: 'generate_chunks',
                    progress: Math.round(adjustedProgress),
                    message: message,
                    details: `Processing chunk audio with Fish.Audio`
                }, context);
            }
        );

        if (!chunkResult.success) {
            // Clean up temp directory on failure
            await fs.remove(tempDir);
            sendContextualProgress(jobId, {
                type: 'error',
                step: 'generate_chunks',
                progress: 20,
                message: 'Content audio generation failed',
                error: chunkResult.error
            }, context);
            return;
        }

        console.log(`Generated ${chunkResult.audioPaths.length} content audio chunks`);

        // Step 6: Merge introduction + all chunks into final audio file
        sendContextualProgress(jobId, {
            type: 'progress',
            step: 'merge_audio',
            progress: 70,
            message: 'Merging audio files...',
            details: `Combining introduction + ${chunkResult.audioPaths.length} parts into single MP3`
        });

        const audioResult = await audioService.processChapterAudio(
            introResult.audioPath,
            chunkResult.audioPaths,
            book,
            chapter,
            version,
            (progress, message) => {
                console.log(`Audio processing: ${progress}% - ${message}`);
                // FFmpeg sometimes reports progress > 100%, so clamp it strictly
                const clampedProgress = Math.min(100, Math.max(0, progress || 0));
                const adjustedProgress = 70 + (clampedProgress * 0.15); // 70% to 85%
                const finalProgress = Math.min(85, Math.max(70, adjustedProgress)); // Double-clamp to 70-85 range
                
                sendContextualProgress(jobId, {
                    type: 'progress',
                    step: 'merge_audio',
                    progress: Math.round(finalProgress),
                    message: message,
                    details: `Merging audio with FFmpeg`
                });
            }
        );

        if (!audioResult.success) {
            // Clean up temp directory on failure
            await fs.remove(tempDir);
            sendContextualProgress(jobId, {
                type: 'error',
                step: 'merge_audio',
                progress: 70,
                message: 'Audio processing failed',
                error: audioResult.error
            });
            return;
        }

        // Step 7: Create video if requested and image provided
        let videoResult = null;
        if (createVideo && backgroundImagePath) {
            sendContextualProgress(jobId, {
                type: 'progress',
                step: 'create_video',
                progress: 85,
                message: 'Creating video with background image...',
                details: 'Combining audio with static image to create MP4 video'
            });

            console.log('Creating video with background image...');
            
            // Validate image exists
            if (!(await fs.pathExists(backgroundImagePath))) {
                console.warn('Background image not found, skipping video creation');
                sendContextualProgress(jobId, {
                    type: 'warning',
                    step: 'create_video',
                    progress: 85,
                    message: 'Background image not found, skipping video creation',
                    details: 'Video will not be created, but audio is complete'
                });
            } else {
                videoResult = await videoService.createChapterVideo(
                    backgroundImagePath,
                    audioResult.finalAudioPath,
                    book,
                    chapter,
                    version,
                    (progress, message) => {
                        console.log(`Video processing: ${progress}% - ${message}`);
                        // FFmpeg video progress can also exceed 100%, so clamp it strictly
                        const clampedProgress = Math.min(100, Math.max(0, progress || 0));
                        const adjustedProgress = 85 + (clampedProgress * 0.1); // 85% to 95%
                        const finalProgress = Math.min(95, Math.max(85, adjustedProgress)); // Double-clamp to 85-95 range
                        
                        sendContextualProgress(jobId, {
                            type: 'progress',
                            step: 'create_video',
                            progress: Math.round(finalProgress),
                            message: message,
                            details: `Creating HD video with FFmpeg`
                        });
                    }
                );

                if (videoResult.success) {
                    console.log(`Video created: ${videoResult.filename}`);
                    
                    // Clean up background image after video creation (only if not persistent)
                    try {
                        // Only clean up temporary uploads, not persistent images
                        if (backgroundImagePath && !backgroundImagePath.includes('persistent_images')) {
                            await fs.remove(backgroundImagePath);
                            console.log('Cleaned up temporary background image');
                        } else {
                            console.log('Keeping persistent background image for other jobs');
                        }
                    } catch (cleanupError) {
                        console.warn('Failed to clean up background image:', cleanupError.message);
                    }

                    // Clean up audio file since video contains the audio
                    try {
                        await fs.remove(audioResult.finalAudioPath);
                        console.log(`Audio file deleted: ${audioResult.filename} (video contains audio)`);
                        
                        // Update response to indicate audio was cleaned up
                        audioResult.deletedForVideo = true;
                        audioResult.message = 'Audio merged into video and cleaned up';
                    } catch (audioCleanupError) {
                        console.warn('Failed to clean up audio file:', audioCleanupError.message);
                    }
                } else {
                    console.error(`Video creation failed: ${videoResult.error}`);
                }
            }
        }

        // Final cleanup and completion
        sendContextualProgress(jobId, {
            type: 'progress',
            step: 'cleanup',
            progress: 95,
            message: 'Cleaning up temporary files...',
            details: 'Removing temporary audio chunks and processing files'
        });

        // Clean up temp directory
        await fs.remove(tempDir);

        console.log(`Transcription completed: ${audioResult.filename}`);

        // Prepare final response
        const response = {
            success: true,
            message: videoResult?.success 
                ? 'Transcription and video creation completed successfully'
                : 'Transcription completed successfully',
            filename: audioResult.filename,
            downloadUrl: `/api/download/${audioResult.filename}`,
            metadata: {
                ...audioResult.metadata,
                textMetadata: textResult.metadata,
                chunkCount: textChunks.length,
                hasIntroduction: true,
                totalParts: textChunks.length + 1, // chunks + introduction
                processingTime: Date.now() - parseInt(jobId.split('_').pop())
            }
        };

        // Add video information if created
        if (videoResult?.success) {
            response.video = {
                filename: videoResult.filename,
                downloadUrl: `/api/download/${videoResult.filename}`,
                metadata: videoResult.metadata
            };
        } else if (videoResult?.error) {
            response.videoError = videoResult.error;
        }

        // Send final completion message
        sendContextualProgress(jobId, {
            type: 'completed',
            step: 'completed',
            progress: 100,
            message: response.message,
            details: `Files ready for download: ${audioResult.filename}${videoResult?.success ? ` and ${videoResult.filename}` : ''}`,
            result: response
        });

        // Close progress stream after a brief delay
        setTimeout(() => {
            if (global.progressStreams && global.progressStreams.has(jobId)) {
                global.progressStreams.get(jobId).end();
                global.progressStreams.delete(jobId);
            }
        }, 2000);

    } catch (error) {
        console.error('Background transcription error:', error);
        sendContextualProgress(jobId, {
            type: 'error',
            step: 'error',
            progress: 0,
            message: 'Transcription failed',
            error: error.message,
            details: 'An unexpected error occurred during processing'
        });

        // Clean up on error
        try {
            if (params.tempDir) {
                await fs.remove(params.tempDir);
            }
        } catch (cleanupError) {
            console.error('Cleanup error:', cleanupError);
        }
    }
}

/**
 * GET /api/download/:filename - Download generated audio/video file with friendly name
 */
router.get('/download/:filename', async (req, res) => {
    try {
        const { filename } = req.params;
        
        // Validate filename to prevent directory traversal
        if (!filename || filename.includes('..') || filename.includes('/')) {
            return res.status(400).json({ error: 'Invalid filename' });
        }

        const filePath = path.join(process.env.AUDIO_OUTPUT_DIR || './output', filename);
        
        // Check if file exists
        if (!(await fs.pathExists(filePath))) {
            return res.status(404).json({ error: 'File not found' });
        }

        // Extract metadata from filename for friendly download name
        let downloadName = filename;
        const ext = path.extname(filename).toLowerCase();
        
        // Try to parse filename: BookName_Chapter_Version_[VIDEO_]Date.ext
        const match = filename.match(/^(.+?)_(\d+)_([A-Z]+)(?:_VIDEO)?_(.+)\.(mp3|mp4)$/);
        if (match) {
            const [, book, chapter, version] = match;
            const isVideo = filename.includes('_VIDEO_');
            downloadName = `${book}_Chapter_${chapter}${isVideo ? '_Video' : ''}.${ext.substring(1)}`;
        }

        // Set appropriate headers for download
        let contentType = 'audio/mpeg';
        if (ext === '.mp4') {
            contentType = 'video/mp4';
        }

        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Disposition', `attachment; filename="${downloadName}"`);
        
        console.log(`Download: ${filename} → ${downloadName}`);
        
        // Stream the file
        const fileStream = fs.createReadStream(filePath);
        fileStream.pipe(res);

        fileStream.on('error', (error) => {
            console.error('File stream error:', error);
            if (!res.headersSent) {
                res.status(500).json({ error: 'Error streaming file' });
            }
        });

    } catch (error) {
        console.error('Download error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/files/debug - Debug endpoint to show raw file information
 */
router.get('/files/debug', async (req, res) => {
    try {
        const outputDir = process.env.AUDIO_OUTPUT_DIR || './output';
        
        // Check if directory exists
        const dirExists = await fs.pathExists(outputDir);
        const allFiles = dirExists ? await fs.readdir(outputDir) : [];
        
        console.log('Debug: Output directory exists:', dirExists);
        console.log('Debug: Output directory path:', outputDir);
        console.log('Debug: Raw files in directory:', allFiles);
        
        res.json({
            success: true,
            debug: {
                outputDir: outputDir,
                dirExists: dirExists,
                rawFiles: allFiles,
                fileCount: allFiles.length
            }
        });
    } catch (error) {
        console.error('Debug endpoint error:', error);
        res.status(500).json({ 
            error: 'Debug failed',
            details: error.message 
        });
    }
});

/**
 * GET /api/files - Get list of generated audio and video files
 */
router.get('/files', async (req, res) => {
    try {
        let audioFiles = [];
        let videoFiles = [];
        
        // Get audio files safely
        try {
            console.log('Loading audio files...');
            audioFiles = await audioService.getGeneratedAudioFiles();
            console.log(`Found ${audioFiles.length} audio files`);
        } catch (audioError) {
            console.error('Error loading audio files:', audioError);
            audioFiles = [];
        }
        
        // Get video files safely
        try {
            console.log('Loading video files...');
            videoFiles = await videoService.getGeneratedVideoFiles();
            console.log(`Found ${videoFiles.length} video files`);
        } catch (videoError) {
            console.error('Error loading video files:', videoError);
            videoFiles = [];
        }
        
        // Combine and sort by modification time (newest first)
        const allFiles = [
            ...audioFiles.map(file => ({ ...file, type: 'audio' })),
            ...videoFiles.map(file => ({ ...file, type: 'video' }))
        ].sort((a, b) => new Date(b.modified) - new Date(a.modified));
        
        console.log(`Total files combined: ${allFiles.length} (${audioFiles.length} audio, ${videoFiles.length} video)`);
        
        const response = { 
            files: allFiles,
            summary: {
                total: allFiles.length,
                audio: audioFiles.length,
                video: videoFiles.length
            }
        };
        
        console.log('Sending files response:', JSON.stringify(response, null, 2));
        res.json(response);
    } catch (error) {
        console.error('Error in /api/files:', error);
        res.status(500).json({ 
            error: 'Failed to load media files',
            details: error.message 
        });
    }
});

/**
 * DELETE /api/files/:filename - Delete a generated audio file
 */
router.delete('/files/:filename', async (req, res) => {
    try {
        const { filename } = req.params;
        
        // Validate filename
        if (!filename || filename.includes('..') || filename.includes('/')) {
            return res.status(400).json({ error: 'Invalid filename' });
        }

        const filePath = path.join(process.env.AUDIO_OUTPUT_DIR || './output', filename);
        
        if (await fs.pathExists(filePath)) {
            await fs.remove(filePath);
            res.json({ success: true, message: 'File deleted successfully' });
        } else {
            res.status(404).json({ error: 'File not found' });
        }

    } catch (error) {
        console.error('Delete error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/stats - Get application statistics
 */
router.get('/stats', async (req, res) => {
    try {
        const files = await audioService.getGeneratedAudioFiles();
        const totalFiles = files.length;
        const totalSize = files.reduce((sum, file) => {
            // Parse size string back to bytes for calculation
            const sizeMatch = file.size.match(/^([\d.]+)\s*(Bytes|KB|MB|GB)$/);
            if (sizeMatch) {
                const value = parseFloat(sizeMatch[1]);
                const unit = sizeMatch[2];
                const multipliers = { 'Bytes': 1, 'KB': 1024, 'MB': 1024*1024, 'GB': 1024*1024*1024 };
                return sum + (value * multipliers[unit]);
            }
            return sum;
        }, 0);

        res.json({
            totalFiles,
            totalSize: audioService.formatFileSize(totalSize),
            oldestFile: files.length > 0 ? files[files.length - 1].created : null,
            newestFile: files.length > 0 ? files[0].created : null
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Export both the router and the processing function for the job queue
module.exports = {
    router,
    processTranscriptionInBackground
};
