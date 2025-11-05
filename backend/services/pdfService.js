const pdf = require('pdf-parse');
const sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');

class PDFService {
  /**
   * Extract metadata from PDF
   */
  async extractMetadata(pdfPath) {
    try {
      const dataBuffer = await fs.readFile(pdfPath);
      const data = await pdf(dataBuffer);

      return {
        totalPages: data.numpages,
        info: data.info || {},
        metadata: data.metadata || {},
        version: data.version
      };
    } catch (error) {
      console.error('PDF metadata extraction error:', error);
      throw new Error(`Failed to extract PDF metadata: ${error.message}`);
    }
  }

  /**
   * Convert PDF pages to images for OCR
   * Note: This is a simplified version. For production, use pdf-poppler or similar
   */
  async convertPDFToImages(pdfPath, outputDir, documentId) {
    try {
      // Create output directory
      await fs.mkdir(outputDir, { recursive: true });

      const dataBuffer = await fs.readFile(pdfPath);
      const data = await pdf(dataBuffer);

      const pages = [];
      
      // For this implementation, we'll use a workaround
      // In production, you should use pdf-poppler or pdf2pic
      // This is a placeholder that creates a basic structure
      
      for (let i = 1; i <= data.numpages; i++) {
        const pageImagePath = path.join(outputDir, `page-${i}.png`);
        
        // Create a placeholder image (in production, render actual PDF page)
        // You would typically use pdf-poppler here
        await this.createPlaceholderImage(pageImagePath, i);
        
        pages.push({
          pageNumber: i,
          imagePath: pageImagePath,
          thumbnailPath: null
        });
      }

      return pages;
    } catch (error) {
      console.error('PDF to images conversion error:', error);
      throw new Error(`Failed to convert PDF to images: ${error.message}`);
    }
  }

  /**
   * Create placeholder image (replace with actual PDF rendering in production)
   */
  async createPlaceholderImage(outputPath, pageNumber) {
    try {
      // Create a white image with page number
      const width = 1000;
      const height = 1400;
      
      const svg = `
        <svg width="${width}" height="${height}">
          <rect width="100%" height="100%" fill="white"/>
          <text x="50%" y="50%" text-anchor="middle" font-size="48" fill="black">
            Page ${pageNumber}
          </text>
          <text x="50%" y="60%" text-anchor="middle" font-size="24" fill="gray">
            (PDF page placeholder - use pdf-poppler for actual rendering)
          </text>
        </svg>
      `;

      await sharp(Buffer.from(svg))
        .png()
        .toFile(outputPath);
    } catch (error) {
      console.error('Placeholder image creation error:', error);
    }
  }

  /**
   * Extract text directly from PDF (without OCR)
   */
  async extractTextFromPDF(pdfPath) {
    try {
      const dataBuffer = await fs.readFile(pdfPath);
      const data = await pdf(dataBuffer);

      return {
        text: data.text,
        pages: data.numpages
      };
    } catch (error) {
      console.error('PDF text extraction error:', error);
      return { text: '', pages: 0 };
    }
  }

  /**
   * Check if PDF contains searchable text
   */
  async hasSearchableText(pdfPath) {
    try {
      const result = await this.extractTextFromPDF(pdfPath);
      return result.text.trim().length > 0;
    } catch (error) {
      return false;
    }
  }
}

module.exports = new PDFService();
