// ============================================
// SipSpot Frontend - Auth API
// 用户认证和个人资料相关的所有API调用
// ============================================

import { get, post, put, uploadFile } from './api';
import { 
    setAuthToken, 
    setRefreshToken, 
    setUser, 
    clearAuth,
    getRefreshToken,
    refreshAccessToken 
} from './api';

// ============================================
// 认证 API
// ============================================

/**
 * 用户注册
 * @param {Object} userData
 * @param {string} userData.username - 用户名
 * @param {string} userData.email - 邮箱
 * @param {string} userData.password - 密码
 */
export const register = async (userData) => {
    try {
        const response = await post('/auth/register', userData);
        
        // 保存认证信息
        if (response.success) {
            setAuthToken(response.token);
            setRefreshToken(response.refreshToken);
            setUser(response.user);
        }
        
        return response;
    } catch (error) {
        throw error;
    }
};

/**
 * 用户登录
 * @param {Object} credentials
 * @param {string} credentials.identifier - 邮箱或用户名
 * @param {string} credentials.password - 密码
 */
export const login = async (credentials) => {
    try {
        const response = await post('/auth/login', credentials);
        
        // 保存认证信息
        if (response.success) {
            setAuthToken(response.token);
            setRefreshToken(response.refreshToken);
            setUser(response.user);
        }
        
        return response;
    } catch (error) {
        throw error;
    }
};

/**
 * 用户登出
 */
export const logout = async () => {
    try {
        await post('/auth/logout');
    } catch (error) {
        console.error('Logout API error:', error);
        // 即使API调用失败也要清除本地数据
    } finally {
        clearAuth();
    }
};

/**
 * 获取当前用户信息
 */
export const getCurrentUser = async () => {
    try {
        const response = await get('/auth/me');
        
        // 更新本地存储的用户信息
        if (response.success && response.data) {
            setUser(response.data);
        }
        
        return response;
    } catch (error) {
        throw error;
    }
};

/**
 * 更新用户资料
 * @param {Object} updateData
 * @param {string} updateData.username - 用户名
 * @param {string} updateData.email - 邮箱
 * @param {string} updateData.avatar - 头像URL
 * @param {string} updateData.bio - 个人简介
 */
export const updateProfile = async (updateData) => {
    try {
        const response = await put('/auth/me', updateData);
        
        // 更新本地存储的用户信息
        if (response.success && response.data) {
            setUser(response.data);
        }
        
        return response;
    } catch (error) {
        throw error;
    }
};

/**
 * 修改密码
 * @param {Object} passwordData
 * @param {string} passwordData.currentPassword - 当前密码
 * @param {string} passwordData.newPassword - 新密码
 */
export const updatePassword = async (passwordData) => {
    try {
        const response = await put('/auth/password', passwordData);
        
        // 更新token
        if (response.success && response.token) {
            setAuthToken(response.token);
        }
        
        return response;
    } catch (error) {
        throw error;
    }
};

/**
 * 请求密码重置
 * @param {string} email - 邮箱地址
 */
export const forgotPassword = async (email) => {
    try {
        const response = await post('/auth/forgot-password', { email });
        return response;
    } catch (error) {
        throw error;
    }
};

/**
 * 重置密码
 * @param {string} token - 重置token
 * @param {string} password - 新密码
 */
export const resetPassword = async (token, password) => {
    try {
        const response = await put(`/auth/reset-password/${token}`, { password });
        
        // 保存新的认证信息
        if (response.success && response.token) {
            setAuthToken(response.token);
        }
        
        return response;
    } catch (error) {
        throw error;
    }
};

/**
 * 刷新访问令牌
 */
export const refreshToken = async () => {
    try {
        const refreshTokenValue = getRefreshToken();
        
        if (!refreshTokenValue) {
            throw new Error('No refresh token available');
        }
        
        const response = await post('/auth/refresh', { 
            refreshToken: refreshTokenValue 
        });
        
        // 更新token
        if (response.success && response.token) {
            setAuthToken(response.token);
        }
        
        return response;
    } catch (error) {
        // 刷新失败，清除所有认证信息
        clearAuth();
        throw error;
    }
};

/**
 * 上传用户头像
 * @param {File} avatarFile - 头像文件
 */
export const uploadAvatar = async (avatarFile) => {
    try {
        // 注意：这个功能需要后端支持，如果没有对应路由，需要通过updateProfile实现
        const response = await uploadFile('/auth/avatar', avatarFile, 'avatar');
        
        // 更新本地用户信息
        if (response.success && response.data) {
            setUser(response.data);
        }
        
        return response;
    } catch (error) {
        throw error;
    }
};

// ============================================
// 用户扩展功能（已迁移到 usersAPI.js）
// 以下函数保留以保持向后兼容，但已标记为废弃
// 建议使用新的 usersAPI.js 中的对应函数
// ============================================

/**
 * 获取用户的收藏列表
 * @deprecated 此函数已迁移到 usersAPI.js
 * 请使用：import { getFavorites } from './usersAPI';
 * @param {Object} params
 * @param {number} params.page - 页码
 * @param {number} params.limit - 每页数量
 */
export const getUserFavorites = async (params = {}) => {
    try {
        // 调用新端点以保持向后兼容
        const response = await get('/users/me/favorites', { params });
        return response;
    } catch (error) {
        throw error;
    }
};

