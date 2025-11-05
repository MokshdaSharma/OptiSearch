const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  document: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Document',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['ocr_full', 'ocr_page', 'reprocess'],
    default: 'ocr_full'
  },
  status: {
    type: String,
    enum: ['queued', 'processing', 'completed', 'failed', 'cancelled'],
    default: 'queued'
  },
  priority: {
    type: Number,
    default: 0
  },
  progress: {
    current: {
      type: Number,
      default: 0
    },
    total: {
      type: Number,
      default: 0
    },
    percentage: {
      type: Number,
      default: 0
    }
  },
  pageNumbers: [{
    type: Number
  }], // Specific pages to process (for reprocessing)
  options: {
    language: {
      type: String,
      default: 'eng'
    },
    preprocessing: {
      deskew: { type: Boolean, default: false },
      denoise: { type: Boolean, default: false },
      rotate: { type: Number, default: 0 },
      binarize: { type: Boolean, default: false }
    }
  },
  result: {
    processedPages: {
      type: Number,
      default: 0
    },
    failedPages: [{
      pageNumber: Number,
      error: String
    }],
    averageConfidence: {
      type: Number,
      default: 0
    },
    totalProcessingTime: {
      type: Number,
      default: 0
    }
  },
  error: {
    message: String,
    stack: String,
    timestamp: Date
  },
  retryCount: {
    type: Number,
    default: 0
  },
  maxRetries: {
    type: Number,
    default: 3
  },
  estimatedTimeRemaining: {
    type: Number, // in seconds
    default: null
  },
  startedAt: {
    type: Date
  },
  completedAt: {
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

// Indexes
jobSchema.index({ status: 1, priority: -1, createdAt: 1 });
jobSchema.index({ document: 1 });
jobSchema.index({ user: 1, createdAt: -1 });

// Update timestamp on save
jobSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Job', jobSchema);
