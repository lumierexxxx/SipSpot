// ============================================
// SipSpot Frontend - NearbyPage
// 附近咖啡店页面 - 基于地理位置
// ============================================

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Map from '@components/Map'
// @ts-ignore — mapUtils is plain JS; types are handled via casts below
import { getUserLocation, sortCafesByDistance, formatDistance } from '@utils/mapUtils'
import * as cafesAPI from '@services/cafesAPI'
import type { ICafe } from '@/types'

// ============================================
// Local types
// ============================================

interface SipSpotPosition {
    lat: number
    lng: number
}

interface LocationError {
    title: string
    message: string
    type: string
}

interface ApiError {
    type: string
    message: string
    details?: string
}

type CafeWithDistance = ICafe & { distance: number }

// ============================================
// NearbyPage Component
// ============================================

export default function NearbyPage() {
    const navigate = useNavigate()
    const [cafes, setCafes] = useState<CafeWithDistance[]>([])
    const [userLocation, setUserLocation] = useState<SipSpotPosition | null>(null)
    const [loading, setLoading] = useState<boolean>(true)
    const [error, setError] = useState<string | null>(null)
    const [distance, setDistance] = useState<number>(5)
    const [locationError, setLocationError] = useState<LocationError | null>(null)
    const [apiError, setApiError] = useState<ApiError | null>(null)

    useEffect(() => {
        loadNearbyCafes()
    }, [distance])

    const loadNearbyCafes = async (): Promise<void> => {
        setLoading(true)
        setError(null)
        setLocationError(null)
        setApiError(null)

        try {
            const location: SipSpotPosition = await getUserLocation()
            setUserLocation(location)
            await fetchNearbyCafes(location)
        } catch (err: unknown) {
            const e = err as { name?: string; code?: number; message?: string }

            if (e.name === 'GeolocationPositionError' || e.code) {
                setLocationError(getLocationErrorMessage(e.code ?? 0))
            } else if (e.message?.includes('不支持定位')) {
                setLocationError({
                    title: '浏览器不支持定位',
                    message: '请使用现代浏览器或手动选择位置',
                    type: 'unsupported'
                })
            } else {
                setError(e.message ?? '未知错误')
            }
            setLoading(false)
        }
    }

    const fetchNearbyCafes = async (location: SipSpotPosition): Promise<void> => {
        try {
            const response = await cafesAPI.getNearbyCafes({
                lat: location.lat,
                lng: location.lng,
                distance: distance * 1000,
            })

            const cafesData = (response.data ?? []) as ICafe[]
            const cafesWithDistance = sortCafesByDistance(
                cafesData,
                location.lat,
                location.lng
            ) as CafeWithDistance[]

            setCafes(cafesWithDistance)
        } catch (err: unknown) {
            const e = err as { message?: string }

            if (e.message?.includes('Failed to fetch') || e.message?.includes('NetworkError')) {
                setApiError({
                    type: 'network',
                    message: '无法连接到后端服务器',
                    details: '请确认后端服务器正在运行'
                })
            } else if (!apiError) {
                setError(e.message ?? '加载失败')
            }
        } finally {
            setLoading(false)
        }
    }

    const getLocationErrorMessage = (code: number): LocationError => {
        switch (code) {
            case 1:
                return {
                    title: '位置权限被拒绝',
                    message: '请在浏览器设置中允许访问您的位置',
                    type: 'permission'
                }
            case 2:
                return {
                    title: '无法获取位置',
                    message: '请确保设备的位置服务已开启',
                    type: 'unavailable'
                }
            case 3:
                return {
                    title: '定位超时',
                    message: '获取位置信息超时，请重试',
                    type: 'timeout'
                }
            default:
                return {
                    title: '定位失败',
                    message: '无法获取您的位置信息',
                    type: 'unknown'
                }
        }
    }

    const useDefaultLocation = async (): Promise<void> => {
        try {
            setLoading(true)
            setLocationError(null)
            setApiError(null)

            const defaultLocation: SipSpotPosition = {
                lat: 31.230416,
                lng: 121.473701
            }

            setUserLocation(defaultLocation)
            await fetchNearbyCafes(defaultLocation)
        } catch (err: unknown) {
            const e = err as { message?: string }
            if (!apiError) {
                setError(e.message ?? '加载失败')
            }
            setLoading(false)
        }
    }

    // ============================================
    // 渲染API错误（非JSON响应）
    // ============================================
    if (apiError) {
        return (
            <div className="max-w-3xl mx-auto px-4 py-8">
                <div className="bg-red-50 border-2 border-red-200 rounded-lg p-8">
                    <div className="text-center mb-6">
                        <div className="text-6xl mb-4">🔌</div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">
                            后端API连接失败
                        </h2>
                        <p className="text-gray-600 mb-2">
                            {apiError.message}
                        </p>
                        {apiError.type === 'not_json' && (
                            <p className="text-sm text-red-600">
                                服务器返回了HTML错误页面而不是JSON数据
                            </p>
                        )}
                    </div>

                    <div className="bg-white rounded-lg p-6 mb-6">
                        <h3 className="font-bold text-lg mb-4">🔍 问题诊断：</h3>

                        <div className="space-y-4 text-sm">
                            <div>
                                <p className="font-semibold text-gray-700 mb-2">可能的原因：</p>
                                <ul className="list-disc list-inside space-y-1 text-gray-600">
                                    <li>后端服务器未启动</li>
                                    <li>API端点配置错误</li>
                                    <li>环境变量VITE_API_URL配置不正确</li>
                                    <li>CORS配置问题</li>
                                </ul>
                            </div>

                            <div>
                                <p className="font-semibold text-gray-700 mb-2">解决步骤：</p>
                                <ol className="list-decimal list-inside space-y-2 text-gray-600">
                                    <li>
                                        <span className="font-semibold">检查后端服务器：</span>
                                        <div className="ml-6 mt-1 p-2 bg-gray-100 rounded font-mono text-xs">
                                            cd backend<br/>
                                            npm run dev
                                        </div>
                                    </li>
                                    <li>
                                        <span className="font-semibold">验证API URL：</span>
                                        <div className="ml-6 mt-1">
                                            <p className="text-xs">当前配置: <code className="bg-gray-100 px-1">{import.meta.env.VITE_API_URL || '未配置'}</code></p>
                                            <p className="text-xs mt-1">应该是: <code className="bg-gray-100 px-1">http://localhost:5001/api</code></p>
                                        </div>
                                    </li>
                                    <li>
                                        <span className="font-semibold">测试API端点：</span>
                                        <div className="ml-6 mt-1 p-2 bg-gray-100 rounded font-mono text-xs break-all">
                                            curl http://localhost:5001/api/cafes/nearby?lng=121.47&lat=31.23&distance=5000
                                        </div>
                                    </li>
                                </ol>
                            </div>
                        </div>
                    </div>

                    {/* 调试信息 */}
                    {import.meta.env.DEV && apiError.details && (
                        <details className="mb-6">
                            <summary className="cursor-pointer text-sm font-semibold text-gray-700 hover:text-gray-900 mb-2">
                                🔧 调试信息
                            </summary>
                            <div className="p-4 bg-gray-100 rounded text-xs font-mono space-y-1">
                                <p className="text-xs font-mono">{apiError.details}</p>
                            </div>
                        </details>
                    )}

                    <div className="space-y-3">
                        <button
                            onClick={() => window.location.reload()}
                            className="w-full px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-semibold"
                        >
                            🔄 重新加载页面
                        </button>

                        <button
                            onClick={() => navigate('/cafes')}
                            className="w-full px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
                        >
                            ← 返回咖啡馆列表
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    // ============================================
    // 渲染加载状态
    // ============================================
    if (loading) {
        return (
            <div className="max-w-7xl mx-auto px-4 py-8">
                <div className="text-center">
                    <div className="text-6xl mb-4 animate-pulse">📍</div>
                    <p className="text-gray-600 text-lg">正在获取您的位置...</p>
                </div>
            </div>
        )
    }

    // ============================================
    // 渲染位置错误
    // ============================================
    if (locationError) {
        return (
            <div className="max-w-3xl mx-auto px-4 py-8">
                <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-8">
                    <div className="text-center mb-6">
                        <div className="text-6xl mb-4">
                            {locationError.type === 'permission' ? '🔒' :
                             locationError.type === 'unavailable' ? '📡' : '⏱️'}
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">
                            {locationError.title}
                        </h2>
                        <p className="text-gray-600 mb-6">
                            {locationError.message}
                        </p>
                    </div>

                    <div className="bg-white rounded-lg p-6 mb-6">
                        <h3 className="font-bold text-lg mb-4">💡 解决方法：</h3>

                        {locationError.type === 'permission' && (
                            <div className="space-y-3 text-sm text-gray-700">
                                <div>1. 点击浏览器地址栏左侧的锁图标</div>
                                <div>2. 找到"位置"或"Location"权限</div>
                                <div>3. 选择"允许"，然后重试</div>
                            </div>
                        )}

                        {locationError.type === 'unavailable' && (
                            <div className="space-y-3 text-sm text-gray-700">
                                <div>1. 确保系统位置服务已开启</div>
                                <div>2. 移动到窗边或室外</div>
                                <div>3. 或使用下方的默认位置</div>
                            </div>
                        )}
                    </div>

                    <div className="space-y-3">
                        <button
                            onClick={loadNearbyCafes}
                            className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold"
                        >
                            🔄 重试获取位置
                        </button>

                        <button
                            onClick={useDefaultLocation}
                            className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold"
                        >
                            📍 使用默认位置（上海人民广场）
                        </button>

                        <button
                            onClick={() => navigate('/cafes')}
                            className="w-full px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
                        >
                            ← 返回咖啡馆列表
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    // ============================================
    // 渲染其他错误
    // ============================================
    if (error) {
        return (
            <div className="max-w-7xl mx-auto px-4 py-8">
                <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                    <div className="text-4xl mb-4">❌</div>
                    <p className="text-red-600 mb-4">{error}</p>
                    <div className="space-y-2">
                        <button
                            onClick={loadNearbyCafes}
                            className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 mx-2"
                        >
                            重试
                        </button>
                        <button
                            onClick={() => navigate('/cafes')}
                            className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 mx-2"
                        >
                            返回列表
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    // ============================================
    // 主渲染
    // ============================================
    return (
        <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="mb-6">
                <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
                    <span>📍</span>
                    <span>附近的咖啡馆</span>
                </h1>
                <p className="text-gray-600">
                    找到 <span className="font-semibold text-green-600">{cafes.length}</span> 家咖啡馆，在 {distance}公里范围内
                </p>
            </div>

            <div className="mb-6 flex gap-2">
                {[1, 3, 5, 10, 20].map(d => (
                    <button
                        key={d}
                        onClick={() => setDistance(d)}
                        className={`px-4 py-2 rounded-lg transition font-semibold ${
                            distance === d
                                ? 'bg-green-600 text-white'
                                : 'bg-gray-100 hover:bg-gray-200'
                        }`}
                    >
                        {d}公里
                    </button>
                ))}
            </div>

            {userLocation && (
                <div className="mb-8 rounded-lg overflow-hidden shadow-lg">
                    <Map
                        cafes={cafes}
                        center={[userLocation.lng, userLocation.lat]}
                        zoom={distance <= 3 ? 14 : distance <= 5 ? 13 : 12}
                        height="500px"
                        showUserLocation={true}
                        onMarkerClick={(cafe: ICafe) => navigate(`/cafes/${cafe._id}`)}
                    />
                </div>
            )}

            {cafes.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {cafes.map(cafe => (
                        <div
                            key={cafe._id}
                            onClick={() => navigate(`/cafes/${cafe._id}`)}
                            className="bg-white rounded-lg shadow hover:shadow-xl transition cursor-pointer overflow-hidden group"
                        >
                            {cafe.images?.[0] && (
                                <div className="relative h-48">
                                    <img
                                        src={(() => {
                                            const img = cafe.images[0]
                                            return typeof img === 'string' ? img : (img?.url ?? img?.cardImage ?? '')
                                        })()}
                                        alt={cafe.name}
                                        className="w-full h-full object-cover group-hover:scale-110 transition duration-300"
                                    />
                                    <div className="absolute top-2 right-2 bg-green-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
                                        📍 {formatDistance(cafe.distance)}
                                    </div>
                                </div>
                            )}
                            <div className="p-4">
                                <h3 className="font-bold text-lg mb-2">{cafe.name}</h3>
                                <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                                    <span>⭐ {cafe.rating?.toFixed(1)}</span>
                                    <span>•</span>
                                    <span>💰 {'$'.repeat(cafe.price || 2)}</span>
                                </div>
                                {cafe.description && (
                                    <p className="text-gray-600 text-sm line-clamp-2">
                                        {cafe.description}
                                    </p>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-16">
                    <div className="text-6xl mb-4">☕</div>
                    <p className="text-xl text-gray-600 mb-2">
                        附近{distance}公里内没有找到咖啡馆
                    </p>
                    <button
                        onClick={() => navigate('/cafes')}
                        className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                        查看所有咖啡馆
                    </button>
                </div>
            )}
        </div>
    )
}
