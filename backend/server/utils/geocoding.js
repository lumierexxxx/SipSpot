// ============================================
// SipSpot - 地理编码工具
// 使用 Google Maps Geocoding API
// ============================================

const axios = require('axios');

// Google Maps API 配置
const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;
const GEOCODING_BASE_URL = 'https://maps.googleapis.com/maps/api/geocode/json';

// API Key 检查
if (!GOOGLE_MAPS_API_KEY) {
    console.warn('⚠️  警告: GOOGLE_MAPS_API_KEY 未设置，地理编码功能将无法使用');
}

/**
 * 地理编码 - 地址转坐标
 * @param {string} address - 地址字符串
 * @returns {Object} { longitude, latitude, formattedAddress, city, country, state, postcode }
 */
exports.geocode = async (address) => {
    try {
        if (!GOOGLE_MAPS_API_KEY) {
            throw new Error('Google Maps API Key 未配置');
        }

        const response = await axios.get(GEOCODING_BASE_URL, {
            params: {
                address: address,
                key: GOOGLE_MAPS_API_KEY,
                language: 'zh-CN' // 中文结果
            }
        });
        
        if (response.data.status === 'OK' && response.data.results.length > 0) {
            const result = response.data.results[0];
            const location = result.geometry.location;
            const addressComponents = result.address_components;
            
            // 解析地址组件
            const getAddressComponent = (types) => {
                const component = addressComponents.find(comp => 
                    types.some(type => comp.types.includes(type))
                );
                return component ? component.long_name : '';
            };
            
            return {
                longitude: location.lng,
                latitude: location.lat,
                formattedAddress: result.formatted_address,
                city: getAddressComponent(['locality', 'administrative_area_level_2']),
                country: getAddressComponent(['country']),
                state: getAddressComponent(['administrative_area_level_1']),
                postcode: getAddressComponent(['postal_code']),
                placeId: result.place_id // Google Places ID，可用于获取更多详情
            };
        }
        
        // 处理不同的错误状态
        if (response.data.status === 'ZERO_RESULTS') {
            throw new Error('未找到该地址的坐标');
        } else if (response.data.status === 'OVER_QUERY_LIMIT') {
            throw new Error('API 配额已用完，请稍后再试');
        } else if (response.data.status === 'REQUEST_DENIED') {
            throw new Error('API 请求被拒绝，请检查 API Key 配置');
        } else if (response.data.status === 'INVALID_REQUEST') {
            throw new Error('无效的地址');
        }
        
        throw new Error('地址解析失败');
    } catch (error) {
        console.error('Geocoding error:', error.message);
        throw error;
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
        if (!GOOGLE_MAPS_API_KEY) {
            throw new Error('Google Maps API Key 未配置');
        }

        const response = await axios.get(GEOCODING_BASE_URL, {
            params: {
                latlng: `${latitude},${longitude}`,
                key: GOOGLE_MAPS_API_KEY,
                language: 'zh-CN',
                result_type: 'street_address|route|locality' // 优先返回街道地址
            }
        });
        
        if (response.data.status === 'OK' && response.data.results.length > 0) {
            const result = response.data.results[0];
            const addressComponents = result.address_components;
            
            // 解析地址组件
            const getAddressComponent = (types) => {
                const component = addressComponents.find(comp => 
                    types.some(type => comp.types.includes(type))
                );
                return component ? component.long_name : '';
            };
            
            return {
                address: result.formatted_address,
                city: getAddressComponent(['locality', 'administrative_area_level_2']),
                country: getAddressComponent(['country']),
                state: getAddressComponent(['administrative_area_level_1']),
                postcode: getAddressComponent(['postal_code']),
                placeId: result.place_id
            };
        }
        
        if (response.data.status === 'ZERO_RESULTS') {
            throw new Error('未找到该坐标的地址');
        } else if (response.data.status === 'OVER_QUERY_LIMIT') {
            throw new Error('API 配额已用完，请稍后再试');
        }
        
        throw new Error('坐标解析失败');
    } catch (error) {
        console.error('Reverse geocoding error:', error.message);
        throw error;
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

/**
 * 通过 Place ID 获取详细信息（可选扩展功能）
 * @param {string} placeId - Google Places ID
 * @returns {Object} 详细的地点信息
 */
exports.getPlaceDetails = async (placeId) => {
    try {
        if (!GOOGLE_MAPS_API_KEY) {
            throw new Error('Google Maps API Key 未配置');
        }

        const response = await axios.get('https://maps.googleapis.com/maps/api/place/details/json', {
            params: {
                place_id: placeId,
                key: GOOGLE_MAPS_API_KEY,
                language: 'zh-CN',
                fields: 'name,formatted_address,geometry,rating,opening_hours,formatted_phone_number,website'
            }
        });
        
        if (response.data.status === 'OK') {
            return response.data.result;
        }
        
        throw new Error('获取地点详情失败');
    } catch (error) {
        console.error('Place details error:', error.message);
        throw error;
    }
};

/**
 * 自动补全地址（可选功能）
 * @param {string} input - 输入的部分地址
 * @param {Object} options - 选项（如限制国家、类型等）
 * @returns {Array} 建议的地址列表
 */
exports.autocomplete = async (input, options = {}) => {
    try {
        if (!GOOGLE_MAPS_API_KEY) {
            throw new Error('Google Maps API Key 未配置');
        }

        const params = {
            input: input,
            key: GOOGLE_MAPS_API_KEY,
            language: 'zh-CN',
            ...options
        };

        const response = await axios.get('https://maps.googleapis.com/maps/api/place/autocomplete/json', {
            params
        });
        
        if (response.data.status === 'OK') {
            return response.data.predictions.map(prediction => ({
                description: prediction.description,
                placeId: prediction.place_id,
                types: prediction.types
            }));
        }
        
        return [];
    } catch (error) {
        console.error('Autocomplete error:', error.message);
        throw error;
    }
};