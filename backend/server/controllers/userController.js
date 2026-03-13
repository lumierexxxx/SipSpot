// ============================================
// SipSpot - 用户控制器 (v2)
// 职责：用户资料 + 收藏管理 + 我的内容
// 推荐/偏好 → recommendationController
// ============================================

const User = require('../models/user');
const Cafe = require('../models/cafe');
const Review = require('../models/review');
const ExpressError = require('../utils/ExpressError');
const asyncHandler = require('../utils/asyncHandler');
const embeddingService = require('../services/embeddingService');
const vectorService = require('../services/vectorService');

// ============================================
// 用户资料
// ============================================

/**
 * @desc    获取当前用户信息
 * @route   GET /api/users/me
 * @access  Private
 */
exports.getMe = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.id)
        .populate('favorites', 'name images rating location')
        .populate({
            path: 'visited.cafe',
            select: 'name images rating location'
        });

    if (!user) {
        throw new ExpressError('用户不存在', 404);
    }

    res.status(200).json({
        success: true,
        data: user
    });
});

/**
 * @desc    更新用户资料
 * @route   PUT /api/users/me
 * @access  Private
 */
exports.updateProfile = asyncHandler(async (req, res) => {
    const allowedUpdates = ['username', 'email', 'avatar', 'bio'];
    const updates = {};

    Object.keys(req.body).forEach(key => {
        if (allowedUpdates.includes(key)) {
            updates[key] = req.body[key];
        }
    });

    if (updates.username || updates.email) {
        const conditions = [];
        if (updates.username) conditions.push({ username: updates.username.toLowerCase() });
        if (updates.email) conditions.push({ email: updates.email.toLowerCase() });

        const existingUser = await User.findOne({
            _id: { $ne: req.user.id },
            $or: conditions
        });

        if (existingUser) {
            const field = existingUser.username === updates.username?.toLowerCase() ? '用户名' : '邮箱';
            throw new ExpressError(`${field}已被使用`, 400);
        }
    }

    const user = await User.findByIdAndUpdate(
        req.user.id,
        updates,
        { new: true, runValidators: true }
    ).select('-password');

    res.status(200).json({
        success: true,
        message: '资料更新成功',
        data: user
    });
});

// ============================================
// 收藏管理
// ============================================

/**
 * @desc    获取当前用户的收藏列表
 * @route   GET /api/users/me/favorites
 * @access  Private
 */
exports.getFavorites = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.id)
        .populate({
            path: 'favorites',
            select: 'name images rating location city price amenities reviewCount'
        });

    res.status(200).json({
        success: true,
        count: user.favorites.length,
        data: user.favorites
    });
});

/**
 * @desc    添加咖啡店到收藏
 * @route   POST /api/users/me/favorites/:cafeId
 * @access  Private
 */
exports.addFavorite = asyncHandler(async (req, res) => {
    const cafe = await Cafe.findById(req.params.cafeId);
    if (!cafe) throw new ExpressError('咖啡店不存在', 404);

    const user = await User.findById(req.user.id);
    if (user.hasFavorite(cafe._id)) {
        throw new ExpressError('已在收藏中', 400);
    }

    await user.addFavorite(cafe._id);

    cafe.favoriteCount = (cafe.favoriteCount || 0) + 1;
    await cafe.save({ validateBeforeSave: false });

    res.status(200).json({
        success: true,
        message: '已添加到收藏',
        data: { favoriteCount: cafe.favoriteCount }
    });

    // 异步更新用户偏好向量（添加收藏）
    process.nextTick(async () => {
        try {
            if (!embeddingService.isReady()) return;
            const userId = req.user.id;
            const cafeId = req.params.cafeId;

            const freshUser = await User.findById(userId)
                .select('+preferenceEmbedding +preferenceHistory +preferenceEmbeddingUpdatedAt');
            if (!vectorService.shouldUpdatePreference(freshUser)) return;

            const cafeWithEmb = await Cafe.findById(cafeId).select('+embedding');
            if (!cafeWithEmb || !cafeWithEmb.embedding || cafeWithEmb.embedding.length !== 1024) return;

            await User.findByIdAndUpdate(userId, {
                $push: {
                    preferenceHistory: {
                        $each: [{ cafeId, weight: 2, addedAt: new Date() }],
                        $slice: -100
                    }
                }
            }, { runValidators: false });

            const updatedUser = await User.findById(userId).select('+preferenceHistory');
            const cafeMap = await buildCafeEmbeddingMap(updatedUser.preferenceHistory);
            const historyItems = buildHistoryItems(updatedUser.preferenceHistory, cafeMap);
            const newEmbedding = vectorService.computeUserEmbedding(historyItems);
            if (newEmbedding.length === 0) return;

            await User.findByIdAndUpdate(userId, {
                preferenceEmbedding: newEmbedding,
                preferenceEmbeddingUpdatedAt: new Date()
            }, { runValidators: false });

            console.log(`✅ 用户 ${userId} 偏好向量已更新（添加收藏）`);
        } catch (e) {
            console.error('❌ 更新用户偏好向量失败（添加收藏）:', e.message);
        }
    });
});

