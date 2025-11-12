// ============================================
// SipSpot - Cafe Routes
// RESTful API endpoints for cafe operations
// ============================================

const express = require('express');
const router = express.Router();
const { protect, optionalAuth } = require('../middleware/auth');
const { uploadCafeImages } = require('../config/cloudinary');
const {
    getCafes,
    getNearby,
    getCafe,
    createCafe,
    updateCafe,
    deleteCafe,
    getTopRated,
    searchCafes,
    getCafesByAmenities,
    addToFavorites,
    removeFromFavorites,
    getCafeStats
} = require('../controllers/cafeController');

// Import nested review routes
const reviewRoutes = require('./reviews');

// ============================================
// Nested Review Routes
// Mount review routes under /:cafeId/reviews
// ============================================
router.use('/:cafeId/reviews', reviewRoutes);

// ============================================
// Public Routes
// ============================================

/**
 * @route   GET /api/cafes
 * @desc    Get all cafes with filtering and pagination
 * @access  Public
 * @query   city, amenities, minRating, maxPrice, search, page, limit, sort
 */
router.get('/', optionalAuth, getCafes);

/**
 * @route   GET /api/cafes/nearby
 * @desc    Get cafes near a location (geospatial query)
 * @access  Public
 * @query   lng, lat, distance (meters), limit
 */
router.get('/nearby', getNearby);

/**
 * @route   GET /api/cafes/top/rated
 * @desc    Get top-rated cafes
 * @access  Public
 * @query   limit, city
 */
router.get('/top/rated', getTopRated);

/**
 * @route   GET /api/cafes/search
 * @desc    Search cafes by text
 * @access  Public
 * @query   q (search query), city, minRating, maxPrice, amenities, limit
 */
router.get('/search', searchCafes);

/**
 * @route   GET /api/cafes/amenities/:amenity
 * @desc    Get cafes by specific amenities
 * @access  Public
 * @param   amenity - Single amenity or comma-separated list
 * @query   city, limit
 */
router.get('/amenities/:amenity', getCafesByAmenities);

/**
 * @route   GET /api/cafes/:id
 * @desc    Get single cafe by ID
 * @access  Public
 */
router.get('/:id', optionalAuth, getCafe);

/**
 * @route   GET /api/cafes/:id/stats
 * @desc    Get cafe statistics (ratings, reviews, etc.)
 * @access  Public
 */
router.get('/:id/stats', getCafeStats);

// ============================================
// Protected Routes (Require Authentication)
// ============================================

/**
 * @route   POST /api/cafes
 * @desc    Create new cafe
 * @access  Private (Authenticated users)
 * @body    name, description, geometry, address, city, price, amenities, etc.
 * @files   images (optional, max 10)
 */
router.post('/', protect, uploadCafeImages, createCafe);

/**
 * @route   PUT /api/cafes/:id
 * @desc    Update cafe
 * @access  Private (Owner or Admin)
 */
router.put('/:id', protect, updateCafe);

/**
 * @route   DELETE /api/cafes/:id
 * @desc    Delete cafe
 * @access  Private (Owner or Admin)
 */
router.delete('/:id', protect, deleteCafe);

/**
 * @route   POST /api/cafes/:id/favorite
 * @desc    Add cafe to user's favorites
 * @access  Private
 */
router.post('/:id/favorite', protect, addToFavorites);

/**
 * @route   DELETE /api/cafes/:id/favorite
 * @desc    Remove cafe from user's favorites
 * @access  Private
 */
router.delete('/:id/favorite', protect, removeFromFavorites);

module.exports = router;