// ============================================
// SipSpot Frontend - CafeList Component
// 咖啡店列表组件
// ============================================

import React, { useState } from 'react';
import CafeCard from './CafeCard';

/**
 * CafeList 组件
 * @param {Array} cafes - 咖啡店数据数组
 * @param {boolean} loading - 加载状态
 * @param {Object} error - 错误信息
 * @param {Function} onFavoriteToggle - 收藏切换回调
 * @param {boolean} showDistance - 是否显示距离
 * @param {Function} getDistance - 获取距离的函数
 * @param {boolean} showViewToggle - 是否显示视图切换按钮
 * @param {Function} onLoadMore - 加载更多回调
 * @param {boolean} hasMore - 是否还有更多数据
 * @param {string} emptyMessage - 空状态提示文字
 */
const CafeList = ({
    cafes = [],
    loading = false,
    error = null,
    onFavoriteToggle,
    showDistance = false,
    getDistance = null,
    showViewToggle = true,
    onLoadMore = null,
    hasMore = false,
    emptyMessage = '暂无咖啡店'
}) => {
    // 视图模式：grid（网格）或 list（列表）
    const [viewMode, setViewMode] = useState('grid');
    
    // ============================================
    // 加载状态
    // ============================================
    if (loading && cafes.length === 0) {
        return (
            <div className="space-y-4">
                {[...Array(6)].map((_, index) => (
                    <div
                        key={index}
                        className="bg-white rounded-xl shadow-md overflow-hidden animate-pulse"
                    >
                        <div className="h-48 bg-gray-200" />
                        <div className="p-4 space-y-3">
                            <div className="h-6 bg-gray-200 rounded w-3/4" />
                            <div className="h-4 bg-gray-200 rounded w-1/2" />
                            <div className="h-4 bg-gray-200 rounded w-full" />
                            <div className="h-4 bg-gray-200 rounded w-full" />
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    // ============================================
    // 错误状态
    // ============================================
    if (error) {
        return (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                <svg
                    className="w-12 h-12 text-red-400 mx-auto mb-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                </svg>
                <h3 className="text-lg font-semibold text-red-900 mb-2">
                    加载失败
                </h3>
                <p className="text-red-700 mb-4">
                    {error.message || '无法加载咖啡店列表'}
                </p>
                <button
                    onClick={() => window.location.reload()}
                    className="btn btn-primary"
                >
                    重新加载
                </button>
            </div>
        );
    }

    // ============================================
    // 空状态
    // ============================================
    if (!loading && cafes.length === 0) {
        return (
            <div className="bg-white rounded-lg p-12 text-center">
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-5xl">☕</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {emptyMessage}
                </h3>
                <p className="text-gray-600 mb-6">
                    尝试调整筛选条件或添加新的咖啡店
                </p>
                <a
                    href="/cafes/new"
                    className="btn btn-primary inline-flex items-center"
                >
                    <svg
                        className="w-5 h-5 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 4v16m8-8H4"
                        />
                    </svg>
                    添加咖啡店
                </a>
            </div>
        );
    }

    return (
        <div>
            {/* ============================================ */}
            {/* 工具栏 */}
            {/* ============================================ */}
            <div className="flex items-center justify-between mb-6">
                <div className="text-sm text-gray-600">
                    找到 <span className="font-semibold text-gray-900">{cafes.length}</span> 家咖啡店
                </div>

                {/* 视图切换按钮 */}
                {showViewToggle && (
                    <div className="flex items-center space-x-2 bg-gray-100 rounded-lg p-1">
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`p-2 rounded-md transition-colors ${
                                viewMode === 'grid'
                                    ? 'bg-white text-amber-600 shadow-sm'
                                    : 'text-gray-600 hover:text-gray-900'
                            }`}
                            title="网格视图"
                        >
                            <svg
                                className="w-5 h-5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                                />
                            </svg>
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={`p-2 rounded-md transition-colors ${
                                viewMode === 'list'
                                    ? 'bg-white text-amber-600 shadow-sm'
                                    : 'text-gray-600 hover:text-gray-900'
                            }`}
                            title="列表视图"
                        >
                            <svg
                                className="w-5 h-5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M4 6h16M4 12h16M4 18h16"
                                />
                            </svg>
                        </button>
                    </div>
                )}
            </div>

            {/* ============================================ */}
            {/* 咖啡店网格/列表 */}
            {/* ============================================ */}
            <div
                className={
                    viewMode === 'grid'
                        ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'
                        : 'space-y-4'
                }
            >
                {cafes.map((cafe) => {
                    const distance = getDistance ? getDistance(cafe) : null;
                    
                    return (
                        <CafeCard
                            key={cafe._id || cafe.id}
                            cafe={cafe}
                            onFavoriteToggle={onFavoriteToggle}
                            showDistance={showDistance}
                            distance={distance}
                            className={viewMode === 'list' ? 'flex' : ''}
                        />
                    );
                })}
            </div>

            {/* ============================================ */}
            {/* 加载更多按钮 */}
            {/* ============================================ */}
            {onLoadMore && hasMore && (
                <div className="mt-8 text-center">
                    <button
                        onClick={onLoadMore}
                        disabled={loading}
                        className="btn btn-outline inline-flex items-center"
                    >
                        {loading ? (
                            <>
                                <div className="spinner w-5 h-5 mr-2" />
                                加载中...
                            </>
                        ) : (
                            <>
                                <svg
                                    className="w-5 h-5 mr-2"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M19 9l-7 7-7-7"
                                    />
                                </svg>
                                加载更多
                            </>
                        )}
                    </button>
                </div>
            )}

            {/* 底部加载指示器 */}
            {loading && cafes.length > 0 && (
                <div className="mt-8 flex justify-center">
                    <div className="spinner w-8 h-8" />
                </div>
            )}
        </div>
    );
};

export default CafeList;