/**
 * @desc    从收藏中移除咖啡店
 * @route   DELETE /api/users/me/favorites/:cafeId
 * @access  Private
 */
exports.removeFavorite = asyncHandler(async (req, res) => {
    const cafe = await Cafe.findById(req.params.cafeId);
    if (!cafe) throw new ExpressError('咖啡店不存在', 404);

    const user = await User.findById(req.user.id);
    await user.removeFavorite(cafe._id);

    cafe.favoriteCount = Math.max(0, (cafe.favoriteCount || 0) - 1);
    await cafe.save({ validateBeforeSave: false });

    res.status(200).json({
        success: true,
        message: '已从收藏中移除',
        data: { favoriteCount: cafe.favoriteCount }
    });

    // 异步更新用户偏好向量（取消收藏）
    process.nextTick(async () => {
        try {
            if (!embeddingService.isReady()) return;
            const userId = req.user.id;
            const cafeId = req.params.cafeId;

            const freshUser = await User.findById(userId)
                .select('+preferenceEmbedding +preferenceHistory +preferenceEmbeddingUpdatedAt');
            if (!vectorService.shouldUpdatePreference(freshUser)) return;

            await User.findByIdAndUpdate(userId, {
                $pull: { preferenceHistory: { cafeId } }
            }, { runValidators: false });

            const updatedUser = await User.findById(userId).select('+preferenceHistory');
            if (!updatedUser.preferenceHistory || updatedUser.preferenceHistory.length === 0) return;

            const cafeMap = await buildCafeEmbeddingMap(updatedUser.preferenceHistory);
            const historyItems = buildHistoryItems(updatedUser.preferenceHistory, cafeMap);
            const newEmbedding = vectorService.computeUserEmbedding(historyItems);
            if (newEmbedding.length === 0) return;

            await User.findByIdAndUpdate(userId, {
                preferenceEmbedding: newEmbedding,
                preferenceEmbeddingUpdatedAt: new Date()
            }, { runValidators: false });

            console.log(`✅ 用户 ${userId} 偏好向量已更新（取消收藏）`);
        } catch (e) {
            console.error('❌ 更新用户偏好向量失败（取消收藏）:', e.message);
        }
    });
});

/**
 * @desc    检查是否收藏了某个咖啡店
 * @route   GET /api/users/me/favorites/:cafeId/check
 * @access  Private
 */
exports.checkFavorite = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.id);
    res.status(200).json({
        success: true,
        data: { isFavorited: user.hasFavorite(req.params.cafeId) }
    });
});

// ============================================
// 访问记录
// ============================================

/**
 * @desc    获取用户访问过的咖啡店
 * @route   GET /api/users/me/visited
 * @access  Private
 */
exports.getVisitedCafes = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.id)
        .populate({
            path: 'visited.cafe',
            select: 'name images rating location city'
        });

    res.status(200).json({
        success: true,
        count: user.visited.length,
        data: user.visited
    });
});

