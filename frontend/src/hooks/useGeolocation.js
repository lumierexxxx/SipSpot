// ============================================
// SipSpot Frontend - Geolocation Hook
// 获取和追踪用户地理位置
// ============================================

import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * 默认配置选项
 */
const DEFAULT_OPTIONS = {
    enableHighAccuracy: true,  // 高精度模式
    timeout: 10000,            // 10秒超时
    maximumAge: 60000          // 缓存1分钟
};

/**
 * 默认位置（如果获取失败，使用这个）
 * 这里设置为盐湖城（根据你的用户位置）
 */
const DEFAULT_LOCATION = {
    latitude: 40.7608,
    longitude: -111.8910,
    city: 'Salt Lake City'
};

/**
 * useGeolocation Hook
 * @param {Object} options - Geolocation API 选项
 * @param {boolean} watch - 是否持续追踪位置（默认false）
 * @param {boolean} autoFetch - 是否自动获取位置（默认true）
 */
export const useGeolocation = (options = {}, watch = false, autoFetch = true) => {
    const [position, setPosition] = useState(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const [permission, setPermission] = useState('prompt'); // 'granted' | 'denied' | 'prompt'
    
    const watchIdRef = useRef(null);
    const isMountedRef = useRef(true);

    // 合并选项
    const geoOptions = { ...DEFAULT_OPTIONS, ...options };

    // ============================================
    // 检查地理位置API是否可用
    // ============================================
    const isGeolocationAvailable = 'geolocation' in navigator;

    // ============================================
    // 成功回调
    // ============================================
    const handleSuccess = useCallback((pos) => {
        if (!isMountedRef.current) return;

        const locationData = {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
            altitude: pos.coords.altitude,
            altitudeAccuracy: pos.coords.altitudeAccuracy,
            heading: pos.coords.heading,
            speed: pos.coords.speed,
            timestamp: pos.timestamp
        };

        setPosition(locationData);
        setError(null);
        setLoading(false);
        setPermission('granted');

        // 保存到 localStorage（可选）
        try {
            localStorage.setItem('lastKnownLocation', JSON.stringify({
                ...locationData,
                savedAt: new Date().toISOString()
            }));
        } catch (err) {
            console.error('Failed to save location to localStorage:', err);
        }
    }, []);

    // ============================================
    // 错误回调
    // ============================================
    const handleError = useCallback((err) => {
        if (!isMountedRef.current) return;

        let errorMessage = '无法获取位置信息';
        let errorType = 'UNKNOWN_ERROR';

        switch (err.code) {
            case err.PERMISSION_DENIED:
                errorMessage = '您拒绝了位置访问权限';
                errorType = 'PERMISSION_DENIED';
                setPermission('denied');
                break;
            case err.POSITION_UNAVAILABLE:
                errorMessage = '位置信息暂时不可用';
                errorType = 'POSITION_UNAVAILABLE';
                break;
            case err.TIMEOUT:
                errorMessage = '获取位置信息超时';
                errorType = 'TIMEOUT';
                break;
            default:
                errorMessage = err.message || '未知错误';
                break;
        }

        setError({
            message: errorMessage,
            type: errorType,
            code: err.code
        });
        setLoading(false);

        // 尝试使用上次保存的位置
        tryLoadLastKnownLocation();
    }, []);

    // ============================================
    // 尝试加载上次保存的位置
    // ============================================
    const tryLoadLastKnownLocation = useCallback(() => {
        try {
            const saved = localStorage.getItem('lastKnownLocation');
            if (saved) {
                const lastLocation = JSON.parse(saved);
                const savedAt = new Date(lastLocation.savedAt);
                const now = new Date();
                const diffMinutes = (now - savedAt) / 1000 / 60;

                // 如果保存时间在30分钟内，使用保存的位置
                if (diffMinutes < 30) {
                    console.log('使用上次保存的位置（', Math.round(diffMinutes), '分钟前）');
                    setPosition(lastLocation);
                    return true;
                }
            }
        } catch (err) {
            console.error('Failed to load last known location:', err);
        }

        // 没有保存的位置，使用默认位置
        console.log('使用默认位置（盐湖城）');
        setPosition(DEFAULT_LOCATION);
        return false;
    }, []);

    // ============================================
    // 获取当前位置
    // ============================================
    const getCurrentPosition = useCallback(() => {
        if (!isGeolocationAvailable) {
            setError({
                message: '您的浏览器不支持地理定位',
                type: 'NOT_SUPPORTED'
            });
            tryLoadLastKnownLocation();
            return;
        }

        setLoading(true);
        setError(null);

        navigator.geolocation.getCurrentPosition(
            handleSuccess,
            handleError,
            geoOptions
        );
    }, [isGeolocationAvailable, handleSuccess, handleError, geoOptions, tryLoadLastKnownLocation]);

    // ============================================
    // 开始追踪位置
    // ============================================
    const startWatching = useCallback(() => {
        if (!isGeolocationAvailable) return;

        if (watchIdRef.current !== null) {
            // 已在追踪中
            return;
        }

        setLoading(true);
        setError(null);

        watchIdRef.current = navigator.geolocation.watchPosition(
            handleSuccess,
            handleError,
            geoOptions
        );
    }, [isGeolocationAvailable, handleSuccess, handleError, geoOptions]);

    // ============================================
    // 停止追踪位置
    // ============================================
    const stopWatching = useCallback(() => {
        if (watchIdRef.current !== null) {
            navigator.geolocation.clearWatch(watchIdRef.current);
            watchIdRef.current = null;
            setLoading(false);
        }
    }, []);

    // ============================================
    // 清除位置数据
    // ============================================
    const clearPosition = useCallback(() => {
        setPosition(null);
        setError(null);
        try {
            localStorage.removeItem('lastKnownLocation');
        } catch (err) {
            console.error('Failed to clear location from localStorage:', err);
        }
    }, []);

    // ============================================
    // 请求权限
    // ============================================
    const requestPermission = useCallback(async () => {
        if (!isGeolocationAvailable) {
            setPermission('denied');
            return 'denied';
        }

        try {
            // 检查 Permissions API 是否可用
            if ('permissions' in navigator) {
                const result = await navigator.permissions.query({ name: 'geolocation' });
                setPermission(result.state);
                return result.state;
            }
        } catch (err) {
            console.error('Failed to query geolocation permission:', err);
        }

        // 如果 Permissions API 不可用，尝试直接获取位置
        // 这会触发权限请求
        getCurrentPosition();
        return permission;
    }, [isGeolocationAvailable, getCurrentPosition, permission]);

    // ============================================
    // 自动获取位置（组件挂载时）
    // ============================================
    useEffect(() => {
        isMountedRef.current = true;

        if (autoFetch) {
            if (watch) {
                startWatching();
            } else {
                getCurrentPosition();
            }
        }

        return () => {
            isMountedRef.current = false;
            stopWatching();
        };
    }, [autoFetch, watch, startWatching, stopWatching, getCurrentPosition]);

    // ============================================
    // 计算两点之间的距离（千米）
    // ============================================
    const calculateDistance = useCallback((lat1, lon1, lat2, lon2) => {
        const R = 6371; // 地球半径（千米）
        const dLat = ((lat2 - lat1) * Math.PI) / 180;
        const dLon = ((lon2 - lon1) * Math.PI) / 180;
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos((lat1 * Math.PI) / 180) *
                Math.cos((lat2 * Math.PI) / 180) *
                Math.sin(dLon / 2) *
                Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }, []);

    // ============================================
    // 获取到某个位置的距离
    // ============================================
    const getDistanceTo = useCallback(
        (targetLat, targetLon) => {
            if (!position) return null;
            return calculateDistance(
                position.latitude,
                position.longitude,
                targetLat,
                targetLon
            );
        },
        [position, calculateDistance]
    );

    // ============================================
    // 格式化距离显示
    // ============================================
    const formatDistance = useCallback((kilometers) => {
        if (kilometers === null) return '未知';
        if (kilometers < 1) {
            return `${Math.round(kilometers * 1000)}米`;
        }
        return `${kilometers.toFixed(1)}公里`;
    }, []);

    // ============================================
    // 返回值
    // ============================================
    return {
        // 位置数据
        position,
        latitude: position?.latitude || null,
        longitude: position?.longitude || null,
        accuracy: position?.accuracy || null,
        
        // 状态
        loading,
        error,
        permission,
        isGeolocationAvailable,
        hasPosition: position !== null,
        
        // 方法
        getCurrentPosition,
        startWatching,
        stopWatching,
        clearPosition,
        requestPermission,
        
        // 工具方法
        calculateDistance,
        getDistanceTo,
        formatDistance
    };
};

/**
 * 简化版：仅获取一次位置
 */
export const useCurrentPosition = (options = {}) => {
    return useGeolocation(options, false, true);
};

/**
 * 实时追踪版：持续追踪位置变化
 */
export const useWatchPosition = (options = {}) => {
    return useGeolocation(options, true, true);
};

export default useGeolocation;