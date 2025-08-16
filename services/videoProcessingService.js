const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs-extra');
const path = require('path');

// Try to load Sharp, gracefully handle if not available
let sharp;
try {
    sharp = require('sharp');
} catch (error) {
    console.warn('⚠️ Sharp not available - video processing disabled:', error.message);
    sharp = null;
}

class VideoProcessingService {
    constructor() {
        this.tempDir = process.env.TEMP_AUDIO_DIR || './uploads';
        this.outputDir = process.env.AUDIO_OUTPUT_DIR || './output';
        this.imagesDir = path.join(this.tempDir, 'images');
    }

    /**
     * Create video from static image and audio
     * @param {string} imagePath - Path to background image
     * @param {string} audioPath - Path to audio file
     * @param {string} book - Bible book name
     * @param {number} chapter - Chapter number
     * @param {string} version - Bible version
     * @param {Function} progressCallback - Progress callback function
     * @returns {Promise<Object>} - {success: boolean, videoPath?: string, metadata?: Object, error?: string}
     */
    async createChapterVideo(imagePath, audioPath, book, chapter, version, progressCallback = null) {
        // Check if Sharp is available
        if (!sharp) {
            return {
                success: false,
                error: 'Video processing not available - Sharp image library not installed. Run: npm install sharp --build-from-source'
            };
        }
        return new Promise(async (resolve, reject) => {
            try {
                // Generate filename for final video
                const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
                const filename = `${book}_${chapter}_${version}_VIDEO_${timestamp}.mp4`;
                const finalVideoPath = path.join(this.outputDir, filename);

                console.log(`Creating video: ${book} ${chapter} (${version})`);

                // Ensure output directory exists
                await fs.ensureDir(this.outputDir);

                // Process image for video compatibility
                const processedImagePath = await this.processImageForVideo(imagePath, book, chapter, version);
                
                if (!processedImagePath.success) {
                    return resolve(processedImagePath);
                }

                // Get audio duration for video length
                const audioDuration = await this.getAudioDuration(audioPath);
                
                if (progressCallback) {
                    progressCallback(10, 'Creating video from image and audio...');
                }

                // Create video using FFmpeg
                const command = ffmpeg()
                    .input(processedImagePath.imagePath)
                    .inputOptions([
                        '-loop', '1',           // Loop the image
                        '-framerate', '1'       // Low framerate for static image
                    ])
                    .input(audioPath)
                    .videoCodec('libx264')
                    .audioCodec('aac')
                    .outputOptions([
                        '-t', audioDuration.toString(),  // Duration matches audio
                        '-pix_fmt', 'yuv420p',           // Compatibility
                        '-shortest',                      // Stop when shortest input ends
                        '-movflags', '+faststart'         // Optimize for streaming
                    ])
                    .output(finalVideoPath);

                // Set up progress tracking
                command.on('start', (commandLine) => {
                    console.log('FFmpeg video command:', commandLine);
                    if (progressCallback) {
                        progressCallback(20, 'Starting video generation...');
                    }
                });

                command.on('progress', (progress) => {
                    if (progressCallback && progress.percent) {
                        const percent = Math.round(20 + (progress.percent * 0.7)); // 20-90%
                        progressCallback(percent, `Creating video: ${percent}%`);
                    }
                });

                command.on('error', (err) => {
                    console.error('Video creation error:', err.message);
                    resolve({
                        success: false,
                        error: `Video creation failed: ${err.message}`
                    });
                });

                command.on('end', async () => {
                    console.log(`Video creation completed: ${finalVideoPath}`);
                    
                    if (progressCallback) {
                        progressCallback(95, 'Video created, getting metadata...');
                    }

                    // Get video metadata
                    const metadata = await this.getVideoMetadata(finalVideoPath);

                    // Clean up processed image
                    try {
                        await fs.remove(processedImagePath.imagePath);
                    } catch (cleanupError) {
                        console.warn('Failed to clean up processed image:', cleanupError.message);
                    }

                    if (progressCallback) {
                        progressCallback(100, 'Video creation completed');
                    }

                    resolve({
                        success: true,
                        videoPath: finalVideoPath,
                        filename: filename,
                        metadata: {
                            book,
                            chapter,
                            version,
                            duration: metadata.duration,
                            fileSize: metadata.fileSize,
                            videoCodec: metadata.videoCodec,
                            audioCodec: metadata.audioCodec,
                            resolution: metadata.resolution,
                            createdAt: new Date().toISOString(),
                            type: 'video'
                        }
                    });
                });

                // Start the video creation process
                command.run();

            } catch (error) {
                console.error('Video processing setup error:', error);
                resolve({
                    success: false,
                    error: error.message
                });
            }
        });
    }

