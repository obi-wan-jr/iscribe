// Audibible Frontend JavaScript

class AudibibleApp {
    constructor() {
        this.apiBase = '/api';
        this.uploadedImagePath = null;
        this.init();
    }

    init() {
        this.loadStoredConfig();
        this.bindEvents();
        this.checkServerStatus();
        this.loadFiles(); // Load existing files on startup
    }

    // Load configuration from localStorage
    loadStoredConfig() {
        const apiKey = localStorage.getItem('fishApiKey');
        const voiceModelId = localStorage.getItem('voiceModelId');
        
        if (apiKey) {
            document.getElementById('fishApiKey').value = apiKey;
        }
        if (voiceModelId) {
            document.getElementById('voiceModelId').value = voiceModelId;
        }
    }

    // Bind event listeners
    bindEvents() {
        // Configuration
        document.getElementById('saveConfig').addEventListener('click', () => this.saveConfiguration());
        
        // Transcription
        document.getElementById('startTranscription').addEventListener('click', () => this.startTranscription());
        
        // Download button (will be enabled when transcription completes)
        document.getElementById('downloadBtn').addEventListener('click', () => this.downloadAudio());
        
        // File manager
        document.getElementById('refreshFiles').addEventListener('click', () => this.loadFiles());
        document.getElementById('clearAll').addEventListener('click', () => this.clearAllFiles());
        
        // Queue management
        document.getElementById('refreshQueue').addEventListener('click', () => this.loadQueue());
        
        // Chapter validation
        document.getElementById('bibleBook').addEventListener('change', () => this.validateChapter());
        document.getElementById('chapter').addEventListener('input', () => this.validateChapter());
        document.getElementById('chapter').addEventListener('blur', () => this.validateChapter());
        
        // Full book transcription toggle
        document.getElementById('transcribeFullBook').addEventListener('change', (e) => this.toggleFullBookMode(e.target.checked));
        
        // Video creation
        document.getElementById('createVideo').addEventListener('change', (e) => this.toggleVideoSection(e.target.checked));
        document.getElementById('backgroundImage').addEventListener('change', (e) => this.handleImageUpload(e));
        document.getElementById('removeImage').addEventListener('click', () => this.removeImage());
    }

    // Check if server is running and load configuration
    async checkServerStatus() {
        try {
            const response = await fetch(`${this.apiBase}/health`);
            const data = await response.json();
            console.log('Server status:', data);
            
            // Load server configuration
            await this.loadServerConfig();
        } catch (error) {
            console.error('Server connection failed:', error);
            this.showStatus('error', 'Unable to connect to server. Please ensure the backend is running.');
        }
    }

    // Load configuration from server
    async loadServerConfig() {
        try {
            const response = await fetch(`${this.apiBase}/config`);
            const config = await response.json();
            
            console.log('Server config:', config);
            
            // Update UI based on server configuration
            this.updateConfigurationUI(config);
            
        } catch (error) {
            console.error('Failed to load server config:', error);
        }
    }

    // Update configuration UI based on server status
    updateConfigurationUI(config) {
        const configSection = document.querySelector('.config-section');
        const configForm = document.querySelector('.config-grid');
        const saveButton = document.getElementById('saveConfig');
        const envStatusDiv = document.getElementById('envConfigStatus');
        const fishApiKeyInput = document.getElementById('fishApiKey');
        const voiceModelIdInput = document.getElementById('voiceModelId');
        
        if (config.fishAudioConfigured) {
            // Credentials are configured in environment
            configForm.style.display = 'none';
            saveButton.style.display = 'none';
            envStatusDiv.style.display = 'block';
            
            console.log('Fish.Audio credentials loaded from environment');
            
            // Show the environment status and allow voice model changes
            envStatusDiv.innerHTML = `
                <strong>✅ API Key loaded from environment file (.env)</strong><br>
                <small>API Key: Configured | Voice Model: ${config.voiceModelId}</small><br>
                <small>You can change the Voice Model ID using the form above if needed.</small>
                <button onclick="audibibleApp.showConfigForm()" class="btn btn-secondary" style="margin-top: 10px; font-size: 0.85rem;">
                    ⚙️ Change Voice Model
                </button>
            `;
            
            // Always show the config form, but make API key readonly
            configForm.style.display = 'grid';
            saveButton.style.display = 'inline-block';
            fishApiKeyInput.readOnly = true;
            fishApiKeyInput.value = '••••••••••••••••'; // Show obfuscated value
            voiceModelIdInput.value = config.voiceModelId || '';
            voiceModelIdInput.readOnly = false;
        } else {
            // No environment config - still make API key readonly
            configForm.style.display = 'grid';
            saveButton.style.display = 'inline-block';
            envStatusDiv.style.display = 'none';
            
            // Make API key readonly even when not configured
            fishApiKeyInput.readOnly = true;
            fishApiKeyInput.value = '';
            voiceModelIdInput.readOnly = false;
            
            // Check what's missing
            if (!config.apiKeyConfigured) {
                fishApiKeyInput.placeholder = 'Fish.Audio API key required';
            }
            if (!config.voiceModelConfigured) {
                voiceModelIdInput.placeholder = 'Voice model ID required';
            }
            
            this.showConfigStatus('info', 'Please configure Fish.Audio credentials below or add them to your .env file');
        }
        
        // Show video processing status
        this.updateVideoProcessingStatus(config);
    }

    // Show configuration form (for override)
    showConfigForm() {
        const configForm = document.querySelector('.config-grid');
        const saveButton = document.getElementById('saveConfig');
        const envStatusDiv = document.getElementById('envConfigStatus');
        
        configForm.style.display = 'grid';
        saveButton.style.display = 'inline-block';
        
        // Update the environment status to show it's in override mode
        envStatusDiv.innerHTML = `
            <strong>ℹ️ Override Mode</strong><br>
            <small>Enter credentials below to override environment settings.</small>
            <button onclick="audibibleApp.hideConfigForm()" class="btn btn-secondary" style="margin-top: 10px; font-size: 0.85rem;">
                ← Back to Environment Settings
            </button>
        `;
    }

    // Hide configuration form (back to environment)
    hideConfigForm() {
        window.location.reload(); // Reload to restore original state
    }

