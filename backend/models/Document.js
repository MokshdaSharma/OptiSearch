const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  originalFilename: {
    type: String,
    required: true
  },
  fileType: {
    type: String,
    required: true,
    enum: ['pdf', 'image']
  },
  mimeType: {
    type: String,
    required: true
  },
  fileSize: {
    type: Number,
    required: true
  },
  filePath: {
    type: String,
    required: true
  },
  fileHash: {
    type: String,
    required: true,
    unique: true
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  tags: [{
    type: String,
    trim: true
  }],
  documentLanguage: {
    type: String,
    default: 'eng',
    enum: ['eng', 'spa', 'fra', 'deu', 'ita', 'por', 'rus', 'chi_sim', 'jpn', 'kor', 'ara', 'hin']
  },
  totalPages: {
    type: Number,
    default: 1
  },
  processedPages: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['uploaded', 'queued', 'processing', 'completed', 'failed', 'partial'],
    default: 'uploaded'
  },
  processingProgress: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  averageConfidence: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  ocrLanguage: {
    type: String,
    default: 'eng'
  },
  preprocessingOptions: {
    deskew: { type: Boolean, default: false },
    denoise: { type: Boolean, default: false },
    rotate: { type: Number, default: 0 },
    binarize: { type: Boolean, default: false }
  },
  metadata: {
    author: String,
    createdDate: Date,
    modifiedDate: Date,
    keywords: [String]
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

// Text index for search
documentSchema.index({ 
  title: 'text', 
  tags: 'text', 
  'metadata.author': 'text',
  'metadata.keywords': 'text'
});

// Compound indexes
documentSchema.index({ uploadedBy: 1, createdAt: -1 });
documentSchema.index({ status: 1, createdAt: -1 });

// Update timestamp on save
documentSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Document', documentSchema);
