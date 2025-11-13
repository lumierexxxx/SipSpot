// ============================================
// SipSpot Frontend - Login Page
// 登录页面
// ============================================

import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@contexts/AuthContext';
import { validateLoginData } from '@services/authAPI';

const Login = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { login } = useAuth();

    const [formData, setFormData] = useState({
        identifier: '',
        password: ''
    });

    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    // 获取重定向URL
    const redirectUrl = searchParams.get('redirect') || '/';
    const expired = searchParams.get('expired');

    // ============================================
    // 处理输入变化
    // ============================================
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        
        // 清除对应字段的错误
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    // ============================================
    // 处理提交
    // ============================================
    const handleSubmit = async (e) => {
        e.preventDefault();

        // 前端验证
        const validation = validateLoginData(formData);
        if (!validation.isValid) {
            setErrors(validation.errors);
            return;
        }

        try {
            setLoading(true);
            setErrors({});

            const result = await login(formData);

            if (result.success) {
                // 登录成功，跳转
                navigate(redirectUrl);
            } else {
                setErrors({ submit: result.message || '登录失败' });
            }
        } catch (error) {
            setErrors({ submit: error.message || '登录失败，请重试' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-amber-50 via-orange-50 to-yellow-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full">
                {/* Logo 和标题 */}
                <div className="text-center mb-8">
                    <a href="/" className="inline-flex items-center justify-center mb-6">
                        <div className="w-16 h-16 bg-linear-to-br from-amber-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg">
                            <span className="text-4xl">☕</span>
                        </div>
                    </a>
                    <h2 className="text-3xl font-bold text-gray-900 mb-2">
                        欢迎回来
                    </h2>
                    <p className="text-gray-600">
                        登录到你的 SipSpot 账户
                    </p>
                </div>

                {/* Token 过期提示 */}
                {expired && (
                    <div className="mb-4 bg-amber-50 border border-amber-200 rounded-lg p-4">
                        <p className="text-sm text-amber-800">
                            ⏱️ 登录已过期，请重新登录
                        </p>
                    </div>
                )}

                {/* 登录表单 */}
                <div className="bg-white rounded-2xl shadow-xl p-8">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* 邮箱/用户名 */}
                        <div>
                            <label htmlFor="identifier" className="block text-sm font-medium text-gray-700 mb-2">
                                邮箱或用户名
                            </label>
                            <input
                                id="identifier"
                                name="identifier"
                                type="text"
                                autoComplete="username"
                                required
                                value={formData.identifier}
                                onChange={handleChange}
                                className={`input ${errors.identifier ? 'input-error' : ''}`}
                                placeholder="your@email.com 或 username"
                            />
                            {errors.identifier && (
                                <p className="mt-1 text-sm text-red-600">{errors.identifier}</p>
                            )}
                        </div>

                        {/* 密码 */}
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                                密码
                            </label>
                            <div className="relative">
                                <input
                                    id="password"
                                    name="password"
                                    type={showPassword ? 'text' : 'password'}
                                    autoComplete="current-password"
                                    required
                                    value={formData.password}
                                    onChange={handleChange}
                                    className={`input ${errors.password ? 'input-error' : ''}`}
                                    placeholder="请输入密码"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    {showPassword ? (
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                        </svg>
                                    ) : (
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                        </svg>
                                    )}
                                </button>
                            </div>
                            {errors.password && (
                                <p className="mt-1 text-sm text-red-600">{errors.password}</p>
                            )}
                        </div>

                        {/* 记住我和忘记密码 */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <input
                                    id="remember"
                                    name="remember"
                                    type="checkbox"
                                    className="h-4 w-4 text-amber-600 focus:ring-amber-500 border-gray-300 rounded"
                                />
                                <label htmlFor="remember" className="ml-2 block text-sm text-gray-700">
                                    记住我
                                </label>
                            </div>

                            <a href="/forgot-password" className="text-sm text-amber-600 hover:text-amber-700">
                                忘记密码？
                            </a>
                        </div>

                        {/* 提交错误 */}
                        {errors.submit && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                                <p className="text-sm text-red-800">{errors.submit}</p>
                            </div>
                        )}

                        {/* 提交按钮 */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full btn btn-primary py-3 text-lg"
                        >
                            {loading ? (
                                <div className="flex items-center justify-center">
                                    <div className="spinner w-5 h-5 mr-2" />
                                    登录中...
                                </div>
                            ) : (
                                '登录'
                            )}
                        </button>
                    </form>

                    {/* 分隔线 */}
                    <div className="mt-6">
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-300" />
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-2 bg-white text-gray-500">
                                    还没有账户？
                                </span>
                            </div>
                        </div>

                        <div className="mt-6">
                            <a
                                href="/register"
                                className="w-full btn btn-outline py-3 text-center block"
                            >
                                立即注册
                            </a>
                        </div>
                    </div>
                </div>

                {/* 返回首页 */}
                <div className="text-center mt-6">
                    <a href="/" className="text-sm text-gray-600 hover:text-gray-900">
                        ← 返回首页
                    </a>
                </div>
            </div>
        </div>
    );
};

export default Login;