    // Update video processing status
    updateVideoProcessingStatus(config) {
        const videoSection = document.querySelector('.video-section');
        
        if (!config.videoProcessingAvailable) {
            // Disable video section and show warning
            videoSection.style.opacity = '0.6';
            videoSection.style.pointerEvents = 'none';
            
            // Add warning message
            let warningDiv = videoSection.querySelector('.video-warning');
            if (!warningDiv) {
                warningDiv = document.createElement('div');
                warningDiv.className = 'video-warning';
                warningDiv.style.cssText = `
                    background: #fff3cd;
                    border: 1px solid #ffeaa7;
                    border-radius: 6px;
                    padding: 1rem;
                    margin-bottom: 1rem;
                    color: #856404;
                `;
                warningDiv.innerHTML = `
                    <strong>⚠️ Video Processing Unavailable</strong><br>
                    <small>Sharp image library not installed. Audio transcription works normally.<br>
                    To enable video features, run: <code>npm install sharp --build-from-source</code></small>
                `;
                videoSection.insertBefore(warningDiv, videoSection.firstElementChild.nextSibling);
            }
            
            // Uncheck video creation option
            document.getElementById('createVideo').checked = false;
            document.getElementById('createVideo').disabled = true;
        } else {
            // Enable video section
            videoSection.style.opacity = '1';
            videoSection.style.pointerEvents = 'auto';
            document.getElementById('createVideo').disabled = false;
            
            // Remove warning if it exists
            const warningDiv = videoSection.querySelector('.video-warning');
            if (warningDiv) {
                warningDiv.remove();
            }
        }
    }

    // Save Voice Model ID configuration (API key is set via .env file only)
    saveConfiguration() {
        const voiceModelId = document.getElementById('voiceModelId').value.trim();

        if (!voiceModelId) {
            this.showConfigStatus('error', 'Please enter a voice model ID');
            return;
        }

        // Store only voice model ID in localStorage
        localStorage.setItem('voiceModelId', voiceModelId);

        this.showConfigStatus('success', 'Voice Model ID saved successfully!');
        console.log('Voice Model ID updated:', voiceModelId);
    }

