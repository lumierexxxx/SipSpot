// ============================================
// SipSpot - Standalone Review Routes
// Routes for individual review operations (not nested under cafe)
// ============================================

const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
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
 * @body    voteType: 'helpful' | 'not-helpful'
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
 */
router.post('/:id/report', protect, reportReview);

/**
 * @route   POST /api/reviews/:id/response
 * @desc    Add owner response to review
 * @access  Private (Cafe owner or Admin)
 * @body    content
 */
router.post('/:id/response', protect, addOwnerResponse);

/**
 * @route   POST /api/reviews/:id/analyze
 * @desc    Trigger AI analysis for review
 * @access  Private (Author or Admin)
 */
router.post('/:id/analyze', protect, analyzeReview);

module.exports = router;