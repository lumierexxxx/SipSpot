// ============================================
// SipSpot - 地理编码工具
// 使用 OpenStreetMap Nominatim API（免费开源）
// ============================================

const axios = require('axios');

// Nominatim API 配置
const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org';
const USER_AGENT = 'SipSpot/1.0 (Coffee Shop Review App)';

/**
 * 地理编码 - 地址转坐标
 * @param {string} address - 地址字符串
 * @returns {Object} { longitude, latitude, formattedAddress, city, country, state, postcode }
 */
exports.geocode = async (address) => {
    try {
        const response = await axios.get(`${NOMINATIM_BASE_URL}/search`, {
            params: {
                q: address,
                format: 'json',
                limit: 1,
                addressdetails: 1
            },
            headers: {
                'User-Agent': USER_AGENT
            }
        });
        
        if (response.data && response.data.length > 0) {
            const result = response.data[0];
            const addressDetails = result.address || {};
            
            return {
                longitude: parseFloat(result.lon),
                latitude: parseFloat(result.lat),
                formattedAddress: result.display_name,
                city: addressDetails.city || addressDetails.town || addressDetails.village || '',
                country: addressDetails.country || '',
                state: addressDetails.state || '',
                postcode: addressDetails.postcode || ''
            };
        }
        
        throw new Error('未找到该地址的坐标');
    } catch (error) {
        if (error.response?.status === 429) {
            throw new Error('请求过于频繁，请稍后再试');
        }
        console.error('Geocoding error:', error.message);
        throw new Error('地址解析失败');
    }
};

/**
 * 反向地理编码 - 坐标转地址
 * @param {number} longitude - 经度
 * @param {number} latitude - 纬度
 * @returns {Object} { address, city, country, state, postcode }
 */
exports.reverseGeocode = async (longitude, latitude) => {
    try {
        const response = await axios.get(`${NOMINATIM_BASE_URL}/reverse`, {
            params: {
                lat: latitude,
                lon: longitude,
                format: 'json',
                addressdetails: 1
            },
            headers: {
                'User-Agent': USER_AGENT
            }
        });
        
        if (response.data && response.data.address) {
            const addressDetails = response.data.address;
            
            return {
                address: response.data.display_name,
                city: addressDetails.city || addressDetails.town || addressDetails.village || '',
                country: addressDetails.country || '',
                state: addressDetails.state || '',
                postcode: addressDetails.postcode || ''
            };
        }
        
        throw new Error('未找到该坐标的地址');
    } catch (error) {
        if (error.response?.status === 429) {
            throw new Error('请求过于频繁，请稍后再试');
        }
        console.error('Reverse geocoding error:', error.message);
        throw new Error('坐标解析失败');
    }
};

/**
 * 计算两点之间的距离（米）
 * 使用 Haversine 公式
 * @param {number} lat1 - 第一个点的纬度
 * @param {number} lon1 - 第一个点的经度
 * @param {number} lat2 - 第二个点的纬度
 * @param {number} lon2 - 第二个点的经度
 * @returns {number} 距离（米）
 */
exports.calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3; // 地球半径（米）
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;
    
    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    
    return R * c; // 返回距离（米）
};

/**
 * 格式化距离显示
 * @param {number} meters - 距离（米）
 * @returns {string} 格式化的距离字符串
 */
exports.formatDistance = (meters) => {
    if (meters < 1000) {
        return `${Math.round(meters)}米`;
    }
    return `${(meters / 1000).toFixed(1)}公里`;
};

/**
 * 验证坐标是否有效
 * @param {number} longitude - 经度
 * @param {number} latitude - 纬度
 * @returns {boolean}
 */
exports.isValidCoordinates = (longitude, latitude) => {
    return (
        typeof longitude === 'number' &&
        typeof latitude === 'number' &&
        longitude >= -180 &&
        longitude <= 180 &&
        latitude >= -90 &&
        latitude <= 90
    );
};