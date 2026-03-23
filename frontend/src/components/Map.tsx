// ============================================
// SipSpot Frontend - Map Component
// 地图展示组件（使用高德地图 AMap）
// ============================================

import { useEffect, useRef, useState } from 'react'
import AMapLoader from '@amap/amap-jsapi-loader'
import type { ICafe } from '@/types/cafe'

// ============================================
// Props
// ============================================

interface MapProps {
  cafes?: ICafe[]
  center?: [number, number]
  zoom?: number
  height?: string
  onMarkerClick?: (cafe: ICafe) => void
  showUserLocation?: boolean
  selectedCafe?: ICafe | null
}

// ============================================
// Map Component
// ============================================

export default function Map({
  cafes = [],
  center,
  zoom = 13,
  height = '600px',
  onMarkerClick,
  showUserLocation = false,
  selectedCafe = null,
}: MapProps) {
  const mapRef = useRef<HTMLDivElement | null>(null)
  const mapInstance = useRef<AMap.Map | null>(null)
  const markersRef = useRef<AMap.Marker[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  // ============================================
  // 初始化地图
  // ============================================
  useEffect(() => {
    const amapKey = import.meta.env.VITE_AMAP_KEY as string | undefined
    const securityCode = import.meta.env.VITE_AMAP_SECURITY_CODE as string | undefined

    if (!amapKey) {
      setError('高德地图 API Key 未配置')
      setLoading(false)
      return
    }

    if (!mapRef.current) return

    AMapLoader({
      key: amapKey,
      version: '2.0',
      plugins: ['AMap.Scale', 'AMap.ToolBar', 'AMap.Geolocation', 'AMap.ControlBar'],
      ...(securityCode ? { securityJsCode: securityCode } : {}),
    })
      .then((_AMapSDK: typeof AMap) => {
        if (!mapRef.current) return

        const mapCenter: [number, number] = center ?? [116.397428, 39.90923]

        mapInstance.current = new _AMapSDK.Map(mapRef.current, {
          zoom,
          center: mapCenter,
          resizeEnable: true,
          mapStyle: 'amap://styles/normal',
        })

        const map = mapInstance.current

        map.addControl(new _AMapSDK.Scale({}))
        map.addControl(new _AMapSDK.ToolBar({}))

        if (showUserLocation) {
          map.addControl(
            new _AMapSDK.Geolocation({
              enableHighAccuracy: true,
              timeout: 10000,
              buttonPosition: 'RB',
              zoomToAccuracy: true,
            }),
          )
        }

        setLoading(false)
      })
      .catch(() => {
        setError('高德地图加载失败')
        setLoading(false)
      })

    return () => {
      if (mapInstance.current) {
        mapInstance.current.destroy()
        mapInstance.current = null
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ============================================
  // 添加/更新标记
  // ============================================
  useEffect(() => {
    if (loading || !mapInstance.current) return

    // 清除旧标记
    markersRef.current.forEach((m) => m.setMap(null))
    markersRef.current = []

    if (cafes.length === 0) return

    const map = mapInstance.current

    cafes.forEach((cafe) => {
      const coords = cafe.geometry?.coordinates
      if (!coords || coords.length !== 2) return

      const [lng, lat] = coords
      const position: [number, number] = [lng, lat]

      const marker = new window.AMap.Marker({
        position,
        title: cafe.name,
        animation: 'AMAP_ANIMATION_DROP',
        cursor: 'pointer',
        extData: cafe,
      })

      marker.setMap(map)

      marker.on('click', () => {
        // 关闭所有已打开的信息窗口
        markersRef.current.forEach((m) => {
          const existingInfoWindow = (m as AMap.Marker & { _infoWindow?: AMap.InfoWindow })
            ._infoWindow
          existingInfoWindow?.close()
        })

        const pos = marker.getPosition()
        if (!pos) return

        // WARNING: XSS risk — InfoWindow uses innerHTML with cafe data.
        // Do not add user-generated content here without sanitization. Fix in separate security task.
        const infoWindowContent = `
          <div style="padding:12px;min-width:200px;font-family:system-ui,-apple-system,sans-serif;">
            <h3 style="font-weight:bold;font-size:16px;color:#111827;margin:0 0 8px 0;">${cafe.name}</h3>
            <div style="display:flex;align-items:center;margin-bottom:8px;">
              <span style="color:#F59E0B;font-size:14px;">★</span>
              <span style="margin-left:4px;font-weight:500;">${cafe.rating?.toFixed(1) ?? '0.0'}</span>
              <span style="margin-left:4px;color:#6B7280;font-size:13px;">(${cafe.reviewCount ?? 0})</span>
            </div>
            <p style="color:#6B7280;font-size:13px;margin:0 0 12px 0;">${cafe.address ?? cafe.city}</p>
            <a href="/cafes/${cafe._id}" style="display:inline-block;background-color:#D97706;color:white;padding:6px 12px;border-radius:4px;text-decoration:none;font-size:13px;">查看详情</a>
          </div>
        `

        const infoWindow = new window.AMap.InfoWindow({
          content: infoWindowContent,
          offset: new window.AMap.Pixel(0, -30),
          closeWhenClickMap: true,
        })

        infoWindow.open(map, [pos.lng, pos.lat])
        ;(marker as AMap.Marker & { _infoWindow?: AMap.InfoWindow })._infoWindow = infoWindow

        onMarkerClick?.(cafe)
      })

      markersRef.current.push(marker)
    })

    if (markersRef.current.length > 0) {
      mapInstance.current.setFitView()
    }
  }, [loading, cafes, onMarkerClick])

  // ============================================
  // selectedCafe 高亮处理
  // ============================================
  useEffect(() => {
    if (!selectedCafe || !mapInstance.current) return
    const coords = selectedCafe.geometry?.coordinates
    if (!coords || coords.length !== 2) return
    mapInstance.current.setCenter([coords[0], coords[1]])
    mapInstance.current.setZoom(15)
  }, [selectedCafe])

  // ============================================
  // 错误状态
  // ============================================
  if (error) {
    return (
      <div
        className="bg-gray-100 rounded-lg flex items-center justify-center"
        style={{ height }}
      >
        <div className="text-center p-4">
          <svg
            className="w-12 h-12 text-gray-400 mx-auto mb-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
            />
          </svg>
          <p className="text-gray-600">{error}</p>
          {error.includes('API Key') && (
            <p className="text-sm text-gray-500 mt-2">
              请在 .env 文件中配置 VITE_AMAP_KEY
            </p>
          )}
        </div>
      </div>
    )
  }

  // ============================================
  // 加载状态
  // ============================================
  if (loading) {
    return (
      <div
        className="bg-gray-100 rounded-lg flex items-center justify-center"
        style={{ height }}
      >
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-gray-300 border-t-amber-600 rounded-full animate-spin mb-2" />
          <p className="text-gray-600">加载地图中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative" style={{ height }}>
      <div ref={mapRef} className="rounded-lg overflow-hidden shadow-md w-full h-full" />
      {/* 地图控制提示 */}
      <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 text-xs text-gray-600 shadow-md pointer-events-none">
        点击标记查看详情 | 滚动缩放地图
      </div>
    </div>
  )
}
