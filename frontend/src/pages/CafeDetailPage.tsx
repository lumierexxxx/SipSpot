// ============================================
// SipSpot Frontend - CafeDetailPage (AI增强版)
// 咖啡店详情页面 - 包含AI总结和多维度评分展示
// ============================================

import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '@contexts/AuthContext'
import Map from '@components/Map'
import * as cafesAPI from '@services/cafesAPI'
import * as usersAPI from '@services/usersAPI'
import type { ICafe } from '@/types'
import type { IReview } from '@/types'

export default function CafeDetailPage() {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const { isLoggedIn, user } = useAuth()

    // 状态管理
    const [cafe, setCafe] = useState<ICafe | null>(null)
    const [reviews, setReviews] = useState<IReview[]>([])
    const [averageRatings, setAverageRatings] = useState<Record<string, string> | null>(null)
    const [loading, setLoading] = useState<boolean>(true)
    const [reviewsLoading, setReviewsLoading] = useState<boolean>(false)
    const [error, setError] = useState<string | null>(null)
    const [isFavorited, setIsFavorited] = useState<boolean>(() => user?.favorites?.includes(id ?? '') ?? false)
    const [favoriteLoading, setFavoriteLoading] = useState<boolean>(false)
    const [reviewFeedback, setReviewFeedback] = useState<{ type: 'success' | 'error', message: string } | null>(null)

    // 分页和排序
    const [currentPage, setCurrentPage] = useState<number>(1)
    const [totalPages, setTotalPages] = useState<number>(1)
    const [sortBy, setSortBy] = useState<string>('-createdAt')

    // UI状态
    const [showReviewForm, setShowReviewForm] = useState<boolean>(false)
    const [activeTab, setActiveTab] = useState<string>('overview')

    // ============================================
    // 计算多维度平均评分
    // ============================================
    const calculateAverageRatings = useCallback((reviewsList: IReview[]): void => {
        if (!reviewsList || reviewsList.length === 0) {
            setAverageRatings(null)
            return
        }

        const totals = {
            taste: 0,
            price: 0,
            environment: 0,
            service: 0,
            workspace: 0,
            count: 0
        }

        reviewsList.forEach(review => {
            if (review.ratings) {
                totals.taste += review.ratings.taste || 0
                totals.price += review.ratings.price || 0
                totals.environment += review.ratings.environment || 0
                totals.service += review.ratings.service || 0
                totals.workspace += review.ratings.workspace || 0
                totals.count++
            }
        })

        if (totals.count > 0) {
            setAverageRatings({
                taste: (totals.taste / totals.count).toFixed(1),
                price: (totals.price / totals.count).toFixed(1),
                environment: (totals.environment / totals.count).toFixed(1),
                service: (totals.service / totals.count).toFixed(1),
                workspace: (totals.workspace / totals.count).toFixed(1)
            })
        }
    }, [])

    // ============================================
    // 加载咖啡店数据
    // ============================================
    const loadCafeData = useCallback(async (): Promise<void> => {
        if (!id) return
        try {
            setLoading(true)
            setError(null)
            const response = await cafesAPI.getCafeById(id)
            setCafe(response.data ?? null)
        } catch (err) {
            setError(err instanceof Error ? err.message : '加载咖啡店失败')
        } finally {
            setLoading(false)
        }
    }, [id])

    const loadReviews = useCallback(async (): Promise<void> => {
        if (!id) return
        try {
            setReviewsLoading(true)
            const response = await cafesAPI.getReviews(id, { page: currentPage, limit: 10, sort: sortBy })
            const reviewsList = (response.data ?? []) as IReview[]
            setReviews(reviewsList)
            const pagination = (response as Record<string, unknown>).pagination as { pages?: number } | undefined
            if (pagination?.pages) {
                setTotalPages(pagination.pages)
            }
            calculateAverageRatings(reviewsList)
        } catch {
            // silently fail — reviews are non-critical
        } finally {
            setReviewsLoading(false)
        }
    }, [id, currentPage, sortBy, calculateAverageRatings])

    useEffect(() => {
        loadCafeData()
    }, [loadCafeData])

    const cafeId = cafe?._id
    useEffect(() => {
        if (cafeId) {
            loadReviews()
        }
    }, [loadReviews, cafeId])

    useEffect(() => {
        if (user && cafe) {
            setIsFavorited(user.favorites?.includes(cafe._id) ?? false)
        }
    }, [user, cafe])

    // ============================================
    // 处理收藏
    // ============================================
    const handleFavoriteToggle = async (): Promise<void> => {
        if (!isLoggedIn) { navigate('/login'); return }
        if (!cafe || favoriteLoading) return
        try {
            setFavoriteLoading(true)
            const newState = await usersAPI.toggleFavorite(cafe._id, isFavorited)
            setIsFavorited(newState)
            setCafe(prev => prev ? {
                ...prev,
                favoriteCount: (prev.favoriteCount ?? 0) + (newState ? 1 : -1)
            } : prev)
        } catch {
            // ignore
        } finally {
            setFavoriteLoading(false)
        }
    }

    // ============================================
    // 处理评论提交
    // ============================================
    const handleReviewSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
        e.preventDefault()

        if (!isLoggedIn) { navigate('/login'); return }
        if (!id) return

        const formData = new FormData(e.currentTarget)
        const reviewData = {
            content: formData.get('content') as string,
            rating: parseFloat(formData.get('rating') as string),
            ratings: {
                taste: parseFloat(formData.get('taste') as string),
                price: parseFloat(formData.get('price') as string),
                environment: parseFloat(formData.get('environment') as string),
                service: parseFloat(formData.get('service') as string),
                workspace: parseFloat(formData.get('workspace') as string),
            }
        }

        try {
            await cafesAPI.createReview(id, reviewData as Record<string, unknown>)
            await loadCafeData()
            await loadReviews()
            setShowReviewForm(false)
            setReviewFeedback({ type: 'success', message: '评论提交成功！' })
        } catch (err) {
            setReviewFeedback({ type: 'error', message: '提交失败: ' + (err instanceof Error ? err.message : '未知错误') })
        }
    }

    // ============================================
    // 处理页面变化
    // ============================================
    const handlePageChange = (page: number): void => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page)
            window.scrollTo({ top: 0, behavior: 'smooth' })
        }
    }

    // ============================================
    // 渲染加载状态
    // ============================================
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="text-6xl mb-4 animate-bounce">☕</div>
                    <p className="text-gray-600 text-lg">加载中...</p>
                </div>
            </div>
        )
    }

    // ============================================
    // 渲染错误状态
    // ============================================
    if (error || !cafe) {
        return (
            <div className="min-h-screen flex items-center justify-center px-4">
                <div className="max-w-md w-full bg-red-50 border border-red-200 rounded-lg p-6">
                    <div className="text-center">
                        <div className="text-4xl mb-4">❌</div>
                        <p className="text-red-600 mb-2 font-semibold text-lg">加载失败</p>
                        <p className="text-red-500 text-sm mb-4">{error || '咖啡店不存在'}</p>
                        <div className="space-y-2">
                            <button
                                onClick={loadCafeData}
                                className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                            >
                                🔄 重试
                            </button>
                            <button
                                onClick={() => navigate('/cafes')}
                                className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                            >
                                ← 返回列表
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    // ============================================
    // 主渲染
    // ============================================
    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
            {/* 头图 - 更大更醒目 */}
            {cafe.images && cafe.images.length > 0 ? (
                <div className="relative h-[500px] bg-gray-900">
                    <img
                        src={(() => {
                            const img = cafe.images[0]
                            return typeof img === 'string' ? img : (img?.url ?? img?.cardImage ?? '')
                        })()}
                        alt={cafe.name}
                        className="w-full h-full object-cover opacity-90"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

                    {/* 返回按钮 */}
                    <button
                        onClick={() => navigate(-1)}
                        className="absolute top-6 left-6 px-5 py-3 bg-white/95 hover:bg-white rounded-xl shadow-lg transition flex items-center gap-2 font-semibold"
                    >
                        <span className="text-xl">←</span>
                        <span>返回</span>
                    </button>

                    {/* 标题层 - 更大更醒目 */}
                    <div className="absolute bottom-0 left-0 right-0 p-10">
                        <div className="max-w-7xl mx-auto">
                            <h1 className="text-5xl font-bold text-white mb-4 drop-shadow-lg">
                                {cafe.name}
                            </h1>

                            {/* 核心信息 - 更大更醒目 */}
                            <div className="flex flex-wrap items-center gap-6 text-white">
                                {/* 评分 */}
                                <div className="flex items-center gap-2 bg-amber-500/90 px-5 py-3 rounded-xl backdrop-blur-sm">
                                    <span className="text-3xl">⭐</span>
                                    <div>
                                        <div className="text-2xl font-bold leading-none">
                                            {cafe.rating?.toFixed(1) || 'N/A'}
                                        </div>
                                        <div className="text-sm text-amber-100">
                                            {cafe.reviewCount || 0}条评论
                                        </div>
                                    </div>
                                </div>

                                {/* 价格 */}
                                <div className="flex items-center gap-2 bg-white/20 px-5 py-3 rounded-xl backdrop-blur-sm">
                                    <span className="text-3xl">💰</span>
                                    <div>
                                        <div className="text-2xl font-bold leading-none">
                                            {'$'.repeat(cafe.price || 2)}
                                        </div>
                                        <div className="text-sm text-gray-200">
                                            价格等级
                                        </div>
                                    </div>
                                </div>

                                {/* 位置 */}
                                {cafe.city && (
                                    <div className="flex items-center gap-2 bg-white/20 px-5 py-3 rounded-xl backdrop-blur-sm">
                                        <span className="text-3xl">📍</span>
                                        <div>
                                            <div className="text-xl font-semibold leading-none">
                                                {cafe.city}
                                            </div>
                                            <div className="text-sm text-gray-200">
                                                {cafe.address?.split('区')[0]}区
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="bg-gradient-to-r from-green-600 via-green-700 to-green-800 text-white py-16">
                    <div className="max-w-7xl mx-auto px-4">
                        <button
                            onClick={() => navigate(-1)}
                            className="mb-6 px-5 py-3 bg-white/20 hover:bg-white/30 rounded-xl transition flex items-center gap-2"
                        >
                            <span className="text-xl">←</span>
                            <span>返回</span>
                        </button>
                        <h1 className="text-5xl font-bold mb-4">{cafe.name}</h1>
                        <div className="flex items-center gap-6 text-xl">
                            <span>⭐ {cafe.rating?.toFixed(1) || 'N/A'} ({cafe.reviewCount || 0}条评论)</span>
                            <span>•</span>
                            <span>💰 {'$'.repeat(cafe.price || 2)}</span>
                        </div>
                    </div>
                </div>
            )}

            {/* 主内容 */}
            <div className="max-w-7xl mx-auto px-4 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* 左侧主内容 */}
                    <div className="lg:col-span-2 space-y-6">

                        {/* 标签导航 */}
                        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                            <div className="border-b border-gray-200">
                                <div className="flex">
                                    <button
                                        onClick={() => setActiveTab('overview')}
                                        className={`flex-1 px-6 py-4 font-semibold text-lg transition ${
                                            activeTab === 'overview'
                                                ? 'text-green-600 bg-green-50 border-b-4 border-green-600'
                                                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                                        }`}
                                    >
                                        🎯 概览
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('reviews')}
                                        className={`flex-1 px-6 py-4 font-semibold text-lg transition ${
                                            activeTab === 'reviews'
                                                ? 'text-green-600 bg-green-50 border-b-4 border-green-600'
                                                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                                        }`}
                                    >
                                        💬 评论 ({cafe.reviewCount || 0})
                                    </button>
                                    {cafe.geometry && (
                                        <button
                                            onClick={() => setActiveTab('map')}
                                            className={`flex-1 px-6 py-4 font-semibold text-lg transition ${
                                                activeTab === 'map'
                                                    ? 'text-green-600 bg-green-50 border-b-4 border-green-600'
                                                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                                            }`}
                                        >
                                            🗺️ 位置
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="p-8">
                                {/* 概览标签页 */}
                                {activeTab === 'overview' && (
                                    <div className="space-y-8">
                                        {/* AI 总结卡片 */}
                                        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border-2 border-blue-200">
                                            <div className="flex items-center gap-3 mb-4">
                                                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                                                    <span className="text-white text-xl">🤖</span>
                                                </div>
                                                <h3 className="text-xl font-bold text-gray-900">
                                                    AI 智能总结
                                                </h3>
                                            </div>
                                            <p className="text-gray-700 leading-relaxed text-lg">
                                                {cafe.description}
                                            </p>
                                        </div>

                                        {/* 多维度评分 */}
                                        {averageRatings && (
                                            <div className="bg-white rounded-2xl p-6 border-2 border-gray-200">
                                                <h3 className="text-xl font-bold text-gray-900 mb-6">
                                                    用户评价（基于 {reviews.length} 条评论）
                                                </h3>
                                                <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
                                                    {[
                                                        { key: 'taste', label: '口味', icon: '☕', color: 'from-amber-500 to-orange-500' },
                                                        { key: 'price', label: '价格', icon: '💰', color: 'from-green-500 to-emerald-500' },
                                                        { key: 'environment', label: '环境', icon: '🏠', color: 'from-blue-500 to-cyan-500' },
                                                        { key: 'service', label: '服务', icon: '👨‍💼', color: 'from-purple-500 to-pink-500' },
                                                        { key: 'workspace', label: '办公', icon: '💻', color: 'from-indigo-500 to-blue-500' }
                                                    ].map(item => (
                                                        <div key={item.key} className="text-center">
                                                            <div className={`w-20 h-20 mx-auto mb-3 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center shadow-lg transform hover:scale-110 transition`}>
                                                                <span className="text-4xl">{item.icon}</span>
                                                            </div>
                                                            <div className="text-sm font-semibold text-gray-600 mb-1">
                                                                {item.label}
                                                            </div>
                                                            <div className="text-3xl font-bold text-gray-900">
                                                                {averageRatings[item.key]}
                                                            </div>
                                                            <div className="text-xs text-gray-400">
                                                                / 5.0
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* 基本信息 */}
                                        <div className="bg-white rounded-2xl p-6 border-2 border-gray-200">
                                            <h3 className="text-xl font-bold text-gray-900 mb-4">
                                                基本信息
                                            </h3>

                                            <div className="space-y-4">
                                                <div className="flex items-start gap-3">
                                                    <span className="text-2xl">📍</span>
                                                    <div className="flex-1">
                                                        <div className="text-sm text-gray-500 mb-1">地址</div>
                                                        <div className="text-gray-900 font-medium">{cafe.address}</div>
                                                    </div>
                                                </div>

                                                {cafe.phoneNumber && (
                                                    <div className="flex items-start gap-3">
                                                        <span className="text-2xl">📞</span>
                                                        <div className="flex-1">
                                                            <div className="text-sm text-gray-500 mb-1">电话</div>
                                                            <a
                                                                href={`tel:${cafe.phoneNumber}`}
                                                                className="text-green-600 hover:underline font-medium"
                                                            >
                                                                {cafe.phoneNumber}
                                                            </a>
                                                        </div>
                                                    </div>
                                                )}

                                                {cafe.specialty && (
                                                    <div className="flex items-start gap-3">
                                                        <span className="text-2xl">☕</span>
                                                        <div className="flex-1">
                                                            <div className="text-sm text-gray-500 mb-1">特色</div>
                                                            <div className="text-gray-900 font-medium">{cafe.specialty}</div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* 设施标签 */}
                                        {cafe.amenities && cafe.amenities.length > 0 && (
                                            <div className="bg-white rounded-2xl p-6 border-2 border-gray-200">
                                                <h3 className="text-xl font-bold text-gray-900 mb-4">
                                                    设施与服务
                                                </h3>
                                                <div className="flex flex-wrap gap-3">
                                                    {cafe.amenities.map((amenity, index) => (
                                                        <span
                                                            key={index}
                                                            className="px-4 py-2 bg-gradient-to-r from-amber-50 to-orange-50 text-amber-800 rounded-xl text-sm font-semibold border-2 border-amber-200"
                                                        >
                                                            {amenity}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* 评论标签页 */}
                                {activeTab === 'reviews' && (
                                    <div>
                                        {/* 写评论按钮 */}
                                        {isLoggedIn && !showReviewForm && (
                                            <button
                                                onClick={() => setShowReviewForm(true)}
                                                className="mb-6 w-full px-6 py-4 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl hover:from-green-700 hover:to-green-800 transition font-bold text-lg shadow-lg"
                                            >
                                                ✍️ 写评论
                                            </button>
                                        )}

                                        {!isLoggedIn && (
                                            <button
                                                onClick={() => navigate('/login')}
                                                className="mb-6 w-full px-6 py-4 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition font-semibold"
                                            >
                                                登录后可写评论
                                            </button>
                                        )}

                                        {/* 评论表单 */}
                                        {showReviewForm && (
                                            <form onSubmit={handleReviewSubmit} className="mb-6 p-6 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border-2 border-green-200">
                                                <div className="flex items-center justify-between mb-4">
                                                    <h3 className="font-bold text-xl">写评论</h3>
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowReviewForm(false)}
                                                        className="text-gray-500 hover:text-gray-700 text-2xl"
                                                    >
                                                        ✕
                                                    </button>
                                                </div>

                                                <div className="mb-4">
                                                    <label className="block text-sm font-semibold mb-2">
                                                        总体评分 *
                                                    </label>
                                                    <select
                                                        name="rating"
                                                        required
                                                        className="w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                                    >
                                                        <option value="">选择评分</option>
                                                        <option value="5">⭐⭐⭐⭐⭐ (5分 - 完美)</option>
                                                        <option value="4.5">⭐⭐⭐⭐ (4.5分)</option>
                                                        <option value="4">⭐⭐⭐⭐ (4分 - 很好)</option>
                                                        <option value="3.5">⭐⭐⭐ (3.5分)</option>
                                                        <option value="3">⭐⭐⭐ (3分 - 一般)</option>
                                                        <option value="2.5">⭐⭐ (2.5分)</option>
                                                        <option value="2">⭐⭐ (2分 - 较差)</option>
                                                        <option value="1.5">⭐ (1.5分)</option>
                                                        <option value="1">⭐ (1分 - 很差)</option>
                                                    </select>
                                                </div>

                                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
                                                    {[
                                                        { name: 'taste', label: '☕ 口味' },
                                                        { name: 'price', label: '💰 价格' },
                                                        { name: 'environment', label: '🏠 环境' },
                                                        { name: 'service', label: '👨‍💼 服务' },
                                                        { name: 'workspace', label: '💻 办公' }
                                                    ].map(field => (
                                                        <div key={field.name}>
                                                            <label className="block text-xs font-semibold mb-1">
                                                                {field.label}
                                                            </label>
                                                            <input
                                                                type="number"
                                                                name={field.name}
                                                                min="1"
                                                                max="5"
                                                                step="0.5"
                                                                required
                                                                className="w-full px-3 py-2 border-2 rounded-lg text-sm"
                                                                placeholder="1-5"
                                                            />
                                                        </div>
                                                    ))}
                                                </div>

                                                <div className="mb-4">
                                                    <label className="block text-sm font-semibold mb-2">
                                                        评论内容 * (至少10个字)
                                                    </label>
                                                    <textarea
                                                        name="content"
                                                        required
                                                        minLength={10}
                                                        rows={4}
                                                        className="w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-green-500"
                                                        placeholder="分享你的体验..."
                                                    />
                                                </div>

                                                <div className="flex gap-2">
                                                    <button
                                                        type="submit"
                                                        className="flex-1 px-4 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 font-bold"
                                                    >
                                                        ✓ 提交评论
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowReviewForm(false)}
                                                        className="px-4 py-3 bg-gray-200 rounded-xl hover:bg-gray-300"
                                                    >
                                                        取消
                                                    </button>
                                                </div>
                                            </form>
                                        )}

                                        {reviewFeedback && (
                                            <div className={`mb-4 px-4 py-3 rounded-xl text-sm font-semibold ${reviewFeedback.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                                                {reviewFeedback.message}
                                            </div>
                                        )}

                                        <div className="mb-4 flex items-center justify-between">
                                            <span className="text-sm text-gray-600 font-semibold">
                                                共 {cafe.reviewCount || 0} 条评论
                                            </span>
                                            <select
                                                value={sortBy}
                                                onChange={(e) => setSortBy(e.target.value)}
                                                className="px-4 py-2 border-2 rounded-xl text-sm"
                                            >
                                                <option value="-createdAt">最新优先</option>
                                                <option value="-rating">评分最高</option>
                                                <option value="createdAt">最早优先</option>
                                            </select>
                                        </div>

                                        {reviewsLoading ? (
                                            <div className="text-center py-12">
                                                <div className="text-4xl mb-2 animate-spin inline-block">⏳</div>
                                                <p className="text-gray-500">加载评论中...</p>
                                            </div>
                                        ) : reviews.length > 0 ? (
                                            <div className="space-y-6">
                                                {reviews.map(review => {
                                                    const author = typeof review.author === 'string' ? null : review.author
                                                    return (
                                                        <div key={review._id} className="bg-white rounded-xl p-6 border-2 border-gray-200 hover:border-green-200 transition">
                                                            <div className="flex items-start justify-between mb-3">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center">
                                                                        {author?.avatar ? (
                                                                            <img
                                                                                src={author.avatar}
                                                                                alt={author.username}
                                                                                className="w-full h-full rounded-full"
                                                                            />
                                                                        ) : (
                                                                            <span className="text-white text-lg font-bold">
                                                                                {author?.username?.charAt(0).toUpperCase() || '?'}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                    <div>
                                                                        <div className="font-semibold">
                                                                            {author?.username || '匿名用户'}
                                                                        </div>
                                                                        <div className="text-xs text-gray-500">
                                                                            {new Date(review.createdAt).toLocaleDateString()}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <div className="bg-amber-100 px-4 py-2 rounded-xl">
                                                                    <span className="text-amber-600 font-bold text-lg">
                                                                        ⭐ {review.rating?.toFixed(1)}
                                                                    </span>
                                                                </div>
                                                            </div>

                                                            {review.ratings && (
                                                                <div className="grid grid-cols-5 gap-2 mb-3 text-xs">
                                                                    {[
                                                                        { key: 'taste', label: '口味', icon: '☕' },
                                                                        { key: 'price', label: '价格', icon: '💰' },
                                                                        { key: 'environment', label: '环境', icon: '🏠' },
                                                                        { key: 'service', label: '服务', icon: '👨‍💼' },
                                                                        { key: 'workspace', label: '办公', icon: '💻' }
                                                                    ].map(item => (
                                                                        <div key={item.key} className="text-center bg-gray-50 rounded-lg py-2">
                                                                            <div className="text-gray-500 mb-1">
                                                                                {item.icon} {item.label}
                                                                            </div>
                                                                            <div className="font-bold text-gray-900">
                                                                                {review.ratings[item.key as keyof typeof review.ratings] ?? 0}
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            )}

                                                            <p className="text-gray-700 leading-relaxed">{review.content}</p>
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        ) : (
                                            <div className="text-center py-12">
                                                <div className="text-5xl mb-3">💬</div>
                                                <p className="text-gray-500 mb-2">暂无评论</p>
                                                <p className="text-sm text-gray-400">成为第一个评论的人吧！</p>
                                            </div>
                                        )}

                                        {totalPages > 1 && (
                                            <div className="mt-6 flex justify-center gap-2">
                                                <button
                                                    onClick={() => handlePageChange(currentPage - 1)}
                                                    disabled={currentPage === 1}
                                                    className="px-4 py-2 border-2 rounded-xl disabled:opacity-50"
                                                >
                                                    ← 上一页
                                                </button>
                                                <span className="px-4 py-2 text-sm text-gray-600">
                                                    {currentPage} / {totalPages}
                                                </span>
                                                <button
                                                    onClick={() => handlePageChange(currentPage + 1)}
                                                    disabled={currentPage === totalPages}
                                                    className="px-4 py-2 border-2 rounded-xl disabled:opacity-50"
                                                >
                                                    下一页 →
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* 地图标签页 */}
                                {activeTab === 'map' && cafe.geometry && (
                                    <div>
                                        <div className="mb-4">
                                            <h3 className="font-bold text-xl mb-2">📍 位置信息</h3>
                                            <p className="text-gray-600">{cafe.address}</p>
                                        </div>

                                        <div className="rounded-2xl overflow-hidden shadow-lg mb-4 border-2 border-gray-200">
                                            <Map
                                                cafes={[cafe]}
                                                center={[
                                                    cafe.geometry.coordinates[0],
                                                    cafe.geometry.coordinates[1]
                                                ]}
                                                zoom={16}
                                                height="500px"
                                            />
                                        </div>

                                        <a
                                            href={`https://uri.amap.com/marker?position=${cafe.geometry.coordinates[0]},${cafe.geometry.coordinates[1]}&name=${encodeURIComponent(cafe.name)}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="block w-full px-6 py-4 bg-gradient-to-r from-green-600 to-green-700 text-white text-center rounded-xl hover:from-green-700 hover:to-green-800 transition font-bold shadow-lg"
                                        >
                                            🧭 在高德地图中导航
                                        </a>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* 右侧边栏 */}
                    <div className="lg:col-span-1 space-y-6">
                        {/* 收藏按钮卡片 */}
                        <div className="bg-white rounded-2xl shadow-lg p-6 lg:sticky lg:top-24">
                            <button
                                onClick={handleFavoriteToggle}
                                disabled={favoriteLoading}
                                className={`w-full px-6 py-4 rounded-xl transition font-bold text-lg shadow-md flex items-center justify-center gap-3 disabled:opacity-60 ${
                                    isFavorited
                                        ? 'bg-gradient-to-r from-red-500 to-pink-500 text-white hover:from-red-600 hover:to-pink-600'
                                        : 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 hover:from-gray-200 hover:to-gray-300'
                                }`}
                            >
                                <span className="text-3xl">{isFavorited ? '❤️' : '🤍'}</span>
                                <div className="text-left">
                                    <div className="text-sm opacity-90">
                                        {isFavorited ? '已收藏' : '收藏'}
                                    </div>
                                    <div className="text-xs opacity-75">
                                        {cafe.favoriteCount || 0} 人收藏
                                    </div>
                                </div>
                            </button>
                        </div>

                        {/* 小地图预览 */}
                        {cafe.geometry && (
                            <div className="bg-white rounded-2xl shadow-lg p-6">
                                <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                                    <span>📍</span>
                                    <span>位置</span>
                                </h3>
                                <div className="rounded-xl overflow-hidden mb-3 border-2 border-gray-200">
                                    <Map
                                        cafes={[cafe]}
                                        center={[
                                            cafe.geometry.coordinates[0],
                                            cafe.geometry.coordinates[1]
                                        ]}
                                        zoom={15}
                                        height="200px"
                                    />
                                </div>
                                <p className="text-sm text-gray-600 mb-3">{cafe.address}</p>
                                <button
                                    onClick={() => setActiveTab('map')}
                                    className="w-full px-4 py-3 bg-gray-100 hover:bg-gray-200 rounded-xl font-semibold transition"
                                >
                                    查看大地图 →
                                </button>
                            </div>
                        )}

                        {/* 快速操作 */}
                        <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl shadow-lg p-6 border-2 border-amber-200">
                            <h3 className="font-bold text-lg mb-4">快速操作</h3>
                            <div className="space-y-3">
                                <button
                                    onClick={() => {
                                        if (navigator.share) {
                                            navigator.share({
                                                title: cafe.name,
                                                text: cafe.description,
                                                url: window.location.href
                                            }).catch(() => {})
                                        } else {
                                            navigator.clipboard.writeText(window.location.href).catch(() => {})
                                        }
                                    }}
                                    className="w-full px-4 py-3 bg-white hover:bg-gray-50 rounded-xl transition flex items-center justify-center gap-2 shadow-sm border-2 border-gray-200 font-semibold"
                                >
                                    <span>📤</span>
                                    <span>分享</span>
                                </button>

                                {cafe.phoneNumber && (
                                    <a
                                        href={`tel:${cafe.phoneNumber}`}
                                        className="block w-full px-4 py-3 bg-white hover:bg-gray-50 rounded-xl transition text-center shadow-sm border-2 border-gray-200 font-semibold"
                                    >
                                        📞 拨打电话
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
