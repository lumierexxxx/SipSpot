// ============================================
// SipSpot - Recommendation Controller (新建)
// 🤖 AI个性化推荐系统
// 处理用户偏好学习和咖啡店推荐
// ============================================

const User = require('../models/user');
const Cafe = require('../models/cafe');
const Review = require('../models/review');
const ExpressError = require('../utils/ExpressError');
const aiService = require('../services/aiService');
const vectorService = require('../services/vectorService');

// ============================================
// 个性化推荐相关功能
// ============================================

/**
 * @desc    🤖 获取个性化推荐
 * @route   GET /api/recommendations
 * @access  Private (需要登录)
 * @query   limit - 返回数量(默认10)
 * @query   includeLocation - 是否包含位置优先推荐(默认false)
 * 
 * 返回格式:
 * {
 *   recommendations: [
 *     {
 *       cafe: { ... },
 *       score: 94,
 *       reasons: ["具备您偏好的设施: WiFi、Quiet", "价格符合您的预算"],
 *       type: "personalized"
 *     }
 *   ]
 * }
 */
exports.getRecommendations = async (req, res, next) => {
    try {
        const userId = req.user._id;
        const { limit = 10 } = req.query;

        console.log(`🎯 为用户 ${req.user.username} 生成个性化推荐`);

        // 加载用户（含 preferenceEmbedding）
        const user = await User.findById(userId)
            .select('+preferenceEmbedding')
            .populate('favorites')
            .populate('visited.cafe');

        const userReviews = await Review.find({ author: userId })
            .populate('cafe')
            .sort({ createdAt: -1 })
            .limit(50);

        // ── 向量推荐路径 ──────────────────────────────────
        if (user.preferenceEmbedding && user.preferenceEmbedding.length >= 768) {
            console.log('🧮 使用向量推荐');

            const candidates = await Cafe.find({
                isActive: true,
                embeddingUpdatedAt: { $exists: true, $ne: null },
                _id: { $nin: user.favorites.map(f => f._id || f) }
            })
            .select('+embedding')
            .lean();

            const ranked = vectorService.rankCafes(
                user.preferenceEmbedding,
                candidates,
                { topK: parseInt(limit) }
            );

            const recommendations = ranked.map(({ cafe, similarityScore }) => ({
                cafe,
                score: Math.round(similarityScore * 100),
                reasons: ['基于您的偏好推荐'],
                type: similarityScore >= 0.7 ? 'personalized' : 'general'
            }));

            console.log(`✅ 向量推荐生成了 ${recommendations.length} 个结果`);

            return res.status(200).json({
                success: true,
                recommendations,
                basedOn: {
                    reviewCount: userReviews.length,
                    favoriteCount: user.favorites.length,
                    visitedCount: user.visited.length,
                    mode: 'vector'
                }
            });
        }

        // ── 降级：规则推荐路径（保留原有逻辑）──────────────
        console.log('⚠️  用户无偏好向量，使用规则推荐');

        const candidateCafes = await Cafe.find({
            isActive: true,
            _id: { $nin: user.favorites }
        })
        .populate('author', 'username avatar')
        .sort({ rating: -1 })
        .limit(100);

        const recommendations = await aiService.generatePersonalizedRecommendations(
            user,
            candidateCafes,
            { reviews: userReviews, favorites: user.favorites, visited: user.visited }
        );

        return res.status(200).json({
            success: true,
            recommendations: recommendations.slice(0, parseInt(limit)),
            basedOn: {
                reviewCount: userReviews.length,
                favoriteCount: user.favorites.length,
                visitedCount: user.visited.length,
                mode: 'rule-based'
            },
            userPreferences: user.getPreferencesSummary ? user.getPreferencesSummary() : {}
        });

    } catch (error) {
        console.error('❌ 生成推荐失败:', error);
        next(error);
    }
};

/**
 * @desc    🎯 获取基于位置的推荐
 * @route   POST /api/recommendations/nearby
 * @access  Private
 * @body    { location: { lng, lat }, radius?: number }
 * 
 * 结合用户偏好和地理位置的推荐
 */
