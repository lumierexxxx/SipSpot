// ============================================
// SipSpot Frontend - API 服务配置
// Axios 配置、拦截器、错误处理
// ============================================

import axios from 'axios';

// ============================================
// 基础配置
// ============================================
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api';

// 创建 axios 实例
const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 15000,
    headers: {
        'Content-Type': 'application/json'
    },
    withCredentials: true // 允许跨域携带cookie
});

// ============================================
// 请求拦截器 - 自动添加 token
// ============================================
api.interceptors.request.use(
    (config) => {
        // 从 localStorage 获取 token
        const token = localStorage.getItem('token');
        
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        
        // 开发环境下打印请求信息
        if (import.meta.env.DEV) {
            console.log('📤 API Request:', {
                method: config.method?.toUpperCase(),
                url: config.url,
                data: config.data
            });
        }
        
        return config;
    },
    (error) => {
        console.error('❌ Request Error:', error);
        return Promise.reject(error);
    }
);

// ============================================
// 响应拦截器 - 统一处理响应和错误
// ============================================
api.interceptors.response.use(
    (response) => {
        // 开发环境下打印响应信息
        if (import.meta.env.DEV) {
            console.log('📥 API Response:', {
                status: response.status,
                url: response.config.url,
                data: response.data
            });
        }
        
        return response.data; // 直接返回 data 部分
    },
    (error) => {
        // 统一错误处理
        const errorMessage = handleApiError(error);
        
        console.error('❌ API Error:', {
            url: error.config?.url,
            status: error.response?.status,
            message: errorMessage
        });
        
        // Token 过期处理
        if (error.response?.status === 401) {
            // 清除本地存储的认证信息
            localStorage.removeItem('token');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('user');
            
            // 如果不是登录页面，跳转到登录页
            if (!window.location.pathname.includes('/login')) {
                window.location.href = '/login?expired=true';
            }
        }
        
        // 返回格式化的错误
        return Promise.reject({
            message: errorMessage,
            status: error.response?.status,
            data: error.response?.data
        });
    }
);

// ============================================
// 错误处理函数
// ============================================
function handleApiError(error) {
    if (error.response) {
        // 服务器返回了错误响应
        const { status, data } = error.response;
        
        // 处理不同的错误状态码
        switch (status) {
            case 400:
                return data.message || '请求参数错误';
            case 401:
                return data.message || '请先登录';
            case 403:
                return data.message || '您没有权限访问此资源';
            case 404:
                return data.message || '请求的资源不存在';
            case 409:
                return data.message || '资源已存在';
            case 429:
                return data.message || '请求过于频繁，请稍后再试';
            case 500:
                return data.message || '服务器内部错误';
            default:
                return data.message || `请求失败 (${status})`;
        }
    } else if (error.request) {
        // 请求已发送但没有收到响应
        return '网络连接失败，请检查您的网络';
    } else {
        // 请求配置出错
        return error.message || '请求配置错误';
    }
}

// ============================================
// Token 管理工具函数
// ============================================

/**
 * 设置认证 token
 */
export const setAuthToken = (token) => {
    if (token) {
        localStorage.setItem('token', token);
    } else {
        localStorage.removeItem('token');
    }
};

/**
 * 获取认证 token
 */
export const getAuthToken = () => {
    return localStorage.getItem('token');
};

/**
 * 设置刷新 token
 */
export const setRefreshToken = (refreshToken) => {
    if (refreshToken) {
        localStorage.setItem('refreshToken', refreshToken);
    } else {
        localStorage.removeItem('refreshToken');
    }
};

/**
 * 获取刷新 token
 */
export const getRefreshToken = () => {
    return localStorage.getItem('refreshToken');
};

/**
 * 刷新 token
 */
export const refreshAccessToken = async () => {
    try {
        const refreshToken = getRefreshToken();
        
        if (!refreshToken) {
            throw new Error('No refresh token available');
        }
        
        const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refreshToken
        });
        
        const { token } = response.data;
        setAuthToken(token);
        
        return token;
    } catch (error) {
        // 刷新失败，清除所有认证信息
        setAuthToken(null);
        setRefreshToken(null);
        localStorage.removeItem('user');
        throw error;
    }
};

/**
 * 清除所有认证信息
 */
export const clearAuth = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
};

// ============================================
// 用户信息管理
// ============================================

/**
 * 设置用户信息
 */
export const setUser = (user) => {
    if (user) {
        localStorage.setItem('user', JSON.stringify(user));
    } else {
        localStorage.removeItem('user');
    }
};

/**
 * 获取用户信息
 */
export const getUser = () => {
    const userStr = localStorage.getItem('user');
    try {
        return userStr ? JSON.parse(userStr) : null;
    } catch (error) {
        console.error('Error parsing user data:', error);
        return null;
    }
};

/**
 * 检查是否已登录
 */
export const isAuthenticated = () => {
    return !!getAuthToken();
};

// ============================================
// 便捷的 API 调用方法
// ============================================

/**
 * GET 请求
 */
export const get = (url, config = {}) => {
    return api.get(url, config);
};

/**
 * POST 请求
 */
export const post = (url, data = {}, config = {}) => {
    return api.post(url, data, config);
};

/**
 * PUT 请求
 */
export const put = (url, data = {}, config = {}) => {
    return api.put(url, data, config);
};

/**
 * PATCH 请求
 */
export const patch = (url, data = {}, config = {}) => {
    return api.patch(url, data, config);
};

/**
 * DELETE 请求
 */
export const del = (url, config = {}) => {
    return api.delete(url, config);
};

/**
 * 上传文件（支持多文件）
 */
export const uploadFile = (url, files, fieldName = 'images', additionalData = {}) => {
    const formData = new FormData();
    
    // 添加文件
    if (Array.isArray(files)) {
        files.forEach(file => {
            formData.append(fieldName, file);
        });
    } else {
        formData.append(fieldName, files);
    }
    
    // 添加其他数据
    Object.keys(additionalData).forEach(key => {
        const value = additionalData[key];
        if (value !== undefined && value !== null) {
            if (typeof value === 'object' && !Array.isArray(value)) {
                formData.append(key, JSON.stringify(value));
            } else if (Array.isArray(value)) {
                formData.append(key, JSON.stringify(value));
            } else {
                formData.append(key, value);
            }
        }
    });
    
    return api.post(url, formData, {
        headers: {
            'Content-Type': 'multipart/form-data'
        }
    });
};

/**
 * 下载文件
 */
export const downloadFile = async (url, filename) => {
    try {
        const response = await api.get(url, {
            responseType: 'blob'
        });
        
        // 创建下载链接
        const blob = new Blob([response]);
        const downloadUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(downloadUrl);
        
        return true;
    } catch (error) {
        console.error('File download failed:', error);
        throw error;
    }
};

// ============================================
// 导出
// ============================================
export default api;