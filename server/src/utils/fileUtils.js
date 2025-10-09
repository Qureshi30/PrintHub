const fs = require('fs').promises;
const path = require('path');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const { v2: cloudinary } = require('cloudinary');

// Configure Cloudinary (ensure it's configured before use)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Downloads a file from Cloudinary using public ID (more reliable than URL)
 * @param {string} publicId - Cloudinary public ID
 * @param {string} originalName - Original filename for extension detection
 * @returns {Promise<string>} - Local file path
 */
const downloadFileByPublicId = async (publicId, originalName) => {
  try {
    console.log(`📥 Downloading file by public ID: ${publicId}`);
    
    // Create temp directory if it doesn't exist
    const tempDir = path.join(__dirname, '../../temp');
    await fs.mkdir(tempDir, { recursive: true });
    
    // Generate unique filename with original extension
    const fileExtension = path.extname(originalName).toLowerCase() || '.pdf';
    const tempFileName = `${uuidv4()}${fileExtension}`;
    const localFilePath = path.join(tempDir, tempFileName);
    
    // Generate a fresh public URL using Cloudinary API
    // For PDFs uploaded with resource_type: 'auto', they become 'image' type
    const publicUrl = cloudinary.url(publicId, {
      resource_type: 'image',
      type: 'upload',
      secure: true
    });
    
    console.log(`📎 Generated public URL: ${publicUrl}`);
    
    // Download using the generated URL
    const response = await axios({
      method: 'GET',
      url: publicUrl,
      responseType: 'stream',
      timeout: 30000,
      headers: {
        'User-Agent': 'PrintHub-Server/1.0',
        'Accept': '*/*',
      },
    });
    
    // Create write stream and pipe response
    const writer = require('fs').createWriteStream(localFilePath);
    response.data.pipe(writer);
    
    // Wait for download to complete
    await new Promise((resolve, reject) => {
      writer.on('finish', resolve);
      writer.on('error', reject);
    });
    
    // Verify file exists and has content
    const stats = await fs.stat(localFilePath);
    if (stats.size === 0) {
      throw new Error('Downloaded file is empty');
    }
    
    console.log(`✅ File downloaded successfully: ${localFilePath} (${stats.size} bytes)`);
    return localFilePath;
    
  } catch (error) {
    console.error('❌ File download by public ID failed:', error.message);
    throw new Error(`Failed to download file: ${error.message}`);
  }
};

/**
 * Downloads a file from Cloudinary URL to temporary local storage (fallback method)
 * @param {string} url - Cloudinary URL
 * @param {string} originalName - Original filename for extension detection
 * @returns {Promise<string>} - Local file path
 */
const downloadFile = async (url, originalName) => {
  try {
    console.log(`📥 Downloading file from: ${url}`);
    
    // Create temp directory if it doesn't exist
    const tempDir = path.join(__dirname, '../../temp');
    await fs.mkdir(tempDir, { recursive: true });
    
    // Generate unique filename with original extension
    const fileExtension = path.extname(originalName) || '.pdf';
    const tempFileName = `${uuidv4()}${fileExtension}`;
    const localFilePath = path.join(tempDir, tempFileName);
    
    // Try to download file with different approaches
    let response;
    try {
      // First try: Direct download
      response = await axios({
        method: 'GET',
        url: url,
        responseType: 'stream',
        timeout: 30000, // 30 second timeout
      });
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('🔄 Direct download failed with 401, trying with authentication headers...');
        
        // Second try: Add common authentication headers
        response = await axios({
          method: 'GET',
          url: url,
          responseType: 'stream',
          timeout: 30000,
          headers: {
            'User-Agent': 'PrintHub-Server/1.0',
            'Accept': '*/*',
          },
        });
      } else {
        throw error;
      }
    }
    
    // Create write stream and pipe response
    const writer = require('fs').createWriteStream(localFilePath);
    response.data.pipe(writer);
    
    // Wait for download to complete
    await new Promise((resolve, reject) => {
      writer.on('finish', resolve);
      writer.on('error', reject);
    });
    
    // Verify file exists and has content
    const stats = await fs.stat(localFilePath);
    if (stats.size === 0) {
      throw new Error('Downloaded file is empty');
    }
    
    console.log(`✅ File downloaded successfully: ${localFilePath} (${stats.size} bytes)`);
    return localFilePath;
    
  } catch (error) {
    console.error('❌ File download failed:', error.message);
    throw new Error(`Failed to download file: ${error.message}`);
  }
};

/**
 * Deletes a temporary file
 * @param {string} filePath - Path to file to delete
 */
const deleteTempFile = async (filePath) => {
  try {
    await fs.unlink(filePath);
    console.log(`🗑️ Temporary file deleted: ${filePath}`);
  } catch (error) {
    console.error(`⚠️ Failed to delete temp file ${filePath}:`, error.message);
  }
};

/**
 * Cleans up old temporary files (older than 1 hour)
 */
