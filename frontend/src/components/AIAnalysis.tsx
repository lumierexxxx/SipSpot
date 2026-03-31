// ============================================
// SipSpot Frontend - AIAnalysis Component
// AI 分析结果展示组件
// ============================================

import type { IReview } from '@/types'

type SentimentKey = 'positive' | 'negative' | 'neutral'

interface ReviewAIAnalysisProps {
    analysis: IReview['aiAnalysis']
    compact?: boolean
}

interface CafeSentimentStatsProps {
    stats: { positive: number; negative: number; neutral: number } | null
}

interface AIBadgeProps {
    sentiment: SentimentKey
    showLabel?: boolean
}

// AILoadingState — no props, no interface needed

interface AIErrorStateProps {
    onRetry?: () => void
}

interface AIFeaturePromoProps {
    onAnalyze?: () => void
}

/**
 * AIAnalysis 组件 - 显示单条评论的AI分析
 * @param {Object} analysis - AI分析数据
 * @param {boolean} compact - 紧凑模式
 */
export const ReviewAIAnalysis = ({ analysis, compact = false }: ReviewAIAnalysisProps) => {
    if (!analysis) return null;

    const { sentiment, keywords = [], summary, confidence } = analysis;

    // 情感图标和颜色
    const sentimentConfig: Record<SentimentKey, { icon: string; color: string; bg: string; label: string }> = {
        positive: { icon: '😊', color: 'text-green-600', bg: 'bg-green-50', label: '正面' },
        negative: { icon: '😞', color: 'text-red-600',   bg: 'bg-red-50',   label: '负面' },
        neutral:  { icon: '😐', color: 'text-gray-600',  bg: 'bg-gray-50',  label: '中性' },
    };

    const config = sentimentConfig[sentiment ?? 'neutral'];

    if (compact) {
        return (
            <div className="flex items-center space-x-2 text-sm">
                <span className="text-lg">{config.icon}</span>
                <span className={`font-medium ${config.color}`}>
                    {config.label}
                </span>
                {confidence && (
                    <span className="text-gray-500">
                        ({Math.round(confidence * 100)}%)
                    </span>
                )}
            </div>
        );
    }

    return (
        <div className={`${config.bg} rounded-lg p-4`}>
            <div className="flex items-start space-x-3">
                <span className="text-3xl">{config.icon}</span>
                <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-gray-900">
                            AI 分析
                        </h4>
                        <span className={`text-sm font-medium ${config.color}`}>
                            {config.label}情感
                        </span>
                    </div>

                    {summary && (
                        <p className="text-sm text-gray-700 mb-3">
                            {summary}
                        </p>
                    )}

                    {keywords.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                            {keywords.map((keyword, index) => (
                                <span
                                    key={index}
                                    className="inline-flex items-center px-2 py-1 bg-white/70 text-gray-700 text-xs rounded-md"
                                >
                                    {keyword}
                                </span>
                            ))}
                        </div>
                    )}

                    {confidence && (
                        <div className="mt-3 flex items-center">
                            <span className="text-xs text-gray-600 mr-2">
                                置信度
                            </span>
                            <div className="flex-1 bg-white/50 rounded-full h-2 max-w-[200px]">
                                <div
                                    className={`h-full rounded-full ${config.color.replace('text-', 'bg-')}`}
                                    style={{ width: `${confidence * 100}%` }}
                                />
                            </div>
                            <span className="text-xs text-gray-600 ml-2">
                                {Math.round(confidence * 100)}%
                            </span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

/**
 * CafeSentimentStats 组件 - 显示咖啡店整体情感统计
 * @param {Object} stats - 情感统计数据
 */
export const CafeSentimentStats = ({ stats }: CafeSentimentStatsProps) => {
    if (!stats) return null;

    const { positive = 0, negative = 0, neutral = 0 } = stats;
    const total = positive + negative + neutral;

    if (total === 0) {
        return (
            <div className="bg-white rounded-lg p-6 text-center">
                <p className="text-gray-600">暂无AI分析数据</p>
            </div>
        );
    }

    const percentages = {
        positive: Math.round((positive / total) * 100),
        negative: Math.round((negative / total) * 100),
        neutral: Math.round((neutral / total) * 100)
    };

    return (
        <div className="bg-linear-to-r from-purple-50 to-pink-50 rounded-lg p-6">
            <div className="flex items-center mb-4">
                <span className="text-2xl mr-2">🤖</span>
                <h3 className="text-lg font-bold text-gray-900">
                    AI 情感分析
                </h3>
            </div>

            {/* 情感分布条 */}
            <div className="mb-4">
                <div className="flex h-3 rounded-full overflow-hidden">
                    {positive > 0 && (
                        <div
                            className="bg-green-500"
                            style={{ width: `${percentages.positive}%` }}
                            title={`正面 ${percentages.positive}%`}
                        />
                    )}
                    {neutral > 0 && (
                        <div
                            className="bg-gray-400"
                            style={{ width: `${percentages.neutral}%` }}
                            title={`中性 ${percentages.neutral}%`}
                        />
                    )}
                    {negative > 0 && (
                        <div
                            className="bg-red-500"
                            style={{ width: `${percentages.negative}%` }}
                            title={`负面 ${percentages.negative}%`}
                        />
                    )}
                </div>
            </div>

            {/* 详细统计 */}
            <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                    <div className="text-2xl mb-1">😊</div>
                    <div className="text-2xl font-bold text-green-600">
                        {percentages.positive}%
                    </div>
                    <div className="text-xs text-gray-600">
                        正面 ({positive})
                    </div>
                </div>

                <div className="text-center">
                    <div className="text-2xl mb-1">😐</div>
                    <div className="text-2xl font-bold text-gray-600">
                        {percentages.neutral}%
                    </div>
                    <div className="text-xs text-gray-600">
                        中性 ({neutral})
                    </div>
                </div>

                <div className="text-center">
                    <div className="text-2xl mb-1">😞</div>
                    <div className="text-2xl font-bold text-red-600">
                        {percentages.negative}%
                    </div>
                    <div className="text-xs text-gray-600">
                        负面 ({negative})
                    </div>
                </div>
            </div>

            {/* 总评 */}
            <div className="mt-4 pt-4 border-t border-white/50">
                <p className="text-sm text-gray-700 text-center">
                    基于 <span className="font-semibold">{total}</span> 条AI分析的评论
                </p>
            </div>
        </div>
    );
};

/**
 * AIBadge 组件 - AI分析徽章（小图标）
 * @param {string} sentiment - 情感类型
 * @param {boolean} showLabel - 是否显示标签
 */
export const AIBadge = ({ sentiment, showLabel = true }: AIBadgeProps) => {
    const config: Record<SentimentKey, { icon: string; label: string; color: string }> = {
        positive: { icon: '😊', label: '正面', color: 'bg-green-100 text-green-700' },
        negative: { icon: '😞', label: '负面', color: 'bg-red-100 text-red-700' },
        neutral:  { icon: '😐', label: '中性', color: 'bg-gray-100 text-gray-700' },
    };

    const { icon, label, color } = config[sentiment];

    return (
        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${color}`}>
            <span className="mr-1">{icon}</span>
            {showLabel && label}
        </span>
    );
};

/**
 * AILoadingState 组件 - AI分析加载状态
 */
export const AILoadingState = () => {
    return (
        <div className="bg-linear-to-r from-purple-50 to-pink-50 rounded-lg p-6">
            <div className="flex items-center space-x-3">
                <div className="animate-bounce-slow">
                    <span className="text-3xl">🤖</span>
                </div>
                <div className="flex-1">
                    <div className="h-4 bg-white/50 rounded mb-2 animate-pulse" />
                    <div className="h-4 bg-white/50 rounded w-3/4 animate-pulse" />
                </div>
            </div>
            <p className="text-sm text-gray-600 mt-3 text-center">
                AI 正在分析评论内容...
            </p>
        </div>
    );
};

/**
 * AIErrorState 组件 - AI分析错误状态
 * @param {Function} onRetry - 重试回调
 */
export const AIErrorState = ({ onRetry }: AIErrorStateProps) => {
    return (
        <div className="bg-red-50 rounded-lg p-6 text-center">
            <span className="text-4xl mb-2 block">😕</span>
            <p className="text-sm text-red-700 mb-3">
                AI 分析失败
            </p>
            {onRetry && (
                <button
                    onClick={onRetry}
                    className="btn btn-outline text-sm"
                >
                    重试
                </button>
            )}
        </div>
    );
};

/**
 * AIFeaturePromo 组件 - AI功能推广（当没有分析时）
 */
export const AIFeaturePromo = ({ onAnalyze }: AIFeaturePromoProps) => {
    return (
        <div className="bg-linear-to-r from-purple-50 to-pink-50 rounded-lg p-6 text-center">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-3xl">🤖</span>
            </div>
            <h4 className="font-semibold text-gray-900 mb-2">
                AI 智能分析
            </h4>
            <p className="text-sm text-gray-600 mb-4">
                让AI帮你快速了解这条评论的关键信息和情感倾向
            </p>
            {onAnalyze && (
                <button
                    onClick={onAnalyze}
                    className="btn btn-primary text-sm"
                >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    开始分析
                </button>
            )}
        </div>
    );
};

// 默认导出主组件
export default ReviewAIAnalysis;
