const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { upload, calculateFileHash, validateFile, moveToProcessed } = require('../services/uploadService');
const { addJob } = require('../services/jobQueue');
const pdfService = require('../services/pdfService');
const Document = require('../models/Document');
const Page = require('../models/Page');
const path = require('path');
const fs = require('fs').promises;

/**
 * Upload document
 */
router.post('/upload', auth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Validate file
    const validationErrors = await validateFile(req.file);
    if (validationErrors.length > 0) {
      await fs.unlink(req.file.path);
      return res.status(400).json({ errors: validationErrors });
    }

    // Calculate file hash for duplicate detection
    const fileHash = await calculateFileHash(req.file.path);

    // Check for duplicate
    const existingDoc = await Document.findOne({ fileHash });
    if (existingDoc) {
      await fs.unlink(req.file.path);
      return res.status(409).json({ 
        error: 'Duplicate file detected',
        existingDocument: existingDoc 
      });
    }

    // Determine file type
    const fileType = req.file.mimetype === 'application/pdf' ? 'pdf' : 'image';
    
    // Get metadata
    let totalPages = 1;
    let metadata = {};
    
    // For PDFs, get page count and metadata
    if (fileType === 'pdf') {
      try {
        const pdfInfo = await pdfService.getPdfInfo(req.file.path);
        totalPages = pdfInfo.pages || 1;
        metadata = {
          title: pdfInfo.title,
          author: pdfInfo.author,
          creator: pdfInfo.creator,
          producer: pdfInfo.producer,
          creationDate: pdfInfo.creationDate,
          modificationDate: pdfInfo.modificationDate
        };
      } catch (error) {
        console.warn('Failed to extract PDF metadata:', error);
        // Continue with default values
      }
    }

    // Create document
    const document = new Document({
      title: req.body.title || req.file.originalname,
      originalFilename: req.file.originalname,
      fileType,
      mimeType: req.file.mimetype,
      fileSize: req.file.size,
      filePath: req.file.path,
      fileHash,
      uploadedBy: req.user._id,
      tags: req.body.tags ? JSON.parse(req.body.tags) : [],
      documentLanguage: req.body.language || 'eng',
      ocrLanguage: req.body.language || 'eng',
      totalPages,
      metadata,
      preprocessingOptions: req.body.preprocessingOptions ? JSON.parse(req.body.preprocessingOptions) : {}
    });

    await document.save();

    // Move file to processed directory
    const newPath = await moveToProcessed(req.file.path, document._id.toString());
    document.filePath = newPath;
    await document.save();

    // Add OCR job to queue
    const job = await addJob(
      document._id,
      req.user._id,
      'ocr_full',
      {
        language: document.ocrLanguage,
        preprocessing: document.preprocessingOptions
      }
    );

    res.status(201).json({
      message: 'File uploaded successfully',
      document,
      job: {
        id: job._id,
        status: job.status
      }
    });
  } catch (error) {
    console.error('Upload error:', error);
    
    // Clean up file on error
    if (req.file) {
      try {
        await fs.unlink(req.file.path);
      } catch (unlinkError) {
        console.error('Failed to delete file:', unlinkError);
      }
    }
    
    res.status(500).json({ error: 'Upload failed', message: error.message });
  }
});

/**
 * Get all documents for current user
 */
router.get('/', auth, async (req, res) => {
  try {
    const { 
      status, 
      fileType, 
      page = 1, 
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const query = { uploadedBy: req.user._id };
    
    if (status) query.status = status;
    if (fileType) query.fileType = fileType;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    const documents = await Document.find(query)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Document.countDocuments(query);

    res.json({
      documents,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get documents error:', error);
    res.status(500).json({ error: 'Failed to fetch documents' });
  }
});

/**
 * Get document by ID
 */
router.get('/:id', auth, async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // Check ownership
    if (document.uploadedBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({ document });
  } catch (error) {
    console.error('Get document error:', error);
    res.status(500).json({ error: 'Failed to fetch document' });
  }
});

/**
 * Get document pages
 */
router.get('/:id/pages', auth, async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // Check ownership
    if (document.uploadedBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const pages = await Page.find({ document: req.params.id })
      .sort({ pageNumber: 1 });

    res.json({ pages });
  } catch (error) {
    console.error('Get pages error:', error);
    res.status(500).json({ error: 'Failed to fetch pages' });
  }
});

/**
 * Get specific page
 */
router.get('/:id/pages/:pageNumber', auth, async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // Check ownership
    if (document.uploadedBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const page = await Page.findOne({ 
      document: req.params.id,
      pageNumber: parseInt(req.params.pageNumber)
    });

    if (!page) {
      return res.status(404).json({ error: 'Page not found' });
    }

    res.json({ page });
  } catch (error) {
    console.error('Get page error:', error);
    res.status(500).json({ error: 'Failed to fetch page' });
  }
});

/**
 * Reprocess specific pages
 */
router.post('/:id/reprocess', auth, async (req, res) => {
  try {
    const { pageNumbers, language, preprocessingOptions } = req.body;

    const document = await Document.findById(req.params.id);

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // Check ownership
    if (document.uploadedBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Add reprocess job
    const job = await addJob(
      document._id,
      req.user._id,
      'reprocess',
      {
        pageNumbers: pageNumbers || [],
        language: language || document.ocrLanguage,
        preprocessing: preprocessingOptions || document.preprocessingOptions
      }
    );

    res.json({
      message: 'Reprocessing job created',
      job: {
        id: job._id,
        status: job.status
      }
    });
  } catch (error) {
    console.error('Reprocess error:', error);
    res.status(500).json({ error: 'Failed to create reprocess job' });
  }
});

/**
 * Update document metadata
 */
router.patch('/:id', auth, async (req, res) => {
  try {
    const { title, tags } = req.body;

    const document = await Document.findById(req.params.id);

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // Check ownership
    if (document.uploadedBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (title) document.title = title;
    if (tags) document.tags = tags;

    await document.save();

    res.json({ 
      message: 'Document updated successfully',
      document 
    });
  } catch (error) {
    console.error('Update document error:', error);
    res.status(500).json({ error: 'Failed to update document' });
  }
});

/**
 * Delete document
 */
router.delete('/:id', auth, async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // Check ownership
    if (document.uploadedBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Delete associated pages
    await Page.deleteMany({ document: document._id });

    // Delete files
    try {
      const documentDir = path.join(
        process.env.UPLOAD_DIR || './uploads',
        'processed',
        document._id.toString()
      );
      await fs.rm(documentDir, { recursive: true, force: true });
    } catch (fileError) {
      console.warn('Failed to delete document files:', fileError);
    }

    // Delete document
    await document.deleteOne();

    res.json({ message: 'Document deleted successfully' });
  } catch (error) {
    console.error('Delete document error:', error);
    res.status(500).json({ error: 'Failed to delete document' });
  }
});

module.exports = router;
