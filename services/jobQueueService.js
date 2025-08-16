const fs = require('fs-extra');
const path = require('path');

/**
 * Job Queue Service for managing transcription jobs
 * Handles job queuing, processing, and status tracking
 */
class JobQueueService {
    constructor() {
        this.queue = [];
        this.processing = false;
        this.currentJob = null;
        this.completedJobs = [];
        this.maxCompletedJobs = 50; // Keep last 50 completed jobs
    }

    /**
     * Add a job to the queue
     * @param {Object} job - Job object with id, params, and metadata
     * @returns {Object} Queue status
     */
    addJob(job) {
        const queuedJob = {
            id: job.id,
            params: job.params,
            status: 'queued',
            queuedAt: new Date().toISOString(),
            position: this.queue.length + 1
        };

        this.queue.push(queuedJob);
        
        console.log(`Job ${job.id} added to queue. Position: ${queuedJob.position}`);
        
        // Start processing if not already processing
        if (!this.processing) {
            setImmediate(() => this.processNext());
        }

        return {
            success: true,
            job: queuedJob,
            queueLength: this.queue.length,
            position: queuedJob.position
        };
    }

    /**
     * Get queue status
     * @returns {Object} Current queue status
     */
    getQueueStatus() {
        return {
            processing: this.processing,
            currentJob: this.currentJob,
            queueLength: this.queue.length,
            queue: this.queue.map(job => ({
                id: job.id,
                status: job.status,
                queuedAt: job.queuedAt,
                position: job.position,
                params: {
                    book: job.params.book,
                    chapter: job.params.chapter,
                    version: job.params.version,
                    createVideo: job.params.createVideo
                }
            })),
            recentCompleted: this.completedJobs.slice(-5) // Last 5 completed
        };
    }

    /**
     * Process next job in queue
     */
    async processNext() {
        if (this.processing || this.queue.length === 0) {
            return;
        }

        this.processing = true;
        const job = this.queue.shift();
        this.currentJob = {
            ...job,
            status: 'processing',
            startedAt: new Date().toISOString()
        };

        console.log(`Starting job ${job.id}`);

        try {
            // Update positions for remaining jobs
            this.queue.forEach((queuedJob, index) => {
                queuedJob.position = index + 1;
            });

            // Import the processing function dynamically to avoid circular dependency
            const { processTranscriptionInBackground } = require('../routes/api');
            
            // Process the job
            await processTranscriptionInBackground(job.id, job.params);

            // Mark as completed
            this.currentJob.status = 'completed';
            this.currentJob.completedAt = new Date().toISOString();
            
            this.completedJobs.push(this.currentJob);
            
            // Keep only the most recent completed jobs
            if (this.completedJobs.length > this.maxCompletedJobs) {
                this.completedJobs = this.completedJobs.slice(-this.maxCompletedJobs);
            }

            console.log(`Job ${job.id} completed successfully`);

        } catch (error) {
            console.error(`Job ${job.id} failed:`, error);
            
            this.currentJob.status = 'failed';
            this.currentJob.error = error.message;
            this.currentJob.completedAt = new Date().toISOString();
            
            this.completedJobs.push(this.currentJob);
        }

        this.currentJob = null;
        this.processing = false;

        // Process next job if any
        if (this.queue.length > 0) {
            setImmediate(() => this.processNext());
        }
    }

    /**
     * Cancel a job in queue
     * @param {string} jobId - Job ID to cancel
     * @returns {Object} Cancellation result
     */
    cancelJob(jobId) {
        const jobIndex = this.queue.findIndex(job => job.id === jobId);
        
        if (jobIndex === -1) {
            return {
                success: false,
                error: 'Job not found in queue'
            };
        }

        const canceledJob = this.queue.splice(jobIndex, 1)[0];
        canceledJob.status = 'cancelled';
        canceledJob.cancelledAt = new Date().toISOString();
        
        this.completedJobs.push(canceledJob);

        // Update positions for remaining jobs
        this.queue.forEach((job, index) => {
            job.position = index + 1;
        });

        console.log(`Job ${jobId} cancelled`);

        return {
            success: true,
            job: canceledJob
        };
    }

    /**
     * Clear completed jobs history
     */
    clearCompleted() {
        this.completedJobs = [];
        console.log('Completed jobs history cleared');
    }

    /**
     * Get job by ID (from queue, current, or completed)
     * @param {string} jobId - Job ID
     * @returns {Object|null} Job object or null if not found
     */
    getJob(jobId) {
        // Check current job
        if (this.currentJob && this.currentJob.id === jobId) {
            return this.currentJob;
        }

        // Check queue
        const queuedJob = this.queue.find(job => job.id === jobId);
        if (queuedJob) {
            return queuedJob;
        }

        // Check completed jobs
        const completedJob = this.completedJobs.find(job => job.id === jobId);
        if (completedJob) {
            return completedJob;
        }

        return null;
    }
}

// Create singleton instance
const jobQueueService = new JobQueueService();

module.exports = jobQueueService;
