const mongoose = require('mongoose');

const pageSchema = new mongoose.Schema({
  document: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Document',
    required: true
  },
  pageNumber: {
    type: Number,
    required: true
  },
  text: {
    type: String,
    default: ''
  },
  rawText: {
    type: String,
    default: ''
  },
  confidence: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  words: [{
    text: String,
    bbox: {
      x0: Number,
      y0: Number,
      x1: Number,
      y1: Number
    },
    confidence: Number
  }],
  lines: [{
    text: String,
    bbox: {
      x0: Number,
      y0: Number,
      x1: Number,
      y1: Number
    },
    confidence: Number,
    words: [Number] // Indices to words array
  }],
  ocrLanguage: {
    type: String,
    default: 'eng'
  },
  imagePath: {
    type: String
  },
  thumbnailPath: {
    type: String
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed', 'low_quality'],
    default: 'pending'
  },
  processingTime: {
    type: Number, // in milliseconds
    default: 0
  },
  errorMessage: {
    type: String
  },
  retryCount: {
    type: Number,
    default: 0
  },
  lastProcessedAt: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Text index for full-text search
pageSchema.index({ text: 'text', rawText: 'text' });

// Compound indexes
pageSchema.index({ document: 1, pageNumber: 1 }, { unique: true });
pageSchema.index({ document: 1, status: 1 });
pageSchema.index({ confidence: 1 });

// Update timestamp on save
pageSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Page', pageSchema);
