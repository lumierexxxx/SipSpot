// ============================================
// SipSpot Frontend - Cafes & Reviews API
// 咖啡店和评论相关的所有API调用
// ============================================

import { get, post, put, del, uploadFile } from './api';

// ============================================
// 咖啡店 API
// ============================================

/**
 * 获取所有咖啡店（带过滤和分页）
 * @param {Object} params - 查询参数
 * @param {string} params.city - 城市过滤
 * @param {string|string[]} params.amenities - 设施过滤
 * @param {number} params.minRating - 最低评分
 * @param {number} params.maxPrice - 最高价格等级
 * @param {string} params.search - 搜索关键词
 * @param {number} params.page - 页码
 * @param {number} params.limit - 每页数量
 * @param {string} params.sort - 排序方式
 */
export const getCafes = (params = {}) => {
    return get('/cafes', { params });
};

/**
 * 获取附近的咖啡店（地理位置查询）
 * @param {Object} params
 * @param {number} params.lng - 经度
 * @param {number} params.lat - 纬度
 * @param {number} params.distance - 搜索半径（米）默认5000
 * @param {number} params.limit - 返回数量
 */
export const getNearbyCafes = (params) => {
    return get('/cafes/nearby', { params });
};

/**
 * 获取高评分咖啡店
 * @param {Object} params
 * @param {number} params.limit - 返回数量
 * @param {string} params.city - 城市过滤
 */
export const getTopRatedCafes = (params = {}) => {
    return get('/cafes/top/rated', { params });
};

/**
 * 搜索咖啡店
 * @param {Object} params
 * @param {string} params.q - 搜索关键词（必填）
 * @param {string} params.city - 城市过滤
 * @param {number} params.minRating - 最低评分
 * @param {number} params.maxPrice - 最高价格
 * @param {string|string[]} params.amenities - 设施过滤
 * @param {number} params.limit - 返回数量
 */
export const searchCafes = (params) => {
    return get('/cafes/search', { params });
};

/**
 * 按设施获取咖啡店
 * @param {string|string[]} amenities - 设施名称（可以是逗号分隔的字符串或数组）
 * @param {Object} params
 * @param {string} params.city - 城市过滤
 * @param {number} params.limit - 返回数量
 */
export const getCafesByAmenities = (amenities, params = {}) => {
    const amenityString = Array.isArray(amenities) ? amenities.join(',') : amenities;
    return get(`/cafes/amenities/${amenityString}`, { params });
};

/**
 * 获取单个咖啡店详情
 * @param {string} cafeId - 咖啡店ID
 */
export const getCafeById = (cafeId) => {
    return get(`/cafes/${cafeId}`);
};

/**
 * 获取咖啡店统计信息
 * @param {string} cafeId - 咖啡店ID
 */
export const getCafeStats = (cafeId) => {
    return get(`/cafes/${cafeId}/stats`);
};

/**
 * 创建新咖啡店
 * @param {Object} cafeData - 咖啡店数据
 * @param {File[]} images - 图片文件数组（可选）
 */
export const createCafe = (cafeData, images = []) => {
    if (images && images.length > 0) {
        // 有图片，使用 FormData
        return uploadFile('/cafes', images, 'images', cafeData);
    } else {
        // 无图片，直接发送 JSON
        return post('/cafes', cafeData);
    }
};

/**
 * 更新咖啡店信息
 * @param {string} cafeId - 咖啡店ID
 * @param {Object} updateData - 更新的数据
 */
export const updateCafe = (cafeId, updateData) => {
    return put(`/cafes/${cafeId}`, updateData);
};

/**
 * 删除咖啡店
 * @param {string} cafeId - 咖啡店ID
 */
export const deleteCafe = (cafeId) => {
    return del(`/cafes/${cafeId}`);
};

/**
 * 添加咖啡店到收藏
 * @param {string} cafeId - 咖啡店ID
 */
export const addToFavorites = (cafeId) => {
    return post(`/cafes/${cafeId}/favorite`);
};

/**
 * 从收藏中移除咖啡店
 * @param {string} cafeId - 咖啡店ID
 */
export const removeFromFavorites = (cafeId) => {
    return del(`/cafes/${cafeId}/favorite`);
};

// ============================================
// 评论 API（嵌套在咖啡店下）
// ============================================

/**
 * 获取咖啡店的所有评论
 * @param {string} cafeId - 咖啡店ID
 * @param {Object} params
 * @param {number} params.page - 页码
 * @param {number} params.limit - 每页数量
 * @param {string} params.sort - 排序方式
 */
export const getReviews = (cafeId, params = {}) => {
    return get(`/cafes/${cafeId}/reviews`, { params });
};

/**
 * 获取最有帮助的评论
 * @param {string} cafeId - 咖啡店ID
 * @param {number} limit - 返回数量
 */
export const getMostHelpfulReviews = (cafeId, limit = 5) => {
    return get(`/cafes/${cafeId}/reviews/helpful`, { params: { limit } });
};

/**
 * 获取评论情感统计
 * @param {string} cafeId - 咖啡店ID
 */
export const getReviewSentimentStats = (cafeId) => {
    return get(`/cafes/${cafeId}/reviews/sentiment`);
};

/**
 * 创建评论
 * @param {string} cafeId - 咖啡店ID
 * @param {Object} reviewData - 评论数据
 * @param {string} reviewData.content - 评论内容
 * @param {number} reviewData.rating - 评分（1-5）
 * @param {Object} reviewData.detailedRatings - 详细评分（可选）
 * @param {Date} reviewData.visitDate - 访问日期（可选）
 * @param {File[]} images - 评论图片（可选）
 */