    /**
     * Process and optimize image for video use
     * @param {string} imagePath - Original image path
     * @param {string} book - Bible book name
     * @param {number} chapter - Chapter number
     * @param {string} version - Bible version
     * @returns {Promise<Object>} - {success: boolean, imagePath?: string, error?: string}
     */
    async processImageForVideo(imagePath, book, chapter, version) {
        try {
            await fs.ensureDir(this.imagesDir);
            
            const processedImagePath = path.join(this.imagesDir, `processed_${Date.now()}.jpg`);
            
            console.log('Processing image for video compatibility...');

            // Process image with Sharp for video compatibility
            await sharp(imagePath)
                .resize(1920, 1080, {
                    fit: 'contain',
                    background: { r: 0, g: 0, b: 0, alpha: 1 } // Black background
                })
                .jpeg({
                    quality: 90,
                    progressive: true
                })
                .toFile(processedImagePath);

            // Optionally add text overlay with chapter information
            const withTextPath = path.join(this.imagesDir, `with_text_${Date.now()}.jpg`);
            
            await this.addChapterTextOverlay(processedImagePath, withTextPath, book, chapter, version);

            // Clean up intermediate file
            await fs.remove(processedImagePath);

            return {
                success: true,
                imagePath: withTextPath
            };

        } catch (error) {
            console.error('Image processing error:', error);
            return {
                success: false,
                error: `Image processing failed: ${error.message}`
            };
        }
    }

    /**
     * Add chapter text overlay to image
     * @param {string} inputPath - Input image path
     * @param {string} outputPath - Output image path
     * @param {string} book - Bible book name
     * @param {number} chapter - Chapter number
     * @param {string} version - Bible version
     * @returns {Promise<void>}
     */
    async addChapterTextOverlay(inputPath, outputPath, book, chapter, version) {
        try {
            // Create text overlay using SVG
            const textSvg = `
                <svg width="1920" height="1080">
                    <defs>
                        <style>
                            .title { font: bold 96px Arial, sans-serif; fill: white; text-anchor: middle; }
                            .shadow { font: bold 96px Arial, sans-serif; fill: black; text-anchor: middle; opacity: 0.8; }
                        </style>
                    </defs>
                    <!-- Text shadow for better readability -->
                    <text x="962" y="322" class="shadow">${book} ${chapter}</text>
                    <!-- Main text -->
                    <text x="960" y="320" class="title">${book} ${chapter}</text>
                </svg>
            `;

            const textBuffer = Buffer.from(textSvg);

            // Composite text overlay onto image
            await sharp(inputPath)
                .composite([{
                    input: textBuffer,
                    top: 0,
                    left: 0
                }])
                .toFile(outputPath);

            console.log(`Added text overlay: ${book} ${chapter}`);

        } catch (error) {
            console.error('Text overlay error:', error);
            // If text overlay fails, just copy the original
            await fs.copy(inputPath, outputPath);
        }
    }

    /**
     * Get audio duration in seconds
     * @param {string} audioPath - Path to audio file
     * @returns {Promise<number>} - Duration in seconds
     */
    async getAudioDuration(audioPath) {
        return new Promise((resolve, reject) => {
            ffmpeg.ffprobe(audioPath, (err, metadata) => {
                if (err) {
                    console.error('Audio duration probe error:', err);
                    resolve(60); // Default to 60 seconds if probe fails
                } else {
                    const duration = metadata.format.duration || 60;
                    resolve(Math.ceil(duration));
                }
            });
        });
    }

