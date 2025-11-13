// ============================================
// SipSpot - 用户控制器
// 处理用户相关操作：收藏、访问记录、用户资料等
// ============================================

const User = require('../models/user');
const Cafe = require('../models/cafe');
const Review = require('../models/review');
const ExpressError = require('../utils/ExpressError');

// ============================================
// 用户资料相关
// ============================================

/**
 * @desc    获取用户公开资料
 * @route   GET /api/users/:id
 * @access  Public
 */
exports.getUserProfile = async (req, res, next) => {
    try {
        const user = await User.findById(req.params.id)
            .select('-password -email -resetPasswordToken -resetPasswordExpire -emailVerificationToken -emailVerificationExpire');
        
        if (!user) {
            return next(new ExpressError('用户不存在', 404));
        }
        
        // 获取用户统计数据
        const cafeCount = await Cafe.countDocuments({ author: user._id, isActive: true });
        const reviewCount = await Review.countDocuments({ author: user._id });
        
        res.status(200).json({
            success: true,
            data: {
                ...user.toObject(),
                stats: {
                    cafes: cafeCount,
                    reviews: reviewCount,
                    favorites: user.favorites.length
                }
            }
        });
        
    } catch (error) {
        next(error);
    }
};

// ============================================
// 收藏管理
// ============================================

/**
 * @desc    获取用户收藏的咖啡店列表
 * @route   GET /api/users/me/favorites
 * @access  Private
 */
