// ============================================
// SipSpot - Cafe Controller
// 咖啡店 CRUD + 搜索 + 附近 + 统计
// 已移除：aiSearch（→ aiSearchController）
// 已移除：收藏功能（→ userController）
// ============================================

import { Response, NextFunction } from 'express';
import Cafe from '../models/cafe';
import ExpressError from '../utils/ExpressError';
import * as embeddingService from '../services/embeddingService';
import { AuthRequest } from '../types';

/**
 * @desc    Get all cafes with filtering and pagination
 * @route   GET /api/cafes
 * @access  Public
 */
export const getCafes = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const {
            city, amenities, minRating, maxPrice, search, vibe,
            page = 1, limit = 20, sort = '-rating'
        } = req.query;

        let query: Record<string, any> = { isActive: true };

        if (city) query.city = new RegExp(city as string, 'i');
        if (vibe) query.vibe = vibe;
        if (amenities) {
            const amenitiesArray = Array.isArray(amenities) ? amenities : (amenities as string).split(',');
            query.amenities = { $all: amenitiesArray };
        }
        if (minRating) query.rating = { $gte: parseFloat(minRating as string) };
        if (maxPrice) query.price = { $lte: parseInt(maxPrice as string) };
        if (search) query.$text = { $search: search };

        const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

        const cafes = await Cafe.find(query)
            .populate('author', 'username avatar')
            .select('-reviews')
            .sort(sort as string)
            .skip(skip)
            .limit(parseInt(limit as string));

        const total = await Cafe.countDocuments(query);

        res.status(200).json({
            success: true,
            count: cafes.length,
            total,
            page: parseInt(page as string),
            pages: Math.ceil(total / parseInt(limit as string)),
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
 */
export const getNearby = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { lng, lat, distance = 5000, limit = 20 } = req.query;

        if (!lng || !lat) {
            return next(new ExpressError('Please provide longitude and latitude', 400));
        }

        const longitude = parseFloat(lng as string);
        const latitude = parseFloat(lat as string);

        if (isNaN(longitude) || isNaN(latitude)) {
            return next(new ExpressError('Invalid coordinates', 400));
        }

        if (longitude < -180 || longitude > 180 || latitude < -90 || latitude > 90) {
            return next(new ExpressError('Coordinates out of range', 400));
        }

        const cafes = await (Cafe as any).findNearby(longitude, latitude, parseInt(distance as string), parseInt(limit as string));

        res.status(200).json({
            success: true,
            count: cafes.length,
            searchCenter: { longitude, latitude },
            searchRadius: parseInt(distance as string),
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
export const getCafe = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const cafe = await Cafe.findById(req.params.id)
            .populate('author', 'username avatar bio')
            .populate({
                path: 'reviews',
                populate: { path: 'author', select: 'username avatar' },
                options: { sort: { createdAt: -1 } }
            }) as any;

        if (!cafe) return next(new ExpressError('Cafe not found', 404));

        cafe.incrementViewCount().catch((err: Error) => console.error('Error incrementing view count:', err));

        res.status(200).json({ success: true, data: cafe });
    } catch (error: any) {
        if (error.name === 'CastError') return next(new ExpressError('Invalid cafe ID', 400));
        next(error);
    }
};

/**
 * @desc    Create new cafe
 * @route   POST /api/cafes
 * @access  Private
 */
export const createCafe = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        req.body.author = req.user.id;

        if (req.files && (req.files as any[]).length > 0) {
            req.body.images = (req.files as any[]).map(file => ({
                url: file.path,
                filename: file.filename,
                publicId: file.filename
            }));
        }

        const cafe = await Cafe.create(req.body) as any;
        await cafe.populate('author', 'username avatar');

        res.status(201).json({
            success: true,
            message: 'Cafe created successfully',
            data: cafe
        });

        // 异步生成 embedding，不阻塞响应
        process.nextTick(async () => {
            try {
                if (!(embeddingService as any).isReady()) return;
                const text = (embeddingService as any).buildCafeText(cafe);
                const embedding = await (embeddingService as any).generateEmbedding(text, 'passage');
                await Cafe.findByIdAndUpdate(cafe._id, {
                    embedding,
                    embeddingUpdatedAt: new Date()
                });
                console.log(`✅ Cafe embedding 已生成: ${cafe.name}`);
            } catch (e: any) {
                console.error(`❌ Cafe embedding 生成失败 (${cafe.name}):`, e.message);
            }
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
export const updateCafe = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        let cafe = await Cafe.findById(req.params.id) as any;
        if (!cafe) return next(new ExpressError('Cafe not found', 404));

        if (cafe.author.toString() !== req.user.id && req.user.role !== 'admin') {
            return next(new ExpressError('Not authorized to update this cafe', 403));
        }

        const restrictedFields = ['author', 'rating', 'reviewCount', 'reviews', 'viewCount'];
        restrictedFields.forEach(field => delete req.body[field]);

        cafe = await Cafe.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        }).populate('author', 'username avatar') as any;

        res.status(200).json({
            success: true,
            message: 'Cafe updated successfully',
            data: cafe
        });

        // 更新后重新生成 embedding
        process.nextTick(async () => {
            try {
                if (!(embeddingService as any).isReady()) return;
                const text = (embeddingService as any).buildCafeText(cafe);
                const embedding = await (embeddingService as any).generateEmbedding(text, 'passage');
                await Cafe.findByIdAndUpdate(cafe._id, {
                    embedding,
                    embeddingUpdatedAt: new Date()
                });
                console.log(`✅ Cafe embedding 已更新: ${cafe.name}`);
            } catch (e: any) {
                console.error(`❌ Cafe embedding 更新失败:`, e.message);
            }
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
export const deleteCafe = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const cafe = await Cafe.findById(req.params.id) as any;
        if (!cafe) return next(new ExpressError('Cafe not found', 404));

        if (cafe.author.toString() !== req.user.id && req.user.role !== 'admin') {
            return next(new ExpressError('Not authorized to delete this cafe', 403));
        }

        if (cafe.images && cafe.images.length > 0) {
            const cloudinary = require('../config/cloudinary');
            for (const image of cafe.images) {
                await cloudinary.uploader.destroy(image.publicId);
            }
        }

        await cafe.deleteOne();

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
export const getTopRated = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { limit = 10, city } = req.query;
        const cafes = await (Cafe as any).getTopRated(parseInt(limit as string), city);

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
export const searchCafes = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { q, city, minRating, maxPrice, amenities, limit = 20 } = req.query;

        if (!q) return next(new ExpressError('Please provide search query', 400));

        const options: Record<string, any> = {};
        if (city) options.city = city;
        if (minRating) options.minRating = parseFloat(minRating as string);
        if (maxPrice) options.maxPrice = parseInt(maxPrice as string);
        if (amenities) {
            options.amenities = Array.isArray(amenities) ? amenities : (amenities as string).split(',');
        }

        const cafes = await (Cafe as any).searchCafes(q, options).limit(parseInt(limit as string));

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
export const getCafesByAmenities = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const amenities = (req.params.amenity as string).split(',');
        const { city, limit = 20 } = req.query;

        const cafes = await (Cafe as any).findByAmenities(amenities, city).limit(parseInt(limit as string));

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
 * @desc    Get cafe statistics
 * @route   GET /api/cafes/:id/stats
 * @access  Public
 */
export const getCafeStats = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const cafe = await Cafe.findById(req.params.id)
            .populate('reviews', 'rating createdAt') as any;

        if (!cafe) return next(new ExpressError('Cafe not found', 404));

        const ratingDistribution: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
        cafe.reviews.forEach((review: any) => {
            const rating = Math.floor(review.rating);
            ratingDistribution[rating]++;
        });

        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        const recentReviews = cafe.reviews.filter((r: any) => r.createdAt >= sixMonthsAgo);

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
