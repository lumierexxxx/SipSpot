// ============================================
// SipSpot - Cafe Routes
// 咖啡店 CRUD + 搜索 + 附近 + 语义搜索
// 重要：所有静态路由必须在 /:cafeId 通配符路由之前！
// ============================================

import express from 'express';
const router = express.Router();
import rateLimit from 'express-rate-limit';
import { protect, optionalAuth } from '../middleware/auth';
import { uploadCafeImages } from '../services/cloudinary';
import { validate, cafeSchema, explainSearchSchema } from '../utils/validation';

import {
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
} from '../controllers/cafeController';

import { aiSearch, explainSearch } from '../controllers/aiSearchController';

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
import reviewRoutes from './reviews';
router.use('/:cafeId/reviews', reviewRoutes);

export default router;
