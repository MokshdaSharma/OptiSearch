const Job = require('../models/Job');
const Document = require('../models/Document');
const Page = require('../models/Page');
const ocrService = require('./ocrService');
const pdfService = require('./pdfService');
const path = require('path');
const fs = require('fs').promises;

class JobQueue {
  constructor() {
    this.activeJobs = new Map();
    this.maxConcurrentJobs = parseInt(process.env.MAX_CONCURRENT_JOBS) || 3;
    this.io = null;
    this.isProcessing = false;
  }

  initialize(io) {
    this.io = io;
    this.startProcessing();
  }

  /**
   * Add a new job to the queue
   */
  async addJob(documentId, userId, type = 'ocr_full', options = {}) {
    try {
      const job = new Job({
        document: documentId,
        user: userId,
        type,
        options: {
          language: options.language || 'eng',
          preprocessing: options.preprocessing || {}
        },
        pageNumbers: options.pageNumbers || []
      });

      await job.save();

      // Update document status
      await Document.findByIdAndUpdate(documentId, {
        status: 'queued'
      });

      // Notify via socket
      this.emitJobUpdate(job);

      // Start processing if not already running
      if (!this.isProcessing) {
        this.processNextJob();
      }

      return job;
    } catch (error) {
      console.error('Add job error:', error);
      throw error;
    }
  }

  /**
   * Start processing jobs from the queue
   */
  async startProcessing() {
    if (this.isProcessing) return;
    
    this.isProcessing = true;
    this.processNextJob();
  }

  /**
   * Process next job in the queue
   */
  async processNextJob() {
    try {
      // Check if we can process more jobs
      if (this.activeJobs.size >= this.maxConcurrentJobs) {
        return;
      }

      // Find next queued job
      const job = await Job.findOne({ status: 'queued' })
        .sort({ priority: -1, createdAt: 1 })
        .populate('document');

      if (!job) {
        // No jobs to process, check again after a delay
        setTimeout(() => this.processNextJob(), 5000);
        return;
      }

      // Mark job as processing
      this.activeJobs.set(job._id.toString(), job);
      job.status = 'processing';
      job.startedAt = new Date();
      await job.save();

      // Update document status
      await Document.findByIdAndUpdate(job.document._id, {
        status: 'processing'
      });

      this.emitJobUpdate(job);

      // Process the job
      await this.executeJob(job);

      // Remove from active jobs
      this.activeJobs.delete(job._id.toString());

      // Process next job
      setImmediate(() => this.processNextJob());
    } catch (error) {
      console.error('Process next job error:', error);
      setTimeout(() => this.processNextJob(), 5000);
    }
  }

  /**
   * Execute a job
   */
  async executeJob(job) {
    try {
      const document = await Document.findById(job.document);
      if (!document) {
        throw new Error('Document not found');
      }

      // Get or create pages
      let pages = await Page.find({ document: document._id }).sort({ pageNumber: 1 });
      
      if (pages.length === 0) {
        // Create pages from document
        pages = await this.createPagesFromDocument(document);
      }

      // Filter pages if specific pages requested
      if (job.pageNumbers && job.pageNumbers.length > 0) {
        pages = pages.filter(p => job.pageNumbers.includes(p.pageNumber));
      }

      // Update job progress total
      job.progress.total = pages.length;
      await job.save();

      // Process each page
      const results = [];
      for (let i = 0; i < pages.length; i++) {
        const page = pages[i];
        
        try {
          // Skip OCR if page already has text (PDF pages)
          if (page.status === 'completed' && page.text) {
            console.log(`Page ${page.pageNumber} already has text, skipping OCR`);
            results.push({
              pageNumber: page.pageNumber,
              success: true,
              confidence: page.confidence || 100
            });
          } else {
            // Perform OCR for image files
            const ocrResult = await ocrService.performOCR(
              page.imagePath,
              job.options.language,
              job.options.preprocessing
            );

            // Create thumbnail
            const thumbnailPath = page.imagePath.replace(/(\.[^.]+)$/, '_thumb$1');
            await ocrService.createThumbnail(page.imagePath, thumbnailPath);

            // Update page
            page.text = ocrResult.text;
            page.rawText = ocrResult.text;
            page.confidence = ocrResult.confidence;
            page.words = ocrResult.words;
            page.lines = ocrResult.lines;
            page.ocrLanguage = job.options.language;
            page.thumbnailPath = thumbnailPath;
            page.status = ocrResult.confidence < 60 ? 'low_quality' : 'completed';
            page.processingTime = ocrResult.processingTime;
            page.lastProcessedAt = new Date();
            await page.save();

            results.push({
              pageNumber: page.pageNumber,
              success: true,
              confidence: ocrResult.confidence
            });
          }
        } catch (error) {
          console.error(`Page ${page.pageNumber} OCR error:`, error);
          
          page.status = 'failed';
          page.errorMessage = error.message;
          page.retryCount += 1;
          await page.save();

          results.push({
            pageNumber: page.pageNumber,
            success: false,
            error: error.message
          });

          job.result.failedPages.push({
            pageNumber: page.pageNumber,
            error: error.message
          });
        }

        // Update progress
        job.progress.current = i + 1;
        job.progress.percentage = Math.round(((i + 1) / pages.length) * 100);
        
        // Calculate ETA
        const elapsed = Date.now() - job.startedAt.getTime();
        const avgTimePerPage = elapsed / (i + 1);
        const remainingPages = pages.length - (i + 1);
        job.estimatedTimeRemaining = Math.round((avgTimePerPage * remainingPages) / 1000);
        
        await job.save();
        this.emitJobUpdate(job);
      }

      // Calculate final statistics
      const successfulResults = results.filter(r => r.success);
      const avgConfidence = successfulResults.length > 0
        ? successfulResults.reduce((sum, r) => sum + r.confidence, 0) / successfulResults.length
        : 0;

      job.result.processedPages = successfulResults.length;
      job.result.averageConfidence = avgConfidence;
      job.result.totalProcessingTime = Date.now() - job.startedAt.getTime();
      job.status = 'completed';
      job.completedAt = new Date();
      await job.save();

      // Update document
      const completedPages = await Page.countDocuments({ 
        document: document._id, 
        status: { $in: ['completed', 'low_quality'] } 
      });
      
      const allPages = await Page.find({ document: document._id });
      const totalConfidence = allPages.reduce((sum, p) => sum + (p.confidence || 0), 0);
      
      document.processedPages = completedPages;
      document.processingProgress = Math.round((completedPages / document.totalPages) * 100);
      document.averageConfidence = allPages.length > 0 ? totalConfidence / allPages.length : 0;
      document.status = completedPages === document.totalPages ? 'completed' : 'partial';
      await document.save();

      this.emitJobUpdate(job);
      this.emitDocumentUpdate(document);
    } catch (error) {
      console.error('Execute job error:', error);
      
      job.status = 'failed';
      job.error = {
        message: error.message,
        stack: error.stack,
        timestamp: new Date()
      };
      job.completedAt = new Date();
      await job.save();

      // Update document status
      await Document.findByIdAndUpdate(job.document._id, {
        status: 'failed'
      });

      this.emitJobUpdate(job);
    }
  }