    /**
     * Get video metadata
     * @param {string} videoPath - Path to video file
     * @returns {Promise<Object>} - Video metadata
     */
    async getVideoMetadata(videoPath) {
        return new Promise((resolve, reject) => {
            ffmpeg.ffprobe(videoPath, (err, metadata) => {
                if (err) {
                    console.error('Video metadata probe error:', err);
                    resolve({
                        duration: 0,
                        fileSize: this.getFileSize(videoPath),
                        videoCodec: 'h264',
                        audioCodec: 'aac',
                        resolution: '1920x1080'
                    });
                } else {
                    const duration = metadata.format.duration || 0;
                    const videoStream = metadata.streams.find(s => s.codec_type === 'video');
                    const audioStream = metadata.streams.find(s => s.codec_type === 'audio');
                    
                    resolve({
                        duration: Math.round(duration),
                        fileSize: this.getFileSize(videoPath),
                        videoCodec: videoStream?.codec_name || 'h264',
                        audioCodec: audioStream?.codec_name || 'aac',
                        resolution: videoStream ? `${videoStream.width}x${videoStream.height}` : '1920x1080',
                        bitrate: metadata.format.bit_rate || '0'
                    });
                }
            });
        });
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
     * Clean up temporary video files
     * @param {Array<string>} filePaths - Array of file paths to delete
     * @returns {Promise<void>}
     */
    async cleanupVideoFiles(filePaths) {
        try {
            console.log(`Cleaning up ${filePaths.length} temporary video files...`);
            
            for (const filePath of filePaths) {
                try {
                    if (await fs.pathExists(filePath)) {
                        await fs.remove(filePath);
                        console.log(`Deleted video temp file: ${path.basename(filePath)}`);
                    }
                } catch (deleteError) {
                    console.warn(`Failed to delete video file ${filePath}:`, deleteError.message);
                }
            }

        } catch (error) {
            console.warn('Video cleanup error:', error.message);
        }
    }

    /**
     * Get list of generated video files
     * @returns {Promise<Array>} Array of video file objects
     */
    async getGeneratedVideoFiles() {
        try {
            await fs.ensureDir(this.outputDir);
            const files = await fs.readdir(this.outputDir);
            
            const videoFiles = files.filter(file => 
                file.toLowerCase().endsWith('.mp4') && 
                file.includes('VIDEO')
            );

            const fileDetails = await Promise.all(
                videoFiles.map(async (filename) => {
                    const filePath = path.join(this.outputDir, filename);
                    const stats = await fs.stat(filePath);
                    
                    // Extract metadata from filename (e.g., Genesis_1_NIV_VIDEO_2024-01-01.mp4)
                    const match = filename.match(/^(.+?)_(\d+)_([A-Z]+)_VIDEO_(.+)\.mp4$/);
                    const metadata = match ? {
                        book: match[1],
                        chapter: parseInt(match[2]),
                        version: match[3],
                        date: match[4]
                    } : null;

                    return {
                        filename,
                        path: filePath,
                        size: stats.size,
                        modified: stats.mtime.toISOString(),
                        created: stats.birthtime.toISOString(),
                        type: 'video',
                        metadata
                    };
                })
            );

            // Sort by modification time (newest first)
            return fileDetails.sort((a, b) => new Date(b.modified) - new Date(a.modified));

        } catch (error) {
            console.error('Error reading video files:', error);
            return [];
        }
    }

    /**
     * Validate image file
     * @param {string} imagePath - Path to image file
     * @returns {Promise<Object>} - {valid: boolean, error?: string, format?: string}
     */
    async validateImageFile(imagePath) {
        if (!sharp) {
            return {
                valid: false,
                error: 'Image validation not available - Sharp library not installed'
            };
        }
        
        try {
            const metadata = await sharp(imagePath).metadata();
            
            const supportedFormats = ['jpeg', 'jpg', 'png', 'webp', 'tiff', 'gif'];
            const isSupported = supportedFormats.includes(metadata.format.toLowerCase());
            
            if (!isSupported) {
                return {
                    valid: false,
                    error: `Unsupported image format: ${metadata.format}. Supported formats: ${supportedFormats.join(', ')}`
                };
            }

            return {
                valid: true,
                format: metadata.format,
                width: metadata.width,
                height: metadata.height
            };

        } catch (error) {
            return {
                valid: false,
                error: `Invalid image file: ${error.message}`
            };
        }
    }
}

module.exports = VideoProcessingService;
