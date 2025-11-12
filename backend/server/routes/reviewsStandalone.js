// ============================================
// SipSpot - Standalone Review Routes
// Routes for individual review operations (not nested under cafe)
// ============================================

const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const ExpressError = require('../utils/ExpressError'); // 添加这行

const {
    getReview,
    updateReview,
    deleteReview,
    voteHelpful,
    removeVote,
    reportReview,
    addOwnerResponse,
    analyzeReview
} = require('../controllers/reviewController');

// ============================================
// Public Routes
// ============================================

/**
 * @route   GET /api/reviews/:id
 * @desc    Get single review by ID
 * @access  Public
 */
router.get('/:id', getReview);

// ============================================
// Protected Routes (Require Authentication)
// ============================================

/**
 * @route   PUT /api/reviews/:id
 * @desc    Update review
 * @access  Private (Author only)
 * @body    content?, rating?, detailedRatings?
 */
router.put('/:id', protect, updateReview);

/**
 * @route   DELETE /api/reviews/:id
 * @desc    Delete review
 * @access  Private (Author or Admin)
 */
router.delete('/:id', protect, deleteReview);

/**
 * @route   POST /api/reviews/:id/helpful
 * @desc    Vote review as helpful or not helpful
 * @access  Private
 * @body    { voteType: 'helpful' | 'not-helpful' }
 */
router.post('/:id/helpful', protect, voteHelpful);

/**
 * @route   DELETE /api/reviews/:id/helpful
 * @desc    Remove helpful vote
 * @access  Private
 */
router.delete('/:id/helpful', protect, removeVote);

/**
 * @route   POST /api/reviews/:id/report
 * @desc    Report review for moderation
 * @access  Private
 * @body    { reason?: string }
 */
router.post('/:id/report', protect, reportReview);

/**
 * @route   POST /api/reviews/:id/response
 * @desc    Add owner response to review
 * @access  Private (Cafe owner or Admin)
 * @body    { content: string }
 */
router.post('/:id/response', protect, addOwnerResponse);

/**
 * @route   POST /api/reviews/:id/analyze
 * @desc    Trigger AI analysis for review
 * @access  Private (Author or Admin)
 */
router.post('/:id/analyze', protect, analyzeReview);

// ============================================// 管理员路由
// ============================================

/**
 * @route   GET /api/reviews/reported
 * @desc    获取所有被举报的评论
 * @access  Private (仅管理员)
 */
router.get('/admin/reported', protect, authorize('admin'), async (req, res, next) => {
    try {
        const Review = require('../models/review');
        
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
});

/**
 * @route   PUT /api/reviews/:id/moderate
 * @desc    审核评论（管理员）
 * @access  Private (仅管理员)
 * @body    { action: 'approve' | 'remove', reason?: string }
 */
router.put('/:id/moderate', protect, authorize('admin'), async (req, res, next) => {
    try {
        const Review = require('../models/review');
        const { action, reason } = req.body;
        
        const review = await Review.findById(req.params.id);
        
        if (!review) {
            return next(new ExpressError('评论不存在', 404));
        }
        
        if (action === 'approve') {
            review.isReported = false;
            review.reportCount = 0;
            await review.save();
            
            res.status(200).json({
                success: true,
                message: '评论已批准'
            });
        } else if (action === 'remove') {
            await review.remove();
            
            res.status(200).json({
                success: true,
                message: '评论已删除',
                reason
            });
        } else {
            return next(new ExpressError('无效的操作', 400));
        }
    } catch (error) {
        next(error);
    }
});

module.exports = router;