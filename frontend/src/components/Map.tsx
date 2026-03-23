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
  // 初始化地图 + 添加标记（合并为单一 effect）
  // ============================================
  useEffect(() => {
    // 清理之前的地图实例
    if (mapInstance.current) {
      mapInstance.current.destroy()
    }

    const amapKey = import.meta.env.VITE_AMAP_KEY as string | undefined
    const securityCode = import.meta.env.VITE_AMAP_SECURITY_CODE as string | undefined

    if (!amapKey) {
      setError('高德地图 API Key 未配置')
      setLoading(false)
      return
    }

    AMapLoader.load({
      key: amapKey,
      version: '2.0',
      plugins: [
        'AMap.Marker',
        'AMap.InfoWindow',
        'AMap.Geolocation',
        'AMap.Scale',
        'AMap.ToolBar',
      ],
      ...(securityCode ? { securityJsCode: securityCode } : {}),
    })
      .then((_AMapSDK: typeof AMap) => {
        // 创建地图实例
        const map = new _AMapSDK.Map(mapRef.current!, {
          zoom,
          center: center ?? [121.473701, 31.230416], // 默认上海人民广场
          viewMode: '2D',
          mapStyle: 'amap://styles/light', // 浅色主题
          showLabel: true,
          features: ['bg', 'road', 'building', 'point'],
        })

        mapInstance.current = map

        // 添加缩放和平移控件
        map.addControl(new _AMapSDK.Scale({}))
        map.addControl(
          new _AMapSDK.ToolBar({
            position: {
              top: '110px',
              right: '40px',
            },
          }),
        )

        // 显示用户位置
        if (showUserLocation) {
          const geolocation = new _AMapSDK.Geolocation({
            enableHighAccuracy: true,
            timeout: 10000,
            buttonPosition: 'RB',
            buttonOffset: new _AMapSDK.Pixel(10, 20),
            zoomToAccuracy: true,
          })

          map.addControl(geolocation)
          geolocation.getCurrentPosition()
        }

        // 清除旧标记
        markersRef.current.forEach((marker) => marker.setMap(null))
        markersRef.current = []

        // 添加咖啡馆标记
        cafes.forEach((cafe) => {
          const marker = new _AMapSDK.Marker({
            position: [
              cafe.geometry.coordinates[0], // 经度
              cafe.geometry.coordinates[1], // 纬度
            ],
            title: cafe.name,
            extData: cafe, // 存储咖啡馆数据
            cursor: 'pointer',
          })

          // 获取第一张图片 URL（兼容 string | CafeImage 两种格式）
          const firstImage = cafe.images?.[0]
          const imageUrl =
            firstImage == null
              ? null
              : typeof firstImage === 'string'
                ? firstImage
                : firstImage.url ?? null

          // WARNING: XSS risk — InfoWindow uses innerHTML with cafe data.
          // Do not add user-generated content here without sanitization. Fix in separate security task.
          const infoWindowContent = `
            <div style="padding: 12px; min-width: 240px;">
                <div style="font-size: 16px; font-weight: bold; margin-bottom: 8px;">
                    ${cafe.name}
                </div>
                ${imageUrl ? `
                    <img
                        src="${imageUrl}"
                        alt="${cafe.name}"
                        style="width: 100%; height: 150px; object-fit: cover; border-radius: 8px; margin-bottom: 8px;"
                    />
                ` : ''}
                <div style="color: #666; font-size: 14px; margin-bottom: 4px;">
                    ⭐ ${cafe.rating ? cafe.rating.toFixed(1) : 'N/A'}
                    ${cafe.reviewCount ? `(${cafe.reviewCount}条评论)` : ''}
                </div>
                <div style="color: #666; font-size: 14px; margin-bottom: 4px;">
                    💰 ${'$'.repeat(cafe.price ?? 2)}
                </div>
                <div style="color: #666; font-size: 14px; margin-bottom: 8px;">
                    📍 ${cafe.address}
                </div>
                ${cafe.description ? `
                    <div style="color: #888; font-size: 13px; margin-bottom: 8px; max-height: 60px; overflow: hidden;">
                        ${cafe.description.substring(0, 80)}${cafe.description.length > 80 ? '...' : ''}
                    </div>
                ` : ''}
                <a
                    href="/cafes/${cafe._id}"
                    style="
                        display: inline-block;
                        padding: 6px 12px;
                        background: #16a34a;
                        color: white;
                        text-decoration: none;
                        border-radius: 6px;
                        font-size: 14px;
                        margin-top: 8px;
                    "
                >
                    查看详情 →
                </a>
            </div>
          `

          // 点击标记显示信息窗口
          marker.on('click', () => {
            const pos = marker.getPosition()
            if (!pos) return

            // 创建信息窗口
            const infoWindow = new _AMapSDK.InfoWindow({
              content: infoWindowContent,
              offset: new _AMapSDK.Pixel(0, -30),
            })

            infoWindow.open(map, [pos.lng, pos.lat])

            // 触发回调
            onMarkerClick?.(cafe)
          })

          // 添加到地图
          map.add(marker)
          markersRef.current.push(marker)
        })

        // 如果有多个标记，自动调整视野
        if (cafes.length > 1) {
          map.setFitView()
        }

        setLoading(false)
      })
      .catch((err: unknown) => {
        console.error('高德地图加载失败:', err)
        setError('地图加载失败，请刷新页面重试')
        setLoading(false)
      })

    // 清理函数
    return () => {
      if (mapInstance.current) {
        mapInstance.current.destroy()
        mapInstance.current = null
      }
    }
  }, [cafes, center, zoom, showUserLocation, onMarkerClick])

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
        <div className="text-center text-gray-600">
          <p className="text-lg mb-2">❌ {error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-2 px-4 py-2 bg-green-600 text-white rounded-md text-sm cursor-pointer"
          >
            刷新页面
          </button>
        </div>
      </div>
    )
  }

  // ============================================
  // 地图容器（loading 时显示遮罩层）
  // ============================================
  return (
    <div className="relative w-full" style={{ height }}>
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/90 z-[1000]">
          <div className="text-center">
            <div className="text-2xl mb-2">🗺️</div>
            <div className="text-gray-600">地图加载中...</div>
          </div>
        </div>
      )}
      <div ref={mapRef} className="w-full h-full" />
    </div>
  )
}
