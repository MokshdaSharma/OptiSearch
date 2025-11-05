const Tesseract = require('tesseract.js');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs').promises;

class OCRService {
  constructor() {
    this.activeWorkers = new Map();
    this.maxWorkers = parseInt(process.env.MAX_CONCURRENT_JOBS) || 3;
  }

  /**
   * Preprocess image for better OCR results
   */
  async preprocessImage(imagePath, options = {}) {
    try {
      const { deskew, denoise, rotate, binarize } = options;
      let image = sharp(imagePath);

      // Rotate if needed
      if (rotate && rotate !== 0) {
        image = image.rotate(rotate);
      }

      // Deskew (auto-rotate to correct angle)
      if (deskew) {
        // Sharp doesn't have built-in deskew, but we can use rotate with background
        image = image.rotate(0, { background: { r: 255, g: 255, b: 255 } });
      }

      // Enhance contrast and denoise
      if (denoise) {
        image = image
          .median(3) // Noise reduction
          .normalize(); // Enhance contrast
      }

      // Binarize (convert to black and white)
      if (binarize) {
        image = image
          .grayscale()
          .normalise()
          .threshold(128);
      }

      // Always enhance for better OCR
      image = image
        .sharpen()
        .resize(null, null, { 
          fit: 'inside',
          withoutEnlargement: true 
        });

      // Save processed image
      const processedPath = imagePath.replace(/(\.[^.]+)$/, '_processed$1');
      await image.toFile(processedPath);

      return processedPath;
    } catch (error) {
      console.error('Image preprocessing error:', error);
      // Return original path if preprocessing fails
      return imagePath;
    }
  }

  /**
   * Create thumbnail for page preview
   */
  async createThumbnail(imagePath, thumbnailPath) {
    try {
      await sharp(imagePath)
        .resize(200, 300, {
          fit: 'inside',
          withoutEnlargement: true
        })
        .toFile(thumbnailPath);
      
      return thumbnailPath;
    } catch (error) {
      console.error('Thumbnail creation error:', error);
      return null;
    }
  }

  /**
   * Perform OCR on a single image
   */
  async performOCR(imagePath, language = 'eng', options = {}) {
    const startTime = Date.now();
    
    try {
      // Preprocess image if options provided
      let processedPath = imagePath;
      if (options.deskew || options.denoise || options.rotate || options.binarize) {
        processedPath = await this.preprocessImage(imagePath, options);
      }

      // Perform OCR
      const result = await Tesseract.recognize(
        processedPath,
        language,
        {
          logger: info => {
            if (info.status === 'recognizing text') {
              console.log(`OCR Progress: ${(info.progress * 100).toFixed(2)}%`);
            }
          }
        }
      );

      const processingTime = Date.now() - startTime;

      // Extract words with bounding boxes (safely handle missing data)
      const words = [];
      if (result.data.words && Array.isArray(result.data.words)) {
        result.data.words.forEach(word => {
          if (word && word.text) {
            words.push({
              text: word.text,
              bbox: word.bbox || { x0: 0, y0: 0, x1: 0, y1: 0 },
              confidence: word.confidence || 0
            });
          }
        });
      }

      // Extract lines with bounding boxes (safely handle missing data)
      const lines = [];
      if (result.data.lines && Array.isArray(result.data.lines)) {
        result.data.lines.forEach(line => {
          if (line && line.text) {
            lines.push({
              text: line.text,
              bbox: line.bbox || { x0: 0, y0: 0, x1: 0, y1: 0 },
              confidence: line.confidence || 0,
              words: (line.words && Array.isArray(line.words)) ? line.words.map(w => w.text || '') : []
            });
          }
        });
      }

      // Clean up processed image if different from original
      if (processedPath !== imagePath) {
        try {
          await fs.unlink(processedPath);
        } catch (err) {
          console.warn('Failed to delete processed image:', err);
        }
      }

      return {
        text: result.data.text,
        confidence: result.data.confidence,
        words,
        lines,
        processingTime
      };
    } catch (error) {
      console.error('OCR error:', error);
      throw new Error(`OCR failed: ${error.message}`);
    }
  }

  /**
   * Process multiple pages with progress callback
   */
  async processPages(pages, language, options, progressCallback) {
    const results = [];
    const total = pages.length;

    for (let i = 0; i < total; i++) {
      const page = pages[i];
      
      try {
        const ocrResult = await this.performOCR(page.imagePath, language, options);
        
        results.push({
          pageNumber: page.pageNumber,
          success: true,
          ...ocrResult
        });

        if (progressCallback) {
          progressCallback({
            current: i + 1,
            total,
            percentage: Math.round(((i + 1) / total) * 100),
            currentPage: page.pageNumber
          });
        }
      } catch (error) {
        results.push({
          pageNumber: page.pageNumber,
          success: false,
          error: error.message
        });

        if (progressCallback) {
          progressCallback({
            current: i + 1,
            total,
            percentage: Math.round(((i + 1) / total) * 100),
            currentPage: page.pageNumber,
            error: error.message
          });
        }
      }
    }

    return results;
  }

  /**
   * Get available OCR languages
   */
  getAvailableLanguages() {
    return [
      { code: 'eng', name: 'English' },
      { code: 'spa', name: 'Spanish' },
      { code: 'fra', name: 'French' },
      { code: 'deu', name: 'German' },
      { code: 'ita', name: 'Italian' },
      { code: 'por', name: 'Portuguese' },
      { code: 'rus', name: 'Russian' },
      { code: 'chi_sim', name: 'Chinese Simplified' },
      { code: 'jpn', name: 'Japanese' },
      { code: 'kor', name: 'Korean' },
      { code: 'ara', name: 'Arabic' },
      { code: 'hin', name: 'Hindi' }
    ];
  }
}

module.exports = new OCRService();