const cleanupTempFiles = async () => {
  try {
    const tempDir = path.join(__dirname, '../../temp');
    const files = await fs.readdir(tempDir);
    const oneHourAgo = Date.now() - (60 * 60 * 1000); // 1 hour in milliseconds
    
    for (const file of files) {
      const filePath = path.join(tempDir, file);
      const stats = await fs.stat(filePath);
      
      if (stats.mtime.getTime() < oneHourAgo) {
        await deleteTempFile(filePath);
      }
    }
    
    console.log(`🧹 Temp file cleanup completed`);
  } catch (error) {
    console.error('⚠️ Temp file cleanup failed:', error.message);
  }
};

/**
 * Configure duplex options
 * @param {Object} options - Print options object to modify
 * @param {boolean} isDuplex - Whether duplex is enabled
 */
const configureDuplexOptions = (options, isDuplex) => {
  if (isDuplex) {
    options.duplex = 'long';
    options.sides = 'two-sided-long-edge';
    options.duplexing = 'DuplexTumble';
    options.printOnBothSidesOfPaper = true;
    options.win32 = {
      duplex: 'DMDUP_VERTICAL',
      orientation: 'DMORIENT_PORTRAIT'
    };
    console.log(`🔄 DUPLEX: Enabled double-sided printing with long-edge binding`);
  } else {
    options.duplex = false;
    options.sides = 'one-sided';
    options.duplexing = 'Simplex';
    options.printOnBothSidesOfPaper = false;
    console.log(`📄 SIMPLEX: Enabled single-sided printing`);
  }
};

/**
 * Validate and format page range
 * @param {string} pageRange - Raw page range input
 * @returns {string|null} - Formatted page range or null if invalid
 */
const validatePageRange = (pageRange) => {
  const cleanRange = pageRange.toString().trim();
  
  if (cleanRange.match(/^\d+(-\d+)?(,\s*\d+(-\d+)?)*$/)) {
    return cleanRange;
  } else if (cleanRange === 'current' || cleanRange === '1') {
    return '1';
  } else if (cleanRange.match(/^\d+$/)) {
    return cleanRange;
  }
  
  return null;
};

/**
 * Maps PrintJob settings to pdf-to-printer options
 * @param {Object} settings - PrintJob settings
 * @returns {Object} - pdf-to-printer options
 */
const mapPrintSettings = (settings) => {
  const options = {};
  
  console.log(`⚙️ MAPPING: Converting print settings:`, settings);
  
  // Copies
  if (settings.copies && settings.copies > 1) {
    const copies = Math.max(1, Math.min(100, parseInt(settings.copies)));
    options.copies = copies;
    console.log(`📋 COPIES: Set to ${copies}`);
  }
  
  // Paper size mapping
  const paperSizeMap = {
    'A4': 'A4',
    'A3': 'A3',
    'Letter': 'Letter',
    'Legal': 'Legal',
    'Certificate': 'A4', // Fallback to A4 for Certificate
  };
  
  if (settings.paperType && paperSizeMap[settings.paperType]) {
    options.paperSize = paperSizeMap[settings.paperType];
    console.log(`📄 PAPER SIZE: Set to ${options.paperSize}`);
    
    // Warn about special paper types
    if (settings.paperType === 'Certificate') {
      console.log(`📋 SPECIAL PAPER: Certificate paper mapped to A4`);
    }
  } else if (settings.paperType) {
    console.warn(`⚠️ UNSUPPORTED PAPER TYPE: "${settings.paperType}" - using default A4`);
    options.paperSize = 'A4';
  }
  
  // Duplex (double-sided printing)
  configureDuplexOptions(options, settings.duplex);
  
  // Page range
  if (settings.pages && settings.pages !== 'all') {
    const validatedRange = validatePageRange(settings.pages);
    if (validatedRange) {
      options.pages = validatedRange;
      console.log(`📋 PAGE RANGE: Set to ${validatedRange}`);
    } else {
      console.warn(`⚠️ INVALID PAGE RANGE: "${settings.pages}" - falling back to all pages`);
    }
  }
  
  // Color vs Black & White
  if (settings.color) {
    options.color = true;
    console.log(`🎨 COLOR: Enabled color printing`);
  } else {
    options.monochrome = true;
    console.log(`⚫ MONOCHROME: Enabled black & white printing`);
  }
  
  // Additional print options
  options.scale = 'fit'; // Fit to page
  options.orientation = 'portrait'; // Default orientation
  
  // Add Windows-specific printer options for better duplex support
  if (settings.duplex) {
    options.win32 = {
      duplex: 'DMDUP_VERTICAL', // Windows duplex constant for long-edge binding
      orientation: 'DMORIENT_PORTRAIT'
    };
  }
  
  console.log(`🖨️ Print settings mapped:`, JSON.stringify(options, null, 2));
  return options;
};

module.exports = {
  downloadFile,
  downloadFileByPublicId,
  deleteTempFile,
  cleanupTempFiles,
  mapPrintSettings,
  validatePageRange,
  configureDuplexOptions,
};