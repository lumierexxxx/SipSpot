// ============================================
// SipSpot - Cafe Controller
// Handle all cafe-related operations
// ============================================

const Cafe = require('../models/cafe');
const ExpressError = require('../utils/ExpressError');

/**
 * @desc    Get all cafes with filtering and pagination
 * @route   GET /api/cafes
 * @access  Public
 */
exports.getCafes = async (req, res, next) => {
    try {
        const {
            city,
            amenities,
            minRating,
            maxPrice,
            search,
            page = 1,
            limit = 20,
            sort = '-rating'
        } = req.query;
        
        // Build query
        let query = { isActive: true };
        
        // City filter
        if (city) {
            query.city = new RegExp(city, 'i');
        }
        
        // Amenities filter (must have all specified amenities)
        if (amenities) {
            const amenitiesArray = Array.isArray(amenities) 
                ? amenities 
                : amenities.split(',');
            query.amenities = { $all: amenitiesArray };
        }
        
        // Rating filter
        if (minRating) {
            query.rating = { $gte: parseFloat(minRating) };
        }
        
        // Price filter
        if (maxPrice) {
            query.price = { $lte: parseInt(maxPrice) };
        }
        
        // Text search
        if (search) {
            query.$text = { $search: search };
        }
        
        // Pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);
        
        // Execute query
        const cafes = await Cafe.find(query)
            .populate('author', 'username avatar')
            .select('-reviews') // Don't include reviews array in list view
            .sort(sort)
            .skip(skip)
            .limit(parseInt(limit));
        
        // Get total count for pagination
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
 * @desc    Get cafes near a location
 * @route   GET /api/cafes/nearby
 * @access  Public
 * @query   lng, lat, distance (in meters)
 */
exports.getNearby = async (req, res, next) => {
    try {
        const { lng, lat, distance = 5000, limit = 20 } = req.query;
        
        if (!lng || !lat) {
            return next(new ExpressError('Please provide longitude and latitude', 400));
        }
        
        const longitude = parseFloat(lng);
        const latitude = parseFloat(lat);
        
        // Validate coordinates
        if (isNaN(longitude) || isNaN(latitude)) {
            return next(new ExpressError('Invalid coordinates', 400));
        }
        
        if (longitude < -180 || longitude > 180 || latitude < -90 || latitude > 90) {
            return next(new ExpressError('Coordinates out of range', 400));
        }
        
        const cafes = await Cafe.findNearby(
            longitude,
            latitude,
            parseInt(distance),
            parseInt(limit)
        );
        
        res.status(200).json({
            success: true,
            count: cafes.length,
            searchCenter: { longitude, latitude },
            searchRadius: parseInt(distance),
            data: cafes
        });
        
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get single cafe by ID
 * @route   GET /api/cafes/:id
 * @access  Public
 */
exports.getCafe = async (req, res, next) => {
    try {
        const cafe = await Cafe.findById(req.params.id)
            .populate('author', 'username avatar bio')
            .populate({
                path: 'reviews',
                populate: {
                    path: 'author',
                    select: 'username avatar'
                },
                options: { sort: { createdAt: -1 } }
            });
        
        if (!cafe) {
            return next(new ExpressError('Cafe not found', 404));
        }
        
        // Increment view count (don't await to not slow down response)
        cafe.incrementViewCount().catch(err => console.error('Error incrementing view count:', err));
        
        res.status(200).json({
            success: true,
            data: cafe
        });
        
    } catch (error) {
        // Handle invalid ObjectId
        if (error.name === 'CastError') {
            return next(new ExpressError('Invalid cafe ID', 400));
        }
        next(error);
    }
};

/**
 * @desc    Create new cafe
 * @route   POST /api/cafes
 * @access  Private
 */
exports.createCafe = async (req, res, next) => {
    try {
        // Add author from authenticated user
        req.body.author = req.user.id;
        
        // Handle images from file upload middleware (if using multer + cloudinary)
        if (req.files && req.files.length > 0) {
            req.body.images = req.files.map(file => ({
                url: file.path,
                filename: file.filename,
                publicId: file.filename
            }));
        }
        
        // Create cafe
        const cafe = await Cafe.create(req.body);
        
        // Populate author info
        await cafe.populate('author', 'username avatar');
        
        res.status(201).json({
            success: true,
            message: 'Cafe created successfully',
            data: cafe
        });
        
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Update cafe
 * @route   PUT /api/cafes/:id
 * @access  Private (Owner or Admin)
 */
exports.updateCafe = async (req, res, next) => {
    try {
        let cafe = await Cafe.findById(req.params.id);
        
        if (!cafe) {
            return next(new ExpressError('Cafe not found', 404));
        }
        
        // Check ownership (unless admin)
        if (cafe.author.toString() !== req.user.id && req.user.role !== 'admin') {
            return next(new ExpressError('Not authorized to update this cafe', 403));
        }
        
        // Fields that shouldn't be updated directly
        const restrictedFields = ['author', 'rating', 'reviewCount', 'reviews', 'viewCount'];
        restrictedFields.forEach(field => delete req.body[field]);
        
        // Update cafe
        cafe = await Cafe.findByIdAndUpdate(
            req.params.id,
            req.body,
            {
                new: true,
                runValidators: true
            }
        ).populate('author', 'username avatar');
        
        res.status(200).json({
            success: true,
            message: 'Cafe updated successfully',
            data: cafe
        });
        
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Delete cafe
 * @route   DELETE /api/cafes/:id
 * @access  Private (Owner or Admin)
 */
exports.deleteCafe = async (req, res, next) => {
    try {
        const cafe = await Cafe.findById(req.params.id);
        
        if (!cafe) {
            return next(new ExpressError('Cafe not found', 404));
        }
        
        // Check ownership (unless admin)
        if (cafe.author.toString() !== req.user.id && req.user.role !== 'admin') {
            return next(new ExpressError('Not authorized to delete this cafe', 403));
        }
        
        // Delete images from cloudinary (if using cloudinary)
        if (cafe.images && cafe.images.length > 0) {
            // TODO: Implement cloudinary deletion
            // const cloudinary = require('../config/cloudinary');
            // for (const image of cafe.images) {
            //     await cloudinary.uploader.destroy(image.publicId);
            // }
        }
        
        // Delete cafe (will trigger cascade delete of reviews via middleware)
        await cafe.remove();
        
        res.status(200).json({
            success: true,
            message: 'Cafe deleted successfully',
            data: {}
        });
        
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get top-rated cafes
 * @route   GET /api/cafes/top/rated
 * @access  Public
 */
exports.getTopRated = async (req, res, next) => {
    try {
        const { limit = 10, city } = req.query;
        
        const cafes = await Cafe.getTopRated(parseInt(limit), city);
        
        res.status(200).json({
            success: true,
            count: cafes.length,
            data: cafes
        });
        
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Search cafes by text
 * @route   GET /api/cafes/search
 * @access  Public
 */
exports.searchCafes = async (req, res, next) => {
    try {
        const { q, city, minRating, maxPrice, amenities, limit = 20 } = req.query;
        
        if (!q) {
            return next(new ExpressError('Please provide search query', 400));
        }
        
        const options = {};
        if (city) options.city = city;
        if (minRating) options.minRating = parseFloat(minRating);
        if (maxPrice) options.maxPrice = parseInt(maxPrice);
        if (amenities) {
            options.amenities = Array.isArray(amenities) 
                ? amenities 
                : amenities.split(',');
        }
        
        const cafes = await Cafe.searchCafes(q, options).limit(parseInt(limit));
        
        res.status(200).json({
            success: true,
            count: cafes.length,
            query: q,
            data: cafes
        });
        
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get cafes by amenities
 * @route   GET /api/cafes/amenities/:amenity
 * @access  Public
 */
exports.getCafesByAmenities = async (req, res, next) => {
    try {
        const amenities = req.params.amenity.split(',');
        const { city, limit = 20 } = req.query;
        
        const cafes = await Cafe.findByAmenities(amenities, city).limit(parseInt(limit));
        
        res.status(200).json({
            success: true,
            count: cafes.length,
            amenities,
            data: cafes
        });
        
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Add cafe to favorites
 * @route   POST /api/cafes/:id/favorite
 * @access  Private
 */
exports.addToFavorites = async (req, res, next) => {
    try {
        const cafe = await Cafe.findById(req.params.id);
        
        if (!cafe) {
            return next(new ExpressError('Cafe not found', 404));
        }
        
        // Add to user's favorites
        await req.user.addFavorite(cafe._id);
        
        // Increment cafe's favorite count
        cafe.favoriteCount += 1;
        await cafe.save({ validateBeforeSave: false });
        
        res.status(200).json({
            success: true,
            message: 'Added to favorites',
            data: { favoriteCount: cafe.favoriteCount }
        });
        
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Remove cafe from favorites
 * @route   DELETE /api/cafes/:id/favorite
 * @access  Private
 */
exports.removeFromFavorites = async (req, res, next) => {
    try {
        const cafe = await Cafe.findById(req.params.id);
        
        if (!cafe) {
            return next(new ExpressError('Cafe not found', 404));
        }
        
        // Remove from user's favorites
        await req.user.removeFavorite(cafe._id);
        
        // Decrement cafe's favorite count
        cafe.favoriteCount = Math.max(0, cafe.favoriteCount - 1);
        await cafe.save({ validateBeforeSave: false });
        
        res.status(200).json({
            success: true,
            message: 'Removed from favorites',
            data: { favoriteCount: cafe.favoriteCount }
        });
        
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get cafe statistics
 * @route   GET /api/cafes/:id/stats
 * @access  Public
 */
exports.getCafeStats = async (req, res, next) => {
    try {
        const cafe = await Cafe.findById(req.params.id)
            .populate('reviews', 'rating createdAt');
        
        if (!cafe) {
            return next(new ExpressError('Cafe not found', 404));
        }
        
        // Calculate rating distribution
        const ratingDistribution = {
            5: 0, 4: 0, 3: 0, 2: 0, 1: 0
        };
        
        cafe.reviews.forEach(review => {
            const rating = Math.floor(review.rating);
            ratingDistribution[rating]++;
        });
        
        // Calculate monthly review trend (last 6 months)
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        
        const recentReviews = cafe.reviews.filter(
            review => review.createdAt >= sixMonthsAgo
        );
        
        res.status(200).json({
            success: true,
            data: {
                totalReviews: cafe.reviewCount,
                averageRating: cafe.rating,
                ratingCategory: cafe.ratingCategory,
                ratingDistribution,
                recentReviewCount: recentReviews.length,
                viewCount: cafe.viewCount,
                favoriteCount: cafe.favoriteCount
            }
        });
        
    } catch (error) {
        next(error);
    }
};