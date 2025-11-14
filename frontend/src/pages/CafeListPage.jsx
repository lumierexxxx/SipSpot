// ============================================
// SipSpot Frontend - CafeListPage
// 咖啡店列表页面 - 带过滤、搜索和分页
// ============================================

import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import CafeCard from '../components/CafeCard';
import CafeList from '../components/CafeList';
import { getCafes, searchAndFilterCafes } from '../services/cafesAPI';

const CafeListPage = ({ myOnly = false }) => {
    const navigate = useNavigate();
    const { userId } = useAuth();
    const [searchParams, setSearchParams] = useSearchParams();

    // 数据状态
    const [cafes, setCafes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // 分页状态
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalCount, setTotalCount] = useState(0);

    // 过滤器状态
    const [filters, setFilters] = useState({
        search: searchParams.get('search') || '',
        city: searchParams.get('city') || '',
        minRating: searchParams.get('minRating') || '',
        maxPrice: searchParams.get('maxPrice') || '',
        amenities: searchParams.getAll('amenities') || [],
        sort: searchParams.get('sort') || '-rating'
    });

    // 显示过滤器面板
    const [showFilters, setShowFilters] = useState(false);

    // 可用的设施选项
    const amenityOptions = [
        'WiFi',
        'Power Outlets',
        'Quiet',
        'Outdoor Seating',
        'Pet Friendly',
        'Non-Smoking',
        'Air Conditioning',
        'Parking Available',
        'Wheelchair Accessible',
        'Laptop Friendly',
        'Good for Groups',
        'Good for Work'
    ];

    // 城市选项（可以从后端获取）
    const cityOptions = [
        'Seattle',
        'Portland',
        'San Francisco',
        'Los Angeles',
        'New York',
        'Chicago',
        'Boston',
        'Austin'
    ];

    
    // 更新URL参数
    useEffect(() => {
        const params = new URLSearchParams();
        
        if (filters.search) params.set('search', filters.search);
        if (filters.city) params.set('city', filters.city);
        if (filters.minRating) params.set('minRating', filters.minRating);
        if (filters.maxPrice) params.set('maxPrice', filters.maxPrice);
        if (filters.sort) params.set('sort', filters.sort);
        filters.amenities.forEach(a => params.append('amenities', a));
        
        setSearchParams(params);
    }, [filters, setSearchParams]);

    const loadCafes = useCallback (async () => {
        try {
            setLoading(true);
            setError(null);

            const params = {
                page: currentPage,
                limit: 12,
                ...filters,
                query: filters.search
            };

            // 如果是"我的咖啡店"页面，添加作者过滤
            if (myOnly && userId) {
                params.author = userId;
            }

            const response = await searchAndFilterCafes(params);
            
            setCafes(response.data || []);
            
            if (response.pagination) {
                setTotalPages(response.pagination.pages);
                setTotalCount(response.pagination.total);
            }

        } catch (err) {
            console.error('Failed to load cafes:', err);
            setError(err.response?.data?.message || '加载失败');
        } finally {
            setLoading(false);
        }
    },[currentPage, filters, myOnly, userId]);


    // ============================================
    // 加载咖啡店数据
    // ============================================
    useEffect(() => {
        loadCafes();
    }, [loadCafes]);


    // ============================================
    // 处理过滤器变化
    // ============================================
    const handleFilterChange = (key, value) => {
        setFilters(prev => ({
            ...prev,
            [key]: value
        }));
        setCurrentPage(1); // 重置到第一页
    };

    const handleAmenityToggle = (amenity) => {
        setFilters(prev => {
            const amenities = prev.amenities.includes(amenity)
                ? prev.amenities.filter(a => a !== amenity)
                : [...prev.amenities, amenity];
            return { ...prev, amenities };
        });
        setCurrentPage(1);
    };

    const handleClearFilters = () => {
        setFilters({
            search: '',
            city: '',
            minRating: '',
            maxPrice: '',
            amenities: [],
            sort: '-rating'
        });
        setCurrentPage(1);
    };

    // ============================================
    // 处理搜索
    // ============================================
    const handleSearch = (e) => {
        e.preventDefault();
        setCurrentPage(1);
        loadCafes();
    };

    // ============================================
    // 处理分页
    // ============================================
    const handlePageChange = (page) => {
        setCurrentPage(page);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // ============================================
    // 渲染过滤器面板
    // ============================================
    const renderFilters = () => (
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900">过滤器</h3>
                <button
                    onClick={handleClearFilters}
                    className="text-sm text-amber-600 hover:text-amber-700"
                >
                    清除所有
                </button>
            </div>

            <div className="space-y-4">
                {/* 城市选择 */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        城市
                    </label>
                    <select
                        value={filters.city}
                        onChange={(e) => handleFilterChange('city', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                    >
                        <option value="">全部城市</option>
                        {cityOptions.map(city => (
                            <option key={city} value={city}>{city}</option>
                        ))}
                    </select>
                </div>

                {/* 最低评分 */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        最低评分
                    </label>
                    <select
                        value={filters.minRating}
                        onChange={(e) => handleFilterChange('minRating', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                    >
                        <option value="">不限</option>
                        <option value="4">4星以上</option>
                        <option value="3">3星以上</option>
                        <option value="2">2星以上</option>
                    </select>
                </div>

                {/* 价格等级 */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        最高价格
                    </label>
                    <div className="flex items-center space-x-2">
                        {[1, 2, 3, 4].map(price => (
                            <button
                                key={price}
                                onClick={() => handleFilterChange('maxPrice', price.toString())}
                                className={`flex-1 py-2 px-3 rounded-lg border transition-colors ${
                                    filters.maxPrice === price.toString()
                                        ? 'bg-amber-500 text-white border-amber-500'
                                        : 'bg-white text-gray-700 border-gray-300 hover:border-amber-500'
                                }`}
                            >
                                {'$'.repeat(price)}
                            </button>
                        ))}
                    </div>
                    {filters.maxPrice && (
                        <button
                            onClick={() => handleFilterChange('maxPrice', '')}
                            className="text-sm text-gray-600 hover:text-gray-900 mt-2"
                        >
                            清除价格筛选
                        </button>
                    )}
                </div>

                {/* 设施选择 */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        设施 ({filters.amenities.length})
                    </label>
                    <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto">
                        {amenityOptions.map(amenity => (
                            <label
                                key={amenity}
                                className="flex items-center p-2 rounded hover:bg-gray-50 cursor-pointer"
                            >
                                <input
                                    type="checkbox"
                                    checked={filters.amenities.includes(amenity)}
                                    onChange={() => handleAmenityToggle(amenity)}
                                    className="w-4 h-4 text-amber-600 rounded focus:ring-amber-500"
                                />
                                <span className="ml-2 text-sm text-gray-700">{amenity}</span>
                            </label>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );

    // ============================================
    // 主内容渲染
    // ============================================
    return (
        <div className="bg-gray-50 min-h-screen py-8">
            <div className="container-custom">
                {/* 页面头部 */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        {myOnly ? '我的咖啡店' : '发现咖啡店'}
                    </h1>
                    <p className="text-gray-600">
                        {myOnly 
                            ? '管理你添加的咖啡店'
                            : `找到 ${totalCount} 家咖啡店`
                        }
                    </p>
                </div>

                {/* 搜索栏 */}
                <div className="bg-white rounded-xl shadow-md p-4 mb-6">
                    <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1">
                            <input
                                type="text"
                                value={filters.search}
                                onChange={(e) => handleFilterChange('search', e.target.value)}
                                placeholder="搜索咖啡店名称、描述..."
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                            />
                        </div>
                        <div className="flex gap-2">
                            <button
                                type="submit"
                                className="btn btn-primary whitespace-nowrap"
                            >
                                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                                搜索
                            </button>
                            <button
                                type="button"
                                onClick={() => setShowFilters(!showFilters)}
                                className="btn btn-ghost md:hidden"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                                </svg>
                            </button>
                        </div>
                    </form>
                </div>

                <div className="grid lg:grid-cols-4 gap-6">
                    {/* 左侧过滤器（桌面端） */}
                    <div className="lg:col-span-1 hidden lg:block">
                        {renderFilters()}
                    </div>

                    {/* 移动端过滤器 */}
                    {showFilters && (
                        <div className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-50 p-4 overflow-y-auto">
                            <div className="max-w-lg mx-auto">
                                <div className="flex justify-between items-center mb-4">
                                    <h2 className="text-xl font-bold text-white">过滤器</h2>
                                    <button
                                        onClick={() => setShowFilters(false)}
                                        className="text-white"
                                    >
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                                {renderFilters()}
                            </div>
                        </div>
                    )}

                    {/* 右侧主内容 */}
                    <div className="lg:col-span-3">
                        {/* 排序和视图选择 */}
                        <div className="flex items-center justify-between mb-6">
                            <div className="text-sm text-gray-600">
                                显示 {cafes.length} / {totalCount} 个结果
                            </div>
                            <select
                                value={filters.sort}
                                onChange={(e) => handleFilterChange('sort', e.target.value)}
                                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                            >
                                <option value="-rating">评分最高</option>
                                <option value="-createdAt">最新添加</option>
                                <option value="price">价格最低</option>
                                <option value="-price">价格最高</option>
                                <option value="name">名称 A-Z</option>
                            </select>
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
                                <button onClick={loadCafes} className="btn btn-primary">
                                    重试
                                </button>
                            </div>
                        )}

                        {/* 咖啡店列表 */}
                        {!loading && !error && cafes.length > 0 && (
                            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
                                {cafes.map(cafe => (
                                    <CafeCard key={cafe._id || cafe.id} cafe={cafe} />
                                ))}
                            </div>
                        )}

                        {/* 空状态 */}
                        {!loading && !error && cafes.length === 0 && (
                            <div className="bg-white rounded-xl shadow-md p-12 text-center">
                                <div className="text-6xl mb-4">☕</div>
                                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                                    {myOnly ? '还没有添加咖啡店' : '没有找到咖啡店'}
                                </h3>
                                <p className="text-gray-600 mb-6">
                                    {myOnly 
                                        ? '开始添加你的第一家咖啡店吧！'
                                        : '尝试调整搜索条件或清除过滤器'
                                    }
                                </p>
                                {myOnly ? (
                                    <button
                                        onClick={() => navigate('/cafes/new')}
                                        className="btn btn-primary"
                                    >
                                        添加咖啡店
                                    </button>
                                ) : (
                                    <button
                                        onClick={handleClearFilters}
                                        className="btn btn-primary"
                                    >
                                        清除过滤器
                                    </button>
                                )}
                            </div>
                        )}

                        {/* 分页 */}
                        {!loading && !error && totalPages > 1 && (
                            <div className="mt-8 flex justify-center">
                                <nav className="flex items-center space-x-2">
                                    <button
                                        onClick={() => handlePageChange(currentPage - 1)}
                                        disabled={currentPage === 1}
                                        className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        上一页
                                    </button>

                                    {[...Array(totalPages)].map((_, i) => {
                                        const page = i + 1;
                                        if (
                                            page === 1 ||
                                            page === totalPages ||
                                            (page >= currentPage - 2 && page <= currentPage + 2)
                                        ) {
                                            return (
                                                <button
                                                    key={page}
                                                    onClick={() => handlePageChange(page)}
                                                    className={`px-4 py-2 rounded-lg ${
                                                        page === currentPage
                                                            ? 'bg-amber-600 text-white'
                                                            : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                                                    }`}
                                                >
                                                    {page}
                                                </button>
                                            );
                                        } else if (
                                            page === currentPage - 3 ||
                                            page === currentPage + 3
                                        ) {
                                            return <span key={page} className="px-2">...</span>;
                                        }
                                        return null;
                                    })}

                                    <button
                                        onClick={() => handlePageChange(currentPage + 1)}
                                        disabled={currentPage === totalPages}
                                        className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        下一页
                                    </button>
                                </nav>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CafeListPage;