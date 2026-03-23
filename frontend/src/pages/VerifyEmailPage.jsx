// ============================================
// SipSpot Frontend - Verify Email Page
// 邮箱验证页面：自动验证 token 并显示结果
// 也处理已登录用户重发验证邮件的操作
// ============================================

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { get } from '@services/api';
import { resendVerificationEmail } from '@services/authAPI';
import { useAuth } from '@contexts/AuthContext';

const VerifyEmailPage = () => {
    const { token } = useParams();
    const navigate = useNavigate();
    const { isLoggedIn, refreshUser } = useAuth();

    const [status, setStatus] = useState('verifying'); // verifying | success | error
    const [errorMsg, setErrorMsg] = useState('');
    const [resendStatus, setResendStatus] = useState('idle'); // idle | loading | sent | error
    const [resendError, setResendError] = useState('');

    // ============================================
    // 自动验证 token
    // ============================================
    useEffect(() => {
        const verify = async () => {
            try {
                await get(`/auth/verify-email/${token}`);
                setStatus('success');
                // 刷新用户信息以更新 isEmailVerified 状态
                if (isLoggedIn) {
                    await refreshUser();
                }
            } catch (error) {
                setErrorMsg(error.message || '验证链接无效或已过期');
                setStatus('error');
            }
        };

        verify();
    }, [token]);

    // ============================================
    // 重新发送验证邮件
    // ============================================
    const handleResend = async () => {
        if (!isLoggedIn) {
            navigate('/login?redirect=/profile');
            return;
        }

        try {
            setResendStatus('loading');
            setResendError('');
            await resendVerificationEmail();
            setResendStatus('sent');
        } catch (error) {
            setResendError(error.message || '发送失败，请稍后重试');
            setResendStatus('error');
        }
    };

    // ============================================
    // 渲染
    // ============================================
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
                    <h2 className="text-3xl font-bold text-gray-900 mb-2">邮箱验证</h2>
                </div>

                <div className="bg-white rounded-2xl shadow-xl p-8">
                    {/* 验证中 */}
                    {status === 'verifying' && (
                        <div className="text-center py-8">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto mb-4" />
                            <p className="text-gray-600">正在验证你的邮箱...</p>
                        </div>
                    )}

                    {/* 验证成功 */}
                    {status === 'success' && (
                        <div className="text-center py-4">
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">邮箱验证成功！</h3>
                            <p className="text-gray-600 mb-6">
                                你的邮箱已通过验证，现在可以使用 SipSpot 的全部功能了。
                            </p>
                            {isLoggedIn ? (
                                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                                    <button
                                        onClick={() => navigate('/')}
                                        className="btn btn-primary px-6 py-2.5"
                                    >
                                        探索咖啡馆
                                    </button>
                                    <button
                                        onClick={() => navigate('/profile')}
                                        className="btn btn-outline px-6 py-2.5"
                                    >
                                        查看个人资料
                                    </button>
                                </div>
                            ) : (
                                <button
                                    onClick={() => navigate('/login')}
                                    className="btn btn-primary px-8 py-2.5"
                                >
                                    前往登录
                                </button>
                            )}
                        </div>
                    )}

                    {/* 验证失败 */}
                    {status === 'error' && (
                        <div className="text-center py-4">
                            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">验证失败</h3>
                            <p className="text-gray-600 mb-2">{errorMsg}</p>
                            <p className="text-sm text-gray-500 mb-6">
                                验证链接可能已过期（有效期 24 小时），请重新发送验证邮件。
                            </p>

                            {/* 重发按钮 */}
                            {resendStatus === 'sent' ? (
                                <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                                    <p className="text-sm text-green-800">验证邮件已重新发送，请查收收件箱。</p>
                                </div>
                            ) : (
                                <div>
                                    <button
                                        onClick={handleResend}
                                        disabled={resendStatus === 'loading'}
                                        className="btn btn-primary px-6 py-2.5 mb-3"
                                    >
                                        {resendStatus === 'loading' ? (
                                            <div className="flex items-center">
                                                <div className="spinner w-4 h-4 mr-2" />
                                                发送中...
                                            </div>
                                        ) : (
                                            '重新发送验证邮件'
                                        )}
                                    </button>
                                    {resendError && (
                                        <p className="text-sm text-red-600 mt-2">{resendError}</p>
                                    )}
                                    {!isLoggedIn && (
                                        <p className="text-xs text-gray-500 mt-2">
                                            需要先登录才能重新发送
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="text-center mt-6">
                    <a href="/" className="text-sm text-gray-500 hover:text-gray-700">
                        返回首页
                    </a>
                </div>
            </div>
        </div>
    );
};

export default VerifyEmailPage;