    // Start transcription process
    async startTranscription() {
        const config = this.validateTranscriptionForm();
        if (!config) return;

        // Show progress and queue sections
        this.showSection('queue-section');
        this.showSection('progress-section');
        this.hideSection('results-section');

        // Reset progress for new job
        this.updateProgress(0, 'Starting transcription...');
        this.clearProgressLog();

        try {
            // Add voice model ID from localStorage if available (API key comes from .env only)
            const localVoiceModelId = localStorage.getItem('voiceModelId');
            
            // Include voice model ID if exists locally (for override/customization)
            if (localVoiceModelId) {
                config.voiceModelId = localVoiceModelId;
            }
            // API key will always come from server environment variables

            this.addLogEntry('info', 'Starting Bible chapter transcription...');
            this.updateProgress(5, 'Initializing transcription job...');
            
            // Start transcription
            const response = await fetch(`${this.apiBase}/transcribe`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(config)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `Server error: ${response.status}`);
            }

            const result = await response.json();
            
            if (result.success && result.jobId) {
                // Show queue information
                if (result.queue) {
                    if (result.queue.position === 1) {
                        this.addLogEntry('info', `Job started immediately: ${result.jobId}`);
                    } else {
                        this.addLogEntry('info', `Job queued at position ${result.queue.position}: ${result.jobId}`);
                        this.addLogEntry('info', `Estimated wait time: ${result.queue.estimated_wait}`);
                    }
                }
                
                // Start listening to real-time progress updates
                this.listenToProgress(result.jobId);
                
                // Load and display queue status, then refresh periodically
                this.loadQueue();
                
                // Set up periodic queue refresh while jobs are active
                if (this.queueRefreshInterval) {
                    clearInterval(this.queueRefreshInterval);
                }
                this.queueRefreshInterval = setInterval(() => {
                    this.loadQueue();
                }, 5000); // Refresh every 5 seconds
            } else {
                throw new Error(result.error || 'Failed to start transcription');
            }

        } catch (error) {
            console.error('Transcription error:', error);
            this.addLogEntry('error', `Error: ${error.message}`);
            this.updateProgress(0, 'Transcription failed');
        }
    }

    // Listen to real-time progress updates using Server-Sent Events
    listenToProgress(jobId) {
        console.log(`Connecting to progress stream for job: ${jobId}`);
        
        // Close any existing event source
        if (this.eventSource) {
            this.eventSource.close();
        }

        // Create new EventSource for this job
        this.eventSource = new EventSource(`${this.apiBase}/progress/${jobId}`);

        this.eventSource.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                this.handleProgressUpdate(data);
            } catch (error) {
                console.error('Error parsing progress data:', error);
            }
        };

        this.eventSource.onerror = (error) => {
            console.error('Progress stream error:', error);
            this.eventSource.close();
            
            // Show error if we haven't completed yet
            const progressSection = document.getElementById('progress-section');
            if (progressSection && progressSection.style.display !== 'none') {
                this.addLogEntry('warning', 'Lost connection to progress updates');
            }
        };

        this.eventSource.onopen = () => {
            console.log('Progress stream connected');
            this.addLogEntry('success', 'Connected to real-time progress updates');
        };
    }

    // Handle progress updates from server
    handleProgressUpdate(data) {
        console.log('Progress update:', data);

        switch (data.type) {
            case 'connected':
                this.updateProgress(0, 'Connected to server');
                this.addLogEntry('info', 'Real-time progress tracking enabled');
                break;

            case 'progress':
                this.updateProgress(data.progress, data.message, data.details || '');
                this.addLogEntry('info', data.message + (data.details ? ` - ${data.details}` : ''));
                // Update current job progress in queue display
                this.updateCurrentJobProgress(data.progress, data.message);
                break;

            case 'warning':
                this.updateProgress(data.progress, `⚠️ ${data.message}`, data.details || '');
                this.addLogEntry('warning', data.message + (data.details ? ` - ${data.details}` : ''));
                this.updateCurrentJobProgress(data.progress, `⚠️ ${data.message}`);
                break;

            case 'error':
                this.addLogEntry('error', `❌ ${data.message}: ${data.error || ''}`);
                this.updateProgress(0, 'Transcription failed');
                this.updateCurrentJobProgress(0, '❌ Failed');
                this.loadQueue(); // Refresh queue status
                if (this.eventSource) {
                    this.eventSource.close();
                }
                break;

            case 'completed':
                this.updateProgress(100, `✅ ${data.message}`, data.details || '');
                this.addLogEntry('success', data.message + (data.details ? ` - ${data.details}` : ''));
                this.updateCurrentJobProgress(100, '✅ Completed');
                
                // Handle completion
                if (data.result) {
                    setTimeout(() => {
                        this.handleTranscriptionSuccess(data.result);
                        this.loadQueue(); // Refresh queue status
                        
                        // Clear queue refresh interval if no more jobs
                        setTimeout(() => {
                            this.loadQueue();
                            const queueSection = document.querySelector('.queue-section');
                            if (queueSection && queueSection.style.display === 'none') {
                                if (this.queueRefreshInterval) {
                                    clearInterval(this.queueRefreshInterval);
                                    this.queueRefreshInterval = null;
                                }
                            }
                        }, 2000);
                    }, 1500);
                }
                
                // Close progress stream
                if (this.eventSource) {
                    this.eventSource.close();
                }
                break;
        }
    }

    // Update current job progress in queue display
    updateCurrentJobProgress(progress, message) {
        const currentJobCard = document.querySelector('.current-job .job-card');
        if (currentJobCard) {
            const jobStatus = currentJobCard.querySelector('.job-status');
            if (jobStatus) {
                const clampedProgress = Math.min(100, Math.max(0, progress || 0));
                jobStatus.innerHTML = `
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                        <div style="flex: 1;">
                            ${message || 'Processing...'}
                        </div>
                        <div style="font-weight: bold; color: #3498db;">
                            ${clampedProgress}%
                        </div>
                    </div>
                    <div style="margin-top: 0.25rem;">
                        <div style="background: #e0e0e0; border-radius: 10px; height: 4px; overflow: hidden;">
                            <div style="background: linear-gradient(90deg, #3498db, #2980b9); height: 100%; width: ${clampedProgress}%; transition: width 0.3s ease; border-radius: 10px;"></div>
                        </div>
                    </div>
                `;
            }
        }
    }

    // Load and display queue status
    async loadQueue() {
        try {
            const response = await fetch(`${this.apiBase}/queue`);
            const queueData = await response.json();
            
            if (queueData.success) {
                this.displayQueue(queueData);
            }
        } catch (error) {
            console.error('Failed to load queue:', error);
        }
    }

    // Display queue status in UI
    displayQueue(queueData) {
        const queueSection = document.querySelector('.queue-section');
        const queueCount = document.querySelector('.queue-count');
        const currentJobDiv = document.querySelector('.current-job');
        const queuedJobsDiv = document.querySelector('.queued-jobs');
        const jobsList = document.querySelector('.jobs-list');

        // Update queue count
        const totalJobs = (queueData.currentJob ? 1 : 0) + queueData.queueLength;
        queueCount.textContent = totalJobs === 0 ? 'No jobs in queue' : 
            totalJobs === 1 ? '1 job in queue' : `${totalJobs} jobs in queue`;

        // Show/hide queue section
        queueSection.style.display = totalJobs > 0 ? 'block' : 'none';

        // Display current job
        if (queueData.currentJob) {
            currentJobDiv.style.display = 'block';
            const jobCard = currentJobDiv.querySelector('.job-card');
            const jobTitle = jobCard.querySelector('.job-title');
            const jobStatus = jobCard.querySelector('.job-status');
            
            const job = queueData.currentJob;
            const chapterText = job.params.transcribeFullBook ? 'Full Book' : job.params.chapter;
            jobTitle.textContent = `${job.params.book} ${chapterText} (${job.params.version})`;
            
            // Initialize with basic status - progress updates will override this
            jobStatus.innerHTML = `
                <div style="display: flex; align-items: center; gap: 0.5rem;">
                    <div style="flex: 1;">
                        ${job.status} - Started ${this.formatTime(job.startedAt)}
                    </div>
                    <div style="font-weight: bold; color: #3498db;">
                        0%
                    </div>
                </div>
                <div style="margin-top: 0.25rem;">
                    <div style="background: #e0e0e0; border-radius: 10px; height: 4px; overflow: hidden;">
                        <div style="background: linear-gradient(90deg, #3498db, #2980b9); height: 100%; width: 0%; transition: width 0.3s ease; border-radius: 10px;"></div>
                    </div>
                </div>
            `;
        } else {
            currentJobDiv.style.display = 'none';
        }

        // Display queued jobs
        if (queueData.queue && queueData.queue.length > 0) {
            queuedJobsDiv.style.display = 'block';
            jobsList.innerHTML = '';
            
            queueData.queue.forEach(job => {
                const jobCard = this.createJobCard(job, true);
                jobsList.appendChild(jobCard);
            });
        } else {
            queuedJobsDiv.style.display = 'none';
        }
    }

    // Create a job card element
    createJobCard(job, isQueued = false) {
        const jobCard = document.createElement('div');
        jobCard.className = `job-card ${isQueued ? 'queued' : 'current'}`;
        jobCard.innerHTML = `
            <div class="job-info">
                <span class="job-title">${job.params.book} ${job.params.transcribeFullBook ? 'Full Book' : job.params.chapter} (${job.params.version})</span>
                <span class="job-status">
                    ${isQueued ? `Position ${job.position} in queue` : job.status}
                    ${job.params.createVideo ? ' • Video' : ' • Audio only'}
                </span>
            </div>
            ${isQueued ? `
                <div class="job-actions">
                    <button class="btn btn-danger btn-small" onclick="audibibleApp.cancelJob('${job.id}')">
                        ❌ Cancel
                    </button>
                </div>
            ` : ''}
        `;
        return jobCard;
    }

    // Cancel a job
    async cancelJob(jobId) {
        try {
            const response = await fetch(`${this.apiBase}/queue/${jobId}`, {
                method: 'DELETE'
            });
            
            const result = await response.json();
            if (result.success) {
                this.addLogEntry('info', `Job ${jobId} cancelled`);
                this.loadQueue(); // Refresh queue
            } else {
                this.addLogEntry('error', `Failed to cancel job: ${result.error}`);
            }
        } catch (error) {
            console.error('Failed to cancel job:', error);
            this.addLogEntry('error', `Failed to cancel job: ${error.message}`);
        }
    }

    // Format time for display
    formatTime(timeString) {
        if (!timeString) return 'Unknown';
        const date = new Date(timeString);
        return date.toLocaleTimeString();
    }

    // Validate chapter number
    async validateChapter() {
        const bookSelect = document.getElementById('bibleBook');
        const chapterInput = document.getElementById('chapter');
        const container = document.querySelector('.chapter-input-container');
        const validation = document.getElementById('chapterValidation');
        const icon = validation.querySelector('.validation-icon');
        const message = validation.querySelector('.validation-message');

        const book = bookSelect.value;
        const chapter = parseInt(chapterInput.value);

        // Clear previous validation state
        container.classList.remove('valid', 'invalid');
        validation.classList.remove('show');

        // Don't validate if no book is selected or chapter is empty
        if (!book || !chapterInput.value) {
            return;
        }

        try {
            const response = await fetch(`${this.apiBase}/bible/validate/${encodeURIComponent(book)}/${chapter}`);
            const result = await response.json();

            if (result.success) {
                if (result.valid) {
                    // Valid chapter
                    container.classList.add('valid');
                    icon.textContent = '✓';
                    message.textContent = `Valid (1-${result.maxChapters})`;
                } else {
                    // Invalid chapter
                    container.classList.add('invalid');
                    icon.textContent = '✗';
                    message.textContent = result.message;
                }
                validation.classList.add('show');
            }
        } catch (error) {
            console.error('Chapter validation error:', error);
            // Show error state
            container.classList.add('invalid');
            icon.textContent = '⚠';
            message.textContent = 'Validation error';
            validation.classList.add('show');
        }
    }

    // Toggle full book transcription mode
    toggleFullBookMode(enabled) {
        const chapterInputGroup = document.getElementById('chapterInputGroup');
        const startButton = document.getElementById('startTranscription');
        
        if (enabled) {
            chapterInputGroup.style.display = 'none';
            startButton.textContent = '🎬 Start Book Transcription';
        } else {
            chapterInputGroup.style.display = 'block';
            startButton.textContent = '🎬 Start Transcription';
        }
    }

    // Enhanced form validation with chapter check
    validateTranscriptionForm() {
        const book = document.getElementById('bibleBook').value;
        const chapter = document.getElementById('chapter').value;
        const version = document.getElementById('version').value;
        const maxSentences = document.getElementById('maxSentences').value;
        const transcribeFullBook = document.getElementById('transcribeFullBook').checked;

        if (!book) {
            alert('Please select a Bible book');
            return null;
        }

        // For full book transcription, we don't need chapter validation
        if (!transcribeFullBook) {
            if (!chapter || chapter < 1) {
                alert('Please enter a valid chapter number');
                return null;
            }

            // Check if chapter validation failed
            const container = document.querySelector('.chapter-input-container');
            if (container.classList.contains('invalid')) {
                alert('Please enter a valid chapter number for the selected book');
                return null;
            }
        }

        // Check if voice model is configured locally (API key is handled server-side)
        const hasLocalVoiceModel = localStorage.getItem('voiceModelId');
        // We'll let the server validate if API key is available via environment

        return {
            book,
            chapter: transcribeFullBook ? null : parseInt(chapter),
            version,
            maxSentences: maxSentences ? parseInt(maxSentences) : 5,
            excludeVerseNumbers: true, // Always true per requirements
            createVideo: document.getElementById('createVideo').checked,
            backgroundImagePath: this.uploadedImagePath,
            transcribeFullBook: transcribeFullBook
        };
    }



    // Handle successful transcription
    handleTranscriptionSuccess(result) {
        this.updateProgress(100, 'Transcription completed successfully!');
        this.addLogEntry('success', `Complete chapter audio generated: ${result.filename}`);
        this.addLogEntry('info', `Duration: ${this.formatDuration(result.metadata.duration)}`);
        this.addLogEntry('info', `File size: ${this.formatFileSize(result.metadata.fileSize)}`);
        this.addLogEntry('info', `Complete chapter with introduction + ${result.metadata.chunkCount} content parts`);
        this.addLogEntry('info', `Total sentences: ${result.metadata.textMetadata.sentenceCount}`);
        
        // Show results section
        this.showSection('results-section');
        
        // Update result text with details
        const resultText = document.querySelector('.result-item p');
        if (resultText) {
            resultText.innerHTML = `
                Complete chapter audio generated successfully!<br>
                <small>🎵 Includes: "${result.metadata.book} Chapter ${result.metadata.chapter}" introduction + full chapter content<br>
                Duration: ${this.formatDuration(result.metadata.duration)} | 
                Size: ${this.formatFileSize(result.metadata.fileSize)} | 
                ${result.metadata.textMetadata.sentenceCount} sentences in ${result.metadata.chunkCount} parts</small>
            `;
        }
        
        // Enable download button
        const downloadBtn = document.getElementById('downloadBtn');
        downloadBtn.onclick = () => this.downloadFile(result.downloadUrl);
        
        // Show video download if video was created
        if (result.video) {
            this.addLogEntry('success', `Video created: ${result.video.filename}`);
            this.addLogEntry('info', `Video resolution: ${result.video.metadata.resolution}`);
            
            // Add video download button
            const resultItem = document.querySelector('.result-item');
            const videoDownloadBtn = document.createElement('button');
            videoDownloadBtn.className = 'btn btn-success';
            videoDownloadBtn.innerHTML = '🎥 Download MP4 Video';
            videoDownloadBtn.style.marginLeft = '10px';
            videoDownloadBtn.onclick = () => this.downloadFile(result.video.downloadUrl);
            resultItem.appendChild(videoDownloadBtn);
        } else if (result.videoError) {
            this.addLogEntry('error', `Video creation failed: ${result.videoError}`);
        }
        
        // Refresh file list to show new file(s)
        this.loadFiles();
    }

    // Format duration helper
    formatDuration(seconds) {
        if (!seconds) return '0:00';
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${minutes}:${secs.toString().padStart(2, '0')}`;
    }

    // Format file size helper
    formatFileSize(bytes) {
        if (!bytes) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // Download the generated audio file
    downloadFile(downloadUrl) {
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = '';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    // Show/hide sections
    showSection(sectionClass) {
        const section = document.querySelector(`.${sectionClass}`);
        if (section) {
            section.style.display = 'block';
        }
    }

    hideSection(sectionClass) {
        const section = document.querySelector(`.${sectionClass}`);
        if (section) {
            section.style.display = 'none';
        }
    }

    // Update progress bar and text
    updateProgress(percentage, text, details = '') {
        const progressFill = document.querySelector('.progress-fill');
        const progressText = document.querySelector('.progress-text');
        const progressPercentage = document.querySelector('.progress-percentage');
        const progressDetails = document.querySelector('.progress-details');
        
        // Clamp percentage to 0-100 range as final safeguard
        const clampedPercentage = Math.min(100, Math.max(0, percentage || 0));
        
        // Update progress bar width
        if (progressFill) {
            progressFill.style.width = `${clampedPercentage}%`;
        }
        
        // Update progress text
        if (progressText) {
            progressText.textContent = text;
        }
        
        // Update percentage display
        if (progressPercentage) {
            progressPercentage.textContent = `${clampedPercentage}%`;
        }
        
        // Update details if provided
        if (progressDetails && details) {
            progressDetails.textContent = details;
            progressDetails.style.display = 'block';
        } else if (progressDetails) {
            progressDetails.style.display = 'none';
        }
    }

    // Add entry to progress log
    addLogEntry(type, message) {
        const logContainer = document.querySelector('.progress-log');
        if (!logContainer) return;

        const entry = document.createElement('div');
        entry.className = `log-entry ${type}`;
        entry.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
        
        logContainer.appendChild(entry);
        logContainer.scrollTop = logContainer.scrollHeight;
    }

    // Clear progress log
    clearProgressLog() {
        const logContainer = document.querySelector('.progress-log');
        if (logContainer) {
            logContainer.innerHTML = '';
        }
    }

    // Show configuration status message
    showConfigStatus(type, message) {
        const statusEl = document.getElementById('configStatus');
        statusEl.className = `status-message ${type}`;
        statusEl.textContent = message;
        
        // Auto-hide after 3 seconds for success messages
        if (type === 'success') {
            setTimeout(() => {
                statusEl.textContent = '';
                statusEl.className = 'status-message';
            }, 3000);
        }
    }

    // Generic status message function
    showStatus(type, message) {
        // You can implement a global status notification system here
        console.log(`[${type.toUpperCase()}] ${message}`);
    }

    // Load and display files
    async loadFiles() {
        try {
            const filesContainer = document.querySelector('.files-container');
            if (!filesContainer) {
                console.error('Files container not found');
                return;
            }
            
            filesContainer.innerHTML = '<div class="loading-files"><p>Loading media files...</p></div>';
            console.log('Loading files from:', `${this.apiBase}/files`);

            const response = await fetch(`${this.apiBase}/files`);
            console.log('Files API response status:', response.status);
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('Files API error:', errorText);
                throw new Error(`Failed to load files: ${response.status} - ${errorText}`);
            }

            const data = await response.json();
            console.log('Files data received:', data);
            
            if (data.error) {
                throw new Error(data.error);
            }
            
            this.displayFiles(data.files || []);
            this.updateFileStats(data.files || []);

        } catch (error) {
            console.error('Error loading files:', error);
            this.displayFileError(`Failed to load media files: ${error.message}`);
        }
    }

    // Display files in the UI
    displayFiles(files) {
        const filesContainer = document.querySelector('.files-container');
        
        if (!files || files.length === 0) {
            filesContainer.innerHTML = `
                <div class="empty-files">
                    <p>📁 No media files generated yet</p>
                    <p><small>Generated audio and video files will appear here after transcription</small></p>
                </div>
            `;
            return;
        }

        console.log(`Displaying ${files.length} files`);
        
        let filesHtml = '';
        files.forEach(file => {
            console.log('Processing file:', file);
            
            const fileName = this.parseFileName(file.filename);
            const isVideo = file.type === 'video' || file.filename.includes('VIDEO');
            const icon = isVideo ? '🎬' : '🎵';
            const typeLabel = isVideo ? 'Video' : 'Audio';
            
            filesHtml += `
                <div class="file-item ${file.type}" data-filename="${file.filename}">
                    <div class="file-info">
                        <div class="file-name">
                            ${icon} ${fileName.book} ${fileName.chapter} (${fileName.version}) - ${typeLabel}
                        </div>
                        <div class="file-details">
                            📅 ${this.formatDate(file.created)} | 📦 ${this.formatFileSize(file.size)} | 
                            📂 ${file.type.toUpperCase()}
                        </div>
                        ${isVideo ? `
                            <video class="video-player" controls preload="none" style="max-width: 300px; height: auto;">
                                <source src="/api/download/${file.filename}" type="video/mp4">
                                Your browser does not support the video element.
                            </video>
                        ` : `
                            <audio class="audio-player" controls preload="none">
                                <source src="/api/download/${file.filename}" type="audio/mpeg">
                                Your browser does not support the audio element.
                            </audio>
                        `}
                    </div>
                    <div class="file-actions">
                        <button class="btn btn-success" onclick="audibibleApp.downloadFile('/api/download/${file.filename}', '${file.filename}')">
                            📥 Download
                        </button>
                        <button class="btn btn-danger" onclick="audibibleApp.deleteFile('${file.filename}')">
                            🗑️ Delete
                        </button>
                    </div>
                </div>
            `;
        });

        filesContainer.innerHTML = filesHtml;
    }

    // Parse filename to extract book, chapter, version info
    parseFileName(filename) {
        // Expected format: Book_Chapter_Version_timestamp.mp3
        const parts = filename.replace('.mp3', '').split('_');
        
        if (parts.length >= 3) {
            return {
                book: parts[0].replace(/-/g, ' '),
                chapter: parts[1],
                version: parts[2]
            };
        }
        
        return {
            book: 'Unknown',
            chapter: '?',
            version: 'Unknown'
        };
    }

    // Update file statistics
    updateFileStats(files) {
        const totalFilesElement = document.getElementById('totalFiles');
        const totalSizeElement = document.getElementById('totalSize');
        
        if (totalFilesElement) {
            totalFilesElement.textContent = files.length;
        }
        
        // Calculate total size from raw byte numbers
        let totalBytes = 0;
        files.forEach(file => {
            // Handle both raw numbers and formatted strings
            if (typeof file.size === 'number') {
                totalBytes += file.size;
            } else if (typeof file.size === 'string') {
                const sizeMatch = file.size.match(/^([\d.]+)\s*(Bytes|KB|MB|GB)$/);
                if (sizeMatch) {
                    const value = parseFloat(sizeMatch[1]);
                    const unit = sizeMatch[2];
                    const multipliers = { 'Bytes': 1, 'KB': 1024, 'MB': 1024*1024, 'GB': 1024*1024*1024 };
                    totalBytes += value * multipliers[unit];
                }
            }
        });
        
        if (totalSizeElement) {
            totalSizeElement.textContent = this.formatFileSize(totalBytes);
        }
    }

    // Format date for display
    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    }

    // Download file with custom filename
    downloadFile(downloadUrl, filename = null) {
        const link = document.createElement('a');
        link.href = downloadUrl;
        if (filename) {
            link.download = filename;
        }
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    // Delete a specific file
    async deleteFile(filename) {
        if (!confirm(`Are you sure you want to delete "${filename}"?`)) {
            return;
        }

        try {
            const response = await fetch(`${this.apiBase}/files/${filename}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to delete file');
            }

            // Refresh the file list
            await this.loadFiles();
            this.showStatus('success', `File "${filename}" deleted successfully`);

        } catch (error) {
            console.error('Delete error:', error);
            alert(`Failed to delete file: ${error.message}`);
        }
    }

    // Clear all files
    async clearAllFiles() {
        if (!confirm('Are you sure you want to delete ALL audio files? This action cannot be undone.')) {
            return;
        }

        try {
            // Get all files first
            const response = await fetch(`${this.apiBase}/files`);
            const data = await response.json();
            
            if (!data.files || data.files.length === 0) {
                alert('No files to delete');
                return;
            }

            // Delete each file
            let deletedCount = 0;
            let failedCount = 0;

            for (const file of data.files) {
                try {
                    const deleteResponse = await fetch(`${this.apiBase}/files/${file.filename}`, {
                        method: 'DELETE'
                    });

                    if (deleteResponse.ok) {
                        deletedCount++;
                    } else {
                        failedCount++;
                    }
                } catch (error) {
                    failedCount++;
                }
            }

            // Refresh the file list
            await this.loadFiles();
            
            if (failedCount === 0) {
                this.showStatus('success', `Successfully deleted ${deletedCount} files`);
            } else {
                alert(`Deleted ${deletedCount} files, but ${failedCount} failed to delete`);
            }

        } catch (error) {
            console.error('Clear all error:', error);
            alert(`Failed to clear files: ${error.message}`);
        }
    }

    // Display file loading error
    displayFileError(message) {
        const filesContainer = document.querySelector('.files-container');
        filesContainer.innerHTML = `
            <div class="empty-files">
                <p>❌ ${message}</p>
                <button class="btn btn-secondary" onclick="audibibleApp.loadFiles()">🔄 Try Again</button>
            </div>
        `;
    }

    // Toggle video creation section
    toggleVideoSection(enabled) {
        const imageUploadSection = document.getElementById('imageUploadSection');
        imageUploadSection.style.display = enabled ? 'block' : 'none';
        
        if (!enabled) {
            this.removeImage();
        }
    }

    // Handle image upload
    async handleImageUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        // Validate file size (10MB limit)
        if (file.size > 10 * 1024 * 1024) {
            alert('Image file is too large. Maximum size is 10MB.');
            event.target.value = '';
            return;
        }

        // Show upload progress
        const uploadProgress = document.getElementById('uploadProgress');
        const progressFill = uploadProgress.querySelector('.progress-fill');
        const uploadStatus = uploadProgress.querySelector('.upload-status');
        
        uploadProgress.style.display = 'block';
        progressFill.style.width = '0%';
        uploadStatus.textContent = 'Uploading image...';

        try {
            // Create form data
            const formData = new FormData();
            formData.append('backgroundImage', file);

            // Upload image
            const response = await fetch(`${this.apiBase}/upload-image`, {
                method: 'POST',
                body: formData
            });

            progressFill.style.width = '50%';

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Upload failed');
            }

            const result = await response.json();
            
            progressFill.style.width = '100%';
            uploadStatus.textContent = 'Upload complete!';

            // Store persistent image path for multiple jobs
            this.uploadedImagePath = result.persistentImagePath || result.imagePath;

            // Show image preview
            this.showImagePreview(file, result.imageInfo);

            // Hide upload progress after a brief delay
            setTimeout(() => {
                uploadProgress.style.display = 'none';
            }, 1000);

        } catch (error) {
            console.error('Image upload error:', error);
            alert(`Image upload failed: ${error.message}`);
            
            uploadProgress.style.display = 'none';
            event.target.value = '';
        }
    }

    // Show image preview
    showImagePreview(file, imageInfo) {
        const imagePreview = document.getElementById('imagePreview');
        const previewImg = document.getElementById('previewImg');
        const imageInfoText = document.getElementById('imageInfo');

        // Create object URL for preview
        const objectURL = URL.createObjectURL(file);
        previewImg.src = objectURL;

        // Update image info
        imageInfoText.textContent = `${imageInfo.format.toUpperCase()} • ${imageInfo.width}×${imageInfo.height} • ${this.formatFileSize(file.size)}`;

        // Show preview
        imagePreview.style.display = 'block';

        // Hide file input
        document.getElementById('backgroundImage').style.display = 'none';
    }

    // Remove uploaded image
    async removeImage() {
        // Clean up persistent image on server if it exists
        if (this.uploadedImagePath && this.uploadedImagePath.includes('persistent_images')) {
            try {
                await fetch(`${this.apiBase}/cleanup-image`, {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ imagePath: this.uploadedImagePath })
                });
                console.log('Cleaned up persistent image');
            } catch (error) {
                console.warn('Failed to cleanup persistent image:', error);
            }
        }
        
        this.uploadedImagePath = null;
        
        // Hide preview
        const imagePreview = document.getElementById('imagePreview');
        imagePreview.style.display = 'none';
        
        // Show file input
        const fileInput = document.getElementById('backgroundImage');
        fileInput.style.display = 'block';
        fileInput.value = '';
        
        // Clean up object URL
        const previewImg = document.getElementById('previewImg');
        if (previewImg.src) {
            URL.revokeObjectURL(previewImg.src);
            previewImg.src = '';
        }
    }

    // ===== MANUAL OVERRIDE METHODS =====
    
    toggleManualOverride(enabled) {
        const overrideInterface = document.getElementById('manualOverrideInterface');
        overrideInterface.style.display = enabled ? 'block' : 'none';
        
        if (enabled) {
            this.initializeManualOverride();
        } else {
            this.clearManualOverrideText();
        }
    }

    initializeManualOverride() {
        document.querySelector('input[name="textSource"][value="load"]').checked = true;
        this.handleTextSourceChange('load');
        document.getElementById('chapterContent').value = '';
        document.getElementById('chapterIntroduction').value = '';
        this.updateTextStats();
    }

    clearManualOverrideText() {
        document.getElementById('chapterContent').value = '';
        document.getElementById('chapterIntroduction').value = '';
        this.updateTextStats();
        const existingPreview = document.querySelector('.text-preview');
        if (existingPreview) existingPreview.remove();
    }

    handleTextSourceChange(source) {
        const loadTextSection = document.getElementById('loadTextSection');
        
        if (source === 'load') {
            loadTextSection.style.display = 'block';
            const book = document.getElementById('bibleBook').value;
            const chapter = document.getElementById('chapter').value;
            document.getElementById('loadChapterTextBtn').disabled = !(book && chapter);
        } else {
            loadTextSection.style.display = 'none';
            document.getElementById('chapterContent').value = '';
            document.getElementById('chapterIntroduction').value = '';
            this.updateTextStats();
        }
    }

    async loadChapterText() {
        const book = document.getElementById('bibleBook').value;
        const chapter = document.getElementById('chapter').value;
        
        if (!book || !chapter) {
            alert('Please select a book and chapter first.');
            return;
        }

        try {
            const loadBtn = document.getElementById('loadChapterTextBtn');
            const originalText = loadBtn.textContent;
            loadBtn.textContent = '⏳ Loading...';
            loadBtn.disabled = true;

            const response = await fetch(`http://localhost:3005/api/books/${book}/chapters/${chapter}`);
            
            if (response.ok) {
                const data = await response.json();
                if (data.success && data.data) {
                    const chapterText = data.data.verses.map(v => v.text).join(' ');
                    document.getElementById('chapterContent').value = chapterText;
                    
                    const bookName = this.getBookDisplayName(book);
                    document.getElementById('chapterIntroduction').value = `${bookName}, Chapter ${chapter}`;
                    
                    this.updateTextStats();
                    this.originalChapterText = chapterText;
                    this.originalIntroduction = `${bookName}, Chapter ${chapter}`;
                    
                    this.showManualOverrideStatus('success', 'Chapter text loaded successfully!');
                }
            }
        } catch (error) {
            console.error('Failed to load chapter text:', error);
            document.getElementById('chapterContent').value = 'Failed to load chapter text. Please try again.';
            this.showManualOverrideStatus('error', `Failed to load text: ${error.message}`);
        } finally {
            const loadBtn = document.getElementById('loadChapterTextBtn');
            loadBtn.textContent = originalText;
            loadBtn.disabled = false;
        }
    }

    getBookDisplayName(bookId) {
        const bookSelect = document.getElementById('bibleBook');
        const option = bookSelect.querySelector(`option[value="${bookId}"]`);
        return option ? option.textContent : bookId;
    }

    formatText(type) {
        const textarea = document.getElementById('chapterContent');
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = textarea.value;
        
        if (start === end) {
            this.showManualOverrideStatus('info', 'Please select some text to format');
            return;
        }
        
        let formattedText = '';
        switch (type) {
            case 'bold': formattedText = `**${text.substring(start, end)}**`; break;
            case 'italic': formattedText = `*${text.substring(start, end)}*`; break;
            case 'underline': formattedText = `_${text.substring(start, end)}_`; break;
        }
        
        if (formattedText) {
            textarea.value = text.substring(0, start) + formattedText + text.substring(end);
            textarea.setSelectionRange(start + 2, start + 2 + (end - start));
            textarea.focus();
            this.updateTextStats();
        }
    }

    addPause() { this.insertAtCursor('/'); }
    addLongPause() { this.insertAtCursor('//'); }

    insertAtCursor(text) {
        const textarea = document.getElementById('chapterContent');
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const currentText = textarea.value;
        
        textarea.value = currentText.substring(0, start) + text + currentText.substring(end);
        textarea.setSelectionRange(start + text.length, start + text.length);
        textarea.focus();
        this.updateTextStats();
    }

    resetText() {
        if (this.originalChapterText) {
            document.getElementById('chapterContent').value = this.originalChapterText;
            document.getElementById('chapterIntroduction').value = this.originalIntroduction;
            this.updateTextStats();
            this.showManualOverrideStatus('success', 'Text reset to original');
        } else {
            this.showManualOverrideStatus('info', 'No original text to reset to');
        }
    }

    previewText() {
        const introduction = document.getElementById('chapterIntroduction').value;
        const content = document.getElementById('chapterContent').value;
        
        if (!content.trim()) {
            this.showManualOverrideStatus('warning', 'Please enter some text to preview');
            return;
        }
        
        const existingPreview = document.querySelector('.text-preview');
        if (existingPreview) existingPreview.remove();
        
        const preview = document.createElement('div');
        preview.className = 'text-preview';
        preview.innerHTML = `
            <h4>📖 Text Preview (as it will be processed)</h4>
            <div class="formatted-text">${introduction}\n\n${content}</div>
        `;
        
        const textEditor = document.querySelector('.text-editor-container');
        textEditor.parentNode.insertBefore(preview, textEditor.nextSibling);
        this.showManualOverrideStatus('success', 'Text preview created');
    }

    updateTextStats() {
        const text = document.getElementById('chapterContent').value;
        const charCount = text.length;
        const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
        const sentenceCount = text.trim() ? text.split(/[.!?]+/).filter(s => s.trim()).length : 0;
        
        document.querySelector('.char-count').textContent = `Characters: ${charCount}`;
        document.querySelector('.word-count').textContent = `Words: ${wordCount}`;
        document.querySelector('.sentence-count').textContent = `Sentences: ${sentenceCount}`;
    }

    showManualOverrideStatus(type, message) {
        let statusDiv = document.querySelector('.manual-override-status');
        if (!statusDiv) {
            statusDiv = document.createElement('div');
            statusDiv.className = 'manual-override-status';
            document.querySelector('.manual-override-interface').appendChild(statusDiv);
        }
        
        statusDiv.className = `manual-override-status ${type}`;
        statusDiv.textContent = message;
        
        setTimeout(() => {
            if (statusDiv) statusDiv.remove();
        }, 3000);
    }

    // ===== MANUAL OVERRIDE METHODS =====
    
    toggleManualOverride(enabled) {
        const overrideInterface = document.getElementById('manualOverrideInterface');
        overrideInterface.style.display = enabled ? 'block' : 'none';
        
        if (enabled) {
            // Initialize with default state
            this.initializeManualOverride();
        } else {
            // Clear any loaded text
            this.clearManualOverrideText();
        }
    }

    initializeManualOverride() {
        // Set default text source to "load from Bible API"
        document.querySelector('input[name="textSource"][value="load"]').checked = true;
        this.handleTextSourceChange('load');
        
        // Clear any existing text
        document.getElementById('chapterContent').value = '';
        document.getElementById('chapterIntroduction').value = '';
        this.updateTextStats();
    }

    clearManualOverrideText() {
        document.getElementById('chapterContent').value = '';
        document.getElementById('chapterIntroduction').value = '';
        this.updateTextStats();
        
        // Remove any preview
        const existingPreview = document.querySelector('.text-preview');
        if (existingPreview) {
            existingPreview.remove();
        }
    }

    handleTextSourceChange(source) {
        const loadTextSection = document.getElementById('loadTextSection');
        
        if (source === 'load') {
            loadTextSection.style.display = 'block';
            // Check if we have book/chapter selected and can load text
            const book = document.getElementById('bibleBook').value;
            const chapter = document.getElementById('chapter').value;
            if (book && chapter) {
                document.getElementById('loadChapterTextBtn').disabled = false;
            } else {
                document.getElementById('loadChapterTextBtn').disabled = true;
            }
        } else {
            loadTextSection.style.display = 'none';
            // For custom text, clear the content and allow user to write
            document.getElementById('chapterContent').value = '';
            document.getElementById('chapterIntroduction').value = '';
            this.updateTextStats();
        }
    }

    async loadChapterText() {
        const book = document.getElementById('bibleBook').value;
        const chapter = document.getElementById('chapter').value;
        
        if (!book || !chapter) {
            alert('Please select a book and chapter first.');
            return;
        }

        try {
            // Show loading state
            const loadBtn = document.getElementById('loadChapterTextBtn');
            const originalText = loadBtn.textContent;
            loadBtn.textContent = '⏳ Loading...';
            loadBtn.disabled = true;

            // Fetch the chapter text from the API
            const response = await fetch(`http://localhost:3005/api/books/${book}/chapters/${chapter}`);
            
            if (response.ok) {
                const data = await response.json();
                if (data.success && data.data) {
                    // Extract text from verses array
                    const chapterText = data.data.verses.map(v => v.text).join(' ');
                    
                    // Set the chapter content
                    document.getElementById('chapterContent').value = chapterText;
                    
                    // Set the chapter introduction
                    const bookName = this.getBookDisplayName(book);
                    document.getElementById('chapterIntroduction').value = `${bookName}, Chapter ${chapter}`;
                    
                    // Update text stats
                    this.updateTextStats();
                    
                    // Store original text for reset functionality
                    this.originalChapterText = chapterText;
                    this.originalIntroduction = `${bookName}, Chapter ${chapter}`;
                    
                    // Show success message
                    this.showManualOverrideStatus('success', 'Chapter text loaded successfully!');
                } else {
                    throw new Error('Invalid response format from API');
                }
            } else {
                throw new Error(`API request failed: ${response.status}`);
            }
        } catch (error) {
            console.error('Failed to load chapter text:', error);
            document.getElementById('chapterContent').value = 'Failed to load chapter text. Please try again.';
            this.showManualOverrideStatus('error', `Failed to load text: ${error.message}`);
        } finally {
            // Restore button state
            const loadBtn = document.getElementById('loadChapterTextBtn');
            loadBtn.textContent = originalText;
            loadBtn.disabled = false;
        }
    }

    getBookDisplayName(bookId) {
        const bookSelect = document.getElementById('bibleBook');
        const option = bookSelect.querySelector(`option[value="${bookId}"]`);
        return option ? option.textContent : bookId;
    }

    formatText(type) {
        const textarea = document.getElementById('chapterContent');
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = textarea.value;
        
        if (start === end) {
            // No text selected, show message
            this.showManualOverrideStatus('info', 'Please select some text to format');
            return;
        }
        
        let formattedText = '';
        switch (type) {
            case 'bold':
                formattedText = `**${text.substring(start, end)}**`;
                break;
            case 'italic':
                formattedText = `*${text.substring(start, end)}*`;
                break;
            case 'underline':
                formattedText = `_${text.substring(start, end)}_`;
                break;
        }
        
        if (formattedText) {
            textarea.value = text.substring(0, start) + formattedText + text.substring(end);
            textarea.setSelectionRange(start + 2, start + 2 + (end - start));
            textarea.focus();
            this.updateTextStats();
        }
    }

    addPause() {
        this.insertAtCursor('/');
    }

    addLongPause() {
        this.insertAtCursor('//');
    }

    insertAtCursor(text) {
        const textarea = document.getElementById('chapterContent');
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const currentText = textarea.value;
        
        textarea.value = currentText.substring(0, start) + text + currentText.substring(end);
        textarea.setSelectionRange(start + text.length, start + text.length);
        textarea.focus();
        this.updateTextStats();
    }

    resetText() {
        if (this.originalChapterText) {
            document.getElementById('chapterContent').value = this.originalChapterText;
            document.getElementById('chapterIntroduction').value = this.originalIntroduction;
            this.updateTextStats();
            this.showManualOverrideStatus('success', 'Text reset to original');
        } else {
            this.showManualOverrideStatus('info', 'No original text to reset to');
        }
    }

    previewText() {
        const introduction = document.getElementById('chapterIntroduction').value;
        const content = document.getElementById('chapterContent').value;
        
        if (!content.trim()) {
            this.showManualOverrideStatus('warning', 'Please enter some text to preview');
            return;
        }
        
        // Remove existing preview
        const existingPreview = document.querySelector('.text-preview');
        if (existingPreview) {
            existingPreview.remove();
        }
        
        // Create preview
        const preview = document.createElement('div');
        preview.className = 'text-preview';
        preview.innerHTML = `
            <h4>📖 Text Preview (as it will be processed)</h4>
            <div class="formatted-text">${introduction}\n\n${content}</div>
        `;
        
        // Insert after the text editor
        const textEditor = document.querySelector('.text-editor-container');
        textEditor.parentNode.insertBefore(preview, textEditor.nextSibling);
        
        this.showManualOverrideStatus('success', 'Text preview created');
    }

    updateTextStats() {
        const text = document.getElementById('chapterContent').value;
        const charCount = text.length;
        const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
        const sentenceCount = text.trim() ? text.split(/[.!?]+/).filter(s => s.trim()).length : 0;
        
        document.querySelector('.char-count').textContent = `Characters: ${charCount}`;
        document.querySelector('.word-count').textContent = `Words: ${wordCount}`;
        document.querySelector('.sentence-count').textContent = `Sentences: ${sentenceCount}`;
    }

    showManualOverrideStatus(type, message) {
        // Create or update status message
        let statusDiv = document.querySelector('.manual-override-status');
        if (!statusDiv) {
            statusDiv = document.createElement('div');
            statusDiv.className = 'manual-override-status';
            document.querySelector('.manual-override-interface').appendChild(statusDiv);
        }
        
        statusDiv.className = `manual-override-status ${type}`;
        statusDiv.textContent = message;
        
        // Auto-hide after 3 seconds
        setTimeout(() => {
            if (statusDiv) {
                statusDiv.remove();
            }
        }, 3000);
    }

    // Enhanced form validation with manual override support
    validateTranscriptionForm() {
        const book = document.getElementById('bibleBook').value;
        const chapter = document.getElementById('chapter').value;
        const version = document.getElementById('version').value;
        const maxSentences = document.getElementById('maxSentences').value;
        const transcribeFullBook = document.getElementById('transcribeFullBook').checked;
        const manualOverrideEnabled = document.getElementById('enableManualOverride').checked;

        if (!book) {
            alert('Please select a Bible book');
            return null;
        }

        // For full book transcription, we don't need chapter validation
        if (!transcribeFullBook) {
            if (!chapter || chapter < 1) {
                alert('Please enter a valid chapter number');
                return null;
            }

            // Check if chapter validation failed
            const container = document.querySelector('.chapter-input-container');
            if (container.classList.contains('invalid')) {
                alert('Please enter a valid chapter number for the selected book');
                return null;
            }
        }

        // Check if voice model is configured locally
        const hasLocalVoiceModel = localStorage.getItem('voiceModelId');

        let config = {
            book,
            chapter: transcribeFullBook ? null : parseInt(chapter),
            version,
            maxSentences: maxSentences ? parseInt(maxSentences) : 5,
            excludeVerseNumbers: true,
            createVideo: document.getElementById('createVideo').checked,
            backgroundImagePath: this.uploadedImagePath,
            transcribeFullBook: transcribeFullBook
        };

        // Add manual override data if enabled
        if (manualOverrideEnabled) {
            const overrideContent = document.getElementById('chapterContent').value.trim();
            const overrideIntroduction = document.getElementById('chapterIntroduction').value.trim();
            
            if (!overrideContent) {
                alert('Please enter text content for manual override');
                return null;
            }
            
            config.manualOverride = {
                enabled: true,
                introduction: overrideIntroduction || `${this.getBookDisplayName(book)}, Chapter ${chapter}`,
                content: overrideContent,
                maxSentences: document.getElementById('maxSentencesOverride').value ? 
                    parseInt(document.getElementById('maxSentencesOverride').value) : 5,
                ttsSpeed: document.getElementById('ttsSpeed').value
            };
        }

        return config;
    }
}

// Initialize the application when DOM is loaded
let audibibleApp;
document.addEventListener('DOMContentLoaded', () => {
    audibibleApp = new AudibibleApp();
});

// Service worker registration for potential offline functionality
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        // Uncomment when service worker is implemented
        // navigator.serviceWorker.register('/sw.js')
        //     .then(registration => console.log('SW registered'))
        //     .catch(registrationError => console.log('SW registration failed'));
    });
}
