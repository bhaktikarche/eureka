// utils/textExtractor.js
const pdfParse = require('pdf-parse');
const fs = require('fs');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

const extractTextFromFile = async (filePath, mimeType) => {
  try {
    // For PDF files
    if (mimeType === 'application/pdf') {
      const dataBuffer = fs.readFileSync(filePath);
      const data = await pdfParse(dataBuffer);
      return data.text || '';
    }
    
    // For text files
    else if (mimeType === 'text/plain') {
      return fs.readFileSync(filePath, 'utf8');
    }
    
    // For Word documents (requires antiword or docx2txt to be installed)
    else if (mimeType === 'application/msword') {
      try {
        const { stdout } = await execPromise(`antiword "${filePath}"`);
        return stdout;
      } catch (error) {
        console.warn('antiword not available, trying text extraction fallback');
        // Fallback: try to read as binary and extract text
        const buffer = fs.readFileSync(filePath);
        return buffer.toString('utf8').replace(/[^\x20-\x7E\n\r\t]/g, '');
      }
    }
    
    // For Word DOCX files (requires docx2txt or similar)
    else if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      try {
        const { stdout } = await execPromise(`docx2txt "${filePath}" -`);
        return stdout;
      } catch (error) {
        console.warn('docx2txt not available, trying text extraction fallback');
        // Fallback: try to read as zip and extract document.xml
        try {
          const { stdout } = await execPromise(`unzip -p "${filePath}" word/document.xml | sed 's/<[^>]*>//g'`);
          return stdout;
        } catch (zipError) {
          console.warn('unzip not available, using basic text extraction');
          const buffer = fs.readFileSync(filePath);
          return buffer.toString('utf8').replace(/[^\x20-\x7E\n\r\t]/g, '');
        }
      }
    }
    
    // For RTF files
    else if (mimeType === 'application/rtf') {
      try {
        const { stdout } = await execPromise(`unrtf --text "${filePath}"`);
        return stdout;
      } catch (error) {
        console.warn('unrtf not available, using basic text extraction');
        const buffer = fs.readFileSync(filePath);
        return buffer.toString('utf8').replace(/[^\x20-\x7E\n\r\t]/g, '');
      }
    }
    
    // Default fallback
    else {
      const buffer = fs.readFileSync(filePath);
      return buffer.toString('utf8').replace(/[^\x20-\x7E\n\r\t]/g, '');
    }
  } catch (error) {
    console.error('Text extraction error:', error);
    return ''; // Return empty string instead of crashing
  }
};

module.exports = { extractTextFromFile };