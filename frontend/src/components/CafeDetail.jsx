// ============================================
// SipSpot Frontend - CafeDetail Component
// 咖啡店详情展示组件
// ============================================

import React, { useState } from 'react';
import { useAuth } from '@contexts/AuthContext';

/**
 * CafeDetail 组件
 * @param {Object} cafe - 咖啡店完整数据
 * @param {Function} onFavoriteToggle - 收藏切换回调
 * @param {Function} onEdit - 编辑回调
 * @param {Function} onDelete - 删除回调
 */
const CafeDetail = ({
    cafe,
    onFavoriteToggle,
    onEdit,
    onDelete
}) => {
    const { isLoggedIn, userId, canEdit } = useAuth();
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [isFavorited, setIsFavorited] = useState(cafe.isFavorited || false);
    const [favoriteLoading, setFavoriteLoading] = useState(false);

    if (!cafe) {
        return (
            <div className="bg-white rounded-lg p-6 text-center">
                <p className="text-gray-600">咖啡店信息不存在</p>
            </div>
        );
    }

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
        phoneNumber,
        website,
        openingHours = [],
        geometry,
        author,
        viewCount = 0,
        favoriteCount = 0
    } = cafe;

    const cafeId = _id || id;
    const isOwner = userId && author && (author._id === userId || author.id === userId);
    const canEditCafe = canEdit(author?._id || author?.id);

    // ============================================
    // 处理收藏
    // ============================================
    const handleFavoriteClick = async () => {
        if (!isLoggedIn) {
            window.location.href = '/login';
            return;
        }

        try {
            setFavoriteLoading(true);
            setIsFavorited(!isFavorited);
            if (onFavoriteToggle) {
                await onFavoriteToggle(cafeId, !isFavorited);
            }
        } catch (error) {
            console.error('Toggle favorite failed:', error);
            setIsFavorited(isFavorited); // 回滚
        } finally {
            setFavoriteLoading(false);
        }
    };

    // ============================================
    // 图片导航
    // ============================================
    const nextImage = () => {
        setCurrentImageIndex((prev) => 
            prev === images.length - 1 ? 0 : prev + 1
        );
    };

    const prevImage = () => {
        setCurrentImageIndex((prev) => 
            prev === 0 ? images.length - 1 : prev - 1
        );
    };

    // ============================================
    // 渲染星星
    // ============================================
    const renderStars = () => {
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 >= 0.5;
        const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

        return (
            <div className="flex items-center">
                {[...Array(fullStars)].map((_, i) => (
                    <svg key={`full-${i}`} className="w-6 h-6 text-amber-400 fill-current" viewBox="0 0 20 20">
                        <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                    </svg>
                ))}
                {hasHalfStar && (
                    <svg className="w-6 h-6 text-amber-400" viewBox="0 0 20 20">
                        <defs>
                            <linearGradient id="half-detail">
                                <stop offset="50%" stopColor="currentColor" />
                                <stop offset="50%" stopColor="#d1d5db" stopOpacity="1" />
                            </linearGradient>
                        </defs>
                        <path fill="url(#half-detail)" d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                    </svg>
                )}
                {[...Array(emptyStars)].map((_, i) => (
                    <svg key={`empty-${i}`} className="w-6 h-6 text-gray-300 fill-current" viewBox="0 0 20 20">
                        <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                    </svg>
                ))}
            </div>
        );
    };

    // ============================================
    // 获取当天营业时间
    // ============================================
    const getTodayHours = () => {
        if (!openingHours || openingHours.length === 0) return null;
        
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const today = days[new Date().getDay()];
        
        return openingHours.find(h => h.day === today);
    };

    const todayHours = getTodayHours();

    return (
        <div className="space-y-6">
            {/* ============================================ */}
            {/* 图片轮播 */}
            {/* ============================================ */}
            {images.length > 0 ? (
                <div className="relative h-96 bg-gray-200 rounded-xl overflow-hidden group">
                    <img
                        src={images[currentImageIndex]?.url || images[currentImageIndex]}
                        alt={`${name} - 图片 ${currentImageIndex + 1}`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                            e.target.src = 'https://via.placeholder.com/800x400?text=No+Image';
                        }}
                    />

                    {/* 图片导航按钮 */}
                    {images.length > 1 && (
                        <>
                            <button
                                onClick={prevImage}
                                className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-black/50 hover:bg-black/70 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                            </button>
                            <button
                                onClick={nextImage}
                                className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-black/50 hover:bg-black/70 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </button>

                            {/* 图片指示器 */}
                            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2">
                                {images.map((_, index) => (
                                    <button
                                        key={index}
                                        onClick={() => setCurrentImageIndex(index)}
                                        className={`w-2 h-2 rounded-full transition-all ${
                                            index === currentImageIndex
                                                ? 'bg-white w-8'
                                                : 'bg-white/60 hover:bg-white/80'
                                        }`}
                                    />
                                ))}
                            </div>
                        </>
                    )}

                    {/* 收藏按钮 */}
                    <button
                        onClick={handleFavoriteClick}
                        disabled={favoriteLoading}
                        className="absolute top-4 right-4 p-3 bg-white/90 hover:bg-white rounded-full shadow-lg transition-all hover:scale-110"
                    >
                        <svg
                            className={`w-6 h-6 ${
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
                </div>
            ) : (
                <div className="h-96 bg-gray-200 rounded-xl flex items-center justify-center">
                    <span className="text-6xl">☕</span>
                </div>
            )}

            {/* ============================================ */}
            {/* 主要信息 */}
            {/* ============================================ */}
            <div className="bg-white rounded-xl shadow-md p-6">
                {/* 标题栏 */}
                <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">
                            {name}
                        </h1>
                        <div className="flex items-center space-x-4 mb-3">
                            {renderStars()}
                            <span className="text-xl font-semibold text-gray-900">
                                {rating.toFixed(1)}
                            </span>
                            <span className="text-gray-600">
                                ({reviewCount} 条评论)
                            </span>
                            <span className="text-gray-600">
                                {'$'.repeat(price)}
                            </span>
                        </div>
                    </div>

                    {/* 编辑/删除按钮 */}
                    {canEditCafe && (
                        <div className="flex items-center space-x-2">
                            {onEdit && (
                                <button
                                    onClick={() => onEdit(cafe)}
                                    className="btn btn-outline"
                                >
                                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                    编辑
                                </button>
                            )}
                            {onDelete && (
                                <button
                                    onClick={() => {
                                        if (window.confirm('确定要删除这家咖啡店吗？此操作不可恢复。')) {
                                            onDelete(cafeId);
                                        }
                                    }}
                                    className="btn btn-ghost text-red-600 hover:bg-red-50"
                                >
                                    删除
                                </button>
                            )}
                        </div>
                    )}
                </div>

                {/* 特色标签 */}
                {specialty && (
                    <div className="mb-4">
                        <span className="inline-flex items-center px-4 py-2 bg-amber-100 text-amber-800 text-sm font-medium rounded-full">
                            ⭐ {specialty}
                        </span>
                    </div>
                )}

                {/* 描述 */}
                <p className="text-gray-700 leading-relaxed mb-6">
                    {description}
                </p>

                {/* 设施标签 */}
                {amenities.length > 0 && (
                    <div className="mb-6">
                        <h3 className="text-sm font-semibold text-gray-900 mb-3">设施与服务</h3>
                        <div className="flex flex-wrap gap-2">
                            {amenities.map((amenity, index) => (
                                <span
                                    key={index}
                                    className="inline-flex items-center px-3 py-2 bg-gray-100 text-gray-700 text-sm rounded-lg"
                                >
                                    {getAmenityIcon(amenity)} <span className="ml-1">{amenity}</span>
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {/* 统计信息 */}
                <div className="grid grid-cols-3 gap-4 pt-6 border-t border-gray-200">
                    <div className="text-center">
                        <div className="text-2xl font-bold text-amber-600">{viewCount}</div>
                        <div className="text-sm text-gray-600">浏览量</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-amber-600">{favoriteCount}</div>
                        <div className="text-sm text-gray-600">收藏数</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-amber-600">{reviewCount}</div>
                        <div className="text-sm text-gray-600">评论数</div>
                    </div>
                </div>
            </div>

            {/* ============================================ */}
            {/* 联系信息和营业时间 */}
            {/* ============================================ */}
            <div className="grid md:grid-cols-2 gap-6">
                {/* 联系信息 */}
                <div className="bg-white rounded-xl shadow-md p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">联系信息</h3>
                    <div className="space-y-3">
                        <div className="flex items-start">
                            <svg className="w-5 h-5 text-gray-400 mr-3 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <div>
                                <div className="font-medium text-gray-900">{address}</div>
                                <div className="text-sm text-gray-600">{city}</div>
                            </div>
                        </div>

                        {phoneNumber && (
                            <div className="flex items-center">
                                <svg className="w-5 h-5 text-gray-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                </svg>
                                <a href={`tel:${phoneNumber}`} className="text-amber-600 hover:text-amber-700">
                                    {phoneNumber}
                                </a>
                            </div>
                        )}

                        {website && (
                            <div className="flex items-center">
                                <svg className="w-5 h-5 text-gray-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                                </svg>
                                <a 
                                    href={website} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-amber-600 hover:text-amber-700 truncate"
                                >
                                    {website}
                                </a>
                            </div>
                        )}
                    </div>
                </div>

                {/* 营业时间 */}
                {openingHours && openingHours.length > 0 && (
                    <div className="bg-white rounded-xl shadow-md p-6">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">营业时间</h3>
                        <div className="space-y-2">
                            {openingHours.map((hours, index) => {
                                const isToday = todayHours && todayHours.day === hours.day;
                                return (
                                    <div
                                        key={index}
                                        className={`flex justify-between py-2 ${
                                            isToday ? 'bg-amber-50 -mx-2 px-2 rounded' : ''
                                        }`}
                                    >
                                        <span className={`font-medium ${isToday ? 'text-amber-600' : 'text-gray-700'}`}>
                                            {translateDay(hours.day)}
                                        </span>
                                        <span className={isToday ? 'text-amber-600 font-medium' : 'text-gray-600'}>
                                            {hours.closed ? '休息' : `${hours.open} - ${hours.close}`}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

// ============================================
// 辅助函数
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

const translateDay = (day) => {
    const translation = {
        'Monday': '周一',
        'Tuesday': '周二',
        'Wednesday': '周三',
        'Thursday': '周四',
        'Friday': '周五',
        'Saturday': '周六',
        'Sunday': '周日'
    };
    return translation[day] || day;
};

export default CafeDetail;