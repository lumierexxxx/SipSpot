// ============================================
// SipSpot Frontend - ReviewList Component
// 评论列表组件
// ============================================

import React, { useState } from 'react';
import { useAuth } from '@contexts/AuthContext';

/**
 * ReviewList 组件
 * @param {Array} reviews - 评论数据数组
 * @param {boolean} loading - 加载状态
 * @param {Function} onVote - 投票回调
 * @param {Function} onReport - 举报回调
 * @param {Function} onEdit - 编辑回调
 * @param {Function} onDelete - 删除回调
 * @param {string} sortBy - 排序方式
 * @param {Function} onSortChange - 排序变化回调
 */
const ReviewList = ({
    reviews = [],
    loading = false,
    onVote,
    onReport,
    onEdit,
    onDelete,
    sortBy = '-createdAt',
    onSortChange
}) => {
    const { user, userId, isAdmin, isOwner } = useAuth();

    // ============================================
    // 渲染星星评分
    // ============================================
    const renderStars = (rating) => {
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 >= 0.5;

        return (
            <div className="flex items-center">
                {[...Array(fullStars)].map((_, i) => (
                    <svg key={`full-${i}`} className="w-4 h-4 text-amber-400 fill-current" viewBox="0 0 20 20">
                        <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                    </svg>
                ))}
                {hasHalfStar && (
                    <svg className="w-4 h-4 text-amber-400" viewBox="0 0 20 20">
                        <defs>
                            <linearGradient id="half">
                                <stop offset="50%" stopColor="currentColor" />
                                <stop offset="50%" stopColor="#d1d5db" stopOpacity="1" />
                            </linearGradient>
                        </defs>
                        <path fill="url(#half)" d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                    </svg>
                )}
            </div>
        );
    };

    // ============================================
    // 格式化时间
    // ============================================
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now - date;
        const seconds = Math.floor(diff / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (days > 7) {
            return date.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' });
        }
        if (days > 0) return `${days}天前`;
        if (hours > 0) return `${hours}小时前`;
        if (minutes > 0) return `${minutes}分钟前`;
        return '刚刚';
    };

    // ============================================
    // 加载状态
    // ============================================
    if (loading && reviews.length === 0) {
        return (
            <div className="space-y-4">
                {[...Array(3)].map((_, index) => (
                    <div key={index} className="bg-white rounded-lg p-6 animate-pulse">
                        <div className="flex items-start space-x-4">
                            <div className="w-12 h-12 bg-gray-200 rounded-full" />
                            <div className="flex-1 space-y-3">
                                <div className="h-4 bg-gray-200 rounded w-1/4" />
                                <div className="h-4 bg-gray-200 rounded w-3/4" />
                                <div className="h-4 bg-gray-200 rounded w-full" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    // ============================================
    // 空状态
    // ============================================
    if (reviews.length === 0) {
        return (
            <div className="bg-white rounded-lg p-12 text-center">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-4xl">💬</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    还没有评论
                </h3>
                <p className="text-gray-600">
                    成为第一个分享体验的人！
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* ============================================ */}
            {/* 排序选择器 */}
            {/* ============================================ */}
            {onSortChange && (
                <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-medium text-gray-700">
                        {reviews.length} 条评论
                    </span>
                    <select
                        value={sortBy}
                        onChange={(e) => onSortChange(e.target.value)}
                        className="text-sm border-gray-300 rounded-lg focus:ring-amber-500 focus:border-amber-500"
                    >
                        <option value="-createdAt">最新</option>
                        <option value="createdAt">最早</option>
                        <option value="-rating">评分最高</option>
                        <option value="rating">评分最低</option>
                        <option value="-helpfulCount">最有帮助</option>
                    </select>
                </div>
            )}

            {/* ============================================ */}
            {/* 评论列表 */}
            {/* ============================================ */}
            {reviews.map((review) => {
                const isAuthor = userId && (review.author?._id === userId || review.author?.id === userId);
                const canEdit = isAuthor || isAdmin();
                const hasVoted = review.helpfulVotes?.some(v => v.user === userId);
                const userVote = review.helpfulVotes?.find(v => v.user === userId);

                return (
                    <div key={review._id || review.id} className="bg-white rounded-lg shadow-md p-6 space-y-4">
                        {/* 用户信息和评分 */}
                        <div className="flex items-start justify-between">
                            <div className="flex items-start space-x-3">
                                <img
                                    src={review.author?.avatar || 'https://via.placeholder.com/48'}
                                    alt={review.author?.username}
                                    className="w-12 h-12 rounded-full"
                                />
                                <div>
                                    <div className="flex items-center space-x-2">
                                        <h4 className="font-semibold text-gray-900">
                                            {review.author?.username || '匿名用户'}
                                        </h4>
                                        {review.isVerifiedVisit && (
                                            <span className="badge badge-success text-xs">
                                                ✓ 已验证
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center space-x-2 mt-1">
                                        {renderStars(review.rating)}
                                        <span className="text-sm text-gray-600">
                                            {formatDate(review.createdAt)}
                                        </span>
                                        {review.isEdited && (
                                            <span className="text-xs text-gray-500">(已编辑)</span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* 操作菜单 */}
                            {canEdit && (
                                <div className="flex items-center space-x-2">
                                    {isAuthor && onEdit && (
                                        <button
                                            onClick={() => onEdit(review)}
                                            className="p-2 text-gray-600 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                                            title="编辑"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                            </svg>
                                        </button>
                                    )}
                                    {onDelete && (
                                        <button
                                            onClick={() => {
                                                if (window.confirm('确定要删除这条评论吗？')) {
                                                    onDelete(review._id || review.id);
                                                }
                                            }}
                                            className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                            title="删除"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* 详细评分 */}
                        {review.detailedRatings && Object.values(review.detailedRatings).some(v => v > 0) && (
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-3 border-t border-b border-gray-100">
                                {review.detailedRatings.coffee > 0 && (
                                    <div className="text-center">
                                        <div className="text-xs text-gray-600 mb-1">咖啡</div>
                                        <div className="text-lg font-semibold text-amber-600">
                                            {review.detailedRatings.coffee}
                                        </div>
                                    </div>
                                )}
                                {review.detailedRatings.ambience > 0 && (
                                    <div className="text-center">
                                        <div className="text-xs text-gray-600 mb-1">环境</div>
                                        <div className="text-lg font-semibold text-amber-600">
                                            {review.detailedRatings.ambience}
                                        </div>
                                    </div>
                                )}
                                {review.detailedRatings.service > 0 && (
                                    <div className="text-center">
                                        <div className="text-xs text-gray-600 mb-1">服务</div>
                                        <div className="text-lg font-semibold text-amber-600">
                                            {review.detailedRatings.service}
                                        </div>
                                    </div>
                                )}
                                {review.detailedRatings.value > 0 && (
                                    <div className="text-center">
                                        <div className="text-xs text-gray-600 mb-1">性价比</div>
                                        <div className="text-lg font-semibold text-amber-600">
                                            {review.detailedRatings.value}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* 评论内容 */}
                        <div className="text-gray-700 leading-relaxed">
                            {review.content}
                        </div>

                        {/* 评论图片 */}
                        {review.images && review.images.length > 0 && (
                            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                                {review.images.map((image, index) => (
                                    <img
                                        key={index}
                                        src={image.url || image}
                                        alt={`评论图片 ${index + 1}`}
                                        className="w-full h-24 object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                                        onClick={() => window.open(image.url || image, '_blank')}
                                    />
                                ))}
                            </div>
                        )}

                        {/* AI分析 */}
                        {review.aiAnalysis && (
                            <div className="bg-linear-to-r from-purple-50 to-pink-50 rounded-lg p-4">
                                <div className="flex items-start space-x-2">
                                    <span className="text-2xl">🤖</span>
                                    <div className="flex-1">
                                        <div className="text-sm font-medium text-gray-900 mb-1">
                                            AI 分析
                                        </div>
                                        <p className="text-sm text-gray-700">
                                            {review.aiAnalysis.summary}
                                        </p>
                                        {review.aiAnalysis.keywords && review.aiAnalysis.keywords.length > 0 && (
                                            <div className="flex flex-wrap gap-2 mt-2">
                                                {review.aiAnalysis.keywords.map((keyword, index) => (
                                                    <span
                                                        key={index}
                                                        className="inline-flex items-center px-2 py-1 bg-white/60 text-gray-700 text-xs rounded-md"
                                                    >
                                                        {keyword}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* 店主回复 */}
                        {review.ownerResponse && (
                            <div className="bg-amber-50 rounded-lg p-4 ml-8">
                                <div className="flex items-start space-x-2">
                                    <span className="text-amber-600 font-semibold text-sm">店主回复：</span>
                                </div>
                                <p className="text-sm text-gray-700 mt-1">
                                    {review.ownerResponse.content}
                                </p>
                                <p className="text-xs text-gray-500 mt-2">
                                    {formatDate(review.ownerResponse.respondedAt)}
                                </p>
                            </div>
                        )}

                        {/* 操作按钮 */}
                        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                            <div className="flex items-center space-x-4">
                                {/* 有帮助按钮 */}
                                {onVote && (
                                    <button
                                        onClick={() => onVote(review._id || review.id, 'helpful')}
                                        disabled={!userId}
                                        className={`flex items-center space-x-1 text-sm transition-colors ${
                                            userVote?.vote === 'helpful'
                                                ? 'text-green-600 font-medium'
                                                : 'text-gray-600 hover:text-green-600'
                                        }`}
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                                        </svg>
                                        <span>{review.helpfulCount || 0}</span>
                                    </button>
                                )}

                                {/* 举报按钮 */}
                                {onReport && !isAuthor && userId && (
                                    <button
                                        onClick={() => onReport(review._id || review.id)}
                                        className="text-sm text-gray-600 hover:text-red-600 transition-colors"
                                    >
                                        举报
                                    </button>
                                )}
                            </div>

                            {/* 访问日期 */}
                            {review.visitDate && (
                                <span className="text-xs text-gray-500">
                                    访问于 {new Date(review.visitDate).toLocaleDateString('zh-CN')}
                                </span>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default ReviewList;