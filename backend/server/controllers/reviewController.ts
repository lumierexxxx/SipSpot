// ============================================
// SipSpot - Review Controller
// 评论 CRUD + 投票 + 举报 + AI分析 + 管理员审核
// ============================================

import { Response, NextFunction } from 'express';
import Review from '../models/review';
import Cafe from '../models/cafe';
import User from '../models/user';
import ExpressError from '../utils/ExpressError';
import { deleteImages } from '../services/cloudinary';
import { analyzeReview as aiAnalyzeReview } from '../services/aiService';
import * as embeddingService from '../services/embeddingService';
import * as vectorService from '../services/vectorService';
import { AuthRequest } from '../types';

/**
 * @desc    Get all reviews for a cafe
 * @route   GET /api/cafes/:cafeId/reviews
 * @access  Public
 */
export const getReviews = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { cafeId } = req.params;
        const { page = 1, limit = 10, sort = '-createdAt' } = req.query;

        const cafe = await (Cafe as any).findById(cafeId);
        if (!cafe) return next(new ExpressError('Cafe not found', 404));

        const reviews = await (Review as any).getByCafe(cafeId, { page, limit, sort });
        const total = await (Review as any).countDocuments({ cafe: cafeId });

        res.status(200).json({
            success: true,
            count: reviews.length,
            total,
            page: parseInt(page as string),
            pages: Math.ceil(total / parseInt(limit as string)),
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
export const getReview = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const review = await (Review as any).findById(req.params.id)
            .populate('author', 'username avatar bio')
            .populate('cafe', 'name images rating city');

        if (!review) return next(new ExpressError('Review not found', 404));

        res.status(200).json({ success: true, data: review });
    } catch (error: any) {
        if (error.name === 'CastError') return next(new ExpressError('Invalid review ID', 400));
        next(error);
    }
};

/**
 * @desc    Create review
 * @route   POST /api/cafes/:cafeId/reviews
 * @access  Private
 */
