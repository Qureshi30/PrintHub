import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';
import * as XLSX from 'xlsx';

// Configure PDF.js worker - use local worker file to avoid CORS issues
try {
  // Use local worker file served from public directory
  pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
  console.log('📄 PDF.js configured with local worker');
} catch (error) {
  console.warn('Failed to configure PDF.js:', error);
}

export interface DocumentInfo {
  pages: number;
  type: string;
  error?: string;
}

export async function parseDocumentPages(file: File): Promise<DocumentInfo> {
  try {
    // Use file extension as primary detection method for better reliability
    const ext = file.name.toLowerCase().split('.').pop() || '';
    
    console.log(`Parsing document: ${file.name}, type: ${ext}, size: ${(file.size / 1024).toFixed(1)}KB`);
    
    // Handle images first (no need for complex parsing)
    if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'].includes(ext)) {
      return { pages: 1, type: 'image' };
    }
    
    // Try to parse the file buffer for complex documents
    const buffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(buffer);
    
    switch (ext) {
      case 'pdf':
        return await parsePdfPages(uint8Array).catch(error => {
          console.warn('PDF parsing failed, using estimation:', error);
          return estimatePagesBySize(file.size, ext);
        });
      
      case 'docx':
        return await parseWordPages(uint8Array, ext).catch(error => {
          console.warn('Word parsing failed, using estimation:', error);
          return estimatePagesBySize(file.size, ext);
        });
      
      case 'doc':
        // .doc files are harder to parse, use estimation
        return estimatePagesBySize(file.size, ext);
      
      case 'xlsx':
        return await parseExcelPages(uint8Array, ext).catch(error => {
          console.warn('Excel parsing failed, using estimation:', error);
          return estimatePagesBySize(file.size, ext);
        });
        
      case 'xls':
        // .xls files are harder to parse, use estimation
        return estimatePagesBySize(file.size, ext);
      
      case 'pptx':
      case 'ppt':
        return await parsePowerPointPages(uint8Array, ext);
      
      case 'txt':
        return parseTextPages(new TextDecoder().decode(uint8Array));
      
      default:
        // Fallback to size-based estimation
        return estimatePagesBySize(file.size, ext);
    }
  } catch (error) {
    console.error('Error parsing document:', error);
    // Fallback to size-based estimation
    return estimatePagesBySize(file.size, file.name.toLowerCase().split('.').pop() || '');
  }
}

async function parsePdfPages(uint8Array: Uint8Array): Promise<DocumentInfo> {
  try {
    console.log('🔍 Starting PDF parsing with PDF.js, buffer size:', uint8Array.length);
    const pdf = await pdfjsLib.getDocument({ data: uint8Array }).promise;
    console.log('✅ PDF.js parsing successful, pages:', pdf.numPages);
    return {
      pages: pdf.numPages,
      type: 'pdf'
    };
  } catch (error) {
    console.error('❌ Error parsing PDF with PDF.js:', error);
    const fallbackResult = estimatePagesBySize(uint8Array.length, 'pdf');
    console.log('📏 Using size estimation fallback:', fallbackResult);
    return {
      pages: fallbackResult.pages,
      type: 'pdf',
      error: 'Failed to parse PDF, using size estimation'
    };
  }
}

async function parseWordPages(uint8Array: Uint8Array, ext: string): Promise<DocumentInfo> {
  try {
    if (ext === 'docx') {
      const result = await mammoth.extractRawText({ arrayBuffer: uint8Array.buffer as ArrayBuffer });
      const text = result.value;
      
      // Estimate pages based on character count
      // Rough estimation: ~3000 characters per page (including spaces)
      const estimatedPages = Math.max(1, Math.ceil(text.length / 3000));
      
      return {
        pages: estimatedPages,
        type: 'word'
      };
    } else {
      // For .doc files, fall back to size estimation
      return estimatePagesBySize(uint8Array.length, ext);
    }
  } catch (error) {
    console.error('Error parsing Word document:', error);
    return {
      pages: estimatePagesBySize(uint8Array.length, ext).pages,
      type: 'word',
      error: 'Failed to parse Word document, using size estimation'
    };
  }
}

