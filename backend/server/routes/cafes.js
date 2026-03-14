// ============================================
// SipSpot - Cafe Routes
// 咖啡店 CRUD + 搜索 + 附近 + 语义搜索
// 重要：所有静态路由必须在 /:cafeId 通配符路由之前！
// ============================================

const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { protect, optionalAuth } = require('../middleware/auth');
const { uploadCafeImages } = require('../services/cloudinary');
const { validate, cafeSchema, explainSearchSchema } = require('../utils/validation');

const {
    getCafes,
    getNearby,
    getCafe,
    createCafe,
    updateCafe,
    deleteCafe,
    getTopRated,
    searchCafes,
    getCafesByAmenities,
    getCafeStats
} = require('../controllers/cafeController');

const { aiSearch, explainSearch } = require('../controllers/aiSearchController');

// explain 接口独立限流：10 次/分钟/IP（防止 Qwen token 滥用）
const explainLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 10,
    message: { success: false, message: '请求过于频繁，请稍后再试' }
});

// ============================================
// 公开路由（静态路由必须在 /:id 之前）
// ============================================

router.post('/ai-search', aiSearch);
router.post('/ai-search/explain', explainLimiter, validate(explainSearchSchema), explainSearch);

router.get('/', optionalAuth, getCafes);
router.get('/nearby', getNearby);
router.get('/top/rated', getTopRated);
router.get('/search', searchCafes);
router.get('/amenities/:amenity', getCafesByAmenities);
router.get('/:id/stats', getCafeStats);
router.get('/:id', optionalAuth, getCafe);

// ============================================
// 受保护路由
// ============================================

router.post('/', protect, validate(cafeSchema), uploadCafeImages, createCafe);
router.put('/:id', protect, updateCafe);
router.delete('/:id', protect, deleteCafe);

// ============================================
// 嵌套评论路由
// 必须放在最后！/:cafeId 会匹配所有未命中的路径
// ============================================
const reviewRoutes = require('./reviews');
router.use('/:cafeId/reviews', reviewRoutes);

module.exports = router;