  /**
   * Create pages from document
   */
  async createPagesFromDocument(document) {
    const pages = [];
    const documentDir = path.join(
      process.env.UPLOAD_DIR || './uploads',
      'processed',
      document._id.toString()
    );

    if (document.fileType === 'pdf') {
      try {
        // Extract text directly from PDF (no image conversion needed)
        console.log('Extracting text from PDF:', document.filePath);
        const result = await pdfService.extractTextFromPdf(document.filePath);
        
        console.log(`PDF text extracted: ${result.totalPages} pages`);
        
        // Update document with actual page count
        document.totalPages = result.totalPages;
        await document.save();

        // Split text by pages (approximation - pdf-parse doesn't give per-page text easily)
        // We'll create a single page with all text for now
        const page = new Page({
          document: document._id,
          pageNumber: 1,
          imagePath: document.filePath, // Store PDF path
          text: result.text,
          rawText: result.text,
          confidence: 100, // PDF text is 100% accurate
          status: 'completed', // No OCR needed
          ocrLanguage: document.ocrLanguage || 'eng'
        });
        await page.save();
        pages.push(page);
        
      } catch (error) {
        console.error('PDF text extraction failed:', error);
        throw new Error(`PDF processing failed: ${error.message}`);
      }
    } else {
      // Single image file
      const page = new Page({
        document: document._id,
        pageNumber: 1,
        imagePath: document.filePath,
        status: 'pending'
      });
      await page.save();
      pages.push(page);
    }

    return pages;
  }

  /**
   * Cancel a job
   */
  async cancelJob(jobId) {
    const job = await Job.findById(jobId);
    if (!job) {
      throw new Error('Job not found');
    }

    if (job.status === 'processing') {
      // Can't cancel active job immediately, mark for cancellation
      job.status = 'cancelled';
      await job.save();
      this.emitJobUpdate(job);
      return job;
    }

    job.status = 'cancelled';
    job.completedAt = new Date();
    await job.save();
    this.emitJobUpdate(job);
    return job;
  }

  /**
   * Emit job update via socket
   */
  emitJobUpdate(job) {
    if (this.io) {
      this.io.emit('job:update', {
        jobId: job._id,
        documentId: job.document,
        status: job.status,
        progress: job.progress,
        estimatedTimeRemaining: job.estimatedTimeRemaining,
        result: job.result
      });
    }
  }

  /**
   * Emit document update via socket
   */
  emitDocumentUpdate(document) {
    if (this.io) {
      this.io.emit('document:update', {
        documentId: document._id,
        status: document.status,
        processingProgress: document.processingProgress,
        processedPages: document.processedPages,
        averageConfidence: document.averageConfidence
      });
    }
  }

  /**
   * Get job status
   */
  async getJobStatus(jobId) {
    return await Job.findById(jobId).populate('document');
  }

  /**
   * Get all jobs for a user
   */
  async getUserJobs(userId, status = null) {
    const query = { user: userId };
    if (status) {
      query.status = status;
    }
    return await Job.find(query)
      .populate('document')
      .sort({ createdAt: -1 })
      .limit(50);
  }
}

const jobQueue = new JobQueue();

module.exports = {
  initializeJobQueue: (io) => jobQueue.initialize(io),
  addJob: (...args) => jobQueue.addJob(...args),
  cancelJob: (jobId) => jobQueue.cancelJob(jobId),
  getJobStatus: (jobId) => jobQueue.getJobStatus(jobId),
  getUserJobs: (userId, status) => jobQueue.getUserJobs(userId, status)
};