/**
 * 获取用户访问过的咖啡店
 * @deprecated 此函数已迁移到 usersAPI.js
 * 请使用：import { getVisitedCafes } from './usersAPI';
 */
export const getUserVisitedCafes = async (params = {}) => {
    try {
        // 调用新端点以保持向后兼容
        const response = await get('/users/me/visited', { params });
        return response;
    } catch (error) {
        throw error;
    }
};

/**
 * 获取用户创建的咖啡店
 * @deprecated 此函数已迁移到 usersAPI.js
 * 请使用：import { getMyCafes } from './usersAPI';
 * @param {Object} params
 * @param {number} params.page - 页码
 * @param {number} params.limit - 每页数量
 */
export const getUserCafes = async (params = {}) => {
    try {
        // 调用新端点以保持向后兼容
        const response = await get('/users/me/cafes', { params });
        return response;
    } catch (error) {
        throw error;
    }
};

/**
 * 获取用户的评论
 * @deprecated 此函数已迁移到 usersAPI.js
 * 请使用：import { getMyReviews } from './usersAPI';
 * @param {Object} params
 * @param {number} params.page - 页码
 * @param {number} params.limit - 每页数量
 */
export const getUserReviews = async (params = {}) => {
    try {
        // 调用新端点以保持向后兼容
        const response = await get('/users/me/reviews', { params });
        return response;
    } catch (error) {
        throw error;
    }
};

// ============================================
// 认证状态检查
// ============================================

/**
 * 检查认证状态并尝试刷新token
 * @returns {boolean} 是否已认证
 */
export const checkAuthStatus = async () => {
    try {
        // 尝试获取当前用户信息
        const response = await getCurrentUser();
        return response.success;
    } catch (error) {
        // 如果是401错误，尝试刷新token
        if (error.status === 401) {
            try {
                await refreshToken();
                // 刷新成功后再次尝试获取用户信息
                const retryResponse = await getCurrentUser();
                return retryResponse.success;
            } catch (refreshError) {
                // 刷新失败，清除认证信息
                clearAuth();
                return false;
            }
        }
        
        return false;
    }
};

// ============================================
// 表单验证辅助函数
// ============================================

/**
 * 验证注册表单数据
 */
export const validateRegistrationData = (data) => {
    const errors = {};
    
    // 用户名验证
    if (!data.username) {
        errors.username = '请输入用户名';
    } else if (data.username.length < 3) {
        errors.username = '用户名至少3个字符';
    } else if (data.username.length > 30) {
        errors.username = '用户名最多30个字符';
    } else if (!/^[a-zA-Z0-9_]+$/.test(data.username)) {
        errors.username = '用户名只能包含字母、数字和下划线';
    }
    
    // 邮箱验证
    if (!data.email) {
        errors.email = '请输入邮箱';
    } else if (!/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(data.email)) {
        errors.email = '请输入有效的邮箱地址';
    }
    
    // 密码验证
    if (!data.password) {
        errors.password = '请输入密码';
    } else if (data.password.length < 6) {
        errors.password = '密码至少6个字符';
    }
    
    return {
        isValid: Object.keys(errors).length === 0,
        errors
    };
};

/**
 * 验证登录数据
 */
export const validateLoginData = (data) => {
    const errors = {};
    
    if (!data.identifier) {
        errors.identifier = '请输入邮箱或用户名';
    }
    
    if (!data.password) {
        errors.password = '请输入密码';
    }
    
    return {
        isValid: Object.keys(errors).length === 0,
        errors
    };
};

/**
 * 验证密码强度
 * @param {string} password
 * @returns {Object} 强度信息
 */
export const checkPasswordStrength = (password) => {
    let strength = 0;
    let feedback = [];
    
    if (!password) {
        return { strength: 0, level: 'none', feedback: ['请输入密码'] };
    }
    
    // 长度检查
    if (password.length >= 6) strength += 1;
    if (password.length >= 10) strength += 1;
    
    // 包含数字
    if (/\d/.test(password)) {
        strength += 1;
    } else {
        feedback.push('添加数字可以提高强度');
    }
    
    // 包含小写字母
    if (/[a-z]/.test(password)) {
        strength += 1;
    } else {
        feedback.push('添加小写字母可以提高强度');
    }
    
    // 包含大写字母
    if (/[A-Z]/.test(password)) {
        strength += 1;
    } else {
        feedback.push('添加大写字母可以提高强度');
    }
    
    // 包含特殊字符
    if (/[^A-Za-z0-9]/.test(password)) {
        strength += 1;
    } else {
        feedback.push('添加特殊字符可以提高强度');
    }
    
    // 判断等级
    let level = 'weak';
    if (strength >= 5) level = 'strong';
    else if (strength >= 3) level = 'medium';
    
    return {
        strength,
        level,
        feedback,
        percentage: Math.min(100, (strength / 6) * 100)
    };
};

// ============================================
// 导出所有认证API方法
// ============================================
export default {
    // 基础认证
    register,
    login,
    logout,
    getCurrentUser,
    updateProfile,
    updatePassword,
    forgotPassword,
    resetPassword,
    refreshToken,
    uploadAvatar,
    
    // 用户数据（已废弃，建议使用 usersAPI.js）
    getUserFavorites,      // @deprecated
    getUserVisitedCafes,   // @deprecated
    getUserCafes,          // @deprecated
    getUserReviews,        // @deprecated
    
    // 辅助功能
    checkAuthStatus,
    validateRegistrationData,
    validateLoginData,
    checkPasswordStrength
};