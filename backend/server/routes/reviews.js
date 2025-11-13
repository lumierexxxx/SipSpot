// ============================================
// SipSpot - Review Routes
// RESTful API endpoints for review operations
// ============================================

const express = require('express');
const router = express.Router({ mergeParams: true }); // Merge params from parent router
const { protect } = require('../middleware/auth');
const { uploadReviewImages } = require('../services/cloudinary');
const {
    getReviews,
    getReview,
    createReview,
    updateReview,
    deleteReview,
    voteHelpful,
    removeVote,
    reportReview,
    addOwnerResponse,
    analyzeReview,
    getMostHelpful,
    getUserReviews,
    getSentimentStats
} = require('../controllers/reviewController');

// ============================================
// Public Routes
// ============================================

/**
 * @route   GET /api/cafes/:cafeId/reviews
 * @desc    Get all reviews for a cafe
 * @access  Public
 * @query   page, limit, sort
 */
router.get('/', getReviews);

/**
 * @route   GET /api/cafes/:cafeId/reviews/helpful
 * @desc    Get most helpful reviews for a cafe
 * @access  Public
 * @query   limit
 */
router.get('/helpful', getMostHelpful);

/**
 * @route   GET /api/cafes/:cafeId/reviews/sentiment
 * @desc    Get sentiment statistics for cafe reviews
 * @access  Public
 */
router.get('/sentiment', getSentimentStats);

// ============================================
// Protected Routes (Require Authentication)
// ============================================

/**
 * @route   POST /api/cafes/:cafeId/reviews
 * @desc    Create new review
 * @access  Private
 * @body    content, rating, detailedRatings?, visitDate?
 * @files   images (optional, max 5)
 */
router.post('/', protect, uploadReviewImages, createReview);

/**
 * @route   GET /api/users/me/reviews
 * @desc    Get current user's reviews
 * @access  Private
 * @query   page, limit
 * Note: This should be mounted on the user routes, not cafe routes
 */
// router.get('/user/reviews', protect, getUserReviews);

module.exports = router;