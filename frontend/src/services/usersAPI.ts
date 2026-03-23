// ============================================
// SipSpot Frontend - Users API
// 用户相关的所有API调用（收藏、访问记录、用户内容等）
// ============================================

import { get, post, del } from './api';
import type { IUser, ICafe, ApiResponse } from '@/types'

// ============================================
// 收藏管理 API
// ============================================

/**
 * 获取当前用户的收藏列表
 * @param {Object} params
 * @param {number} params.page - 页码
 * @param {number} params.limit - 每页数量
 * @param {string} params.sort - 排序方式
 */
export const getFavorites = async (params: Record<string, unknown> = {}): Promise<ApiResponse<ICafe[]>> => {
    try {
        const response = await get('/users/me/favorites', { params });
        return response;
    } catch (error) {
        throw error;
    }
};

/**
 * 添加咖啡店到收藏
 * @param {string} cafeId - 咖啡店ID
 */
export const addToFavorites = async (cafeId: string): Promise<ApiResponse<{ favorites: string[] }>> => {
    try {
        const response = await post(`/users/me/favorites/${cafeId}`);
        return response;
    } catch (error) {
        throw error;
    }
};

/**
 * 从收藏中移除咖啡店
 * @param {string} cafeId - 咖啡店ID
 */
export const removeFromFavorites = async (cafeId: string): Promise<ApiResponse<{ favorites: string[] }>> => {
    try {
        const response = await del(`/users/me/favorites/${cafeId}`);
        return response;
    } catch (error) {
        throw error;
    }
};

/**
 * 检查是否收藏了某个咖啡店
 * @param {string} cafeId - 咖啡店ID
 */
export const checkFavorite = async (cafeId: string) => {
    try {
        const response = await get(`/users/me/favorites/${cafeId}/check`);
        return response;
    } catch (error) {
        throw error;
    }
};

// ============================================
// 访问记录 API
// ============================================

/**
 * 获取用户访问过的咖啡店
 * @param {Object} params
 * @param {number} params.page - 页码
 * @param {number} params.limit - 每页数量
 */
export const getVisitedCafes = async (params = {}) => {
    try {
        const response = await get('/users/me/visited', { params });
        return response;
    } catch (error) {
        throw error;
    }
};

/**
 * 记录访问咖啡店
 * @param {string} cafeId - 咖啡店ID
 */
export const markAsVisited = async (cafeId: string) => {
    try {
        const response = await post(`/users/me/visited/${cafeId}`);
        return response;
    } catch (error) {
        throw error;
    }
};

// ============================================
// 用户内容 API
// ============================================

/**
 * 获取当前用户创建的咖啡店
 * @param {Object} params
 * @param {number} params.page - 页码
 * @param {number} params.limit - 每页数量
 * @param {string} params.sort - 排序方式
 */
export const getMyCafes = async (params = {}) => {
    try {
        const response = await get('/users/me/cafes', { params });
        return response;
    } catch (error) {
        throw error;
    }
};

/**
 * 获取当前用户的所有评论
 * @param {Object} params
 * @param {number} params.page - 页码
 * @param {number} params.limit - 每页数量
 * @param {string} params.sort - 排序方式
 */
export const getMyReviews = async (params = {}) => {
    try {
        const response = await get('/users/me/reviews', { params });
        return response;
    } catch (error) {
        throw error;
    }
};

/**
 * 获取当前用户的统计数据
 */
export const getMyStats = async () => {
    try {
        const response = await get('/users/me/stats');
        return response;
    } catch (error) {
        throw error;
    }
};

// ============================================
// 其他用户资料 API
// ============================================

/**
 * 获取用户公开资料
 * @param {string} userId - 用户ID
 */
export const getUserProfile = async (userId: string): Promise<ApiResponse<IUser>> => {
    try {
        const response = await get(`/users/${userId}`);
        return response;
    } catch (error) {
        throw error;
    }
};

/**
 * 获取指定用户创建的咖啡店
 * @param {string} userId - 用户ID
 * @param {Object} params - 查询参数
 */
export const getUserCafes = async (userId: string, params: Record<string, unknown> = {}) => {
    try {
        const response = await get(`/users/${userId}/cafes`, { params });
        return response;
    } catch (error) {
        throw error;
    }
};

/**
 * 获取指定用户的所有评论
 * @param {string} userId - 用户ID
 * @param {Object} params - 查询参数
 */
export const getUserReviews = async (userId: string, params: Record<string, unknown> = {}) => {
    try {
        const response = await get(`/users/${userId}/reviews`, { params });
        return response;
    } catch (error) {
        throw error;
    }
};

// ============================================
// 收藏状态切换
// ============================================

/**
 * 切换收藏状态
 * @param {string} cafeId - 咖啡店ID
 * @param {boolean} isFavorited - 当前是否已收藏
 * @returns {Promise<boolean>} 切换后的收藏状态
 */
export const toggleFavorite = async (cafeId: string, isFavorited: boolean): Promise<boolean> => {
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
// 导出所有用户API方法
// ============================================
export default {
    // 收藏管理
    getFavorites,
    addToFavorites,
    removeFromFavorites,
    checkFavorite,
    
    // 访问记录
    getVisitedCafes,
    markAsVisited,
    
    // 用户内容
    getMyCafes,
    getMyReviews,
    getMyStats,
    
    // 其他用户
    getUserProfile,
    getUserCafes,
    getUserReviews,

    // 收藏切换
    toggleFavorite
};