/**
 * @desc    记录访问咖啡店
 * @route   POST /api/users/me/visited/:cafeId
 * @access  Private
 */
exports.markAsVisited = asyncHandler(async (req, res) => {
    const cafe = await Cafe.findById(req.params.cafeId);
    if (!cafe) throw new ExpressError('咖啡店不存在', 404);

    const user = await User.findById(req.user.id);
    await user.visitCafe(cafe._id);

    res.status(200).json({ success: true, message: '已记录访问' });
});

// ============================================
// 我的内容
// ============================================

/**
 * @desc    获取当前用户的评论
 * @route   GET /api/users/me/reviews
 * @access  Private
 */
exports.getMyReviews = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const reviews = await Review.find({ author: req.user.id })
        .populate('cafe', 'name images rating city')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));

    const total = await Review.countDocuments({ author: req.user.id });

    res.status(200).json({
        success: true,
        count: reviews.length,
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        data: reviews
    });
});

/**
 * @desc    获取当前用户创建的咖啡店
 * @route   GET /api/users/me/cafes
 * @access  Private
 */
exports.getMyCafes = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const cafes = await Cafe.find({ author: req.user.id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));

    const total = await Cafe.countDocuments({ author: req.user.id });

    res.status(200).json({
        success: true,
        count: cafes.length,
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        data: cafes
    });
});

/**
 * @desc    获取用户统计数据
 * @route   GET /api/users/me/stats
 * @access  Private
 */
exports.getMyStats = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const [reviewCount, cafeCount, user] = await Promise.all([
        Review.countDocuments({ author: userId }),
        Cafe.countDocuments({ author: userId }),
        User.findById(userId)
    ]);

    res.status(200).json({
        success: true,
        data: {
            reviewCount,
            cafeCount,
            favoriteCount: user.favorites.length,
            visitedCount: user.visited.length
        }
    });
});

// ============================================
// 公开用户资料
// ============================================

/**
 * @desc    获取用户公开资料
 * @route   GET /api/users/:userId
 * @access  Public
 */
exports.getUserProfile = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.userId)
        .select('username avatar bio createdAt');

    if (!user) throw new ExpressError('用户不存在', 404);

    res.status(200).json({ success: true, data: user });
});

/**
 * @desc    获取指定用户的评论
 * @route   GET /api/users/:userId/reviews
 * @access  Public
 */
exports.getUserReviews = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const reviews = await Review.find({ author: req.params.userId })
        .populate('cafe', 'name images rating city')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));

    const total = await Review.countDocuments({ author: req.params.userId });

    res.status(200).json({
        success: true,
        count: reviews.length,
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        data: reviews
    });
});

/**
 * @desc    获取指定用户创建的咖啡店
 * @route   GET /api/users/:userId/cafes
 * @access  Public
 */
exports.getUserCafes = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const cafes = await Cafe.find({ author: req.params.userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));

    const total = await Cafe.countDocuments({ author: req.params.userId });

    res.status(200).json({
        success: true,
        count: cafes.length,
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        data: cafes
    });
});

// ============================================
// 偏好向量计算辅助函数（reviewController.js 中有相同副本）
// ============================================

/**
 * 批量加载 preferenceHistory 中所有 cafe 的 embedding
 * @param {Array} history - preferenceHistory 数组
 * @returns {Promise<Map<string, number[]>>} cafeId → embedding
 */
async function buildCafeEmbeddingMap(history) {
    const ids = history.map(h => h.cafeId);
    const cafes = await Cafe.find({ _id: { $in: ids } }).select('+embedding');
    const map = new Map();
    cafes.forEach(c => {
        if (c.embedding && c.embedding.length === 1024) {
            map.set(c._id.toString(), c.embedding);
        }
    });
    return map;
}

/**
 * 将 preferenceHistory 转换为 computeUserEmbedding 所需格式
 */
function buildHistoryItems(history, cafeMap) {
    return history
        .map(h => ({
            embedding: cafeMap.get(h.cafeId.toString()),
            weight: h.weight,
            addedAt: h.addedAt
        }))
        .filter(h => h.embedding);
}