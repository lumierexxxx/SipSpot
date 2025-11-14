// ============================================
// SipSpot Frontend - Map Component
// 地图展示组件（使用 Google Maps）
// ============================================

import React, { useEffect, useRef, useState } from 'react';

// Google Maps API Key - 从环境变量读取
const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

/**
 * Map 组件
 * @param {Array} cafes - 咖啡店数据数组
 * @param {Object} center - 地图中心 {lat, lng}
 * @param {number} zoom - 缩放级别
 * @param {Function} onMarkerClick - 标记点击回调
 * @param {string} className - 额外CSS类
 * @param {number} height - 地图高度（像素）
 */
const Map = ({
    cafes = [],
    center = { lat: 40.7608, lng: -111.8910 }, // 默认盐湖城
    zoom = 13,
    onMarkerClick,
    className = '',
    height = 400
}) => {
    const mapRef = useRef(null);
    const mapInstanceRef = useRef(null);
    const markersRef = useRef([]);
    const [isLoaded, setIsLoaded] = useState(false);
    const [error, setError] = useState(null);

    // ============================================
    // 加载 Google Maps 脚本
    // ============================================
    useEffect(() => {
        // 检查 API Key
        if (!GOOGLE_MAPS_API_KEY) {
            setError('Google Maps API Key 未配置');
            return;
        }

        // 检查是否已经加载
        if (window.google && window.google.maps) {
            setIsLoaded(true);
            return;
        }

        // 检查脚本是否正在加载
        if (document.querySelector('script[src*="maps.googleapis.com"]')) {
            // 等待加载完成
            const checkLoaded = setInterval(() => {
                if (window.google && window.google.maps) {
                    setIsLoaded(true);
                    clearInterval(checkLoaded);
                }
            }, 100);
            
            return () => clearInterval(checkLoaded);
        }

        // 加载 Google Maps JS API
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places&language=zh-CN`;
        script.async = true;
        script.defer = true;

        script.onload = () => {
            setIsLoaded(true);
        };

        script.onerror = () => {
            setError('Google Maps 加载失败');
        };

        document.head.appendChild(script);

        return () => {
            // 清理（注意：Google Maps 不建议移除脚本）
        };
    }, []);

    // ============================================
    // 初始化地图
    // ============================================
    useEffect(() => {
        if (!isLoaded || !mapRef.current || mapInstanceRef.current) return;

        try {
            // 创建地图实例
            const map = new window.google.maps.Map(mapRef.current, {
                center: { lat: center.lat, lng: center.lng },
                zoom: zoom,
                // 地图样式选项
                mapTypeControl: true,
                mapTypeControlOptions: {
                    style: window.google.maps.MapTypeControlStyle.DROPDOWN_MENU,
                    position: window.google.maps.ControlPosition.TOP_RIGHT
                },
                streetViewControl: true,
                streetViewControlOptions: {
                    position: window.google.maps.ControlPosition.RIGHT_BOTTOM
                },
                zoomControl: true,
                zoomControlOptions: {
                    position: window.google.maps.ControlPosition.RIGHT_CENTER
                },
                fullscreenControl: true,
                // 地图样式（可选，使用浅色主题）
                styles: [
                    {
                        featureType: 'poi.business',
                        stylers: [{ visibility: 'off' }]
                    }
                ]
            });

            mapInstanceRef.current = map;
        } catch (err) {
            console.error('Map initialization error:', err);
            setError('地图初始化失败');
        }
    }, [isLoaded, center.lat, center.lng, zoom]);

    // ============================================
    // 添加/更新标记
    // ============================================
    useEffect(() => {
        if (!isLoaded || !mapInstanceRef.current || cafes.length === 0) return;

        const map = mapInstanceRef.current;
        const google = window.google;

        // 清除旧标记
        markersRef.current.forEach(marker => marker.setMap(null));
        markersRef.current = [];

        // 创建边界对象用于自动调整视图
        const bounds = new google.maps.LatLngBounds();

        // 添加标记
        cafes.forEach((cafe) => {
            const coordinates = cafe.geometry?.coordinates || cafe.coordinates;
            
            if (!coordinates || coordinates.length !== 2) return;

            const [lng, lat] = coordinates;
            const position = { lat, lng };

            // 扩展边界
            bounds.extend(position);

            // 创建标记
            const marker = new google.maps.Marker({
                position: position,
                map: map,
                title: cafe.name,
                animation: google.maps.Animation.DROP,
                // 自定义图标
                icon: {
                    path: google.maps.SymbolPath.CIRCLE,
                    scale: 12,
                    fillColor: '#D97706',
                    fillOpacity: 1,
                    strokeColor: '#FFFFFF',
                    strokeWeight: 3
                }
            });

            // 创建信息窗口内容
            const infoWindowContent = `
                <div style="padding: 12px; min-width: 200px; font-family: system-ui, -apple-system, sans-serif;">
                    <h3 style="font-weight: bold; font-size: 16px; color: #111827; margin: 0 0 8px 0;">${cafe.name}</h3>
                    <div style="display: flex; align-items: center; margin-bottom: 8px;">
                        <span style="color: #F59E0B; font-size: 14px;">★</span>
                        <span style="margin-left: 4px; font-weight: 500;">${cafe.rating?.toFixed(1) || '0.0'}</span>
                        <span style="margin-left: 4px; color: #6B7280; font-size: 13px;">(${cafe.reviewCount || 0})</span>
                    </div>
                    <p style="color: #6B7280; font-size: 13px; margin: 0 0 12px 0;">${cafe.address || cafe.city}</p>
                    <a 
                        href="/cafes/${cafe._id || cafe.id}" 
                        style="display: inline-block; background-color: #D97706; color: white; padding: 6px 12px; border-radius: 4px; text-decoration: none; font-size: 13px; transition: background-color 0.2s;"
                        onmouseover="this.style.backgroundColor='#B45309'"
                        onmouseout="this.style.backgroundColor='#D97706'"
                    >
                        查看详情
                    </a>
                </div>
            `;

            // 创建信息窗口
            const infoWindow = new google.maps.InfoWindow({
                content: infoWindowContent
            });

            // 点击标记显示信息窗口
            marker.addListener('click', () => {
                // 关闭其他打开的信息窗口
                markersRef.current.forEach(m => {
                    if (m.infoWindow) {
                        m.infoWindow.close();
                    }
                });
                
                infoWindow.open(map, marker);
                
                // 调用回调
                if (onMarkerClick) {
                    onMarkerClick(cafe);
                }
            });

            // 保存信息窗口引用
            marker.infoWindow = infoWindow;

            markersRef.current.push(marker);
        });

        // 自动调整视图以显示所有标记
        if (markersRef.current.length > 0) {
            map.fitBounds(bounds);
            
            // 如果只有一个标记，确保缩放级别合适
            if (markersRef.current.length === 1) {
                const listener = google.maps.event.addListener(map, 'idle', () => {
                    if (map.getZoom() > 15) {
                        map.setZoom(15);
                    }
                    google.maps.event.removeListener(listener);
                });
            }
        }

    }, [isLoaded, cafes, onMarkerClick]);

    // ============================================
    // 错误状态
    // ============================================
    if (error) {
        return (
            <div 
                className={`bg-gray-100 rounded-lg flex items-center justify-center ${className}`}
                style={{ height: `${height}px` }}
            >
                <div className="text-center p-4">
                    <svg className="w-12 h-12 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                    </svg>
                    <p className="text-gray-600">{error}</p>
                    {error.includes('API Key') && (
                        <p className="text-sm text-gray-500 mt-2">
                            请在 .env 文件中配置 VITE_GOOGLE_MAPS_API_KEY
                        </p>
                    )}
                </div>
            </div>
        );
    }

    // ============================================
    // 加载状态
    // ============================================
    if (!isLoaded) {
        return (
            <div 
                className={`bg-gray-100 rounded-lg flex items-center justify-center ${className}`}
                style={{ height: `${height}px` }}
            >
                <div className="text-center">
                    <div className="inline-block w-12 h-12 border-4 border-gray-300 border-t-amber-600 rounded-full animate-spin mb-2" />
                    <p className="text-gray-600">加载地图中...</p>
                </div>
            </div>
        );
    }

    return (
        <div className={`relative ${className}`}>
            <div
                ref={mapRef}
                className="rounded-lg overflow-hidden shadow-md"
                style={{ height: `${height}px`, width: '100%' }}
            />
            
            {/* 地图控制提示 */}
            <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 text-xs text-gray-600 shadow-md pointer-events-none">
                💡 点击标记查看详情 | 滚动缩放地图
            </div>
        </div>
    );
};

/**
 * SimpleMap 组件 - 显示单个位置的简化地图
 * @param {Object} location - 位置 {lat, lng}
 * @param {string} title - 标题
 * @param {number} zoom - 缩放级别
 * @param {number} height - 高度
 */
export const SimpleMap = ({ 
    location, 
    title = '位置',
    zoom = 15,
    height = 300 
}) => {
    const mapRef = useRef(null);
    const [isLoaded, setIsLoaded] = useState(false);
    const [error, setError] = useState(null);

    // 加载 Google Maps
    useEffect(() => {
        if (!GOOGLE_MAPS_API_KEY) {
            setError('Google Maps API Key 未配置');
            return;
        }

        if (window.google && window.google.maps) {
            setIsLoaded(true);
            return;
        }

        if (document.querySelector('script[src*="maps.googleapis.com"]')) {
            const checkLoaded = setInterval(() => {
                if (window.google && window.google.maps) {
                    setIsLoaded(true);
                    clearInterval(checkLoaded);
                }
            }, 100);
            
            return () => clearInterval(checkLoaded);
        }

        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&language=zh-CN`;
        script.async = true;
        script.onload = () => setIsLoaded(true);
        script.onerror = () => setError('Google Maps 加载失败');
        document.head.appendChild(script);
    }, []);

    // 初始化地图和标记
    useEffect(() => {
        if (!isLoaded || !mapRef.current || !location) return;

        const google = window.google;
        const map = new google.maps.Map(mapRef.current, {
            center: { lat: location.lat, lng: location.lng },
            zoom: zoom,
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: false
        });

        // 添加标记
        const marker = new google.maps.Marker({
            position: { lat: location.lat, lng: location.lng },
            map: map,
            title: title,
            animation: google.maps.Animation.DROP,
            icon: {
                path: google.maps.SymbolPath.CIRCLE,
                scale: 12,
                fillColor: '#D97706',
                fillOpacity: 1,
                strokeColor: '#FFFFFF',
                strokeWeight: 3
            }
        });

        // 添加信息窗口
        const infoWindow = new google.maps.InfoWindow({
            content: `<div style="padding: 8px; font-weight: 600;">${title}</div>`
        });
        
        infoWindow.open(map, marker);

        // 清理函数
        return () => {
            marker.setMap(null);
        };
    }, [isLoaded, location, title, zoom]);

    if (error) {
        return (
            <div 
                className="bg-gray-100 rounded-lg flex items-center justify-center"
                style={{ height: `${height}px` }}
            >
                <p className="text-gray-600 text-sm">{error}</p>
            </div>
        );
    }

    if (!isLoaded) {
        return (
            <div 
                className="bg-gray-100 rounded-lg flex items-center justify-center"
                style={{ height: `${height}px` }}
            >
                <div className="inline-block w-8 h-8 border-4 border-gray-300 border-t-amber-600 rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div
            ref={mapRef}
            className="rounded-lg overflow-hidden shadow-md"
            style={{ height: `${height}px`, width: '100%' }}
        />
    );
};

export default Map;