// ============================================
// SipSpot Frontend - Home Page
// 首页组件
// ============================================

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import CafeCard from '@components/CafeCard';
import { useAPI } from '@hooks/useAPI';
import { useCurrentPosition } from '@hooks/useGeolocation';
import { getTopRatedCafes, getNearbyCafes } from '@services/cafesAPI';

const Home = () => {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    
    // 获取用户位置
    const { latitude, longitude } = useCurrentPosition();
    const hasFetchedNearby = useRef(false);

    // 获取高评分咖啡店
    const {
        data: topRatedData,
        loading: topRatedLoading,
        error: topRatedError
    } = useAPI(() => getTopRatedCafes({ limit: 6 }));

    // 🔧 修改：保证 API 函数不会每次 render 重建，避免无限循环
    const stableNearbyAPI = useCallback(() => {
        if (latitude == null || longitude == null) return null; // 🔧 修改：避免位置为 null 时调用
        return getNearbyCafes({
            lng: longitude,
            lat: latitude,
            distance: 10000,
            limit: 6
        });
    }, [latitude, longitude]); // 🔧 修改（新增 useCallback）

    // 获取附近咖啡店（改为稳定 API 函数）
    const {
        data: nearbyData,
        loading: nearbyLoading,
        execute: fetchNearby
    } = useAPI(stableNearbyAPI, {
        immediate: false
    });

    // 当位置获取后，加载附近咖啡店
    useEffect(() => {
        if (!hasFetchedNearby.current && latitude != null && longitude != null) {
        hasFetchedNearby.current = true;
        fetchNearby();
        }
    }, [latitude, longitude, fetch]);

    // 处理搜索
    const handleSearch = (e) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            navigate(`/cafes?search=${encodeURIComponent(searchQuery.trim())}`);
        }
    };

    const topRatedCafes = topRatedData?.data || [];
    const nearbyCafes = nearbyData?.data || [];

    return (
        <div className="min-h-screen">
            {/* ============================================ */}
            {/* 英雄区 */}
            {/* ============================================ */}
            <section className="relative bg-linear-to-br from-amber-50 via-orange-50 to-yellow-50 overflow-hidden">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmYjkyM2MiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDEzNGg4djhIMzZ6bTAgMTZoOHY4SDM2em0xNiAxNmg4djhoLTh6bTE2IDE2aDh2OGgtOHptMTYgMTZoOHY4aC04em0xNiAxNmg4djhoLTh6bTE2LTE0NGg4djhoLTh6bTAtMTZoOHY4aC04em0wLTE2aDh2OGgtOHptMC0xNmg4djhoLTh6bTAtMTZoOHY4aC04em0tMTYgMGg4djhoLTh6bS0xNiAwaDh2OGgtOHptLTE2IDBoOHY4aC04em0tMTYgMGg4djhoLTh6bS0xNiAwaDh2OGgtOHptLTE2IDBoOHY4aC04em0tMTYgMGg4djhoLTh6bS0xNiAwaDh2OGgtOHptMC0xNmg4djhoLTh6bTAgMTZoOHY4aC04em0wIDE2aDh2OGgtOHptMCAxNmg4djhoLTh6bTAgMTZoOHY4aC04em0wIDE2aDh2OGgtOHptMCAxNmg4djhoLTh6bTAgMTZoOHY4aC04em0xNiAwaDh2OGgtOHptMTYgMGg4djhoLTh6bTE2IDBoOHY4aC04em0xNiAwaDh2OGgtOHptMTYgMGg4djhoLTh6bTE2IDBoOHY4aC04em0xNiAwaDh2OGgtOHptMCAxNmg4djhoLTh6bS0xNiAwaDh2OGgtOHptLTE2IDBoOHY4aC04em0tMTYgMGg4djhoLTh6bS0xNiAwaDh2OGgtOHptLTE2IDBoOHY4aC04em0tMTYgMGg4djhoLTh6bS0xNiAwaDh2OGgtOHptLTE2IDBoOHY4aC04em0wLTE2aDh2OGgtOHptMTYgMGg4djhoLTh6bTE2IDBoOHY4aC04em0xNiAwaDh2OGgtOHptMTYgMGg4djhoLTh6bTE2IDBoOHY4aC04em0xNiAwaDh2OGgtOHptMTYgMGg4djhoLTh6bTAgMTZoOHY4aC04em0wIDE2aDh2OGgtOHptMCAxNmg4djhoLTh6bTAgMTZoOHY4aC04eiIvPjwvZz48L2c+PC9zdmc+')] opacity-40" />
                
                <div className="container-custom relative py-20 md:py-32">
                    <div className="max-w-4xl mx-auto text-center">
                        <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6 animate-fadeIn">
                            发现身边最好的
                            <span className="text-gradient block mt-2">咖啡店</span>
                        </h1>
                        <p className="text-lg md:text-xl text-gray-700 mb-8 animate-fadeIn animation-delay-100">
                            分享你的咖啡时光，探索每一杯独特的风味
                        </p>

                        {/* 搜索框 */}
                        <form onSubmit={handleSearch} className="max-w-2xl mx-auto animate-fadeIn animation-delay-200">
                            <div className="flex items-center bg-white rounded-full shadow-lg overflow-hidden">
                                <div className="pl-6 pr-4 text-gray-400">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                </div>
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="搜索咖啡店、地点或特色..."
                                    className="flex-1 py-4 px-2 text-gray-900 placeholder-gray-500 focus:outline-none"
                                />
                                <button
                                    type="submit"
                                    className="px-8 py-4 bg-amber-600 text-white font-medium hover:bg-amber-700 transition-colors"
                                >
                                    搜索
                                </button>
                            </div>
                        </form>

                        {/* 快速链接 */}
                        <div className="flex flex-wrap items-center justify-center gap-4 mt-8 animate-fadeIn animation-delay-300">
                            <a
                                href="/nearby"
                                className="flex items-center space-x-2 px-4 py-2 bg-white/80 hover:bg-white rounded-full text-gray-700 hover:text-amber-600 transition-all shadow-md hover:shadow-lg"
                            >
                                <span>📍</span>
                                <span>附近咖啡店</span>
                            </a>
                            <a
                                href="/cafes?sort=-rating"
                                className="flex items-center space-x-2 px-4 py-2 bg-white/80 hover:bg-white rounded-full text-gray-700 hover:text-amber-600 transition-all shadow-md hover:shadow-lg"
                            >
                                <span>⭐</span>
                                <span>高评分推荐</span>
                            </a>
                            <a
                                href="/cafes/new"
                                className="flex items-center space-x-2 px-4 py-2 bg-white/80 hover:bg-white rounded-full text-gray-700 hover:text-amber-600 transition-all shadow-md hover:shadow-lg"
                            >
                                <span>➕</span>
                                <span>添加咖啡店</span>
                            </a>
                        </div>
                    </div>
                </div>

                {/* 装饰性咖啡杯 */}
                <div className="absolute bottom-0 right-10 text-9xl opacity-10 animate-bounce-slow hidden lg:block">
                    ☕
                </div>
            </section>

            {/* ============================================ */}
            {/* 统计数据 */}
            {/* ============================================ */}
            <section className="py-12 bg-white border-y border-gray-100">
                <div className="container-custom">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                        <div className="text-center">
                            <div className="text-4xl font-bold text-amber-600 mb-2">1000+</div>
                            <div className="text-gray-600">咖啡店</div>
                        </div>
                        <div className="text-center">
                            <div className="text-4xl font-bold text-amber-600 mb-2">5000+</div>
                            <div className="text-gray-600">真实评论</div>
                        </div>
                        <div className="text-center">
                            <div className="text-4xl font-bold text-amber-600 mb-2">50+</div>
                            <div className="text-gray-600">城市覆盖</div>
                        </div>
                        <div className="text-center">
                            <div className="text-4xl font-bold text-amber-600 mb-2">2000+</div>
                            <div className="text-gray-600">活跃用户</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ============================================ */}
            {/* 高评分咖啡店 */}
            {/* ============================================ */}
            <section className="py-16 bg-gray-50">
                <div className="container-custom">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h2 className="text-3xl font-bold text-gray-900 mb-2">
                                ⭐ 高评分推荐
                            </h2>
                            <p className="text-gray-600">
                                探索最受欢迎的咖啡店
                            </p>
                        </div>
                        <a
                            href="/cafes?sort=-rating"
                            className="btn btn-outline hidden md:inline-flex"
                        >
                            查看更多 →
                        </a>
                    </div>

                    {topRatedLoading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {[...Array(6)].map((_, i) => (
                                <div key={i} className="bg-white rounded-xl shadow-md overflow-hidden animate-pulse">
                                    <div className="h-48 bg-gray-200" />
                                    <div className="p-4 space-y-3">
                                        <div className="h-6 bg-gray-200 rounded" />
                                        <div className="h-4 bg-gray-200 rounded w-3/4" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : topRatedError ? (
                        <div className="text-center py-12">
                            <p className="text-red-600">加载失败，请刷新页面重试</p>
                        </div>
                    ) : topRatedCafes.length > 0 ? (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {topRatedCafes.map((cafe) => (
                                    <CafeCard key={cafe._id || cafe.id} cafe={cafe} />
                                ))}
                            </div>
                            <div className="text-center mt-8 md:hidden">
                                <a href="/cafes?sort=-rating" className="btn btn-outline">
                                    查看更多 →
                                </a>
                            </div>
                        </>
                    ) : (
                        <div className="text-center py-12">
                            <p className="text-gray-600">暂无数据</p>
                        </div>
                    )}
                </div>
            </section>

            {/* ============================================ */}
            {/* 附近咖啡店 */}
            {/* ============================================ */}
            {latitude != null && longitude != null && (
                <section className="py-16 bg-white">
                    <div className="container-custom">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h2 className="text-3xl font-bold text-gray-900 mb-2">
                                    📍 附近咖啡店
                                </h2>
                                <p className="text-gray-600">
                                    离你最近的咖啡好去处
                                </p>
                            </div>
                            <a
                                href="/nearby"
                                className="btn btn-outline hidden md:inline-flex"
                            >
                                查看更多 →
                            </a>
                        </div>

                        {nearbyLoading ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {[...Array(6)].map((_, i) => (
                                    <div key={i} className="bg-white rounded-xl shadow-md overflow-hidden animate-pulse">
                                        <div className="h-48 bg-gray-200" />
                                        <div className="p-4 space-y-3">
                                            <div className="h-6 bg-gray-200 rounded" />
                                            <div className="h-4 bg-gray-200 rounded w-3/4" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : nearbyCafes.length > 0 ? (
                            <>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {nearbyCafes.map((cafe) => (
                                        <CafeCard 
                                            key={cafe._id || cafe.id} 
                                            cafe={cafe}
                                            showDistance
                                        />
                                    ))}
                                </div>
                                <div className="text-center mt-8 md:hidden">
                                    <a href="/nearby" className="btn btn-outline">
                                        查看更多 →
                                    </a>
                                </div>
                            </>
                        ) : (
                            <div className="text-center py-12">
                                <p className="text-gray-600">附近暂无咖啡店</p>
                            </div>
                        )}
                    </div>
                </section>
            )}

            {/* ============================================ */}
            {/* 功能介绍 */}
            {/* ============================================ */}
            <section className="py-16 bg-linear-to-br from-amber-50 to-orange-50">
                <div className="container-custom">
                    <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
                        为什么选择 SipSpot
                    </h2>

                    <div className="grid md:grid-cols-3 gap-8">
                        <div className="bg-white rounded-xl p-8 shadow-md text-center">
                            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <span className="text-3xl">🗺️</span>
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-3">
                                地理位置搜索
                            </h3>
                            <p className="text-gray-600">
                                基于你的位置，快速找到附近最好的咖啡店
                            </p>
                        </div>

                        <div className="bg-white rounded-xl p-8 shadow-md text-center">
                            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <span className="text-3xl">⭐</span>
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-3">
                                真实用户评价
                            </h3>
                            <p className="text-gray-600">
                                来自真实用户的评论和评分，帮你做出最好的选择
                            </p>
                        </div>

                        <div className="bg-white rounded-xl p-8 shadow-md text-center">
                            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <span className="text-3xl">🤖</span>
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-3">
                                AI 智能分析
                            </h3>
                            <p className="text-gray-600">
                                AI 帮你分析评论情感，快速了解咖啡店特色
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* ============================================ */}
            {/* CTA 区域 */}
            {/* ============================================ */}
            <section className="py-20 bg-linear-to-r from-amber-600 to-orange-600 text-white">
                <div className="container-custom text-center">
                    <h2 className="text-3xl md:text-4xl font-bold mb-4">
                        准备好开始你的咖啡之旅了吗？
                    </h2>
                    <p className="text-xl mb-8 text-amber-100">
                        加入 SipSpot 社区，分享你的咖啡故事
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <a
                            href="/register"
                            className="btn bg-white text-amber-600 hover:bg-gray-100 px-8 py-3 text-lg"
                        >
                            免费注册
                        </a>
                        <a
                            href="/cafes"
                            className="btn btn-outline border-white text-white hover:bg-white/10 px-8 py-3 text-lg"
                        >
                            浏览咖啡店
                        </a>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Home;