/**
 * 地图相关工具函数
 */

/**
 * 计算两点之间的距离（单位：公里）
 * @param {Number} lat1 - 点1纬度
 * @param {Number} lon1 - 点1经度
 * @param {Number} lat2 - 点2纬度
 * @param {Number} lon2 - 点2经度
 * @returns {Number} 距离（公里）
 */
export function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // 地球半径（公里）
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    
    const a = 
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    
    return Math.round(distance * 10) / 10; // 保留一位小数
}

function toRad(degrees) {
    return degrees * (Math.PI / 180);
}

/**
 * 格式化距离显示
 * @param {Number} distance - 距离（公里）
 * @returns {String} 格式化后的距离
 */
export function formatDistance(distance) {
    if (distance < 1) {
        return `${Math.round(distance * 1000)}米`;
    }
    return `${distance.toFixed(1)}公里`;
}

/**
 * 获取用户当前位置
 * @returns {Promise<{lat: Number, lng: Number}>}
 */
export function getUserLocation() {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error('浏览器不支持定位功能'));
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                resolve({
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                });
            },
            (error) => {
                reject(error);
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            }
        );
    });
}

/**
 * 根据距离排序咖啡馆
 * @param {Array} cafes - 咖啡馆列表
 * @param {Number} userLat - 用户纬度
 * @param {Number} userLng - 用户经度
 * @returns {Array} 排序后的咖啡馆列表
 */
export function sortCafesByDistance(cafes, userLat, userLng) {
    return cafes
        .map(cafe => ({
            ...cafe,
            distance: calculateDistance(
                userLat,
                userLng,
                cafe.geometry.coordinates[1],
                cafe.geometry.coordinates[0]
            )
        }))
        .sort((a, b) => a.distance - b.distance);
}

/**
 * 上海主要区域中心点
 */
export const SHANGHAI_DISTRICTS = {
    '静安区': [121.445123, 31.227456],
    '徐汇区': [121.443726, 31.207852],
    '黄浦区': [121.490234, 31.243567],
    '浦东新区': [121.505234, 31.235678],
    '长宁区': [121.423456, 31.222345],
    '杨浦区': [121.515234, 31.302345],
    '虹口区': [121.487234, 31.273456],
    '普陀区': [121.396234, 31.247890],
    '闵行区': [121.353456, 31.152234],
    '人民广场': [121.473701, 31.230416] // 默认中心
};

/**
 * 获取区域中心点
 * @param {String} district - 区域名称
 * @returns {Array} [经度, 纬度]
 */
export function getDistrictCenter(district) {
    return SHANGHAI_DISTRICTS[district] || SHANGHAI_DISTRICTS['人民广场'];
}