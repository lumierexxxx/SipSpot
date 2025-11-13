// ============================================
// SipSpot - Review Controller
// Handle review operations with AI analysis
// ============================================

const Review = require('../models/review');
const Cafe = require('../models/cafe');
const ExpressError = require('../utils/ExpressError.js');
const { deleteImages } = require('../services/cloudinary');
const { analyzeReview } = require('../services/aiService');

/**
 * @desc    Get all reviews for a cafe
 * @route   GET /api/cafes/:cafeId/reviews
 * @access  Public
 */
exports.getReviews = async (req, res, next) => {
    try {
        const { cafeId } = req.params;
        const { page = 1, limit = 10, sort = '-createdAt' } = req.query;
        
        // Check if cafe exists
        const cafe = await Cafe.findById(cafeId);
        if (!cafe) {
            return next(new ExpressError('Cafe not found', 404));
        }
        
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
        
        if (!review) {
            return next(new ExpressError('Review not found', 404));
        }
        
        res.status(200).json({
            success: true,
            data: review
        });
        
    } catch (error) {
        if (error.name === 'CastError') {
            return next(new ExpressError('Invalid review ID', 400));
        }
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
        
        // Check if cafe exists
        const cafe = await Cafe.findById(cafeId);
        if (!cafe) {
            return next(new ExpressError('Cafe not found', 404));
        }
        
        // Check if user already reviewed this cafe
        const existingReview = await Review.findOne({
            cafe: cafeId,
            author: req.user.id
        });
        
        if (existingReview) {
            return next(new ExpressError('You have already reviewed this cafe', 400));
        }
        
        // Create review
        const reviewData = {
            ...req.body,
            cafe: cafeId,
            author: req.user.id
        };
        
        // Handle images from file upload
        if (req.files && req.files.length > 0) {
            reviewData.images = req.files.map(file => ({
                url: file.path,
                filename: file.filename,
                publicId: file.filename
            }));
        }
        
        const review = await Review.create(reviewData);
        
        // Add review to cafe's reviews array
        cafe.reviews.push(review._id);
        await cafe.save({ validateBeforeSave: false });
        
        // Trigger AI analysis (async - don't wait)
        triggerAIAnalysis(review._id, review.content, cafe.name)
            .catch(err => console.error('AI analysis failed:', err));
        
        // Record visit
        await req.user.visitCafe(cafeId);
        
        // Populate and return
        await review.populate('author', 'username avatar');
        
        res.status(201).json({
            success: true,
            message: 'Review created successfully',
            data: review
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
        
        if (!review) {
            return next(new ExpressError('Review not found', 404));
        }
        
        // Check ownership
        if (review.author.toString() !== req.user.id) {
            return next(new ExpressError('Not authorized to update this review', 403));
        }
        
        // Restricted fields
        const restrictedFields = ['author', 'cafe', 'helpfulCount', 'helpfulVotes'];
        restrictedFields.forEach(field => delete req.body[field]);
        
        // Update review
        Object.assign(review, req.body);
        await review.markAsEdited();
        
        // Re-trigger AI analysis if content changed
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
        
        if (!review) {
            return next(new ExpressError('Review not found', 404));
        }
        
        // Check ownership (unless admin)
        if (review.author.toString() !== req.user.id && req.user.role !== 'admin') {
            return next(new ExpressError('Not authorized to delete this review', 403));
        }
        
        // Remove from cafe's reviews array
        const cafe = await Cafe.findById(review.cafe);
        if (cafe) {
            cafe.reviews = cafe.reviews.filter(
                id => id.toString() !== review._id.toString()
            );
            await cafe.save({ validateBeforeSave: false });
        }
        
        // Delete images from Cloudinary
        if (review.images && review.images.length > 0) {
            const publicIds = review.images.map(img => img.publicId);
            try {
                await deleteImages(publicIds);
                console.log(`Deleted ${publicIds.length} review images from Cloudinary`);
            } catch (error) {
                console.error('Error deleting review images from Cloudinary:', error);
                // Continue with review deletion even if image deletion fails
            }
        }
        
        // Delete review (will trigger rating recalculation)
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
        const { voteType } = req.body; // 'helpful' or 'not-helpful'
        
        if (!['helpful', 'not-helpful'].includes(voteType)) {
            return next(new ExpressError('Invalid vote type', 400));
        }
        
        const review = await Review.findById(req.params.id);
        
        if (!review) {
            return next(new ExpressError('Review not found', 404));
        }
        
        // Can't vote on own review
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
        
        if (!review) {
            return next(new ExpressError('Review not found', 404));
        }
        
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
        
        if (!review) {
            return next(new ExpressError('Review not found', 404));
        }
        
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
        
        if (!content) {
            return next(new ExpressError('Please provide response content', 400));
        }
        
        const review = await Review.findById(req.params.id).populate('cafe');
        
        if (!review) {
            return next(new ExpressError('Review not found', 404));
        }
        
        // Check if user is cafe owner or admin
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
exports.analyzeReview = async (req, res, next) => {
    try {
        const review = await Review.findById(req.params.id).populate('cafe', 'name');
        
        if (!review) {
            return next(new ExpressError('Review not found', 404));
        }
        
        // Check authorization
        if (review.author.toString() !== req.user.id && req.user.role !== 'admin') {
            return next(new ExpressError('Not authorized', 403));
        }
        
        // Call AI service
        const analysis = await triggerAIAnalysis(
            review._id,
            review.content,
            review.cafe.name
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
 * @desc    Get user's reviews
 * @route   GET /api/users/me/reviews
 * @access  Private
 */
exports.getUserReviews = async (req, res, next) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        
        const reviews = await Review.getByUser(req.user.id, { page, limit });
        const total = await Review.countDocuments({ author: req.user.id });
        
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
// Helper Functions
// ============================================

/**
 * Trigger AI analysis for a review
 * Uses Gemini API via aiService
 */
async function triggerAIAnalysis(reviewId, content, cafeName) {
    try {
        const analysisData = await analyzeReview(content, cafeName);
        
        // Save analysis to review
        const review = await Review.findById(reviewId);
        if (review) {
            await review.addAIAnalysis(analysisData);
            return analysisData;
        }
        
        return null;
    } catch (error) {
        console.error('AI Analysis Error:', error.message);
        // Don't throw - allow review creation to succeed even if AI fails
        return null;
    }
}