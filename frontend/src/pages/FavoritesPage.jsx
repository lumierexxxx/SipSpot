// ============================================
// SipSpot Frontend - FavoritesPage
// 收藏列表页面
// ============================================

import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import CafeCard from '../components/CafeCard';
import { getUserFavorites } from '../services/authAPI';
import { toggleFavorite } from '../services/cafesAPI';

const FavoritesPage = () => {
    const navigate = useNavigate();
    const { isLoggedIn } = useAuth();

    // 如果未登录，重定向到登录页
    if (!isLoggedIn) {
        navigate('/login');
        return null;
    }

    // 数据状态
    const [favorites, setFavorites] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // 排序和过滤
    const [sortBy, setSortBy] = useState('recent'); // recent, rating, name
    const [filterCity, setFilterCity] = useState('');

    // ============================================
    // 加载收藏列表
    // ============================================
    useEffect(() => {
        loadFavorites();
    }, []);

    const loadFavorites = async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await getUserFavorites();
            setFavorites(response.data || []);

        } catch (err) {
            console.error('Failed to load favorites:', err);
            setError(err.response?.data?.message || '加载失败');
        } finally {
            setLoading(false);
        }
    };

    // ============================================
    // 处理取消收藏
    // ============================================
    const handleUnfavorite = async (cafeId) => {
        if (!window.confirm('确定要取消收藏这家咖啡店吗？')) {
            return;
        }

        try {
            await toggleFavorite(cafeId, true); // true表示当前已收藏，要取消
            
            // 从列表中移除
            setFavorites(prev => prev.filter(cafe => 
                (cafe._id || cafe.id) !== cafeId
            ));

        } catch (err) {
            console.error('Failed to unfavorite:', err);
            alert('操作失败，请重试');
        }
    };

    // ============================================
    // 排序和过滤
    // ============================================
    const getFilteredAndSortedFavorites = () => {
        let filtered = [...favorites];

        // 城市过滤
        if (filterCity) {
            filtered = filtered.filter(cafe => 
                cafe.city && cafe.city.toLowerCase().includes(filterCity.toLowerCase())
            );
        }

        // 排序
        filtered.sort((a, b) => {
            switch (sortBy) {
                case 'rating':
                    return (b.rating || 0) - (a.rating || 0);
                case 'name':
                    return (a.name || '').localeCompare(b.name || '');
                case 'recent':
                default:
                    // 假设按添加到收藏的顺序（实际需要后端支持）
                    return 0;
            }
        });

        return filtered;
    };

    const displayedFavorites = getFilteredAndSortedFavorites();

    // 获取所有城市用于过滤
    const cities = [...new Set(favorites.map(cafe => cafe.city).filter(Boolean))];

    // ============================================
    // 加载状态
    // ============================================
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
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
            <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
                <div className="text-center max-w-md">
                    <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">加载失败</h2>
                    <p className="text-gray-600 mb-6">{error}</p>
                    <button onClick={loadFavorites} className="btn btn-primary">
                        重试
                    </button>
                </div>
            </div>
        );
    }

    // ============================================
    // 主内容渲染
    // ============================================
    return (
        <div className="bg-gray-50 min-h-screen py-8">
            <div className="container-custom">
                {/* 页面头部 */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        我的收藏
                    </h1>
                    <p className="text-gray-600">
                        {favorites.length > 0 
                            ? `你收藏了 ${favorites.length} 家咖啡店`
                            : '还没有收藏任何咖啡店'
                        }
                    </p>
                </div>

                {/* 空状态 */}
                {favorites.length === 0 ? (
                    <div className="bg-white rounded-xl shadow-md p-12 text-center">
                        <div className="w-24 h-24 bg-linear-to-br from-pink-100 to-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <svg className="w-12 h-12 text-pink-500" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">
                            还没有收藏
                        </h2>
                        <p className="text-gray-600 mb-8">
                            发现喜欢的咖啡店就点击❤️收藏起来吧！
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link to="/cafes" className="btn btn-primary">
                                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                                探索咖啡店
                            </Link>
                            <Link to="/nearby" className="btn btn-ghost">
                                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                附近咖啡店
                            </Link>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* 控制栏 */}
                        <div className="bg-white rounded-xl shadow-md p-4 mb-6">
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                {/* 城市过滤 */}
                                {cities.length > 1 && (
                                    <div className="flex items-center space-x-3">
                                        <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
                                            城市:
                                        </label>
                                        <select
                                            value={filterCity}
                                            onChange={(e) => setFilterCity(e.target.value)}
                                            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                                        >
                                            <option value="">全部城市</option>
                                            {cities.map(city => (
                                                <option key={city} value={city}>{city}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                {/* 排序选择 */}
                                <div className="flex items-center space-x-3">
                                    <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
                                        排序:
                                    </label>
                                    <select
                                        value={sortBy}
                                        onChange={(e) => setSortBy(e.target.value)}
                                        className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                                    >
                                        <option value="recent">最近添加</option>
                                        <option value="rating">评分最高</option>
                                        <option value="name">名称A-Z</option>
                                    </select>
                                </div>

                                {/* 统计信息 */}
                                <div className="text-sm text-gray-600">
                                    显示 {displayedFavorites.length} / {favorites.length} 家
                                </div>
                            </div>
                        </div>

                        {/* 收藏列表 */}
                        {displayedFavorites.length > 0 ? (
                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {displayedFavorites.map(cafe => (
                                    <div key={cafe._id || cafe.id} className="relative group">
                                        <CafeCard cafe={cafe} />
                                        
                                        {/* 取消收藏按钮 */}
                                        <button
                                            onClick={() => handleUnfavorite(cafe._id || cafe.id)}
                                            className="absolute top-4 right-4 p-2 bg-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50"
                                            title="取消收藏"
                                        >
                                            <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                                            </svg>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="bg-white rounded-xl shadow-md p-12 text-center">
                                <div className="text-6xl mb-4">🔍</div>
                                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                                    没有找到匹配的咖啡店
                                </h3>
                                <p className="text-gray-600 mb-6">
                                    尝试更改筛选条件
                                </p>
                                <button
                                    onClick={() => {
                                        setFilterCity('');
                                        setSortBy('recent');
                                    }}
                                    className="btn btn-primary"
                                >
                                    清除筛选
                                </button>
                            </div>
                        )}

                        {/* 快速操作提示 */}
                        <div className="mt-8 bg-linear-to-r from-amber-50 to-orange-50 rounded-xl p-6">
                            <div className="flex items-start">
                                <div className="shrink-0">
                                    <svg className="w-6 h-6 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <div className="ml-4">
                                    <h3 className="text-sm font-medium text-amber-900">
                                        提示
                                    </h3>
                                    <div className="mt-1 text-sm text-amber-700">
                                        <p>• 点击咖啡店卡片查看详情</p>
                                        <p>• 悬停时显示取消收藏按钮</p>
                                        <p>• 收藏的咖啡店会同步到您的个人资料</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default FavoritesPage;