// ============================================
// SipSpot - 用户控制器 (v2)
// 职责：用户资料 + 收藏管理 + 我的内容
// 推荐/偏好 → recommendationController
// ============================================

import { Response } from 'express';
import User from '../models/user';
import Cafe from '../models/cafe';
import Review from '../models/review';
import ExpressError from '../utils/ExpressError';
import asyncHandler from '../utils/asyncHandler';
import * as embeddingService from '../services/embeddingService';
import * as vectorService from '../services/vectorService';
import { AuthRequest } from '../types';

// ============================================
// 用户资料
// ============================================

/**
 * @desc    获取当前用户信息
 * @route   GET /api/users/me
 * @access  Private
 */
export const getMe = asyncHandler(async (req: AuthRequest, res: Response) => {
    const user = await (User as any).findById((req.user as any).id)
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
export const updateProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
    const allowedUpdates = ['username', 'email', 'avatar', 'bio'];
    const updates: Record<string, any> = {};

    Object.keys(req.body).forEach(key => {
        if (allowedUpdates.includes(key)) {
            updates[key] = req.body[key];
        }
    });

    if (updates.username || updates.email) {
        const conditions = [];
        if (updates.username) conditions.push({ username: updates.username.toLowerCase() });
        if (updates.email) conditions.push({ email: updates.email.toLowerCase() });

        const existingUser = await (User as any).findOne({
            _id: { $ne: (req.user as any).id },
            $or: conditions
        });

        if (existingUser) {
            const field = existingUser.username === updates.username?.toLowerCase() ? '用户名' : '邮箱';
            throw new ExpressError(`${field}已被使用`, 400);
        }
    }

    const user = await (User as any).findByIdAndUpdate(
        (req.user as any).id,
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
export const getFavorites = asyncHandler(async (req: AuthRequest, res: Response) => {
    const user = await (User as any).findById((req.user as any).id)
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
export const addFavorite = asyncHandler(async (req: AuthRequest, res: Response) => {
    const cafe = await (Cafe as any).findById(req.params.cafeId);
    if (!cafe) throw new ExpressError('咖啡店不存在', 404);

    const user = await (User as any).findById((req.user as any).id);
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
            if (!(embeddingService as any).isReady()) return;
            const userId = (req.user as any).id;
            const cafeId = req.params.cafeId;

            const freshUser = await (User as any).findById(userId)
                .select('+preferenceEmbedding +preferenceHistory +preferenceEmbeddingUpdatedAt');
            if (!(vectorService as any).shouldUpdatePreference(freshUser)) return;

            const cafeWithEmb = await (Cafe as any).findById(cafeId).select('+embedding');
            if (!cafeWithEmb || !cafeWithEmb.embedding || cafeWithEmb.embedding.length !== 768) return;

            await (User as any).findByIdAndUpdate(userId, {
                $push: {
                    preferenceHistory: {
                        $each: [{ cafeId, weight: 2, addedAt: new Date() }],
                        $slice: -100
                    }
                }
            }, { runValidators: false });

            const updatedUser = await (User as any).findById(userId).select('+preferenceHistory');
            const cafeMap = await buildCafeEmbeddingMap(updatedUser.preferenceHistory);
            const historyItems = buildHistoryItems(updatedUser.preferenceHistory, cafeMap);
            const newEmbedding = (vectorService as any).computeUserEmbedding(historyItems);
            if (newEmbedding.length === 0) return;

            await (User as any).findByIdAndUpdate(userId, {
                preferenceEmbedding: newEmbedding,
                preferenceEmbeddingUpdatedAt: new Date()
            }, { runValidators: false });

            console.log(`✅ 用户 ${userId} 偏好向量已更新（添加收藏）`);
        } catch (e: any) {
            console.error('❌ 更新用户偏好向量失败（添加收藏）:', e.message);
        }
    });
});

/**
 * @desc    从收藏中移除咖啡店
 * @route   DELETE /api/users/me/favorites/:cafeId
 * @access  Private
 */
export const removeFavorite = asyncHandler(async (req: AuthRequest, res: Response) => {
    const cafe = await (Cafe as any).findById(req.params.cafeId);
    if (!cafe) throw new ExpressError('咖啡店不存在', 404);

    const user = await (User as any).findById((req.user as any).id);
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
            if (!(embeddingService as any).isReady()) return;
            const userId = (req.user as any).id;
            const cafeId = req.params.cafeId;

            const freshUser = await (User as any).findById(userId)
                .select('+preferenceEmbedding +preferenceHistory +preferenceEmbeddingUpdatedAt');
            if (!(vectorService as any).shouldUpdatePreference(freshUser)) return;

            await (User as any).findByIdAndUpdate(userId, {
                $pull: { preferenceHistory: { cafeId } }
            }, { runValidators: false });

            const updatedUser = await (User as any).findById(userId).select('+preferenceHistory');
            if (!updatedUser.preferenceHistory || updatedUser.preferenceHistory.length === 0) return;

            const cafeMap = await buildCafeEmbeddingMap(updatedUser.preferenceHistory);
            const historyItems = buildHistoryItems(updatedUser.preferenceHistory, cafeMap);
            const newEmbedding = (vectorService as any).computeUserEmbedding(historyItems);
            if (newEmbedding.length === 0) return;

            await (User as any).findByIdAndUpdate(userId, {
                preferenceEmbedding: newEmbedding,
                preferenceEmbeddingUpdatedAt: new Date()
            }, { runValidators: false });

            console.log(`✅ 用户 ${userId} 偏好向量已更新（取消收藏）`);
        } catch (e: any) {
            console.error('❌ 更新用户偏好向量失败（取消收藏）:', e.message);
        }
    });
});