export const createReview = (cafeId, reviewData, images = []) => {
    if (images && images.length > 0) {
        // 有图片，使用 FormData
        return uploadFile(`/cafes/${cafeId}/reviews`, images, 'images', reviewData);
    } else {
        // 无图片，直接发送 JSON
        return post(`/cafes/${cafeId}/reviews`, reviewData);
    }
};

// ============================================
// 评论 API（独立路由）
// ============================================

/**
 * 获取单个评论
 * @param {string} reviewId - 评论ID
 */
export const getReviewById = (reviewId) => {
    return get(`/reviews/${reviewId}`);
};

/**
 * 更新评论
 * @param {string} reviewId - 评论ID
 * @param {Object} updateData - 更新的数据
 */
export const updateReview = (reviewId, updateData) => {
    return put(`/reviews/${reviewId}`, updateData);
};

/**
 * 删除评论
 * @param {string} reviewId - 评论ID
 */
export const deleteReview = (reviewId) => {
    return del(`/reviews/${reviewId}`);
};

/**
 * 投票评论是否有帮助
 * @param {string} reviewId - 评论ID
 * @param {string} voteType - 投票类型：'helpful' 或 'not-helpful'
 */
export const voteReviewHelpful = (reviewId, voteType) => {
    return post(`/reviews/${reviewId}/helpful`, { voteType });
};

/**
 * 取消评论投票
 * @param {string} reviewId - 评论ID
 */
export const removeReviewVote = (reviewId) => {
    return del(`/reviews/${reviewId}/helpful`);
};

/**
 * 举报评论
 * @param {string} reviewId - 评论ID
 * @param {string} reason - 举报原因（可选）
 */
export const reportReview = (reviewId, reason = '') => {
    return post(`/reviews/${reviewId}/report`, { reason });
};

/**
 * 添加店主回复
 * @param {string} reviewId - 评论ID
 * @param {string} content - 回复内容
 */
export const addOwnerResponse = (reviewId, content) => {
    return post(`/reviews/${reviewId}/response`, { content });
};

/**
 * 触发AI分析
 * @param {string} reviewId - 评论ID
 */
export const analyzeReview = (reviewId) => {
    return post(`/reviews/${reviewId}/analyze`);
};

// ============================================
// 便捷的组合方法
// ============================================

/**
 * 获取咖啡店完整信息（包含统计和评论）
 * @param {string} cafeId - 咖啡店ID
 */
export const getCafeFullInfo = async (cafeId) => {
    try {
        const [cafe, stats, reviews, sentiment] = await Promise.all([
            getCafeById(cafeId),
            getCafeStats(cafeId).catch(() => null),
            getReviews(cafeId, { limit: 10 }).catch(() => null),
            getReviewSentimentStats(cafeId).catch(() => null)
        ]);

        return {
            ...cafe,
            stats: stats?.data || null,
            recentReviews: reviews?.data || [],
            sentiment: sentiment?.data || null
        };
    } catch (error) {
        throw error;
    }
};

/**
 * 获取用户附近的推荐咖啡店
 * @param {Object} location
 * @param {number} location.lng - 经度
 * @param {number} location.lat - 纬度
 */
export const getRecommendedCafes = async (location) => {
    try {
        const [nearby, topRated] = await Promise.all([
            getNearbyCafes({
                lng: location.lng,
                lat: location.lat,
                distance: 5000,
                limit: 10
            }).catch(() => ({ data: [] })),
            getTopRatedCafes({ limit: 10 }).catch(() => ({ data: [] }))
        ]);

        return {
            nearby: nearby.data || [],
            topRated: topRated.data || []
        };
    } catch (error) {
        throw error;
    }
};

/**
 * 搜索并过滤咖啡店
 * @param {Object} filters - 过滤条件
 */
export const searchAndFilterCafes = (filters) => {
    const { query, city, minRating, maxPrice, amenities, page = 1, limit = 20 } = filters;

    if (query) {
        // 如果有搜索关键词，使用搜索API
        return searchCafes({
            q: query,
            city,
            minRating,
            maxPrice,
            amenities,
            limit
        });
    } else {
        // 否则使用普通获取API
        return getCafes({
            city,
            minRating,
            maxPrice,
            amenities,
            page,
            limit,
            sort: '-rating'
        });
    }
};

/**
 * 切换收藏状态
 * @param {string} cafeId - 咖啡店ID
 * @param {boolean} isFavorited - 当前是否已收藏
 */
export const toggleFavorite = async (cafeId, isFavorited) => {
    try {
        if (isFavorited) {
            await removeFromFavorites(cafeId);
            return false;
        } else {
            await addToFavorites(cafeId);
            return true;
        }
    } catch (error) {
        throw error;
    }
};

// ============================================
// 导出所有API方法
// ============================================
export default {
    // Cafe APIs
    getCafes,
    getNearbyCafes,
    getTopRatedCafes,
    searchCafes,
    getCafesByAmenities,
    getCafeById,
    getCafeStats,
    createCafe,
    updateCafe,
    deleteCafe,
    addToFavorites,
    removeFromFavorites,
    
    // Review APIs (nested)
    getReviews,
    getMostHelpfulReviews,
    getReviewSentimentStats,
    createReview,
    
    // Review APIs (standalone)
    getReviewById,
    updateReview,
    deleteReview,
    voteReviewHelpful,
    removeReviewVote,
    reportReview,
    addOwnerResponse,
    analyzeReview,
    
    // Combined methods
    getCafeFullInfo,
    getRecommendedCafes,
    searchAndFilterCafes,
    toggleFavorite
};