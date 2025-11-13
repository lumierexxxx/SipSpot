// ============================================
// SipSpot Frontend - NearbyPage
// 附近咖啡店页面 - 基于地理位置
// ============================================

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import CafeCard from '../components/CafeCard';
import Map from '../components/Map';
import { getNearbyCafes } from '../services/cafesAPI';
import { useGeolocation } from '../hooks/useGeolocation';

const NearbyPage = () => {
    const navigate = useNavigate();
    const { location, loading: locationLoading, error: locationError, getCurrentLocation } = useGeolocation();

    // 数据状态
    const [cafes, setCafes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // 搜索参数
    const [distance, setDistance] = useState(5000); // 默认5公里
    const [limit, setLimit] = useState(20);

    // 视图模式
    const [viewMode, setViewMode] = useState('grid'); // grid or map

    // ============================================
    // 加载附近咖啡店
    // ============================================
    useEffect(() => {
        if (location && location.lat && location.lng) {
            loadNearbyCafes();
        }
    }, [location, distance, limit]);

    const loadNearbyCafes = async () => {
        if (!location || !location.lat || !location.lng) return;

        try {
            setLoading(true);
            setError(null);

            const response = await getNearbyCafes({
                lat: location.lat,
                lng: location.lng,
                distance: distance,
                limit: limit
            });

            setCafes(response.data || []);

        } catch (err) {
            console.error('Failed to load nearby cafes:', err);
            setError(err.response?.data?.message || '加载失败');
        } finally {
            setLoading(false);
        }
    };

    // ============================================
    // 处理距离变化
    // ============================================
    const handleDistanceChange = (newDistance) => {
        setDistance(newDistance);
    };

    // ============================================
    // 准备地图标记
    // ============================================
    const mapMarkers = cafes.map(cafe => ({
        id: cafe._id || cafe.id,
        position: {
            lat: cafe.geometry.coordinates[1],
            lng: cafe.geometry.coordinates[0]
        },
        title: cafe.name,
        cafe: cafe
    }));

    // 添加用户位置标记
    if (location && location.lat && location.lng) {
        mapMarkers.push({
            id: 'user-location',
            position: {
                lat: location.lat,
                lng: location.lng
            },
            title: '您的位置',
            isUserLocation: true
        });
    }

    // ============================================
    // 渲染加载状态
    // ============================================
    if (locationLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="inline-block w-16 h-16 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-4" />
                    <p className="text-gray-600">正在获取您的位置...</p>
                </div>
            </div>
        );
    }

    // ============================================
    // 渲染位置错误
    // ============================================
    if (locationError || (!location && !locationLoading)) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
                <div className="max-w-md w-full text-center">
                    <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-10 h-10 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                        需要您的位置
                    </h2>
                    <p className="text-gray-600 mb-6">
                        {locationError || '请允许访问您的位置以查找附近的咖啡店'}
                    </p>
                    <div className="space-y-3">
                        <button
                            onClick={getCurrentLocation}
                            className="w-full btn btn-primary"
                        >
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            获取我的位置
                        </button>
                        <button
                            onClick={() => navigate('/cafes')}
                            className="w-full btn btn-ghost"
                        >
                            浏览所有咖啡店
                        </button>
                    </div>

                    {/* 使用提示 */}
                    <div className="mt-8 p-4 bg-blue-50 rounded-lg text-left">
                        <p className="text-sm text-blue-800 font-medium mb-2">
                            💡 如何启用位置访问：
                        </p>
                        <ul className="text-sm text-blue-700 space-y-1">
                            <li>1. 点击浏览器地址栏的位置图标</li>
                            <li>2. 选择"允许"或"始终允许"</li>
                            <li>3. 刷新页面</li>
                        </ul>
                    </div>
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
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        附近的咖啡店
                    </h1>
                    <p className="text-gray-600">
                        {location && `在您周围 ${distance / 1000} 公里内找到 ${cafes.length} 家咖啡店`}
                    </p>
                </div>

                {/* 控制栏 */}
                <div className="bg-white rounded-xl shadow-md p-4 mb-6">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        {/* 距离选择 */}
                        <div className="flex items-center space-x-4">
                            <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
                                搜索半径:
                            </label>
                            <div className="flex items-center space-x-2">
                                {[1000, 2000, 5000, 10000].map(dist => (
                                    <button
                                        key={dist}
                                        onClick={() => handleDistanceChange(dist)}
                                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                            distance === dist
                                                ? 'bg-amber-500 text-white'
                                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                    >
                                        {dist / 1000}km
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* 视图切换 */}
                        <div className="flex items-center space-x-2">
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors ${
                                    viewMode === 'grid'
                                        ? 'bg-amber-500 text-white'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                                </svg>
                                <span className="hidden sm:inline">网格</span>
                            </button>
                            <button
                                onClick={() => setViewMode('map')}
                                className={`px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors ${
                                    viewMode === 'map'
                                        ? 'bg-amber-500 text-white'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                                </svg>
                                <span className="hidden sm:inline">地图</span>
                            </button>
                        </div>

                        {/* 刷新按钮 */}
                        <button
                            onClick={loadNearbyCafes}
                            disabled={loading}
                            className="btn btn-ghost"
                        >
                            <svg className={`w-5 h-5 mr-2 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            刷新
                        </button>
                    </div>
                </div>

                {/* 加载状态 */}
                {loading && (
                    <div className="flex items-center justify-center py-20">
                        <div className="text-center">
                            <div className="inline-block w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-4" />
                            <p className="text-gray-600">加载中...</p>
                        </div>
                    </div>
                )}

                {/* 错误状态 */}
                {error && !loading && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                        <svg className="w-12 h-12 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="text-red-800 font-medium mb-2">加载失败</p>
                        <p className="text-red-600 text-sm mb-4">{error}</p>
                        <button onClick={loadNearbyCafes} className="btn btn-primary">
                            重试
                        </button>
                    </div>
                )}

                {/* 内容区域 */}
                {!loading && !error && (
                    <>
                        {/* 网格视图 */}
                        {viewMode === 'grid' && (
                            <>
                                {cafes.length > 0 ? (
                                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {cafes.map(cafe => (
                                            <CafeCard key={cafe._id || cafe.id} cafe={cafe} />
                                        ))}
                                    </div>
                                ) : (
                                    <div className="bg-white rounded-xl shadow-md p-12 text-center">
                                        <div className="text-6xl mb-4">🔍</div>
                                        <h3 className="text-xl font-semibold text-gray-900 mb-2">
                                            附近没有找到咖啡店
                                        </h3>
                                        <p className="text-gray-600 mb-6">
                                            尝试扩大搜索范围或浏览所有咖啡店
                                        </p>
                                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                                            <button
                                                onClick={() => handleDistanceChange(10000)}
                                                className="btn btn-primary"
                                            >
                                                扩大到10公里
                                            </button>
                                            <button
                                                onClick={() => navigate('/cafes')}
                                                className="btn btn-ghost"
                                            >
                                                浏览所有咖啡店
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}

                        {/* 地图视图 */}
                        {viewMode === 'map' && (
                            <div className="bg-white rounded-xl shadow-md overflow-hidden">
                                <Map
                                    center={{
                                        lat: location.lat,
                                        lng: location.lng
                                    }}
                                    markers={mapMarkers}
                                    zoom={13}
                                    height="600px"
                                />
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default NearbyPage;