/**
 * @desc    检查是否收藏了某个咖啡店
 * @route   GET /api/users/me/favorites/:cafeId/check
 * @access  Private
 */
export const checkFavorite = asyncHandler(async (req: AuthRequest, res: Response) => {
    const user = await (User as any).findById((req.user as any).id);
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
export const getVisitedCafes = asyncHandler(async (req: AuthRequest, res: Response) => {
    const user = await (User as any).findById((req.user as any).id)
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
export const markAsVisited = asyncHandler(async (req: AuthRequest, res: Response) => {
    const cafe = await (Cafe as any).findById(req.params.cafeId);
    if (!cafe) throw new ExpressError('咖啡店不存在', 404);

    const user = await (User as any).findById((req.user as any).id);
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
export const getMyReviews = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const reviews = await (Review as any).find({ author: (req.user as any).id })
        .populate('cafe', 'name images rating city')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit as string));

    const total = await (Review as any).countDocuments({ author: (req.user as any).id });

    res.status(200).json({
        success: true,
        count: reviews.length,
        total,
        page: parseInt(page as string),
        pages: Math.ceil(total / parseInt(limit as string)),
        data: reviews
    });
});

/**
 * @desc    获取当前用户创建的咖啡店
 * @route   GET /api/users/me/cafes
 * @access  Private
 */
export const getMyCafes = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const cafes = await (Cafe as any).find({ author: (req.user as any).id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit as string));

    const total = await (Cafe as any).countDocuments({ author: (req.user as any).id });

    res.status(200).json({
        success: true,
        count: cafes.length,
        total,
        page: parseInt(page as string),
        pages: Math.ceil(total / parseInt(limit as string)),
        data: cafes
    });
});

/**
 * @desc    获取用户统计数据
 * @route   GET /api/users/me/stats
 * @access  Private
 */
export const getMyStats = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = (req.user as any).id;
    const [reviewCount, cafeCount, user] = await Promise.all([
        (Review as any).countDocuments({ author: userId }),
        (Cafe as any).countDocuments({ author: userId }),
        (User as any).findById(userId)
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
export const getUserProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
    const user = await (User as any).findById(req.params.userId)
        .select('username avatar bio createdAt');

    if (!user) throw new ExpressError('用户不存在', 404);

    res.status(200).json({ success: true, data: user });
});

/**
 * @desc    获取指定用户的评论
 * @route   GET /api/users/:userId/reviews
 * @access  Public
 */
export const getUserReviews = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const reviews = await (Review as any).find({ author: req.params.userId })
        .populate('cafe', 'name images rating city')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit as string));

    const total = await (Review as any).countDocuments({ author: req.params.userId });

    res.status(200).json({
        success: true,
        count: reviews.length,
        total,
        page: parseInt(page as string),
        pages: Math.ceil(total / parseInt(limit as string)),
        data: reviews
    });
});

/**
 * @desc    获取指定用户创建的咖啡店
 * @route   GET /api/users/:userId/cafes
 * @access  Public
 */
export const getUserCafes = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const cafes = await (Cafe as any).find({ author: req.params.userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit as string));

    const total = await (Cafe as any).countDocuments({ author: req.params.userId });

    res.status(200).json({
        success: true,
        count: cafes.length,
        total,
        page: parseInt(page as string),
        pages: Math.ceil(total / parseInt(limit as string)),
        data: cafes
    });
});

// ============================================
// 偏好向量计算辅助函数（reviewController.ts 中有相同副本）
// ============================================

/**
 * 批量加载 preferenceHistory 中所有 cafe 的 embedding
 * @param history - preferenceHistory 数组
 * @returns cafeId → embedding
 */
async function buildCafeEmbeddingMap(history: any[]): Promise<Map<string, number[]>> {
    const ids = history.map(h => h.cafeId);
    const cafes = await (Cafe as any).find({ _id: { $in: ids } }).select('+embedding');
    const map = new Map<string, number[]>();
    cafes.forEach((c: any) => {
        if (c.embedding && c.embedding.length === 768) {
            map.set(c._id.toString(), c.embedding);
        }
    });
    return map;
}

/**
 * 将 preferenceHistory 转换为 computeUserEmbedding 所需格式
 */
function buildHistoryItems(history: any[], cafeMap: Map<string, number[]>) {
    return history
        .map(h => ({
            embedding: cafeMap.get(h.cafeId.toString()),
            weight: h.weight,
            addedAt: h.addedAt
        }))
        .filter(h => h.embedding);
}

// ============================================
// Route name aliases (routes/users.ts uses these names)
// ============================================
export const addToFavorites = addFavorite;
export const removeFromFavorites = removeFavorite;