exports.getNearbyRecommendations = async (req, res, next) => {
    try {
        const userId = req.user._id;
        const { location, radius = 5000, limit = 10 } = req.body;
        
        if (!location || !location.lng || !location.lat) {
            return next(new ExpressError('请提供位置信息', 400));
        }
        
        console.log(`📍 获取附近推荐: ${radius}米内`);
        
        // 获取用户信息
        const user = await User.findById(userId)
            .populate('favorites')
            .populate('visited.cafe');
        
        // 获取历史评论
        const userReviews = await Review.find({ author: userId })
            .populate('cafe')
            .sort({ createdAt: -1 })
            .limit(30);
        
        // 获取附近咖啡店
        const nearbyCafes = await Cafe.findNearby(
            parseFloat(location.lng),
            parseFloat(location.lat),
            parseInt(radius),
            50 // 候选50个
        );
        
        if (nearbyCafes.length === 0) {
            return res.status(200).json({
                success: true,
                message: '附近没有找到咖啡店',
                recommendations: [],
                searchCenter: location,
                searchRadius: radius
            });
        }
        
        // 生成推荐
        const recommendations = await aiService.generatePersonalizedRecommendations(
            user,
            nearbyCafes,
            {
                reviews: userReviews,
                favorites: user.favorites,
                visited: user.visited
            }
        );
        
        res.status(200).json({
            success: true,
            recommendations: recommendations.slice(0, parseInt(limit)),
            searchCenter: location,
            searchRadius: radius,
            totalNearby: nearbyCafes.length
        });
        
    } catch (error) {
        console.error('获取附近推荐失败:', error);
        next(error);
    }
};

// ============================================
// 用户偏好管理
// ============================================

/**
 * @desc    👤 获取用户偏好概览
 * @route   GET /api/recommendations/preferences
 * @access  Private
 */