exports.getFavorites = async (req, res, next) => {
    try {
        const { page = 1, limit = 20, sort = '-createdAt' } = req.query;
        
        // 使用 populate 获取完整的咖啡店信息
        const user = await User.findById(req.user.id)
            .populate({
                path: 'favorites',
                match: { isActive: true },
                select: '-reviews',
                populate: { path: 'author', select: 'username avatar' },
                options: {
                    sort,
                    skip: (parseInt(page) - 1) * parseInt(limit),
                    limit: parseInt(limit)
                }
            });
        
        if (!user) {
            return next(new ExpressError('用户不存在', 404));
        }
        
        const total = user.favorites.length;
        
        res.status(200).json({
            success: true,
            count: user.favorites.length,
            total,
            page: parseInt(page),
            pages: Math.ceil(total / parseInt(limit)),
            data: user.favorites
        });
        
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    添加咖啡店到收藏
 * @route   POST /api/users/me/favorites/:cafeId
 * @access  Private
 */
exports.addToFavorites = async (req, res, next) => {
    try {
        const cafe = await Cafe.findById(req.params.cafeId);
        
        if (!cafe) {
            return next(new ExpressError('咖啡店不存在', 404));
        }
        
        // 检查是否已经收藏
        if (req.user.hasFavorite(cafe._id)) {
            return next(new ExpressError('已经收藏过该咖啡店', 400));
        }
        
        // 添加到用户收藏
        await req.user.addFavorite(cafe._id);
        
        // 增加咖啡店的收藏计数
        cafe.favoriteCount += 1;
        await cafe.save({ validateBeforeSave: false });
        
        res.status(200).json({
            success: true,
            message: '添加收藏成功',
            data: { 
                cafeId: cafe._id,
                favoriteCount: cafe.favoriteCount 
            }
        });
        
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    从收藏中移除咖啡店
 * @route   DELETE /api/users/me/favorites/:cafeId
 * @access  Private
 */
exports.removeFromFavorites = async (req, res, next) => {
    try {
        const cafe = await Cafe.findById(req.params.cafeId);
        
        if (!cafe) {
            return next(new ExpressError('咖啡店不存在', 404));
        }
        
        // 检查是否收藏了
        if (!req.user.hasFavorite(cafe._id)) {
            return next(new ExpressError('未收藏该咖啡店', 400));
        }
        
        // 从用户收藏中移除
        await req.user.removeFavorite(cafe._id);
        
        // 减少咖啡店的收藏计数
        cafe.favoriteCount = Math.max(0, cafe.favoriteCount - 1);
        await cafe.save({ validateBeforeSave: false });
        
        res.status(200).json({
            success: true,
            message: '取消收藏成功',
            data: { 
                cafeId: cafe._id,
                favoriteCount: cafe.favoriteCount 
            }
        });
        
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    检查是否收藏了某个咖啡店
 * @route   GET /api/users/me/favorites/:cafeId/check
 * @access  Private
 */
exports.checkFavorite = async (req, res, next) => {
    try {
        const isFavorited = req.user.hasFavorite(req.params.cafeId);
        
        res.status(200).json({
            success: true,
            data: { isFavorited }
        });
        
    } catch (error) {
        next(error);
    }
};

// ============================================
// 访问记录
// ============================================

/**
 * @desc    获取用户访问过的咖啡店
 * @route   GET /api/users/me/visited
 * @access  Private
 */
exports.getVisitedCafes = async (req, res, next) => {
    try {
        const { page = 1, limit = 20 } = req.query;
        
        const user = await User.findById(req.user.id)
            .populate({
                path: 'visited.cafe',
                match: { isActive: true },
                select: '-reviews',
                populate: { path: 'author', select: 'username avatar' }
            });
        
        if (!user) {
            return next(new ExpressError('用户不存在', 404));
        }
        
        // 过滤掉已删除的咖啡店，并按访问时间排序
        const visited = user.visited
            .filter(v => v.cafe != null)
            .sort((a, b) => b.visitedAt - a.visitedAt)
            .slice((parseInt(page) - 1) * parseInt(limit), parseInt(page) * parseInt(limit));
        
        const total = user.visited.filter(v => v.cafe != null).length;
        
        res.status(200).json({
            success: true,
            count: visited.length,
            total,
            page: parseInt(page),
            pages: Math.ceil(total / parseInt(limit)),
            data: visited
        });
        
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    记录访问咖啡店
 * @route   POST /api/users/me/visited/:cafeId
 * @access  Private
 */
exports.markAsVisited = async (req, res, next) => {
    try {
        const cafe = await Cafe.findById(req.params.cafeId);
        
        if (!cafe) {
            return next(new ExpressError('咖啡店不存在', 404));
        }
        
        // 记录访问
        await req.user.visitCafe(cafe._id);
        
        // 增加咖啡店的浏览计数
        cafe.viewCount += 1;
        await cafe.save({ validateBeforeSave: false });
        
        res.status(200).json({
            success: true,
            message: '访问记录已保存',
            data: { cafeId: cafe._id }
        });
        
    } catch (error) {
        next(error);
    }
};

// ============================================
// 用户内容
// ============================================

/**
 * @desc    获取用户创建的咖啡店
 * @route   GET /api/users/me/cafes
 * @access  Private
 */
exports.getMyCafes = async (req, res, next) => {
    try {
        const { page = 1, limit = 20, sort = '-createdAt' } = req.query;
        
        const query = { 
            author: req.user.id,
            isActive: true 
        };
        
        const cafes = await Cafe.find(query)
            .populate('author', 'username avatar')
            .select('-reviews')
            .sort(sort)
            .skip((parseInt(page) - 1) * parseInt(limit))
            .limit(parseInt(limit));
        
        const total = await Cafe.countDocuments(query);
        
        res.status(200).json({
            success: true,
            count: cafes.length,
            total,
            page: parseInt(page),
            pages: Math.ceil(total / parseInt(limit)),
            data: cafes
        });
        
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    获取用户的所有评论
 * @route   GET /api/users/me/reviews
 * @access  Private
 */
exports.getMyReviews = async (req, res, next) => {
    try {
        const { page = 1, limit = 20, sort = '-createdAt' } = req.query;
        
        const query = { author: req.user.id };
        
        const reviews = await Review.find(query)
            .populate('author', 'username avatar')
            .populate('cafe', 'name location images')
            .sort(sort)
            .skip((parseInt(page) - 1) * parseInt(limit))
            .limit(parseInt(limit));
        
        const total = await Review.countDocuments(query);
        
        res.status(200).json({
            success: true,
            count: reviews.length,
            total,
            page: parseInt(page),
            pages: Math.ceil(total / parseInt(limit)),
            data: reviews
        });
        
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    获取用户统计数据
 * @route   GET /api/users/me/stats
 * @access  Private
 */
exports.getMyStats = async (req, res, next) => {
    try {
        // 并行获取统计数据
        const [cafeCount, reviewCount, favoriteCount] = await Promise.all([
            Cafe.countDocuments({ author: req.user.id, isActive: true }),
            Review.countDocuments({ author: req.user.id }),
            User.findById(req.user.id).then(user => user.favorites.length)
        ]);
        
        // 获取用户评论的平均评分
        const reviewStats = await Review.aggregate([
            { $match: { author: req.user._id } },
            {
                $group: {
                    _id: null,
                    avgRating: { $avg: '$rating' },
                    totalLikes: { $sum: '$likes' }
                }
            }
        ]);
        
        res.status(200).json({
            success: true,
            data: {
                cafes: cafeCount,
                reviews: reviewCount,
                favorites: favoriteCount,
                averageRating: reviewStats[0]?.avgRating || 0,
                totalLikes: reviewStats[0]?.totalLikes || 0
            }
        });
        
    } catch (error) {
        next(error);
    }
};

// ============================================
// 其他用户相关查询
// ============================================

/**
 * @desc    获取指定用户创建的咖啡店
 * @route   GET /api/users/:id/cafes
 * @access  Public
 */
exports.getUserCafes = async (req, res, next) => {
    try {
        const { page = 1, limit = 20, sort = '-createdAt' } = req.query;
        
        // 验证用户是否存在
        const user = await User.findById(req.params.id);
        if (!user) {
            return next(new ExpressError('用户不存在', 404));
        }
        
        const query = { 
            author: req.params.id,
            isActive: true 
        };
        
        const cafes = await Cafe.find(query)
            .populate('author', 'username avatar')
            .select('-reviews')
            .sort(sort)
            .skip((parseInt(page) - 1) * parseInt(limit))
            .limit(parseInt(limit));
        
        const total = await Cafe.countDocuments(query);
        
        res.status(200).json({
            success: true,
            count: cafes.length,
            total,
            page: parseInt(page),
            pages: Math.ceil(total / parseInt(limit)),
            data: cafes
        });
        
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    获取指定用户的所有评论
 * @route   GET /api/users/:id/reviews
 * @access  Public
 */
exports.getUserReviews = async (req, res, next) => {
    try {
        const { page = 1, limit = 20, sort = '-createdAt' } = req.query;
        
        // 验证用户是否存在
        const user = await User.findById(req.params.id);
        if (!user) {
            return next(new ExpressError('用户不存在', 404));
        }
        
        const query = { author: req.params.id };
        
        const reviews = await Review.find(query)
            .populate('author', 'username avatar')
            .populate('cafe', 'name location images')
            .sort(sort)
            .skip((parseInt(page) - 1) * parseInt(limit))
            .limit(parseInt(limit));
        
        const total = await Review.countDocuments(query);
        
        res.status(200).json({
            success: true,
            count: reviews.length,
            total,
            page: parseInt(page),
            pages: Math.ceil(total / parseInt(limit)),
            data: reviews
        });
        
    } catch (error) {
        next(error);
    }
};