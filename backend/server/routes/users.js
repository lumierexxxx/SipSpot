// ============================================
// SipSpot - 用户路由
// 处理用户相关的路由
// ============================================

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
    getUserProfile,
    getFavorites,
    addToFavorites,
    removeFromFavorites,
    checkFavorite,
    getVisitedCafes,
    markAsVisited,
    getMyCafes,
    getMyReviews,
    getMyStats,
    getUserCafes,
    getUserReviews
} = require('../controllers/userController');

// ============================================
// 当前用户相关路由（需要认证）
// ============================================

/**
 * @route   GET /api/users/me/favorites
 * @desc    获取当前用户收藏的咖啡店列表
 * @access  Private
 * @query   page, limit, sort
 */
router.get('/me/favorites', protect, getFavorites);

/**
 * @route   POST /api/users/me/favorites/:cafeId
 * @desc    添加咖啡店到收藏
 * @access  Private
 */
router.post('/me/favorites/:cafeId', protect, addToFavorites);

/**
 * @route   DELETE /api/users/me/favorites/:cafeId
 * @desc    从收藏中移除咖啡店
 * @access  Private
 */
router.delete('/me/favorites/:cafeId', protect, removeFromFavorites);

/**
 * @route   GET /api/users/me/favorites/:cafeId/check
 * @desc    检查是否收藏了某个咖啡店
 * @access  Private
 */
router.get('/me/favorites/:cafeId/check', protect, checkFavorite);

/**
 * @route   GET /api/users/me/visited
 * @desc    获取当前用户访问过的咖啡店
 * @access  Private
 * @query   page, limit
 */
router.get('/me/visited', protect, getVisitedCafes);

/**
 * @route   POST /api/users/me/visited/:cafeId
 * @desc    记录访问咖啡店
 * @access  Private
 */
router.post('/me/visited/:cafeId', protect, markAsVisited);

/**
 * @route   GET /api/users/me/cafes
 * @desc    获取当前用户创建的咖啡店
 * @access  Private
 * @query   page, limit, sort
 */
router.get('/me/cafes', protect, getMyCafes);

/**
 * @route   GET /api/users/me/reviews
 * @desc    获取当前用户的所有评论
 * @access  Private
 * @query   page, limit, sort
 */
router.get('/me/reviews', protect, getMyReviews);

/**
 * @route   GET /api/users/me/stats
 * @desc    获取当前用户的统计数据
 * @access  Private
 */
router.get('/me/stats', protect, getMyStats);

// ============================================
// 公开用户资料路由
// ============================================

/**
 * @route   GET /api/users/:id
 * @desc    获取用户公开资料
 * @access  Public
 */
router.get('/:id', getUserProfile);

/**
 * @route   GET /api/users/:id/cafes
 * @desc    获取指定用户创建的咖啡店
 * @access  Public
 * @query   page, limit, sort
 */
router.get('/:id/cafes', getUserCafes);

/**
 * @route   GET /api/users/:id/reviews
 * @desc    获取指定用户的所有评论
 * @access  Public
 * @query   page, limit, sort
 */
router.get('/:id/reviews', getUserReviews);

module.exports = router;