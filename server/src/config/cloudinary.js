const { v2: cloudinary } = require('cloudinary');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Validate configuration
const validateCloudinaryConfig = () => {
  const requiredEnvVars = [
    'CLOUDINARY_CLOUD_NAME',
    'CLOUDINARY_API_KEY',
    'CLOUDINARY_API_SECRET'
  ];

  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    throw new Error(`Missing required Cloudinary environment variables: ${missingVars.join(', ')}`);
  }

  console.log('☁️ Cloudinary configured successfully');
};

// Upload file to Cloudinary
const uploadToCloudinary = async (file, options = {}) => {
  try {
    const defaultOptions = {
      folder: 'print_jobs',
      resource_type: 'auto',
      use_filename: true,
      unique_filename: true,
    };

    const uploadOptions = { ...defaultOptions, ...options };
    
    console.log('🔍 File object debug:', {
      hasPath: !!file.path,
      hasBuffer: !!file.buffer,
      bufferLength: file.buffer ? file.buffer.length : 0,
      mimetype: file.mimetype,
      originalname: file.originalname,
      size: file.size
    });
    
    // Handle different file input types
    let uploadInput;
    if (file.path) {
      // File saved to disk (has path)
      uploadInput = file.path;
      console.log('📁 Using file path for upload');
    } else if (file.buffer) {
      // File in memory (buffer) - convert to base64 data URI
      const b64 = Buffer.from(file.buffer).toString('base64');
      uploadInput = `data:${file.mimetype};base64,${b64}`;
      console.log('📄 Using buffer as base64 data URI for upload');
    } else {
      throw new Error('Invalid file input: no path or buffer found');
    }
    
    console.log('📤 Uploading to Cloudinary:', file.originalname || 'unknown file');
    
    const result = await cloudinary.uploader.upload(uploadInput, uploadOptions);
    
    console.log('✅ Cloudinary upload successful:', result.public_id);
    
    return {
      publicId: result.public_id,
      url: result.secure_url,
      format: result.format,
      sizeKB: Math.round(result.bytes / 1024),
      width: result.width,
      height: result.height,
    };
  } catch (error) {
    console.error('❌ Cloudinary upload error:', error);
    throw new Error('File upload failed');
  }
};

// Delete file from Cloudinary
const deleteFromCloudinary = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    console.error('❌ Cloudinary delete error:', error);
    throw new Error('File deletion failed');
  }
};

// Generate signed upload URL
const generateSignedUploadUrl = (options = {}) => {
  try {
    const timestamp = Math.round(Date.now() / 1000);
    
    // Prepare parameters for signing (exclude api_key and file)
    const params = {
      timestamp,
      folder: options.folder || 'print_jobs',
    };
    
    // Add optional parameters only if they are provided
    if (options.resource_type) {
      params.resource_type = options.resource_type;
    }
    if (options.use_filename !== undefined) {
      params.use_filename = options.use_filename;
    }
    if (options.unique_filename !== undefined) {
      params.unique_filename = options.unique_filename;
    }

    console.log('🔐 Signing parameters:', params);

    // Generate signature using Cloudinary's signing method
    const signature = cloudinary.utils.api_sign_request(params, process.env.CLOUDINARY_API_SECRET);
    
    console.log('✅ Generated signature for timestamp:', timestamp);
    
    return {
      signature,
      timestamp,
      api_key: process.env.CLOUDINARY_API_KEY,
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      ...params,
    };
  } catch (error) {
    console.error('❌ Cloudinary signature generation error:', error);
    throw new Error('Failed to generate upload signature');
  }
};

// Validate file before upload
const validateFile = (file) => {
  const maxSize = parseInt(process.env.MAX_FILE_SIZE) || 10485760; // 10MB default
  const allowedTypes = process.env.ALLOWED_FILE_TYPES?.split(',') || [
    'pdf', 'doc', 'docx', 'txt', 'xls', 'xlsx', 'ppt', 'pptx', 'jpg', 'jpeg', 'png'
  ];

  // Check file size
  if (file.size > maxSize) {
    throw new Error(`File size exceeds limit of ${Math.round(maxSize / 1024 / 1024)}MB`);
  }

  // Check file type
  const fileExtension = file.originalname.split('.').pop().toLowerCase();
  if (!allowedTypes.includes(fileExtension)) {
    throw new Error(`File type .${fileExtension} is not allowed. Allowed types: ${allowedTypes.join(', ')}`);
  }

  return true;
};

module.exports = {
  cloudinary,
  validateCloudinaryConfig,
  uploadToCloudinary,
  deleteFromCloudinary,
  generateSignedUploadUrl,
  validateFile,
};