async function parseExcelPages(uint8Array: Uint8Array, ext: string): Promise<DocumentInfo> {
  try {
    const workbook = XLSX.read(uint8Array, { type: 'array' });
    const sheetNames = workbook.SheetNames;
    
    let totalPages = 0;
    
    for (const sheetName of sheetNames) {
      const sheet = workbook.Sheets[sheetName];
      const range = XLSX.utils.decode_range(sheet['!ref'] || 'A1:A1');
      
      // Estimate pages per sheet based on row count
      // Rough estimation: ~50 rows per page (depends on content density)
      const rows = range.e.r - range.s.r + 1;
      const pagesPerSheet = Math.max(1, Math.ceil(rows / 50));
      totalPages += pagesPerSheet;
    }
    
    return {
      pages: Math.max(1, totalPages),
      type: 'excel'
    };
  } catch (error) {
    console.error('Error parsing Excel document:', error);
    return {
      pages: estimatePagesBySize(uint8Array.length, ext).pages,
      type: 'excel',
      error: 'Failed to parse Excel document, using size estimation'
    };
  }
}

async function parsePowerPointPages(uint8Array: Uint8Array, ext: string): Promise<DocumentInfo> {
  try {
    // PowerPoint parsing is complex, so we'll use a rough estimation
    // Based on file size and typical slide counts
    const sizeInMB = uint8Array.length / (1024 * 1024);
    
    // Rough estimation: ~1MB per 10-15 slides for typical presentations
    let estimatedSlides;
    if (sizeInMB < 1) {
      estimatedSlides = Math.max(1, Math.round(sizeInMB * 15));
    } else if (sizeInMB < 10) {
      estimatedSlides = Math.max(1, Math.round(sizeInMB * 12));
    } else {
      estimatedSlides = Math.max(1, Math.round(sizeInMB * 10));
    }
    
    return {
      pages: estimatedSlides,
      type: 'powerpoint'
    };
  } catch (error) {
    console.error('Error parsing PowerPoint document:', error);
    return estimatePagesBySize(uint8Array.length, ext);
  }
}

function parseTextPages(text: string): DocumentInfo {
  // Estimate pages based on character count
  // Rough estimation: ~3000 characters per page
  const estimatedPages = Math.max(1, Math.ceil(text.length / 3000));
  
  return {
    pages: estimatedPages,
    type: 'text'
  };
}

function estimatePagesBySize(sizeInBytes: number, ext: string): DocumentInfo {
  const sizeInKB = sizeInBytes / 1024;
  
  let estimatedPages: number;
  
  switch (ext) {
    case 'pdf':
      // PDF estimation: more conservative approach
      // PDFs can vary widely - simple text PDFs vs image-heavy PDFs
      if (sizeInKB < 50) estimatedPages = 1;
      else if (sizeInKB < 200) estimatedPages = Math.max(1, Math.round(sizeInKB / 100)); // ~100KB per page for simple PDFs
      else if (sizeInKB < 1000) estimatedPages = Math.max(1, Math.round(sizeInKB / 200)); // ~200KB per page for medium PDFs
      else estimatedPages = Math.max(1, Math.round(sizeInKB / 300)); // ~300KB per page for complex PDFs
      break;
      
    case 'docx':
    case 'doc':
      // Word document estimation
      if (sizeInKB < 50) estimatedPages = 1;
      else estimatedPages = Math.round(sizeInKB / 25); // ~25KB per page
      break;
      
    case 'xlsx':
    case 'xls':
      // Excel estimation - typically fewer "pages" but larger file sizes
      if (sizeInKB < 100) estimatedPages = 1;
      else estimatedPages = Math.max(1, Math.round(sizeInKB / 200)); // ~200KB per sheet
      break;
      
    case 'pptx':
    case 'ppt':
      // PowerPoint estimation
      if (sizeInKB < 100) estimatedPages = 1;
      else estimatedPages = Math.round(sizeInKB / 100); // ~100KB per slide
      break;
      
    case 'txt':
      // Text files are usually small
      estimatedPages = Math.max(1, Math.round(sizeInKB / 5)); // ~5KB per page
      break;
      
    default:
      // Generic estimation
      estimatedPages = Math.max(1, Math.round(sizeInKB / 100));
  }
  
  return {
    pages: Math.max(1, estimatedPages),
    type: 'unknown',
    error: 'Using size-based estimation'
  };
}