// ============================================
// SipSpot Frontend - AI Search Page (优化版)
// AI对话式搜索页面 - 修复重复消息 + 新版式
// ============================================

import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import CafeCard from '../components/CafeCard';
import { useCurrentPosition } from '../hooks/useGeolocation';

export default function AISearchPage() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const initialQuery = searchParams.get('query') || '';
    
    const [messages, setMessages] = useState([]);
    const [inputMessage, setInputMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [cafes, setCafes] = useState([]);
    const [explanation, setExplanation] = useState(null);
    const [explanationLoading, setExplanationLoading] = useState(false);
    const messagesEndRef = useRef(null);
    const hasInitialized = useRef(false); // 防止重复初始化

    // 尝试获取用户位置（但不强制要求）
    const { latitude, longitude, error: geoError } = useCurrentPosition();

    // 记录位置状态
    useEffect(() => {
        if (latitude && longitude) {
            console.log('✅ 用户位置已获取:', { latitude, longitude });
        } else if (geoError) {
            console.log('⚠️ 位置获取失败，将使用默认位置:', geoError.message);
        }
    }, [latitude, longitude, geoError]);

    // 自动滚动到底部
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // 初始化对话（防止重复执行）
    useEffect(() => {
        if (hasInitialized.current) return;
        hasInitialized.current = true;

        if (initialQuery) {
            handleAISearch(initialQuery);
        } else {
            // 欢迎消息
            setMessages([
                {
                    type: 'assistant',
                    content: '你好！我是 SipSpot AI 助手 🤖\n\n我可以帮你找到最适合的咖啡馆。你可以这样问我：\n\n• 附近1公里内评分高的咖啡馆\n• 适合办公的安静咖啡店\n• 有WiFi和插座的咖啡馆\n• 性价比高的咖啡店\n\n请告诉我你的需求吧！',
                    timestamp: Date.now(),
                    cafes: []
                }
            ]);
        }
    }, []); // 空依赖数组，只执行一次

    // AI 搜索处理
    const handleAISearch = async (query) => {
        if (!query.trim()) return;

        console.log('🔍 开始 AI 搜索:', query);

        // 添加用户消息
        const userMessage = {
            type: 'user',
            content: query,
            timestamp: Date.now()
        };
        setMessages(prev => [...prev, userMessage]);
        setInputMessage('');
        setIsLoading(true);

        try {
            const apiUrl = `${import.meta.env.VITE_API_URL}/cafes/ai-search`;
            console.log('📡 API URL:', apiUrl);

            // 准备请求体（包含用户位置，如果可用）
            const requestBody = { query };
            if (latitude && longitude) {
                requestBody.lat = latitude;
                requestBody.lng = longitude;
                console.log('📍 使用用户位置:', { lat: latitude, lng: longitude });
            } else {
                console.log('📍 未提供用户位置，后端将使用默认位置');
            }

            // 调用后端 AI 搜索 API
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(localStorage.getItem('token') && {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    })
                },
                body: JSON.stringify(requestBody)
            });

            console.log('📡 响应状态:', response.status);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ API 错误响应:', errorText);
                throw new Error(`HTTP ${response.status}`);
            }

            const data = await response.json();
            console.log('✅ API 返回数据:', data);
            console.log('☕ 咖啡馆数量:', data.count);

            // 添加 AI 回复（包含咖啡馆数据）
            const assistantMessage = {
                type: 'assistant',
                content: data.explanation || '我为你找到了以下咖啡馆：',
                timestamp: Date.now(),
                cafes: data.cafes || [] // 在消息中保存咖啡馆数据
            };
            setMessages(prev => [...prev, assistantMessage]);

            // 更新右侧展示的咖啡馆列表
            if (data.cafes && Array.isArray(data.cafes)) {
                console.log('✅ 设置咖啡馆列表:', data.cafes.length, '家');
                setCafes(data.cafes);

                // 异步加载 Qwen 解释（不阻塞搜索结果显示）
                if (data.cafes.length > 0) {
                    setExplanationLoading(true);
                    setExplanation(null);
                    fetch(`${import.meta.env.VITE_API_URL}/cafes/ai-search/explain`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            ...(localStorage.getItem('token') && {
                                'Authorization': `Bearer ${localStorage.getItem('token')}`
                            })
                        },
                        body: JSON.stringify({
                            query,
                            cafeNames: data.cafes.slice(0, 5).map(c => c.name)
                        })
                    })
                    .then(res => res.json())
                    .then(res => {
                        if (res.explanation) setExplanation(res.explanation);
                    })
                    .catch(() => {
                        // 失败时静默处理，不显示错误
                    })
                    .finally(() => setExplanationLoading(false));
                }
            } else {
                console.warn('⚠️ 咖啡馆数据格式不正确');
                setCafes([]);
            }

        } catch (error) {
            console.error('💥 AI搜索失败:', error);
            
            const errorMessage = {
                type: 'assistant',
                content: `抱歉，搜索遇到了问题。请稍后再试或换个方式描述你的需求。`,
                timestamp: Date.now(),
                cafes: []
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    // 处理发送消息
    const handleSendMessage = (e) => {
        e.preventDefault();
        if (inputMessage.trim() && !isLoading) {
            handleAISearch(inputMessage);
        }
    };

    // 重置对话
    const handleReset = () => {
        hasInitialized.current = false;
        setMessages([{
            type: 'assistant',
            content: '对话已重置。请告诉我你想找什么样的咖啡馆？',
            timestamp: Date.now(),
            cafes: []
        }]);
        setCafes([]);
        hasInitialized.current = true;
    };

    // 快速问题模板
    const quickQuestions = [
        '附近1公里内评分最高的咖啡馆',
        '适合办公的安静咖啡店',
        '有WiFi和插座的咖啡馆',
        '性价比高的平价咖啡店',
        '适合拍照的网红咖啡馆',
        '有户外座位的咖啡店'
    ];

    return (
        <div className="min-h-screen bg-gray-50">
            {/* 顶部导航 */}
            <div className="bg-white border-b sticky top-0 z-10 shadow-sm">
                <div className="max-w-full px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/')}
                            className="text-gray-600 hover:text-gray-900 transition"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                        </button>
                        <div>
                            <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                <span className="text-2xl">🤖</span>
                                <span>AI 智能搜索</span>
                            </h1>
                            <p className="text-sm text-gray-500">用自然语言描述你的需求</p>
                        </div>
                    </div>
                    <button
                        onClick={handleReset}
                        className="px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition"
                    >
                        🔄 重新开始
                    </button>
                </div>
            </div>

            {/* 主内容区 */}
            <div className="flex h-[calc(100vh-80px)]">
                {/* 左侧对话区 (25%) */}
                <div className="w-1/4 border-r border-gray-200 bg-white flex flex-col">
                    {/* 对话历史 */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {messages.map((message, index) => (
                            <div key={`${message.timestamp}-${index}`}>
                                {/* 消息气泡 */}
                                <div
                                    className={`${
                                        message.type === 'user'
                                            ? 'ml-auto bg-gradient-to-r from-amber-500 to-orange-500 text-white'
                                            : 'mr-auto bg-gray-100 text-gray-900'
                                    } rounded-2xl px-4 py-3 max-w-[90%]`}
                                >
                                    <div className="flex items-start gap-2">
                                        {message.type === 'assistant' && (
                                            <span className="text-xl flex-shrink-0">🤖</span>
                                        )}
                                        <div className="flex-1 text-sm whitespace-pre-line">
                                            {message.content}
                                        </div>
                                    </div>
                                </div>

                                {/* 如果消息包含咖啡馆，显示卡片 */}
                                {message.cafes && message.cafes.length > 0 && (
                                    <div className="mt-3 space-y-2">
                                        <div className="text-xs text-gray-500 font-semibold px-2">
                                            推荐 {message.cafes.length} 家咖啡馆
                                        </div>
                                        {message.cafes.slice(0, 3).map((cafe) => (
                                            <button
                                                key={cafe._id}
                                                onClick={() => navigate(`/cafes/${cafe._id}`)}
                                                className="w-full bg-white border border-gray-200 rounded-xl p-3 hover:shadow-md transition-all text-left"
                                            >
                                                {/* 咖啡馆图片 */}
                                                {cafe.images && cafe.images.length > 0 && (
                                                    <img
                                                        src={cafe.images[0].url}
                                                        alt={cafe.name}
                                                        className="w-full h-24 object-cover rounded-lg mb-2"
                                                    />
                                                )}
                                                
                                                {/* 咖啡馆名称 */}
                                                <div className="font-semibold text-gray-900 text-sm mb-1 line-clamp-1">
                                                    {cafe.name}
                                                </div>
                                                
                                                {/* 评分和价格 */}
                                                <div className="flex items-center gap-2 text-xs">
                                                    <span className="flex items-center text-amber-600">
                                                        ⭐ {cafe.rating?.toFixed(1) || 'N/A'}
                                                    </span>
                                                    <span className="text-gray-400">•</span>
                                                    <span className="text-gray-600">
                                                        {'$'.repeat(cafe.price || 1)}
                                                    </span>
                                                </div>
                                                
                                                {/* 地址 */}
                                                <div className="text-xs text-gray-500 mt-1 line-clamp-1">
                                                    📍 {cafe.address}
                                                </div>
                                            </button>
                                        ))}
                                        
                                        {message.cafes.length > 3 && (
                                            <div className="text-xs text-gray-500 text-center py-2">
                                                还有 {message.cafes.length - 3} 家，查看右侧完整列表 →
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                        
                        {/* 加载动画 */}
                        {isLoading && (
                            <div className="bg-gray-100 rounded-2xl px-4 py-3 max-w-[90%]">
                                <div className="flex items-center gap-2">
                                    <span className="text-xl">🤖</span>
                                    <div className="flex gap-1">
                                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
                                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce animation-delay-100"></span>
                                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce animation-delay-200"></span>
                                    </div>
                                </div>
                            </div>
                        )}
                        
                        <div ref={messagesEndRef} />
                    </div>

                    {/* 快速问题 */}
                    {messages.length === 1 && (
                        <div className="border-t p-4 bg-gray-50">
                            <div className="text-xs font-semibold text-gray-700 mb-2">💡 试试这些</div>
                            <div className="space-y-2">
                                {quickQuestions.slice(0, 3).map((question, index) => (
                                    <button
                                        key={index}
                                        onClick={() => setInputMessage(question)}
                                        className="w-full text-left px-3 py-2 bg-white hover:bg-amber-50 rounded-lg transition-all text-xs text-gray-700 hover:text-amber-700 border border-gray-200 hover:border-amber-200"
                                    >
                                        {question}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* 输入区 */}
                    <div className="border-t p-4">
                        <form onSubmit={handleSendMessage} className="space-y-2">
                            <textarea
                                value={inputMessage}
                                onChange={(e) => setInputMessage(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSendMessage(e);
                                    }
                                }}
                                placeholder="描述你想找的咖啡馆..."
                                disabled={isLoading}
                                rows={3}
                                className="w-full px-3 py-2 border-2 border-gray-200 rounded-xl focus:border-amber-500 focus:outline-none disabled:bg-gray-50 text-sm resize-none"
                            />
                            <button
                                type="submit"
                                disabled={!inputMessage.trim() || isLoading}
                                className="w-full py-2 bg-gradient-to-r from-amber-600 to-orange-600 text-white font-semibold rounded-xl hover:from-amber-700 hover:to-orange-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg text-sm"
                            >
                                发送
                            </button>
                        </form>
                    </div>
                </div>

                {/* 右侧搜索结果区 (75%) */}
                <div className="flex-1 overflow-y-auto bg-gray-50">
                    <div className="p-6">
                        {/* 搜索结果统计 */}
                        {cafes.length > 0 && (
                            <div className="mb-6">
                                <div className="flex items-center justify-between mb-4">
                                    <div>
                                        <h2 className="text-2xl font-bold text-gray-900">
                                            为你推荐
                                        </h2>
                                        <p className="text-gray-600 mt-1">
                                            找到 <span className="font-bold text-amber-600">{cafes.length}</span> 家符合条件的咖啡馆
                                        </p>
                                    </div>
                                    
                                    {/* 排序选项 */}
                                    <select className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-amber-500">
                                        <option>按评分排序</option>
                                        <option>按距离排序</option>
                                        <option>按价格排序</option>
                                    </select>
                                </div>

                                {/* AI 解释区域（异步加载，不阻塞主结果） */}
                                {(explanationLoading || explanation) && (
                                    <div className="card p-4 mb-4 bg-amber-50 border border-amber-200">
                                        {explanationLoading ? (
                                            <div className="flex items-center gap-2 text-amber-700">
                                                <span className="spinner" />
                                                <span className="text-sm">AI 正在分析搜索结果...</span>
                                            </div>
                                        ) : (
                                            <p className="text-amber-800 text-sm">{explanation}</p>
                                        )}
                                    </div>
                                )}

                                {/* 咖啡馆网格 */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                                    {cafes.map((cafe) => (
                                        <CafeCard key={cafe._id} cafe={cafe} />
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* 空状态 */}
                        {messages.length > 1 && cafes.length === 0 && !isLoading && (
                            <div className="text-center py-20">
                                <div className="text-6xl mb-4">🔍</div>
                                <p className="text-gray-600 text-lg mb-2">
                                    没有找到符合条件的咖啡馆
                                </p>
                                <p className="text-gray-500 text-sm">
                                    试试换个描述方式，或者调整你的需求
                                </p>
                            </div>
                        )}

                        {/* 初始状态 */}
                        {cafes.length === 0 && messages.length <= 1 && (
                            <div className="text-center py-20">
                                <div className="text-6xl mb-6">☕</div>
                                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                                    开始你的咖啡探索之旅
                                </h3>
                                <p className="text-gray-600 mb-8">
                                    在左侧输入你的需求，AI 会帮你找到最合适的咖啡馆
                                </p>
                                
                                {/* 示例查询 */}
                                <div className="max-w-2xl mx-auto grid grid-cols-2 gap-4">
                                    {quickQuestions.map((question, index) => (
                                        <button
                                            key={index}
                                            onClick={() => setInputMessage(question)}
                                            className="px-6 py-4 bg-white rounded-xl border-2 border-gray-200 hover:border-amber-500 transition-all text-left"
                                        >
                                            <div className="text-sm font-semibold text-gray-900 mb-1">
                                                {question}
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                点击快速搜索
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* 添加动画样式 */}
            <style>{`
                @keyframes bounce {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-0.5rem); }
                }
                
                .animate-bounce {
                    animation: bounce 1s ease-in-out infinite;
                }
                
                .animation-delay-100 {
                    animation-delay: 0.1s;
                }
                
                .animation-delay-200 {
                    animation-delay: 0.2s;
                }

                .line-clamp-1 {
                    display: -webkit-box;
                    -webkit-line-clamp: 1;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                }
            `}</style>
        </div>
    );
}