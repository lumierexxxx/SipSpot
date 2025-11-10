// ============================================
// SipSpot - 认证路由
// 处理用户注册、登录、密码管理等
// ============================================

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
    register,
    login,
    getMe,
    updateProfile,
    updatePassword,
    forgotPassword,
    resetPassword,
    refreshToken,
    logout
} = require('../controllers/authController');

// ============================================
// 公开路由（不需要认证）
// ============================================

/**
 * @route   POST /api/auth/register
 * @desc    用户注册
 * @access  Public
 * @body    { username, email, password }
 */
router.post('/register', register);

/**
 * @route   POST /api/auth/login
 * @desc    用户登录
 * @access  Public
 * @body    { identifier, password }  // identifier可以是邮箱或用户名
 */
router.post('/login', login);

/**
 * @route   POST /api/auth/forgot-password
 * @desc    请求密码重置
 * @access  Public
 * @body    { email }
 */
router.post('/forgot-password', forgotPassword);

/**
 * @route   PUT /api/auth/reset-password/:token
 * @desc    重置密码
 * @access  Public
 * @body    { password }
 */
router.put('/reset-password/:token', resetPassword);

/**
 * @route   POST /api/auth/refresh
 * @desc    刷新访问令牌
 * @access  Public
 * @body    { refreshToken }
 */
router.post('/refresh', refreshToken);

// ============================================
// 受保护路由（需要认证）
// ============================================

/**
 * @route   GET /api/auth/me
 * @desc    获取当前用户信息
 * @access  Private
 */
router.get('/me', protect, getMe);

/**
 * @route   PUT /api/auth/me
 * @desc    更新用户资料
 * @access  Private
 * @body    { username?, email?, avatar?, bio? }
 */
router.put('/me', protect, updateProfile);

/**
 * @route   PUT /api/auth/password
 * @desc    修改密码
 * @access  Private
 * @body    { currentPassword, newPassword }
 */
router.put('/password', protect, updatePassword);

/**
 * @route   POST /api/auth/logout
 * @desc    登出（客户端删除token）
 * @access  Private
 */
router.post('/logout', protect, logout);

module.exports = router;