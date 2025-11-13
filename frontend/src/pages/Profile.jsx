// ============================================
// SipSpot Frontend - Profile Page
// 用户个人资料页面
// ============================================

import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
    getCurrentUser,
    updateProfile,
    updatePassword,
    getUserFavorites
} from '../services/authAPI';
import CafeCard from '../components/CafeCard';

const Profile = () => {
    const navigate = useNavigate();
    const { user: authUser, logout } = useAuth();

    // 用户数据
    const [user, setUser] = useState(null);
    const [favorites, setFavorites] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // 编辑模式
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({
        username: '',
        email: '',
        bio: '',
        avatar: ''
    });
    const [editLoading, setEditLoading] = useState(false);
    const [editError, setEditError] = useState('');

    // 密码修改
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [passwordForm, setPasswordForm] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [passwordLoading, setPasswordLoading] = useState(false);
    const [passwordError, setPasswordError] = useState('');
    const [passwordSuccess, setPasswordSuccess] = useState('');

    // 选项卡
    const [activeTab, setActiveTab] = useState('overview'); // overview, favorites, reviews

    // ============================================
    // 加载用户数据
    // ============================================
    useEffect(() => {
        loadUserData();
    }, []);

    const loadUserData = async () => {
        try {
            setLoading(true);
            setError(null);

            // 获取用户完整信息
            const userResponse = await getCurrentUser();
            setUser(userResponse.data);

            // 设置编辑表单初始值
            setEditForm({
                username: userResponse.data.username || '',
                email: userResponse.data.email || '',
                bio: userResponse.data.bio || '',
                avatar: userResponse.data.avatar || ''
            });

            // 获取收藏列表
            if (userResponse.data.favorites) {
                setFavorites(userResponse.data.favorites);
            }

        } catch (err) {
            console.error('Failed to load user data:', err);
            setError(err.response?.data?.message || '加载用户信息失败');
        } finally {
            setLoading(false);
        }
    };

    // ============================================
    // 处理个人资料编辑
    // ============================================
    const handleEditChange = (e) => {
        const { name, value } = e.target;
        setEditForm(prev => ({
            ...prev,
            [name]: value
        }));
        setEditError('');
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        
        try {
            setEditLoading(true);
            setEditError('');

            const response = await updateProfile(editForm);
            setUser(response.data);
            setIsEditing(false);

            // 显示成功消息
            alert('个人资料更新成功！');
        } catch (err) {
            console.error('Update profile failed:', err);
            setEditError(err.response?.data?.message || '更新失败');
        } finally {
            setEditLoading(false);
        }
    };

    const handleCancelEdit = () => {
        setIsEditing(false);
        setEditError('');
        // 重置表单
        setEditForm({
            username: user.username || '',
            email: user.email || '',
            bio: user.bio || '',
            avatar: user.avatar || ''
        });
    };

    // ============================================
    // 处理密码修改
    // ============================================
    const handlePasswordChange = (e) => {
        const { name, value } = e.target;
        setPasswordForm(prev => ({
            ...prev,
            [name]: value
        }));
        setPasswordError('');
        setPasswordSuccess('');
    };

    const handlePasswordSubmit = async (e) => {
        e.preventDefault();

        // 验证
        if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
            setPasswordError('请填写所有字段');
            return;
        }

        if (passwordForm.newPassword.length < 6) {
            setPasswordError('新密码至少6个字符');
            return;
        }

        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            setPasswordError('两次密码输入不一致');
            return;
        }

        try {
            setPasswordLoading(true);
            setPasswordError('');

            await updatePassword({
                currentPassword: passwordForm.currentPassword,
                newPassword: passwordForm.newPassword
            });

            setPasswordSuccess('密码修改成功！');
            
            // 重置表单
            setPasswordForm({
                currentPassword: '',
                newPassword: '',
                confirmPassword: ''
            });

            // 3秒后关闭弹窗
            setTimeout(() => {
                setShowPasswordModal(false);
                setPasswordSuccess('');
            }, 2000);

        } catch (err) {
            console.error('Update password failed:', err);
            setPasswordError(err.response?.data?.message || '密码修改失败');
        } finally {
            setPasswordLoading(false);
        }
    };

    // ============================================
    // 处理登出
    // ============================================
    const handleLogout = async () => {
        if (window.confirm('确定要退出登录吗？')) {
            await logout();
            navigate('/');
        }
    };

    // ============================================
    // 加载状态
    // ============================================
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="inline-block w-16 h-16 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-4" />
                    <p className="text-gray-600">加载中...</p>
                </div>
            </div>
        );
    }

    // ============================================
    // 错误状态
    // ============================================
    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center max-w-md">
                    <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">加载失败</h2>
                    <p className="text-gray-600 mb-6">{error}</p>
                    <button
                        onClick={loadUserData}
                        className="btn btn-primary"
                    >
                        重试
                    </button>
                </div>
            </div>
        );
    }

    if (!user) return null;

    // ============================================
    // 主内容渲染
    // ============================================
    return (
        <div className="bg-gray-50 min-h-screen py-8">
            <div className="container-custom">
                {/* 用户信息头部 */}
                <div className="bg-white rounded-xl shadow-md overflow-hidden mb-8">
                    {/* 封面背景 */}
                    <div className="h-32 bg-linear-to-r from-amber-500 to-orange-600" />
                    
                    <div className="px-6 pb-6">
                        {/* 头像和基本信息 */}
                        <div className="flex flex-col sm:flex-row items-start sm:items-end -mt-16 mb-6">
                            <div className="relative">
                                <img
                                    src={user.avatar || 'https://via.placeholder.com/150'}
                                    alt={user.username}
                                    className="w-32 h-32 rounded-full border-4 border-white shadow-lg object-cover"
                                    onError={(e) => {
                                        e.target.src = 'https://via.placeholder.com/150?text=User';
                                    }}
                                />
                                {user.role === 'admin' && (
                                    <div className="absolute bottom-0 right-0 bg-amber-500 text-white text-xs px-2 py-1 rounded-full border-2 border-white">
                                        管理员
                                    </div>
                                )}
                            </div>

                            <div className="mt-4 sm:mt-0 sm:ml-6 flex-1">
                                <h1 className="text-3xl font-bold text-gray-900">
                                    {user.username}
                                </h1>
                                <p className="text-gray-600 mt-1">{user.email}</p>
                                {user.bio && (
                                    <p className="text-gray-700 mt-2">{user.bio}</p>
                                )}
                            </div>

                            <div className="mt-4 sm:mt-0 flex items-center space-x-2">
                                {!isEditing ? (
                                    <>
                                        <button
                                            onClick={() => setIsEditing(true)}
                                            className="btn btn-ghost"
                                        >
                                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                            </svg>
                                            编辑资料
                                        </button>
                                        <button
                                            onClick={() => setShowPasswordModal(true)}
                                            className="btn btn-ghost"
                                        >
                                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                                            </svg>
                                            修改密码
                                        </button>
                                        <button
                                            onClick={handleLogout}
                                            className="btn btn-ghost text-red-600 hover:bg-red-50"
                                        >
                                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                            </svg>
                                            退出登录
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <button
                                            onClick={handleEditSubmit}
                                            disabled={editLoading}
                                            className="btn btn-primary"
                                        >
                                            {editLoading ? '保存中...' : '保存'}
                                        </button>
                                        <button
                                            onClick={handleCancelEdit}
                                            disabled={editLoading}
                                            className="btn btn-ghost"
                                        >
                                            取消
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* 编辑表单 */}
                        {isEditing && (
                            <div className="border-t border-gray-200 pt-6">
                                {editError && (
                                    <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
                                        {editError}
                                    </div>
                                )}

                                <form onSubmit={handleEditSubmit} className="space-y-4">
                                    <div className="grid md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                用户名
                                            </label>
                                            <input
                                                type="text"
                                                name="username"
                                                value={editForm.username}
                                                onChange={handleEditChange}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                邮箱
                                            </label>
                                            <input
                                                type="email"
                                                name="email"
                                                value={editForm.email}
                                                onChange={handleEditChange}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            头像URL
                                        </label>
                                        <input
                                            type="url"
                                            name="avatar"
                                            value={editForm.avatar}
                                            onChange={handleEditChange}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                                            placeholder="https://example.com/avatar.jpg"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            个人简介
                                        </label>
                                        <textarea
                                            name="bio"
                                            value={editForm.bio}
                                            onChange={handleEditChange}
                                            rows="3"
                                            maxLength="500"
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                                            placeholder="介绍一下自己..."
                                        />
                                        <p className="text-sm text-gray-500 mt-1">
                                            {editForm.bio.length}/500
                                        </p>
                                    </div>
                                </form>
                            </div>
                        )}

                        {/* 统计数据 */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 border-t border-gray-200">
                            <div className="text-center">
                                <div className="text-2xl font-bold text-amber-600">
                                    {favorites.length || 0}
                                </div>
                                <div className="text-sm text-gray-600">收藏</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-amber-600">
                                    {user.reviewCount || 0}
                                </div>
                                <div className="text-sm text-gray-600">评论</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-amber-600">
                                    {user.cafeCount || 0}
                                </div>
                                <div className="text-sm text-gray-600">添加的店</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-amber-600">
                                    {user.visited?.length || 0}
                                </div>
                                <div className="text-sm text-gray-600">访问过</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 选项卡 */}
                <div className="bg-white rounded-xl shadow-md overflow-hidden">
                    {/* 选项卡头部 */}
                    <div className="border-b border-gray-200">
                        <nav className="flex">
                            <button
                                onClick={() => setActiveTab('overview')}
                                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                                    activeTab === 'overview'
                                        ? 'border-amber-500 text-amber-600'
                                        : 'border-transparent text-gray-600 hover:text-gray-900'
                                }`}
                            >
                                概览
                            </button>
                            <button
                                onClick={() => setActiveTab('favorites')}
                                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                                    activeTab === 'favorites'
                                        ? 'border-amber-500 text-amber-600'
                                        : 'border-transparent text-gray-600 hover:text-gray-900'
                                }`}
                            >
                                我的收藏 ({favorites.length})
                            </button>
                            <button
                                onClick={() => setActiveTab('reviews')}
                                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                                    activeTab === 'reviews'
                                        ? 'border-amber-500 text-amber-600'
                                        : 'border-transparent text-gray-600 hover:text-gray-900'
                                }`}
                            >
                                我的评论
                            </button>
                        </nav>
                    </div>

                    {/* 选项卡内容 */}
                    <div className="p-6">
                        {/* 概览 */}
                        {activeTab === 'overview' && (
                            <div className="space-y-6">
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                        快速操作
                                    </h3>
                                    <div className="grid md:grid-cols-3 gap-4">
                                        <Link
                                            to="/cafes/new"
                                            className="block p-4 bg-linear-to-br from-amber-50 to-orange-50 rounded-lg hover:shadow-md transition-shadow"
                                        >
                                            <div className="flex items-center">
                                                <div className="w-12 h-12 bg-amber-500 rounded-lg flex items-center justify-center text-white text-2xl">
                                                    ➕
                                                </div>
                                                <div className="ml-4">
                                                    <div className="font-medium text-gray-900">添加咖啡店</div>
                                                    <div className="text-sm text-gray-600">分享你的发现</div>
                                                </div>
                                            </div>
                                        </Link>

                                        <Link
                                            to="/my-reviews"
                                            className="block p-4 bg-linear-to-br from-blue-50 to-indigo-50 rounded-lg hover:shadow-md transition-shadow"
                                        >
                                            <div className="flex items-center">
                                                <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center text-white text-2xl">
                                                    ✍️
                                                </div>
                                                <div className="ml-4">
                                                    <div className="font-medium text-gray-900">查看评论</div>
                                                    <div className="text-sm text-gray-600">管理你的评论</div>
                                                </div>
                                            </div>
                                        </Link>

                                        <Link
                                            to="/favorites"
                                            className="block p-4 bg-linear-to-br from-pink-50 to-red-50 rounded-lg hover:shadow-md transition-shadow"
                                        >
                                            <div className="flex items-center">
                                                <div className="w-12 h-12 bg-pink-500 rounded-lg flex items-center justify-center text-white text-2xl">
                                                    ❤️
                                                </div>
                                                <div className="ml-4">
                                                    <div className="font-medium text-gray-900">我的收藏</div>
                                                    <div className="text-sm text-gray-600">浏览收藏的店</div>
                                                </div>
                                            </div>
                                        </Link>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                        账户信息
                                    </h3>
                                    <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">注册时间</span>
                                            <span className="text-gray-900 font-medium">
                                                {new Date(user.createdAt).toLocaleDateString('zh-CN')}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">上次登录</span>
                                            <span className="text-gray-900 font-medium">
                                                {user.lastLogin 
                                                    ? new Date(user.lastLogin).toLocaleDateString('zh-CN')
                                                    : '未知'
                                                }
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">账户状态</span>
                                            <span className={`font-medium ${
                                                user.isActive ? 'text-green-600' : 'text-red-600'
                                            }`}>
                                                {user.isActive ? '正常' : '已禁用'}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">邮箱验证</span>
                                            <span className={`font-medium ${
                                                user.isEmailVerified ? 'text-green-600' : 'text-yellow-600'
                                            }`}>
                                                {user.isEmailVerified ? '已验证' : '未验证'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* 我的收藏 */}
                        {activeTab === 'favorites' && (
                            <div>
                                {favorites.length === 0 ? (
                                    <div className="text-center py-12">
                                        <div className="text-6xl mb-4">💔</div>
                                        <h3 className="text-xl font-semibold text-gray-900 mb-2">
                                            还没有收藏
                                        </h3>
                                        <p className="text-gray-600 mb-6">
                                            发现喜欢的咖啡店就收藏起来吧！
                                        </p>
                                        <Link to="/cafes" className="btn btn-primary">
                                            探索咖啡店
                                        </Link>
                                    </div>
                                ) : (
                                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {favorites.map((cafe) => (
                                            <CafeCard key={cafe._id || cafe.id} cafe={cafe} />
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* 我的评论 */}
                        {activeTab === 'reviews' && (
                            <div className="text-center py-12">
                                <div className="text-6xl mb-4">📝</div>
                                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                                    查看所有评论
                                </h3>
                                <p className="text-gray-600 mb-6">
                                    在单独的页面查看和管理你的所有评论
                                </p>
                                <Link to="/my-reviews" className="btn btn-primary">
                                    前往评论管理
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* 修改密码弹窗 */}
            {showPasswordModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold text-gray-900">
                                修改密码
                            </h3>
                            <button
                                onClick={() => {
                                    setShowPasswordModal(false);
                                    setPasswordForm({
                                        currentPassword: '',
                                        newPassword: '',
                                        confirmPassword: ''
                                    });
                                    setPasswordError('');
                                    setPasswordSuccess('');
                                }}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {passwordError && (
                            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                                {passwordError}
                            </div>
                        )}

                        {passwordSuccess && (
                            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-600 text-sm">
                                {passwordSuccess}
                            </div>
                        )}

                        <form onSubmit={handlePasswordSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    当前密码
                                </label>
                                <input
                                    type="password"
                                    name="currentPassword"
                                    value={passwordForm.currentPassword}
                                    onChange={handlePasswordChange}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    新密码
                                </label>
                                <input
                                    type="password"
                                    name="newPassword"
                                    value={passwordForm.newPassword}
                                    onChange={handlePasswordChange}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                                    required
                                />
                                <p className="text-xs text-gray-500 mt-1">至少6个字符</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    确认新密码
                                </label>
                                <input
                                    type="password"
                                    name="confirmPassword"
                                    value={passwordForm.confirmPassword}
                                    onChange={handlePasswordChange}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                                    required
                                />
                            </div>

                            <div className="flex space-x-3 pt-4">
                                <button
                                    type="submit"
                                    disabled={passwordLoading}
                                    className="flex-1 btn btn-primary"
                                >
                                    {passwordLoading ? '修改中...' : '确认修改'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowPasswordModal(false);
                                        setPasswordForm({
                                            currentPassword: '',
                                            newPassword: '',
                                            confirmPassword: ''
                                        });
                                        setPasswordError('');
                                        setPasswordSuccess('');
                                    }}
                                    disabled={passwordLoading}
                                    className="flex-1 btn btn-ghost"
                                >
                                    取消
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Profile;