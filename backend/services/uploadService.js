const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const fs = require('fs').promises;

// Configure storage
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(process.env.UPLOAD_DIR || './uploads', 'temp');
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}`;
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueSuffix}${ext}`);
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  const allowedTypes = (process.env.ALLOWED_FILE_TYPES || 'application/pdf,image/jpeg,image/png,image/jpg,image/tiff').split(',');
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type. Allowed types: ${allowedTypes.join(', ')}`), false);
  }
};

// Multer configuration
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 52428800 // 50MB default
  }
});

/**
 * Calculate file hash for duplicate detection
 */
async function calculateFileHash(filePath) {
  const fileBuffer = await fs.readFile(filePath);
  return crypto.createHash('sha256').update(fileBuffer).digest('hex');
}

/**
 * Validate uploaded file
 */
async function validateFile(file) {
  const errors = [];

  // Check file size
  const maxSize = parseInt(process.env.MAX_FILE_SIZE) || 52428800;
  if (file.size > maxSize) {
    errors.push(`File size exceeds maximum allowed size of ${maxSize / 1024 / 1024}MB`);
  }

  // Check file type
  const allowedTypes = (process.env.ALLOWED_FILE_TYPES || 'application/pdf,image/jpeg,image/png,image/jpg,image/tiff').split(',');
  if (!allowedTypes.includes(file.mimetype)) {
    errors.push(`Invalid file type. Allowed types: ${allowedTypes.join(', ')}`);
  }

  return errors;
}

/**
 * Move file from temp to processed directory
 */
async function moveToProcessed(tempPath, documentId) {
  const processedDir = path.join(process.env.UPLOAD_DIR || './uploads', 'processed', documentId);
  await fs.mkdir(processedDir, { recursive: true });
  
  const fileName = path.basename(tempPath);
  const newPath = path.join(processedDir, fileName);
  
  await fs.rename(tempPath, newPath);
  return newPath;
}

/**
 * Clean up temporary files
 */
async function cleanupTempFile(filePath) {
  try {
    await fs.unlink(filePath);
  } catch (error) {
    console.warn('Failed to delete temp file:', error);
  }
}

module.exports = {
  upload,
  calculateFileHash,
  validateFile,
  moveToProcessed,
  cleanupTempFile
};
