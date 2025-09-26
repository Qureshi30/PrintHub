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
 * Maps PrintJob settings to pdf-to-printer options
 * @param {Object} settings - PrintJob settings
 * @returns {Object} - pdf-to-printer options
 */
const mapPrintSettings = (settings) => {
  const options = {};
  
  // Copies
  if (settings.copies && settings.copies > 1) {
    options.copies = settings.copies;
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
  }
  
  // Duplex (double-sided printing)
  if (settings.duplex) {
    options.duplex = 'long'; // Long-edge binding
  }
  
  // Page range
  if (settings.pages && settings.pages !== 'all') {
    options.pages = settings.pages;
  }
  
  // Color vs Black & White
  if (settings.color) {
    options.color = true;
  } else {
    options.monochrome = true;
  }
  
  // Additional print options
  options.scale = 'fit'; // Fit to page
  options.orientation = 'portrait'; // Default orientation
  
  console.log(`🖨️ Print settings mapped:`, options);
  return options;
};

module.exports = {
  downloadFile,
  downloadFileByPublicId,
  deleteTempFile,
  cleanupTempFiles,
  mapPrintSettings,
};