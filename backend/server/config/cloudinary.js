// ============================================
// SipSpot - Cloudinary 配置
// 图片上传和管理
// ============================================

const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// ============================================
// Cloudinary 配置
// ============================================
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// ============================================
// 咖啡店图片存储配置
// ============================================
const cafeStorage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'sipspot/cafes',
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'heic'],
        transformation: [
            { width: 1200, height: 800, crop: 'limit' },
            { quality: 'auto' },
            { fetch_format: 'auto' }
        ]
    }
});

// ============================================
// 评论图片存储配置
// ============================================
const reviewStorage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'sipspot/reviews',
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'heic'],
        transformation: [
            { width: 800, height: 600, crop: 'limit' },
            { quality: 'auto' },
            { fetch_format: 'auto' }
        ]
    }
});

// ============================================
// 用户头像存储配置
// ============================================
const avatarStorage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'sipspot/avatars',
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
        transformation: [
            { width: 400, height: 400, crop: 'fill', gravity: 'face' },
            { quality: 'auto' },
            { fetch_format: 'auto' }
        ]
    }
});

// ============================================
// Multer 文件过滤器
// ============================================
const fileFilter = (req, file, cb) => {
    // 检查文件类型
    const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic'];
    
    if (allowedMimes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('不支持的文件格式。请上传 JPG、PNG 或 WebP 格式的图片'), false);
    }
};

// ============================================
// Multer 上传配置
// ============================================

/**
 * 咖啡店图片上传（最多10张）
 */
exports.uploadCafeImages = multer({
    storage: cafeStorage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB per file
        files: 10
    }
}).array('images', 10);

/**
 * 评论图片上传（最多5张）
 */
exports.uploadReviewImages = multer({
    storage: reviewStorage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB per file
        files: 5
    }
}).array('images', 5);

/**
 * 用户头像上传（单张）
 */
exports.uploadAvatar = multer({
    storage: avatarStorage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 2 * 1024 * 1024 // 2MB
    }
}).single('avatar');

// ============================================
// Cloudinary 工具函数
// ============================================

/**
 * 删除单张图片
 * @param {string} publicId - Cloudinary public_id
 */
exports.deleteImage = async (publicId) => {
    try {
        const result = await cloudinary.uploader.destroy(publicId);
        return result;
    } catch (error) {
        console.error('Error deleting image from Cloudinary:', error);
        throw error;
    }
};

/**
 * 删除多张图片
 * @param {string[]} publicIds - Cloudinary public_ids 数组
 */
exports.deleteImages = async (publicIds) => {
    try {
        if (!publicIds || publicIds.length === 0) return;
        
        const deletePromises = publicIds.map(id => cloudinary.uploader.destroy(id));
        const results = await Promise.allSettled(deletePromises);
        
        const successful = results.filter(r => r.status === 'fulfilled').length;
        const failed = results.filter(r => r.status === 'rejected').length;
        
        console.log(`Deleted ${successful} images, ${failed} failed`);
        
        return results;
    } catch (error) {
        console.error('Error deleting images from Cloudinary:', error);
        throw error;
    }
};

/**
 * 生成图片变体URL
 * @param {string} url - 原始Cloudinary URL
 * @param {string} transformation - 变换参数，如 'w_200,h_200,c_fill'
 */
exports.getTransformedUrl = (url, transformation) => {
    if (!url) return null;
    return url.replace('/upload/', `/upload/${transformation}/`);
};

/**
 * 获取缩略图URL
 */
exports.getThumbnail = (url) => {
    return exports.getTransformedUrl(url, 'w_200,h_200,c_fill');
};

/**
 * 获取卡片图片URL
 */
exports.getCardImage = (url) => {
    return exports.getTransformedUrl(url, 'w_400,h_300,c_fill');
};

/**
 * 批量上传图片（用于种子数据）
 * @param {string[]} imagePaths - 本地图片路径数组
 * @param {string} folder - Cloudinary文件夹
 */
exports.uploadMultiple = async (imagePaths, folder) => {
    try {
        const uploadPromises = imagePaths.map(path =>
            cloudinary.uploader.upload(path, { folder })
        );
        
        const results = await Promise.all(uploadPromises);
        return results.map(result => ({
            url: result.secure_url,
            publicId: result.public_id,
            filename: result.original_filename
        }));
    } catch (error) {
        console.error('Error uploading multiple images:', error);
        throw error;
    }
};

// 导出cloudinary实例（用于高级操作）
module.exports.cloudinary = cloudinary;