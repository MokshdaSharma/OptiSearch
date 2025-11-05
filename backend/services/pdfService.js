const { pdfToPng } = require('pdf-to-png-converter');
const pdfParse = require('pdf-parse');
const path = require('path');
const fs = require('fs').promises;

/**
 * Convert PDF to images
 */
async function convertPdfToImages(pdfPath, outputDir) {
  try {
    // Ensure output directory exists
    await fs.mkdir(outputDir, { recursive: true });

    // Convert PDF to PNG images
    const pngPages = await pdfToPng(pdfPath, {
      disableFontFace: false,
      useSystemFonts: true,
      viewportScale: 2.0,  // Higher resolution for better OCR
      outputFolder: outputDir,
      strictPagination: false,
      verbosityLevel: 0
    });

    const imagePaths = pngPages.map((page, index) => {
      const outputPath = path.join(outputDir, `page-${index + 1}.jpg`);
      return outputPath;
    });

    // Convert PNG to JPEG and save
    for (let i = 0; i < pngPages.length; i++) {
      const page = pngPages[i];
      const jpegPath = imagePaths[i];
      await fs.writeFile(jpegPath, page.content);
      console.log(`Converted PDF page ${i + 1}/${pngPages.length}`);
    }

    return {
      totalPages: pngPages.length,
      imagePaths
    };
  } catch (error) {
    console.error('PDF conversion error:', error);
    throw new Error(`Failed to convert PDF: ${error.message}`);
  }
}

/**
 * Get PDF information
 */
async function getPdfInfo(pdfPath) {
  try {
    const dataBuffer = await fs.readFile(pdfPath);
    const data = await pdfParse(dataBuffer);

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
  convertPdfToImages,
  getPdfInfo
};