exports.getUserPreferences = async (req, res, next) => {
    try {
        const user = await User.findById(req.user._id);
        
        const preferencesSummary = user.getPreferencesSummary();
        
        res.status(200).json({
            success: true,
            preferences: user.preferences,
            summary: preferencesSummary
        });
        
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    ✏️ 更新用户手动偏好设置
 * @route   PUT /api/recommendations/preferences
 * @access  Private
 * @body    { preferences: { manual: { ... } } }
 * 
 * 示例请求:
 * PUT /api/recommendations/preferences
 * {
 *   "preferences": {
 *     "manual": {
 *       "mustHaveAmenities": ["WiFi", "Quiet"],
 *       "avoidAmenities": ["Smoking"],
 *       "preferredCities": ["Seattle", "Portland"]
 *     }
 *   }
 * }
 */
exports.updatePreferences = async (req, res, next) => {
    try {
        const userId = req.user._id;
        const { preferences } = req.body;
        
        if (!preferences) {
            return next(new ExpressError('请提供偏好设置', 400));
        }
        
        const user = await User.findById(userId);
        
        // 更新手动偏好
        await user.updatePreferences(preferences);
        
        res.status(200).json({
            success: true,
            message: '偏好已更新',
            preferences: user.preferences,
            summary: user.getPreferencesSummary()
        });
        
    } catch (error) {
        console.error('更新偏好失败:', error);
        next(error);
    }
};

/**
 * @desc    🤖 从用户行为中学习偏好
 * @route   POST /api/recommendations/learn
 * @access  Private
 * 
 * 分析用户的收藏、评论、访问记录，自动更新偏好
 */
exports.learnFromBehavior = async (req, res, next) => {
    try {
        const userId = req.user._id;
        
        console.log(`🎓 开始学习用户 ${req.user.username} 的偏好`);
        
        const user = await User.findById(userId);
        
        // 调用User模型的学习方法
        const updatedPreferences = await user.learnFromBehavior();
        
        if (!updatedPreferences) {
            return res.status(200).json({
                success: true,
                message: '数据不足，无法学习偏好',
                preferences: user.preferences
            });
        }
        
        res.status(200).json({
            success: true,
            message: '已从您的行为中学习偏好',
            learnedPreferences: updatedPreferences.learned,
            confidence: updatedPreferences.confidence,
            summary: user.getPreferencesSummary()
        });
        
    } catch (error) {
        console.error('学习偏好失败:', error);
        next(error);
    }
};

/**
 * @desc    🔄 重置用户偏好
 * @route   DELETE /api/recommendations/preferences
 * @access  Private
 * 
 * 清除所有学习到的偏好，重新开始
 */
exports.resetPreferences = async (req, res, next) => {
    try {
        const userId = req.user._id;
        
        const user = await User.findById(userId);
        
        // 重置偏好为默认值
        user.preferences = {
            learned: {
                favoriteAmenities: [],
                favoriteSpecialties: [],
                priceRange: { min: 1, max: 4 },
                atmospherePreferences: []
            },
            manual: {
                dietaryRestrictions: [],
                mustHaveAmenities: [],
                avoidAmenities: [],
                preferredCities: []
            },
            lastUpdated: Date.now(),
            confidence: 0
        };
        
        await user.save();
        
        res.status(200).json({
            success: true,
            message: '偏好已重置',
            preferences: user.preferences
        });
        
    } catch (error) {
        next(error);
    }
};

// ============================================
// 推荐系统分析和统计
// ============================================

/**
 * @desc    📊 获取推荐系统统计信息
 * @route   GET /api/recommendations/stats
 * @access  Private
 * 
 * 显示用户的推荐系统使用情况
 */
exports.getRecommendationStats = async (req, res, next) => {
    try {
        const userId = req.user._id;
        
        const user = await User.findById(userId)
            .populate('favorites')
            .populate('visited.cafe');
        
        const reviewCount = await Review.countDocuments({ author: userId });
        const highRatedReviews = await Review.countDocuments({
            author: userId,
            rating: { $gte: 4 }
        });
        
        // 统计收藏店的特征
        const favoriteAmenities = {};
        user.favorites.forEach(cafe => {
            cafe.amenities?.forEach(amenity => {
                favoriteAmenities[amenity] = (favoriteAmenities[amenity] || 0) + 1;
            });
        });
        
        const topFavoriteAmenities = Object.entries(favoriteAmenities)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([amenity, count]) => ({ amenity, count }));
        
        res.status(200).json({
            success: true,
            stats: {
                totalReviews: reviewCount,
                highRatedReviews: highRatedReviews,
                favoriteCount: user.favorites.length,
                visitedCount: user.visited.length,
                topFavoriteAmenities: topFavoriteAmenities,
                preferencesConfidence: user.preferences?.confidence || 0,
                lastPreferenceUpdate: user.preferences?.lastUpdated
            },
            readyForRecommendations: (reviewCount >= 3 || user.favorites.length >= 2)
        });
        
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    🎲 获取探索性推荐
 * @route   GET /api/recommendations/explore
 * @access  Private
 * 
 * 推荐用户可能从未尝试过的类型
 */
exports.getExploreRecommendations = async (req, res, next) => {
    try {
        const userId = req.user._id;
        const { limit = 10 } = req.query;
        
        const user = await User.findById(userId)
            .populate('favorites');
        
        // 获取用户已体验过的特色类型
        const experiencedSpecialties = new Set();
        user.favorites.forEach(cafe => {
            if (cafe.specialty) {
                experiencedSpecialties.add(cafe.specialty);
            }
        });
        
        // 查找用户从未尝试过的特色类型咖啡店
        const allSpecialties = ['意式浓缩 Espresso', '手冲咖啡 Pour Over', '冷萃咖啡 Cold Brew', '拉花咖啡 Latte Art', '精品咖啡豆 Specialty Beans', '甜点 Desserts', '轻食 Light Meals'];
        const unexploredSpecialties = allSpecialties.filter(s => !experiencedSpecialties.has(s));
        
        let exploreCafes = [];
        
        if (unexploredSpecialties.length > 0) {
            // 一次查询所有未体验特色的高评分咖啡店，再按特色分组取 top 2
            const allCandidates = await Cafe.find({
                specialty: { $in: unexploredSpecialties },
                isActive: true,
                rating: { $gte: 4.0 },
                reviewCount: { $gte: 5 }
            })
            .sort({ rating: -1 });

            // 按 specialty 分组，每组最多取 2 家
            const bySpecialty = {};
            for (const cafe of allCandidates) {
                const s = cafe.specialty;
                if (!bySpecialty[s]) bySpecialty[s] = [];
                if (bySpecialty[s].length < 2) bySpecialty[s].push(cafe);
            }
            exploreCafes = Object.values(bySpecialty).flat();
        } else {
            // 如果都体验过，推荐高评分但未收藏的
            exploreCafes = await Cafe.find({
                isActive: true,
                _id: { $nin: user.favorites },
                rating: { $gte: 4.5 },
                reviewCount: { $gte: 10 }
            })
            .sort({ rating: -1 })
            .limit(20);
        }
        
        // 随机打乱并限制数量
        const shuffled = exploreCafes.sort(() => 0.5 - Math.random());
        
        res.status(200).json({
            success: true,
            message: '为您推荐一些新的尝试',
            recommendations: shuffled.slice(0, parseInt(limit)),
            count: Math.min(shuffled.length, parseInt(limit))
        });
        
    } catch (error) {
        console.error('获取探索推荐失败:', error);
        next(error);
    }
};

module.exports = exports;