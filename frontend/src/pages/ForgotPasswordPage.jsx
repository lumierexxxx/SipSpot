// ============================================
// SipSpot Frontend - Forgot Password Page
// 忘记密码页面
// ============================================

import React, { useState } from 'react';
import { forgotPassword } from '@services/authAPI';

const ForgotPasswordPage = () => {
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState('idle'); // idle | loading | success | error
    const [errorMsg, setErrorMsg] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!email.trim()) {
            setErrorMsg('请输入邮箱地址');
            return;
        }

        try {
            setStatus('loading');
            setErrorMsg('');
            await forgotPassword(email.trim());
            setStatus('success');
        } catch (error) {
            setErrorMsg(error.message || '发送失败，请稍后重试');
            setStatus('error');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full">
                {/* Logo */}
                <div className="text-center mb-8">
                    <a href="/" className="inline-flex items-center justify-center mb-6">
                        <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg">
                            <span className="text-4xl">☕</span>
                        </div>
                    </a>
                    <h2 className="text-3xl font-bold text-gray-900 mb-2">忘记密码</h2>
                    <p className="text-gray-600">输入邮箱，我们将发送重置链接</p>
                </div>

                <div className="bg-white rounded-2xl shadow-xl p-8">
                    {status === 'success' ? (
                        /* 成功状态 */
                        <div className="text-center py-4">
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">邮件已发送</h3>
                            <p className="text-gray-600 mb-2">
                                如果 <span className="font-medium text-gray-800">{email}</span> 已注册，你将收到一封包含重置链接的邮件。
                            </p>
                            <p className="text-sm text-gray-500 mb-6">链接将在 10 分钟后失效，请尽快操作。</p>
                            <button
                                onClick={() => { setStatus('idle'); setEmail(''); }}
                                className="text-sm text-amber-600 hover:text-amber-700 font-medium"
                            >
                                重新发送
                            </button>
                        </div>
                    ) : (
                        /* 表单 */
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                                    注册邮箱
                                </label>
                                <input
                                    id="email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    value={email}
                                    onChange={(e) => {
                                        setEmail(e.target.value);
                                        setErrorMsg('');
                                    }}
                                    className={`input ${errorMsg ? 'input-error' : ''}`}
                                    placeholder="your@email.com"
                                />
                                {errorMsg && (
                                    <p className="mt-1 text-sm text-red-600">{errorMsg}</p>
                                )}
                            </div>

                            <button
                                type="submit"
                                disabled={status === 'loading'}
                                className="w-full btn btn-primary py-3 text-base"
                            >
                                {status === 'loading' ? (
                                    <div className="flex items-center justify-center">
                                        <div className="spinner w-5 h-5 mr-2" />
                                        发送中...
                                    </div>
                                ) : (
                                    '发送重置链接'
                                )}
                            </button>
                        </form>
                    )}
                </div>

                <div className="text-center mt-6 space-y-2">
                    <div>
                        <a href="/login" className="text-sm text-amber-600 hover:text-amber-700 font-medium">
                            ← 返回登录
                        </a>
                    </div>
                    <div>
                        <a href="/" className="text-sm text-gray-500 hover:text-gray-700">
                            返回首页
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ForgotPasswordPage;
