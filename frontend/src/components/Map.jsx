// ============================================
// SipSpot Frontend - Map Component
// 地图展示组件（使用 Leaflet）
// ============================================

import React, { useEffect, useRef, useState } from 'react';

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
    // 加载 Leaflet 脚本和样式
    // ============================================
    useEffect(() => {
        // 检查是否已经加载
        if (window.L) {
            Promise.resolve().then(() => setIsLoaded(true));  // ✔
            return;
        }


        // 加载 Leaflet CSS
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        link.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
        link.crossOrigin = '';
        document.head.appendChild(link);

        // 加载 Leaflet JS
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        script.integrity = 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=';
        script.crossOrigin = '';
        script.async = true;

        script.onload = () => {
            setTimeout(() => setIsLoaded(true), 0);
        };

        script.onerror = () => {
            setError('地图加载失败');
        };

        document.body.appendChild(script);

        return () => {
            // 清理
            if (link.parentNode) {
                link.parentNode.removeChild(link);
            }
            if (script.parentNode) {
                script.parentNode.removeChild(script);
            }
        };
    }, []);

    // ============================================
    // 初始化地图
    // ============================================
    useEffect(() => {
        if (!isLoaded || !mapRef.current || mapInstanceRef.current) return;

        try {
            const L = window.L;

            // 创建地图实例
            const map = L.map(mapRef.current).setView([center.lat, center.lng], zoom);

            // 添加瓦片层（OpenStreetMap）
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors',
                maxZoom: 19
            }).addTo(map);

            mapInstanceRef.current = map;
        } catch (err) {
            console.error('Map initialization error:', err);
            Promise.resolve().then(() => setError('地图初始化失败'));
        }
    }, [isLoaded, center.lat, center.lng, zoom]);

    // ============================================
    // 添加/更新标记
    // ============================================
    useEffect(() => {
        if (!isLoaded || !mapInstanceRef.current || cafes.length === 0) return;

        const L = window.L;
        const map = mapInstanceRef.current;

        // 清除旧标记
        markersRef.current.forEach(marker => marker.remove());
        markersRef.current = [];

        // 创建自定义图标
        const cafeIcon = L.divIcon({
            html: `
                <div class="relative">
                    <div class="absolute -inset-2 bg-amber-500 rounded-full opacity-25 animate-pulse"></div>
                    <div class="relative w-10 h-10 bg-amber-600 rounded-full shadow-lg flex items-center justify-center text-white text-xl border-2 border-white">
                        ☕
                    </div>
                </div>
            `,
            className: 'custom-cafe-marker',
            iconSize: [40, 40],
            iconAnchor: [20, 40],
            popupAnchor: [0, -40]
        });

        // 添加标记
        const bounds = [];
        
        cafes.forEach((cafe) => {
            const coordinates = cafe.geometry?.coordinates || cafe.coordinates;
            
            if (!coordinates || coordinates.length !== 2) return;

            const [lng, lat] = coordinates;
            bounds.push([lat, lng]);

            const marker = L.marker([lat, lng], { icon: cafeIcon }).addTo(map);

            // 创建弹窗内容
            const popupContent = `
                <div class="p-2 min-w-[200px]">
                    <h3 class="font-bold text-lg text-gray-900 mb-2">${cafe.name}</h3>
                    <div class="flex items-center mb-2">
                        <span class="text-amber-500">★</span>
                        <span class="ml-1 font-medium">${cafe.rating?.toFixed(1) || '0.0'}</span>
                        <span class="ml-1 text-gray-600 text-sm">(${cafe.reviewCount || 0})</span>
                    </div>
                    <p class="text-sm text-gray-600 mb-2">${cafe.address || cafe.city}</p>
                    <a 
                        href="/cafes/${cafe._id || cafe.id}" 
                        class="inline-block bg-amber-600 text-white px-3 py-1 rounded text-sm hover:bg-amber-700 transition-colors"
                    >
                        查看详情
                    </a>
                </div>
            `;

            marker.bindPopup(popupContent);

            // 点击事件
            if (onMarkerClick) {
                marker.on('click', () => {
                    onMarkerClick(cafe);
                });
            }

            markersRef.current.push(marker);
        });

        // 自动调整视图以显示所有标记
        if (bounds.length > 0) {
            map.fitBounds(bounds, { padding: [50, 50] });
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
                <div className="text-center">
                    <svg className="w-12 h-12 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                    </svg>
                    <p className="text-gray-600">{error}</p>
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
                    <div className="spinner w-12 h-12 mx-auto mb-2" />
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
            <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 text-xs text-gray-600 shadow-md">
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

    useEffect(() => {
        if (window.L) {
            Promise.resolve().then(() => setIsLoaded(true));
            return;
        }

        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);

        const script = document.createElement('script');
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        script.async = true;
        script.onload = () => {
            setTimeout(() => setIsLoaded(true), 0);
        };
        document.body.appendChild(script);
    }, []);

    useEffect(() => {
        if (!isLoaded || !mapRef.current || !location) return;

        const L = window.L;
        const map = L.map(mapRef.current).setView([location.lat, location.lng], zoom);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(map);

        // 添加标记
        const marker = L.marker([location.lat, location.lng]).addTo(map);
        marker.bindPopup(`<strong>${title}</strong>`).openPopup();

        return () => {
            map.remove();
        };
    }, [isLoaded, location, title, zoom]);

    if (!isLoaded) {
        return (
            <div 
                className="bg-gray-100 rounded-lg flex items-center justify-center"
                style={{ height: `${height}px` }}
            >
                <div className="spinner w-8 h-8" />
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