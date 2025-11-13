// ============================================
// SipSpot Frontend - Register Page
// 用户注册页面
// ============================================

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Register = () => {
    const navigate = useNavigate();
    const { register } = useAuth();
    
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    
    const [errors, setErrors] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [serverError, setServerError] = useState('');

    // 表单验证
    const validateForm = () => {
        const newErrors = {};
        
        // 用户名验证
        if (!formData.username.trim()) {
            newErrors.username = '请输入用户名';
        } else if (formData.username.length < 3) {
            newErrors.username = '用户名至少3个字符';
        } else if (formData.username.length > 30) {
            newErrors.username = '用户名最多30个字符';
        }
        
        // 邮箱验证
        if (!formData.email.trim()) {
            newErrors.email = '请输入邮箱';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = '请输入有效的邮箱地址';
        }
        
        // 密码验证
        if (!formData.password) {
            newErrors.password = '请输入密码';
        } else if (formData.password.length < 6) {
            newErrors.password = '密码至少6个字符';
        }
        
        // 确认密码验证
        if (!formData.confirmPassword) {
            newErrors.confirmPassword = '请确认密码';
        } else if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = '两次密码不一致';
        }
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // 处理输入变化
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        
        // 清除该字段的错误
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
        setServerError('');
    };

    // 处理表单提交
    const handleSubmit = async (e) => {
        e.preventDefault();
        setServerError('');
        
        if (!validateForm()) {
            return;
        }
        
        setIsLoading(true);
        
        try {
            await register({
                username: formData.username.trim(),
                email: formData.email.trim().toLowerCase(),
                password: formData.password
            });
            
            // 注册成功,导航到首页
            navigate('/');
        } catch (error) {
            console.error('注册失败:', error);
            setServerError(
                error.response?.data?.message || 
                error.message || 
                '注册失败,请稍后再试'
            );
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-amber-50 via-orange-50 to-amber-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full">
                {/* Logo 和标题 */}
                <div className="text-center mb-8">
                    <div className="flex justify-center mb-4">
                        <div className="w-16 h-16 bg-linear-to-br from-amber-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg">
                            <span className="text-4xl">☕</span>
                        </div>
                    </div>
                    <h2 className="text-3xl font-bold text-gray-900 mb-2">
                        创建账户
                    </h2>
                    <p className="text-gray-600">
                        加入 SipSpot,发现更多精彩咖啡店
                    </p>
                </div>

                {/* 注册表单卡片 */}
                <div className="bg-white rounded-2xl shadow-xl p-8">
                    {/* 服务器错误提示 */}
                    {serverError && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
                            <svg
                                className="w-5 h-5 text-red-500 mt-0.5 mr-3 shrink-0"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                            >
                                <path
                                    fillRule="evenodd"
                                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                                    clipRule="evenodd"
                                />
                            </svg>
                            <div>
                                <p className="text-sm text-red-800 font-medium">
                                    {serverError}
                                </p>
                            </div>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* 用户名输入 */}
                        <div>
                            <label 
                                htmlFor="username" 
                                className="block text-sm font-medium text-gray-700 mb-2"
                            >
                                用户名
                            </label>
                            <input
                                id="username"
                                name="username"
                                type="text"
                                autoComplete="username"
                                value={formData.username}
                                onChange={handleChange}
                                className={`
                                    w-full px-4 py-3 rounded-lg border
                                    ${errors.username 
                                        ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                                        : 'border-gray-300 focus:ring-amber-500 focus:border-amber-500'
                                    }
                                    focus:outline-none focus:ring-2
                                    transition-colors
                                `}
                                placeholder="输入用户名"
                            />
                            {errors.username && (
                                <p className="mt-2 text-sm text-red-600">
                                    {errors.username}
                                </p>
                            )}
                        </div>

                        {/* 邮箱输入 */}
                        <div>
                            <label 
                                htmlFor="email" 
                                className="block text-sm font-medium text-gray-700 mb-2"
                            >
                                邮箱地址
                            </label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                autoComplete="email"
                                value={formData.email}
                                onChange={handleChange}
                                className={`
                                    w-full px-4 py-3 rounded-lg border
                                    ${errors.email 
                                        ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                                        : 'border-gray-300 focus:ring-amber-500 focus:border-amber-500'
                                    }
                                    focus:outline-none focus:ring-2
                                    transition-colors
                                `}
                                placeholder="your@email.com"
                            />
                            {errors.email && (
                                <p className="mt-2 text-sm text-red-600">
                                    {errors.email}
                                </p>
                            )}
                        </div>

                        {/* 密码输入 */}
                        <div>
                            <label 
                                htmlFor="password" 
                                className="block text-sm font-medium text-gray-700 mb-2"
                            >
                                密码
                            </label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                autoComplete="new-password"
                                value={formData.password}
                                onChange={handleChange}
                                className={`
                                    w-full px-4 py-3 rounded-lg border
                                    ${errors.password 
                                        ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                                        : 'border-gray-300 focus:ring-amber-500 focus:border-amber-500'
                                    }
                                    focus:outline-none focus:ring-2
                                    transition-colors
                                `}
                                placeholder="至少6个字符"
                            />
                            {errors.password && (
                                <p className="mt-2 text-sm text-red-600">
                                    {errors.password}
                                </p>
                            )}
                        </div>

                        {/* 确认密码输入 */}
                        <div>
                            <label 
                                htmlFor="confirmPassword" 
                                className="block text-sm font-medium text-gray-700 mb-2"
                            >
                                确认密码
                            </label>
                            <input
                                id="confirmPassword"
                                name="confirmPassword"
                                type="password"
                                autoComplete="new-password"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                className={`
                                    w-full px-4 py-3 rounded-lg border
                                    ${errors.confirmPassword 
                                        ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                                        : 'border-gray-300 focus:ring-amber-500 focus:border-amber-500'
                                    }
                                    focus:outline-none focus:ring-2
                                    transition-colors
                                `}
                                placeholder="再次输入密码"
                            />
                            {errors.confirmPassword && (
                                <p className="mt-2 text-sm text-red-600">
                                    {errors.confirmPassword}
                                </p>
                            )}
                        </div>

                        {/* 注册按钮 */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className={`
                                w-full py-3 px-4 rounded-lg font-medium text-white
                                bg-linear-to-r from-amber-500 to-orange-600
                                hover:from-amber-600 hover:to-orange-700
                                focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500
                                transition-all duration-200
                                disabled:opacity-50 disabled:cursor-not-allowed
                                shadow-lg hover:shadow-xl
                            `}
                        >
                            {isLoading ? (
                                <span className="flex items-center justify-center">
                                    <svg
                                        className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                    >
                                        <circle
                                            className="opacity-25"
                                            cx="12"
                                            cy="12"
                                            r="10"
                                            stroke="currentColor"
                                            strokeWidth="4"
                                        />
                                        <path
                                            className="opacity-75"
                                            fill="currentColor"
                                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                        />
                                    </svg>
                                    注册中...
                                </span>
                            ) : (
                                '创建账户'
                            )}
                        </button>

                        {/* 服务条款 */}
                        <p className="text-xs text-center text-gray-500 mt-4">
                            注册即表示您同意我们的
                            <a href="/terms" className="text-amber-600 hover:text-amber-700 ml-1">
                                服务条款
                            </a>
                            {' '}和{' '}
                            <a href="/privacy" className="text-amber-600 hover:text-amber-700">
                                隐私政策
                            </a>
                        </p>
                    </form>
                </div>

                {/* 已有账户提示 */}
                <div className="mt-6 text-center">
                    <p className="text-gray-600">
                        已有账户?{' '}
                        <Link
                            to="/login"
                            className="font-medium text-amber-600 hover:text-amber-700 transition-colors"
                        >
                            立即登录
                        </Link>
                    </p>
                </div>

                {/* 社交注册(可选功能) */}
                <div className="mt-8">
                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-300" />
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-4 bg-amber-50 text-gray-500">
                                或使用社交账户注册
                            </span>
                        </div>
                    </div>

                    <div className="mt-6 grid grid-cols-2 gap-4">
                        <button
                            type="button"
                            className="w-full inline-flex justify-center items-center py-3 px-4 rounded-lg border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition-colors"
                        >
                            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                                <path
                                    fill="currentColor"
                                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                />
                                <path
                                    fill="currentColor"
                                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                />
                                <path
                                    fill="currentColor"
                                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                />
                                <path
                                    fill="currentColor"
                                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                />
                            </svg>
                            Google
                        </button>

                        <button
                            type="button"
                            className="w-full inline-flex justify-center items-center py-3 px-4 rounded-lg border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition-colors"
                        >
                            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                            </svg>
                            GitHub
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Register;