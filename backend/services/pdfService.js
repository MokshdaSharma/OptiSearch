const pdf = require('pdf-parse');
const path = require('path');
const fs = require('fs').promises;

/**
 * Extract text from PDF (PDFs already have text, no OCR needed)
 */
async function extractTextFromPdf(pdfPath) {
  try {
    console.log('Extracting text from PDF:', pdfPath);

    // Read PDF file
    const dataBuffer = await fs.readFile(pdfPath);
    
    // Parse PDF with page-level text extraction
    const data = await pdf(dataBuffer, {
      pagerender: async function(pageData) {
        const textContent = await pageData.getTextContent();
        const strings = textContent.items.map(item => item.str);
        return strings.join(' ');
      }
    });

    console.log(`PDF has ${data.numpages} pages, extracted ${data.text.length} characters`);

    return {
      totalPages: data.numpages,
      text: data.text,
      info: data.info
    };
  } catch (error) {
    console.error('PDF text extraction error:', error);
    throw new Error(`Failed to extract text from PDF: ${error.message}`);
  }
}

/**
 * Get PDF information
 */
async function getPdfInfo(pdfPath) {
  try {
    const dataBuffer = await fs.readFile(pdfPath);
    const data = await pdf(dataBuffer);

    return {
      pages: data.numpages,
      title: data.info?.Title || '',
      author: data.info?.Author || '',
      creator: data.info?.Creator || '',
      producer: data.info?.Producer || '',
      creationDate: data.info?.CreationDate || null,
      modificationDate: data.info?.ModDate || null
    };
  } catch (error) {
    console.error('Get PDF info error:', error);
    // Return default if info extraction fails
    return { pages: 1 };
  }
}

module.exports = {
  extractTextFromPdf,
  getPdfInfo
};
