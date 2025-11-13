// ============================================
// SipSpot Frontend - CafeCard Component
// 咖啡店卡片组件（列表项）
// ============================================

import React, { useState } from 'react';
import { useAuth } from '@contexts/AuthContext';
import { toggleFavorite } from '@services/cafesAPI';

/**
 * CafeCard 组件
 * @param {Object} cafe - 咖啡店数据
 * @param {Function} onFavoriteToggle - 收藏切换回调
 * @param {boolean} showDistance - 是否显示距离
 * @param {number} distance - 距离（公里）
 * @param {string} className - 额外的CSS类
 */
const CafeCard = ({ 
    cafe, 
    onFavoriteToggle,
    showDistance = false,
    distance = null,
    className = ''
}) => {
    const { isLoggedIn, userId } = useAuth();
    const [isFavorited, setIsFavorited] = useState(
        cafe.isFavorited || false
    );
    const [favoriteLoading, setFavoriteLoading] = useState(false);

    // ============================================
    // 提取数据
    // ============================================
    const {
        _id,
        id,
        name,
        description,
        images = [],
        rating = 0,
        reviewCount = 0,
        price = 2,
        city,
        address,
        amenities = [],
        specialty,
        viewCount = 0
    } = cafe;

    const cafeId = _id || id;
    const primaryImage = images[0]?.url || images[0] || 'https://via.placeholder.com/400x300?text=No+Image';

    // ============================================
    // 收藏切换
    // ============================================
    const handleFavoriteClick = async (e) => {
        e.preventDefault();
        e.stopPropagation();

        if (!isLoggedIn) {
            window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname);
            return;
        }

        try {
            setFavoriteLoading(true);
            const newFavoriteState = await toggleFavorite(cafeId, isFavorited);
            setIsFavorited(newFavoriteState);

            // 调用父组件回调
            if (onFavoriteToggle) {
                onFavoriteToggle(cafeId, newFavoriteState);
            }
        } catch (error) {
            console.error('Failed to toggle favorite:', error);
        } finally {
            setFavoriteLoading(false);
        }
    };

    // ============================================
    // 渲染星星评分
    // ============================================
    const renderStars = () => {
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 >= 0.5;
        const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

        return (
            <div className="flex items-center">
                {/* 满星 */}
                {[...Array(fullStars)].map((_, i) => (
                    <svg
                        key={`full-${i}`}
                        className="w-4 h-4 text-amber-400 fill-current"
                        viewBox="0 0 20 20"
                    >
                        <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                    </svg>
                ))}
                {/* 半星 */}
                {hasHalfStar && (
                    <svg
                        className="w-4 h-4 text-amber-400"
                        viewBox="0 0 20 20"
                    >
                        <defs>
                            <linearGradient id="half">
                                <stop offset="50%" stopColor="currentColor" />
                                <stop offset="50%" stopColor="#d1d5db" stopOpacity="1" />
                            </linearGradient>
                        </defs>
                        <path
                            fill="url(#half)"
                            d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z"
                        />
                    </svg>
                )}
                {/* 空星 */}
                {[...Array(emptyStars)].map((_, i) => (
                    <svg
                        key={`empty-${i}`}
                        className="w-4 h-4 text-gray-300 fill-current"
                        viewBox="0 0 20 20"
                    >
                        <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                    </svg>
                ))}
            </div>
        );
    };

    // ============================================
    // 渲染价格等级
    // ============================================
    const renderPrice = () => {
        return (
            <span className="text-sm font-medium text-gray-600">
                {'$'.repeat(price)}
                <span className="text-gray-300">{'$'.repeat(4 - price)}</span>
            </span>
        );
    };

    // ============================================
    // 格式化距离
    // ============================================
    const formatDistance = (km) => {
        if (km === null || km === undefined) return '';
        if (km < 1) return `${Math.round(km * 1000)}m`;
        return `${km.toFixed(1)}km`;
    };

    return (
        <a
            href={`/cafes/${cafeId}`}
            className={`group block bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden ${className}`}
        >
            {/* ============================================ */}
            {/* 图片区域 */}
            {/* ============================================ */}
            <div className="relative h-48 overflow-hidden bg-gray-200">
                <img
                    src={primaryImage}
                    alt={name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    onError={(e) => {
                        e.target.src = 'https://via.placeholder.com/400x300?text=No+Image';
                    }}
                />

                {/* 渐变遮罩 */}
                <div className="absolute inset-0 bg-linear-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                {/* 收藏按钮 */}
                <button
                    onClick={handleFavoriteClick}
                    disabled={favoriteLoading}
                    className="absolute top-3 right-3 p-2 bg-white/90 hover:bg-white rounded-full shadow-md transition-all duration-200 hover:scale-110 disabled:opacity-50"
                    title={isFavorited ? '取消收藏' : '添加收藏'}
                >
                    <svg
                        className={`w-5 h-5 transition-colors ${
                            isFavorited ? 'text-red-500 fill-current' : 'text-gray-600'
                        }`}
                        viewBox="0 0 20 20"
                        fill={isFavorited ? 'currentColor' : 'none'}
                        stroke="currentColor"
                        strokeWidth="1.5"
                    >
                        <path
                            fillRule="evenodd"
                            d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
                            clipRule="evenodd"
                        />
                    </svg>
                </button>

                {/* 距离标签 */}
                {showDistance && distance !== null && (
                    <div className="absolute bottom-3 left-3 px-3 py-1 bg-white/90 backdrop-blur-sm rounded-full shadow-md">
                        <span className="text-sm font-medium text-gray-900">
                            📍 {formatDistance(distance)}
                        </span>
                    </div>
                )}

                {/* 图片数量指示器 */}
                {images.length > 1 && (
                    <div className="absolute bottom-3 right-3 px-2 py-1 bg-black/60 backdrop-blur-sm rounded-full">
                        <span className="text-xs font-medium text-white">
                            📷 {images.length}
                        </span>
                    </div>
                )}
            </div>

            {/* ============================================ */}
            {/* 内容区域 */}
            {/* ============================================ */}
            <div className="p-4">
                {/* 标题和评分 */}
                <div className="flex items-start justify-between mb-2">
                    <h3 className="text-lg font-bold text-gray-900 group-hover:text-amber-600 transition-colors line-clamp-1">
                        {name}
                    </h3>
                </div>

                {/* 评分和价格 */}
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                        {renderStars()}
                        <span className="text-sm font-medium text-gray-700">
                            {rating.toFixed(1)}
                        </span>
                        <span className="text-sm text-gray-500">
                            ({reviewCount})
                        </span>
                    </div>
                    {renderPrice()}
                </div>

                {/* 描述 */}
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                    {description}
                </p>

                {/* 地址 */}
                <div className="flex items-center text-sm text-gray-500 mb-3">
                    <svg
                        className="w-4 h-4 mr-1 shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                        />
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                    </svg>
                    <span className="line-clamp-1">{city}</span>
                </div>

                {/* 特色标签 */}
                {specialty && (
                    <div className="mb-3">
                        <span className="inline-flex items-center px-3 py-1 bg-amber-50 text-amber-700 text-xs font-medium rounded-full">
                            ⭐ {specialty}
                        </span>
                    </div>
                )}

                {/* 设施标签 */}
                {amenities.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                        {amenities.slice(0, 3).map((amenity, index) => (
                            <span
                                key={index}
                                className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-md"
                            >
                                {getAmenityIcon(amenity)} {amenity}
                            </span>
                        ))}
                        {amenities.length > 3 && (
                            <span className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-md">
                                +{amenities.length - 3}
                            </span>
                        )}
                    </div>
                )}

                {/* 底部统计 */}
                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <div className="flex items-center text-xs text-gray-500">
                        <svg
                            className="w-4 h-4 mr-1"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                            />
                        </svg>
                        {viewCount} 次浏览
                    </div>

                    <div className="text-xs font-medium text-amber-600 group-hover:text-amber-700">
                        查看详情 →
                    </div>
                </div>
            </div>
        </a>
    );
};

// ============================================
// 设施图标映射
// ============================================
const getAmenityIcon = (amenity) => {
    const icons = {
        'WiFi': '📶',
        'Power Outlets': '🔌',
        'Quiet': '🤫',
        'Outdoor Seating': '🌳',
        'Pet Friendly': '🐕',
        'Non-Smoking': '🚭',
        'Air Conditioning': '❄️',
        'Parking Available': '🅿️',
        'Wheelchair Accessible': '♿',
        'Laptop Friendly': '💻',
        'Good for Groups': '👥',
        'Good for Work': '💼'
    };

    return icons[amenity] || '✓';
};

export default CafeCard;