// ============================================
// SipSpot Frontend - CafeDetailPage
// 咖啡店详情页面 - 整合所有相关组件
// ============================================

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import CafeDetail from '../components/CafeDetail';
import Map from '../components/Map';
import ReviewForm from '../components/ReviewForm';
import ReviewList from '../components/ReviewList';
import AIAnalysis from '../components/AIAnalysis';
import {
    getCafeById,
    getReviews,
    toggleFavorite,
    deleteCafe,
    createReview,
    getReviewSentimentStats
} from '../services/cafesAPI';

const CafeDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { isLoggedIn, userId } = useAuth();

    // 状态管理
    const [cafe, setCafe] = useState(null);
    const [reviews, setReviews] = useState([]);
    const [sentimentStats, setSentimentStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [reviewsLoading, setReviewsLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // 分页和排序
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [sortBy, setSortBy] = useState('-createdAt'); // -createdAt, -rating, -helpful
    
    // UI 状态
    const [showReviewForm, setShowReviewForm] = useState(false);
    const [showAIAnalysis, setShowAIAnalysis] = useState(false);

    // ============================================
    // 加载咖啡店数据
    // ============================================
    useEffect(() => {
        loadCafeData();
    }, [id]);

    // ============================================
    // 加载评论数据
    // ============================================
    useEffect(() => {
        if (cafe) {
            loadReviews();
        }
    }, [cafe, currentPage, sortBy]);

    const loadCafeData = async () => {
        try {
            setLoading(true);
            setError(null);
            
            const response = await getCafeById(id);
            setCafe(response.data);
            
            // 加载情感统计
            try {
                const sentimentResponse = await getReviewSentimentStats(id);
                setSentimentStats(sentimentResponse.data);
            } catch (err) {
                console.error('Failed to load sentiment stats:', err);
            }
            
        } catch (err) {
            console.error('Failed to load cafe:', err);
            setError(err.response?.data?.message || '加载咖啡店信息失败');
        } finally {
            setLoading(false);
        }
    };

    const loadReviews = async () => {
        try {
            setReviewsLoading(true);
            const response = await getReviews(id, {
                page: currentPage,
                limit: 10,
                sort: sortBy
            });
            
            setReviews(response.data || []);
            
            if (response.pagination) {
                setTotalPages(response.pagination.pages);
            }
        } catch (err) {
            console.error('Failed to load reviews:', err);
        } finally {
            setReviewsLoading(false);
        }
    };

    // ============================================
    // 处理收藏
    // ============================================
    const handleFavoriteToggle = async (cafeId, isFavorited) => {
        try {
            await toggleFavorite(cafeId, !isFavorited);
            
            // 更新本地状态
            setCafe(prev => ({
                ...prev,
                isFavorited: !isFavorited,
                favoriteCount: !isFavorited 
                    ? prev.favoriteCount + 1 
                    : prev.favoriteCount - 1
            }));
        } catch (error) {
            console.error('Toggle favorite failed:', error);
            throw error;
        }
    };

    // ============================================
    // 处理编辑
    // ============================================
    const handleEdit = () => {
        navigate(`/cafes/${id}/edit`);
    };

    // ============================================
    // 处理删除
    // ============================================
    const handleDelete = async (cafeId) => {
        try {
            await deleteCafe(cafeId);
            navigate('/cafes');
        } catch (error) {
            console.error('Delete cafe failed:', error);
            alert('删除失败: ' + (error.response?.data?.message || error.message));
        }
    };

    // ============================================
    // 处理评论提交
    // ============================================
    const handleReviewSubmit = async (reviewData, images) => {
        try {
            await createReview(id, reviewData, images);
            
            // 重新加载咖啡店数据和评论
            await loadCafeData();
            await loadReviews();
            
            // 关闭评论表单
            setShowReviewForm(false);
            
            // 显示成功消息
            alert('评论提交成功!');
        } catch (error) {
            console.error('Submit review failed:', error);
            throw error;
        }
    };

    // ============================================
    // 处理评论更新
    // ============================================
    const handleReviewUpdate = async () => {
        await loadReviews();
        await loadCafeData(); // 更新咖啡店的评分统计
    };

    // ============================================
    // 处理排序变化
    // ============================================
    const handleSortChange = (newSort) => {
        setSortBy(newSort);
        setCurrentPage(1);
    };

    // ============================================
    // 处理分页
    // ============================================
    const handlePageChange = (page) => {
        setCurrentPage(page);
        window.scrollTo({ top: 0, behavior: 'smooth' });
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
                        onClick={() => navigate('/cafes')}
                        className="btn btn-primary"
                    >
                        返回咖啡店列表
                    </button>
                </div>
            </div>
        );
    }

    // ============================================
    // 咖啡店不存在
    // ============================================
    if (!cafe) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center max-w-md">
                    <div className="text-6xl mb-4">☕</div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">咖啡店不存在</h2>
                    <p className="text-gray-600 mb-6">抱歉,找不到这家咖啡店</p>
                    <button
                        onClick={() => navigate('/cafes')}
                        className="btn btn-primary"
                    >
                        返回咖啡店列表
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
                {/* 面包屑导航 */}
                <nav className="flex items-center space-x-2 text-sm text-gray-600 mb-6">
                    <button
                        onClick={() => navigate('/')}
                        className="hover:text-amber-600 transition-colors"
                    >
                        首页
                    </button>
                    <span>/</span>
                    <button
                        onClick={() => navigate('/cafes')}
                        className="hover:text-amber-600 transition-colors"
                    >
                        咖啡店
                    </button>
                    <span>/</span>
                    <span className="text-gray-900 font-medium">{cafe.name}</span>
                </nav>

                <div className="grid lg:grid-cols-3 gap-8">
                    {/* 左侧主要内容 */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* 咖啡店详情 */}
                        <CafeDetail
                            cafe={cafe}
                            onFavoriteToggle={handleFavoriteToggle}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                        />

                        {/* AI 分析 */}
                        {sentimentStats && (
                            <div className="bg-white rounded-xl shadow-md p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-xl font-bold text-gray-900">
                                        AI 情感分析
                                    </h2>
                                    <button
                                        onClick={() => setShowAIAnalysis(!showAIAnalysis)}
                                        className="text-sm text-amber-600 hover:text-amber-700"
                                    >
                                        {showAIAnalysis ? '隐藏' : '展开'}
                                    </button>
                                </div>
                                
                                {showAIAnalysis && (
                                    <AIAnalysis
                                        cafeId={id}
                                        sentimentStats={sentimentStats}
                                    />
                                )}
                            </div>
                        )}

                        {/* 评论表单 */}
                        {isLoggedIn && (
                            <div className="bg-white rounded-xl shadow-md p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-xl font-bold text-gray-900">
                                        写评论
                                    </h2>
                                    {!showReviewForm && (
                                        <button
                                            onClick={() => setShowReviewForm(true)}
                                            className="btn btn-primary"
                                        >
                                            添加评论
                                        </button>
                                    )}
                                </div>
                                
                                {showReviewForm && (
                                    <ReviewForm
                                        cafeId={id}
                                        onSubmit={handleReviewSubmit}
                                        onCancel={() => setShowReviewForm(false)}
                                    />
                                )}
                            </div>
                        )}

                        {/* 评论列表 */}
                        <div className="bg-white rounded-xl shadow-md p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold text-gray-900">
                                    用户评论 ({cafe.reviewCount || 0})
                                </h2>
                                
                                {/* 排序选择器 */}
                                <select
                                    value={sortBy}
                                    onChange={(e) => handleSortChange(e.target.value)}
                                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                                >
                                    <option value="-createdAt">最新</option>
                                    <option value="-rating">评分最高</option>
                                    <option value="-helpful">最有帮助</option>
                                    <option value="createdAt">最早</option>
                                </select>
                            </div>

                            <ReviewList
                                cafeId={id}
                                reviews={reviews}
                                loading={reviewsLoading}
                                onReviewUpdate={handleReviewUpdate}
                            />

                            {/* 分页 */}
                            {totalPages > 1 && (
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
                                            // 只显示当前页附近的页码
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

                    {/* 右侧边栏 */}
                    <div className="lg:col-span-1 space-y-6">
                        {/* 地图 */}
                        {cafe.geometry && (
                            <div className="bg-white rounded-xl shadow-md p-4 sticky top-24">
                                <h3 className="text-lg font-bold text-gray-900 mb-4">
                                    位置
                                </h3>
                                <Map
                                    center={{
                                        lat: cafe.geometry.coordinates[1],
                                        lng: cafe.geometry.coordinates[0]
                                    }}
                                    markers={[{
                                        id: cafe._id || cafe.id,
                                        position: {
                                            lat: cafe.geometry.coordinates[1],
                                            lng: cafe.geometry.coordinates[0]
                                        },
                                        title: cafe.name,
                                        cafe: cafe
                                    }]}
                                    zoom={15}
                                    height="300px"
                                />
                                
                                {/* 导航按钮 */}
                                <a
                                    href={`https://www.google.com/maps/dir/?api=1&destination=${cafe.geometry.coordinates[1]},${cafe.geometry.coordinates[0]}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="btn btn-primary w-full mt-4"
                                >
                                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                                    </svg>
                                    导航到这里
                                </a>
                            </div>
                        )}

                        {/* 快速操作 */}
                        <div className="bg-linear-to-br from-amber-50 to-orange-50 rounded-xl shadow-md p-6">
                            <h3 className="text-lg font-bold text-gray-900 mb-4">
                                快速操作
                            </h3>
                            <div className="space-y-3">
                                {!isLoggedIn && (
                                    <button
                                        onClick={() => navigate('/login')}
                                        className="w-full btn btn-primary"
                                    >
                                        登录以添加评论
                                    </button>
                                )}
                                
                                <button
                                    onClick={() => window.print()}
                                    className="w-full btn btn-ghost"
                                >
                                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                                    </svg>
                                    打印
                                </button>
                                
                                <button
                                    onClick={() => {
                                        navigator.share({
                                            title: cafe.name,
                                            text: cafe.description,
                                            url: window.location.href
                                        }).catch(() => {
                                            // 如果不支持分享,复制链接
                                            navigator.clipboard.writeText(window.location.href);
                                            alert('链接已复制到剪贴板!');
                                        });
                                    }}
                                    className="w-full btn btn-ghost"
                                >
                                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                                    </svg>
                                    分享
                                </button>
                            </div>
                        </div>

                        {/* 相关推荐(可以后续添加) */}
                        {/* <div className="bg-white rounded-xl shadow-md p-6">
                            <h3 className="text-lg font-bold text-gray-900 mb-4">
                                附近推荐
                            </h3>
                        </div> */}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CafeDetailPage;