// ============================================
// SipSpot - Review Controller
// 评论 CRUD + 投票 + 举报 + AI分析 + 管理员审核
// ============================================

const Review = require('../models/review');
const Cafe = require('../models/cafe');
const User = require('../models/user');
const ExpressError = require('../utils/ExpressError.js');
const { deleteImages } = require('../services/cloudinary');
const { analyzeReview } = require('../services/aiService');
const embeddingService = require('../services/embeddingService');
const vectorService = require('../services/vectorService');

/**
 * @desc    Get all reviews for a cafe
 * @route   GET /api/cafes/:cafeId/reviews
 * @access  Public
 */
exports.getReviews = async (req, res, next) => {
    try {
        const { cafeId } = req.params;
        const { page = 1, limit = 10, sort = '-createdAt' } = req.query;

        const cafe = await Cafe.findById(cafeId);
        if (!cafe) return next(new ExpressError('Cafe not found', 404));

        const reviews = await Review.getByCafe(cafeId, { page, limit, sort });
        const total = await Review.countDocuments({ cafe: cafeId });

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
 * @desc    Get single review
 * @route   GET /api/reviews/:id
 * @access  Public
 */
exports.getReview = async (req, res, next) => {
    try {
        const review = await Review.findById(req.params.id)
            .populate('author', 'username avatar bio')
            .populate('cafe', 'name images rating city');

        if (!review) return next(new ExpressError('Review not found', 404));

        res.status(200).json({ success: true, data: review });
    } catch (error) {
        if (error.name === 'CastError') return next(new ExpressError('Invalid review ID', 400));
        next(error);
    }
};

/**
 * @desc    Create review
 * @route   POST /api/cafes/:cafeId/reviews
 * @access  Private
 */
exports.createReview = async (req, res, next) => {
    try {
        const { cafeId } = req.params;

        const cafe = await Cafe.findById(cafeId);
        if (!cafe) return next(new ExpressError('Cafe not found', 404));

        const existingReview = await Review.findOne({
            cafe: cafeId,
            author: req.user.id
        });

        if (existingReview) {
            return next(new ExpressError('You have already reviewed this cafe', 400));
        }

        const reviewData = {
            ...req.body,
            cafe: cafeId,
            author: req.user.id
        };

        if (req.files && req.files.length > 0) {
            reviewData.images = req.files.map(file => ({
                url: file.path,
                filename: file.filename,
                publicId: file.filename
            }));
        }

        const review = await Review.create(reviewData);

        cafe.reviews.push(review._id);
        await cafe.save({ validateBeforeSave: false });

        triggerAIAnalysis(review._id, review.content, cafe.name)
            .catch(err => console.error('AI analysis failed:', err));

        await req.user.visitCafe(cafeId);
        await review.populate('author', 'username avatar');

        res.status(201).json({
            success: true,
            message: 'Review created successfully',
            data: review
        });

        // 高分评论触发偏好向量更新（rating >= 4）
        process.nextTick(async () => {
            try {
                if (review.rating < 4) return;
                if (!embeddingService.isReady()) return;

                const userId = req.user.id;
                const freshUser = await User.findById(userId)
                    .select('+preferenceEmbedding +preferenceHistory +preferenceEmbeddingUpdatedAt');
                if (!vectorService.shouldUpdatePreference(freshUser)) return;

                const cafeWithEmb = await Cafe.findById(cafeId).select('+embedding');
                if (!cafeWithEmb || !cafeWithEmb.embedding || cafeWithEmb.embedding.length !== 1024) return;

                await User.findByIdAndUpdate(userId, {
                    $push: {
                        preferenceHistory: {
                            $each: [{ cafeId, weight: 1, addedAt: new Date() }],
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

                console.log(`✅ 高分评论触发偏好向量更新 (用户: ${userId})`);
            } catch (e) {
                console.error('❌ 评论触发偏好更新失败:', e.message);
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Update review
 * @route   PUT /api/reviews/:id
 * @access  Private (Author only)
 */
exports.updateReview = async (req, res, next) => {
    try {
        let review = await Review.findById(req.params.id);
        if (!review) return next(new ExpressError('Review not found', 404));

        if (review.author.toString() !== req.user.id) {
            return next(new ExpressError('Not authorized to update this review', 403));
        }

        const restrictedFields = ['author', 'cafe', 'helpfulCount', 'helpfulVotes'];
        restrictedFields.forEach(field => delete req.body[field]);

        Object.assign(review, req.body);
        await review.markAsEdited();

        if (req.body.content) {
            const cafe = await Cafe.findById(review.cafe);
            triggerAIAnalysis(review._id, review.content, cafe.name)
                .catch(err => console.error('AI analysis failed:', err));
        }

        await review.populate('author', 'username avatar');

        res.status(200).json({
            success: true,
            message: 'Review updated successfully',
            data: review
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Delete review
 * @route   DELETE /api/reviews/:id
 * @access  Private (Author or Admin)
 */
exports.deleteReview = async (req, res, next) => {
    try {
        const review = await Review.findById(req.params.id);
        if (!review) return next(new ExpressError('Review not found', 404));

        if (review.author.toString() !== req.user.id && req.user.role !== 'admin') {
            return next(new ExpressError('Not authorized to delete this review', 403));
        }

        const cafe = await Cafe.findById(review.cafe);
        if (cafe) {
            cafe.reviews = cafe.reviews.filter(
                id => id.toString() !== review._id.toString()
            );
            await cafe.save({ validateBeforeSave: false });
        }

        if (review.images && review.images.length > 0) {
            const publicIds = review.images.map(img => img.publicId);
            try {
                await deleteImages(publicIds);
            } catch (error) {
                console.error('Error deleting review images from Cloudinary:', error);
            }
        }

        await review.deleteOne();

        res.status(200).json({
            success: true,
            message: 'Review deleted successfully',
            data: {}
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Vote review as helpful
 * @route   POST /api/reviews/:id/helpful
 * @access  Private
 */
exports.voteHelpful = async (req, res, next) => {
    try {
        const { voteType } = req.body;

        if (!['helpful', 'not-helpful'].includes(voteType)) {
            return next(new ExpressError('Invalid vote type', 400));
        }

        const review = await Review.findById(req.params.id);
        if (!review) return next(new ExpressError('Review not found', 404));

        if (review.author.toString() === req.user.id) {
            return next(new ExpressError('Cannot vote on your own review', 400));
        }

        await review.addHelpfulVote(req.user.id, voteType);

        res.status(200).json({
            success: true,
            message: 'Vote recorded',
            data: {
                helpfulCount: review.helpfulCount,
                notHelpfulCount: review.notHelpfulCount,
                helpfulPercentage: review.helpfulPercentage
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Remove helpful vote
 * @route   DELETE /api/reviews/:id/helpful
 * @access  Private
 */
exports.removeVote = async (req, res, next) => {
    try {
        const review = await Review.findById(req.params.id);
        if (!review) return next(new ExpressError('Review not found', 404));

        await review.removeHelpfulVote(req.user.id);

        res.status(200).json({
            success: true,
            message: 'Vote removed',
            data: {
                helpfulCount: review.helpfulCount,
                notHelpfulCount: review.notHelpfulCount
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Report review
 * @route   POST /api/reviews/:id/report
 * @access  Private
 */
exports.reportReview = async (req, res, next) => {
    try {
        const review = await Review.findById(req.params.id);
        if (!review) return next(new ExpressError('Review not found', 404));

        await review.report();

        res.status(200).json({
            success: true,
            message: 'Review reported successfully'
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Add owner response to review
 * @route   POST /api/reviews/:id/response
 * @access  Private (Cafe owner or Admin)
 */
exports.addOwnerResponse = async (req, res, next) => {
    try {
        const { content } = req.body;
        if (!content) return next(new ExpressError('Please provide response content', 400));

        const review = await Review.findById(req.params.id).populate('cafe');
        if (!review) return next(new ExpressError('Review not found', 404));

        const isOwner = review.cafe.author.toString() === req.user.id;
        const isAdmin = req.user.role === 'admin';

        if (!isOwner && !isAdmin) {
            return next(new ExpressError('Not authorized to respond to this review', 403));
        }

        await review.addOwnerResponse(content, req.user.id);

        res.status(200).json({
            success: true,
            message: 'Response added successfully',
            data: review
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Trigger AI analysis for review
 * @route   POST /api/reviews/:id/analyze
 * @access  Private (Admin or review author)
 */
exports.analyzeReviewEndpoint = async (req, res, next) => {
    try {
        const review = await Review.findById(req.params.id).populate('cafe', 'name');
        if (!review) return next(new ExpressError('Review not found', 404));

        if (review.author.toString() !== req.user.id && req.user.role !== 'admin') {
            return next(new ExpressError('Not authorized', 403));
        }

        const analysis = await triggerAIAnalysis(
            review._id, review.content, review.cafe.name
        );

        res.status(200).json({
            success: true,
            message: 'AI analysis completed',
            data: analysis
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get most helpful reviews for a cafe
 * @route   GET /api/cafes/:cafeId/reviews/helpful
 * @access  Public
 */
exports.getMostHelpful = async (req, res, next) => {
    try {
        const { cafeId } = req.params;
        const { limit = 5 } = req.query;

        const reviews = await Review.getMostHelpful(cafeId, parseInt(limit));

        res.status(200).json({
            success: true,
            count: reviews.length,
            data: reviews
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get sentiment statistics for cafe
 * @route   GET /api/cafes/:cafeId/reviews/sentiment
 * @access  Public
 */
exports.getSentimentStats = async (req, res, next) => {
    try {
        const { cafeId } = req.params;
        const stats = await Review.getSentimentStats(cafeId);
        const total = stats.positive + stats.negative + stats.neutral;

        res.status(200).json({
            success: true,
            data: {
                ...stats,
                total,
                percentages: {
                    positive: total > 0 ? Math.round((stats.positive / total) * 100) : 0,
                    negative: total > 0 ? Math.round((stats.negative / total) * 100) : 0,
                    neutral: total > 0 ? Math.round((stats.neutral / total) * 100) : 0
                }
            }
        });
    } catch (error) {
        next(error);
    }
};

// ============================================
// 管理员审核功能（从 reviewsStandalone 移入）
// ============================================

/**
 * @desc    获取所有被举报的评论
 * @route   GET /api/reviews/admin/reported
 * @access  Private (仅管理员)
 */
exports.getReportedReviews = async (req, res, next) => {
    try {
        const reportedReviews = await Review.find({ isReported: true })
            .populate('author', 'username email avatar')
            .populate('cafe', 'name')
            .sort('-reportCount -createdAt')
            .limit(100);

        res.status(200).json({
            success: true,
            count: reportedReviews.length,
            data: reportedReviews
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    审核评论（管理员）
 * @route   PUT /api/reviews/:id/moderate
 * @access  Private (仅管理员)
 */
exports.moderateReview = async (req, res, next) => {
    try {
        const { action, reason } = req.body;
        const review = await Review.findById(req.params.id);

        if (!review) return next(new ExpressError('评论不存在', 404));

        if (action === 'approve') {
            review.isReported = false;
            review.reportCount = 0;
            await review.save();
            res.status(200).json({ success: true, message: '评论已批准' });
        } else if (action === 'remove') {
            await review.deleteOne();
            res.status(200).json({ success: true, message: '评论已删除', reason });
        } else {
            return next(new ExpressError('无效的操作', 400));
        }
    } catch (error) {
        next(error);
    }
};

// ============================================
// Helper Functions
// ============================================

async function triggerAIAnalysis(reviewId, content, cafeName) {
    try {
        const analysisData = await analyzeReview(content, cafeName);
        const review = await Review.findById(reviewId);
        if (review) {
            await review.addAIAnalysis(analysisData);
            return analysisData;
        }
        return null;
    } catch (error) {
        console.error('AI Analysis Error:', error.message);
        return null;
    }
}

// ============================================
// 偏好向量计算辅助函数（与 userController.js 相同）
// ============================================

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

function buildHistoryItems(history, cafeMap) {
    return history
        .map(h => ({
            embedding: cafeMap.get(h.cafeId.toString()),
            weight: h.weight,
            addedAt: h.addedAt
        }))
        .filter(h => h.embedding);
}