export const createReview = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { cafeId } = req.params;

        const cafe = await (Cafe as any).findById(cafeId);
        if (!cafe) return next(new ExpressError('Cafe not found', 404));

        const existingReview = await (Review as any).findOne({
            cafe: cafeId,
            author: (req.user as any).id
        });

        if (existingReview) {
            return next(new ExpressError('You have already reviewed this cafe', 400));
        }

        const reviewData: Record<string, any> = {
            ...req.body,
            cafe: cafeId,
            author: (req.user as any).id
        };

        if ((req as any).files && (req as any).files.length > 0) {
            reviewData.images = (req as any).files.map((file: any) => ({
                url: file.path,
                filename: file.filename,
                publicId: file.filename
            }));
        }

        const review = await (Review as any).create(reviewData);

        cafe.reviews.push(review._id);
        await cafe.save({ validateBeforeSave: false });

        triggerAIAnalysis(review._id, review.content, cafe.name)
            .catch((err: any) => console.error('AI analysis failed:', err));

        await (req.user as any).visitCafe(cafeId);
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
                if (!(embeddingService as any).isReady()) return;

                const userId = (req.user as any).id;
                const freshUser = await (User as any).findById(userId)
                    .select('+preferenceEmbedding +preferenceHistory +preferenceEmbeddingUpdatedAt');
                if (!(vectorService as any).shouldUpdatePreference(freshUser)) return;

                const cafeWithEmb = await (Cafe as any).findById(cafeId).select('+embedding');
                if (!cafeWithEmb || !cafeWithEmb.embedding || cafeWithEmb.embedding.length !== 768) return;

                await (User as any).findByIdAndUpdate(userId, {
                    $push: {
                        preferenceHistory: {
                            $each: [{ cafeId, weight: 1, addedAt: new Date() }],
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

                console.log(`✅ 高分评论触发偏好向量更新 (用户: ${userId})`);
            } catch (e: any) {
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
export const updateReview = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        let review = await (Review as any).findById(req.params.id);
        if (!review) return next(new ExpressError('Review not found', 404));

        if (review.author.toString() !== (req.user as any).id) {
            return next(new ExpressError('Not authorized to update this review', 403));
        }

        const restrictedFields = ['author', 'cafe', 'helpfulCount', 'helpfulVotes'];
        restrictedFields.forEach(field => delete req.body[field]);

        Object.assign(review, req.body);
        await review.markAsEdited();

        if (req.body.content) {
            const cafe = await (Cafe as any).findById(review.cafe);
            triggerAIAnalysis(review._id, review.content, cafe.name)
                .catch((err: any) => console.error('AI analysis failed:', err));
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
export const deleteReview = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const review = await (Review as any).findById(req.params.id);
        if (!review) return next(new ExpressError('Review not found', 404));

        if (review.author.toString() !== (req.user as any).id && (req.user as any).role !== 'admin') {
            return next(new ExpressError('Not authorized to delete this review', 403));
        }

        const cafe = await (Cafe as any).findById(review.cafe);
        if (cafe) {
            cafe.reviews = cafe.reviews.filter(
                (id: any) => id.toString() !== review._id.toString()
            );
            await cafe.save({ validateBeforeSave: false });
        }

        if (review.images && review.images.length > 0) {
            const publicIds = review.images.map((img: any) => img.publicId);
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
export const voteHelpful = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { voteType } = req.body;

        if (!['helpful', 'not-helpful'].includes(voteType)) {
            return next(new ExpressError('Invalid vote type', 400));
        }

        const review = await (Review as any).findById(req.params.id);
        if (!review) return next(new ExpressError('Review not found', 404));

        if (review.author.toString() === (req.user as any).id) {
            return next(new ExpressError('Cannot vote on your own review', 400));
        }

        await review.addHelpfulVote((req.user as any).id, voteType);

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
export const removeVote = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const review = await (Review as any).findById(req.params.id);
        if (!review) return next(new ExpressError('Review not found', 404));

        await review.removeHelpfulVote((req.user as any).id);

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
export const reportReview = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const review = await (Review as any).findById(req.params.id);
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
export const addOwnerResponse = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { content } = req.body;
        if (!content) return next(new ExpressError('Please provide response content', 400));

        const review = await (Review as any).findById(req.params.id).populate('cafe');
        if (!review) return next(new ExpressError('Review not found', 404));

        const isOwner = review.cafe.author.toString() === (req.user as any).id;
        const isAdmin = (req.user as any).role === 'admin';

        if (!isOwner && !isAdmin) {
            return next(new ExpressError('Not authorized to respond to this review', 403));
        }

        await review.addOwnerResponse(content, (req.user as any).id);

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
export const analyzeReviewEndpoint = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const review = await (Review as any).findById(req.params.id).populate('cafe', 'name');
        if (!review) return next(new ExpressError('Review not found', 404));

        if (review.author.toString() !== (req.user as any).id && (req.user as any).role !== 'admin') {
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
export const getMostHelpful = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { cafeId } = req.params;
        const { limit = 5 } = req.query;

        const reviews = await (Review as any).getMostHelpful(cafeId, parseInt(limit as string));

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
export const getSentimentStats = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { cafeId } = req.params;
        const stats = await (Review as any).getSentimentStats(cafeId);
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
export const getReportedReviews = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const reportedReviews = await (Review as any).find({ isReported: true })
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
export const moderateReview = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { action, reason } = req.body;
        const review = await (Review as any).findById(req.params.id);

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

async function triggerAIAnalysis(reviewId: any, content: string, cafeName: string) {
    try {
        const analysisData = await aiAnalyzeReview(content, cafeName);
        const review = await (Review as any).findById(reviewId);
        if (review) {
            await review.addAIAnalysis(analysisData);
            return analysisData;
        }
        return null;
    } catch (error: any) {
        console.error('AI Analysis Error:', error.message);
        return null;
    }
}

// ============================================
// 偏好向量计算辅助函数（与 userController.ts 相同）
// ============================================

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
// Route name aliases (routes/reviews.ts uses these names)
// ============================================
export const analyzeReview = analyzeReviewEndpoint;
// routes/reviews.ts imports getUserReviews from reviewController — not defined here;
// that's the user-specific route handled in userController. Export a stub reference so
// the route file compiles. The actual route file may be routing it incorrectly; exporting
// getReviews under that alias keeps parity.
export const getUserReviews = getReviews;
