// ============================================
// SipSpot Frontend - MyReviewsPage
// 我的评论管理页面
// ============================================

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getUserReviews } from '../services/authAPI';
import { deleteReview } from '../services/cafesAPI';

const MyReviewsPage = () => {
    const navigate = useNavigate();
    const { isLoggedIn } = useAuth();

    // 数据状态
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // 分页
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalCount, setTotalCount] = useState(0);

    // 排序
    const [sortBy, setSortBy] = useState('-createdAt'); // -createdAt, -rating, rating

    // ============================================
    // 如果未登录，重定向到登录页
    // ============================================
    useEffect(() => {
        if (!isLoggedIn) {
            navigate('/login');
        }
    }, [isLoggedIn, navigate]);


    // ============================================
    // 加载评论列表
    // ============================================
    useEffect(() => {
        loadReviews();
    }, [currentPage, sortBy, loadReviews]);

    const loadReviews = useCallback (async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await getUserReviews({
                page: currentPage,
                limit: 10,
                sort: sortBy
            });

            setReviews(response.data || []);
            
            if (response.pagination) {
                setTotalPages(response.pagination.pages);
                setTotalCount(response.pagination.total);
            }

        } catch (err) {
            console.error('Failed to load reviews:', err);
            setError(err.response?.data?.message || '加载失败');
        } finally {
            setLoading(false);
        }
    },[]);

    // ============================================
    // 处理删除评论
    // ============================================
    const handleDeleteReview = async (reviewId) => {
        if (!window.confirm('确定要删除这条评论吗？此操作不可恢复。')) {
            return;
        }

        try {
            await deleteReview(reviewId);
            
            // 从列表中移除
            setReviews(prev => prev.filter(review => 
                (review._id || review.id) !== reviewId
            ));

            // 更新总数
            setTotalCount(prev => prev - 1);

            alert('评论已删除');

        } catch (err) {
            console.error('Failed to delete review:', err);
            alert('删除失败: ' + (err.response?.data?.message || err.message));
        }
    };

    // ============================================
    // 渲染星星评分
    // ============================================
    const renderStars = (rating) => {
        return (
            <div className="flex items-center">
                {[1, 2, 3, 4, 5].map(star => (
                    <svg
                        key={star}
                        className={`w-5 h-5 ${
                            star <= rating ? 'text-amber-400' : 'text-gray-300'
                        } fill-current`}
                        viewBox="0 0 20 20"
                    >
                        <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                    </svg>
                ))}
            </div>
        );
    };

    // ============================================
    // 加载状态
    // ============================================
    if (loading && currentPage === 1) {
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
    if (error && currentPage === 1) {
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
                    <button onClick={loadReviews} className="btn btn-primary">
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
            <div className="container-custom max-w-4xl">
                {/* 页面头部 */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        我的评论
                    </h1>
                    <p className="text-gray-600">
                        {totalCount > 0 
                            ? `你发表了 ${totalCount} 条评论`
                            : '还没有发表任何评论'
                        }
                    </p>
                </div>

                {/* 空状态 */}
                {reviews.length === 0 && !loading ? (
                    <div className="bg-white rounded-xl shadow-md p-12 text-center">
                        <div className="w-24 h-24 bg-linear-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <svg className="w-12 h-12 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">
                            还没有评论
                        </h2>
                        <p className="text-gray-600 mb-8">
                            去咖啡店页面分享你的体验吧！
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link to="/cafes" className="btn btn-primary">
                                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                                浏览咖啡店
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
                            <div className="flex items-center justify-between">
                                <div className="text-sm text-gray-600">
                                    显示 {reviews.length} / {totalCount} 条评论
                                </div>
                                <select
                                    value={sortBy}
                                    onChange={(e) => {
                                        setSortBy(e.target.value);
                                        setCurrentPage(1);
                                    }}
                                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                                >
                                    <option value="-createdAt">最新发表</option>
                                    <option value="createdAt">最早发表</option>
                                    <option value="-rating">评分最高</option>
                                    <option value="rating">评分最低</option>
                                </select>
                            </div>
                        </div>

                        {/* 评论列表 */}
                        <div className="space-y-6">
                            {reviews.map(review => (
                                <div
                                    key={review._id || review.id}
                                    className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow"
                                >
                                    <div className="p-6">
                                        {/* 评论头部 */}
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="flex-1">
                                                {/* 咖啡店链接 */}
                                                <Link
                                                    to={`/cafes/${review.cafe?._id || review.cafe?.id || review.cafe}`}
                                                    className="text-lg font-semibold text-gray-900 hover:text-amber-600 transition-colors"
                                                >
                                                    {review.cafe?.name || '咖啡店'}
                                                </Link>
                                                
                                                {/* 评分和日期 */}
                                                <div className="flex items-center mt-2 space-x-4">
                                                    {renderStars(review.rating)}
                                                    <span className="text-sm text-gray-500">
                                                        {new Date(review.createdAt).toLocaleDateString('zh-CN', {
                                                            year: 'numeric',
                                                            month: 'long',
                                                            day: 'numeric'
                                                        })}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* 操作按钮 */}
                                            <div className="flex items-center space-x-2 ml-4">
                                                <Link
                                                    to={`/cafes/${review.cafe?._id || review.cafe?.id || review.cafe}`}
                                                    className="p-2 text-gray-400 hover:text-amber-600 transition-colors"
                                                    title="查看咖啡店"
                                                >
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                    </svg>
                                                </Link>
                                                <button
                                                    onClick={() => handleDeleteReview(review._id || review.id)}
                                                    className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                                                    title="删除评论"
                                                >
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>

                                        {/* 评论内容 */}
                                        <div className="prose prose-sm max-w-none">
                                            <p className="text-gray-700 whitespace-pre-wrap">
                                                {review.content}
                                            </p>
                                        </div>

                                        {/* 评论图片 */}
                                        {review.images && review.images.length > 0 && (
                                            <div className="mt-4 flex space-x-2 overflow-x-auto">
                                                {review.images.map((image, index) => (
                                                    <img
                                                        key={index}
                                                        src={image.url || image}
                                                        alt={`Review image ${index + 1}`}
                                                        className="h-24 w-24 object-cover rounded-lg shrink-0"
                                                        onError={(e) => {
                                                            e.target.style.display = 'none';
                                                        }}
                                                    />
                                                ))}
                                            </div>
                                        )}

                                        {/* 统计信息 */}
                                        <div className="mt-4 pt-4 border-t border-gray-200 flex items-center text-sm text-gray-600">
                                            <div className="flex items-center mr-6">
                                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                                                </svg>
                                                {review.helpfulCount || 0} 有帮助
                                            </div>
                                            {review.visitDate && (
                                                <div className="flex items-center">
                                                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                    </svg>
                                                    访问日期: {new Date(review.visitDate).toLocaleDateString('zh-CN')}
                                                </div>
                                            )}
                                        </div>

                                        {/* 店主回复 */}
                                        {review.ownerResponse && (
                                            <div className="mt-4 p-4 bg-amber-50 rounded-lg border border-amber-200">
                                                <div className="flex items-start">
                                                    <div className="shrink-0">
                                                        <svg className="w-5 h-5 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
                                                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clipRule="evenodd" />
                                                        </svg>
                                                    </div>
                                                    <div className="ml-3">
                                                        <p className="text-sm font-medium text-amber-900">店主回复:</p>
                                                        <p className="mt-1 text-sm text-amber-800">
                                                            {review.ownerResponse.content}
                                                        </p>
                                                        <p className="mt-1 text-xs text-amber-600">
                                                            {new Date(review.ownerResponse.createdAt).toLocaleDateString('zh-CN')}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* 分页 */}
                        {totalPages > 1 && (
                            <div className="mt-8 flex justify-center">
                                <nav className="flex items-center space-x-2">
                                    <button
                                        onClick={() => setCurrentPage(prev => prev - 1)}
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
                                                    onClick={() => setCurrentPage(page)}
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
                                        onClick={() => setCurrentPage(prev => prev + 1)}
                                        disabled={currentPage === totalPages}
                                        className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        下一页
                                    </button>
                                </nav>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default MyReviewsPage;