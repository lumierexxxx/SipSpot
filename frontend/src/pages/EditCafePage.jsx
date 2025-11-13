// ============================================
// SipSpot Frontend - EditCafePage
// 编辑咖啡店页面
// ============================================

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getCafeById, updateCafe } from '../services/cafesAPI';

const EditCafePage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { isLoggedIn, userId, canEdit } = useAuth();

    // 数据加载状态
    const [initialLoading, setInitialLoading] = useState(true);
    const [cafe, setCafe] = useState(null);

    // 表单数据
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        address: '',
        city: '',
        price: 2,
        specialty: 'Espresso',
        phoneNumber: '',
        website: '',
        amenities: [],
        openingHours: []
    });

    // 地理位置数据
    const [location, setLocation] = useState({
        lat: '',
        lng: ''
    });

    // UI状态
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [errors, setErrors] = useState({});

    // 可用选项
    const amenityOptions = [
        'WiFi', 'Power Outlets', 'Quiet', 'Outdoor Seating',
        'Pet Friendly', 'Non-Smoking', 'Air Conditioning',
        'Parking Available', 'Wheelchair Accessible',
        'Laptop Friendly', 'Good for Groups', 'Good for Work'
    ];

    const specialtyOptions = [
        'Espresso', 'Pour Over', 'Cold Brew', 'Latte Art',
        'Specialty Beans', 'Desserts', 'Light Meals'
    ];


    // ============================================
    // 如果未登录，重定向到登录页
    // ============================================
    useEffect(() => {
        if (!isLoggedIn) {
            navigate('/login');
        }
    }, [isLoggedIn, navigate]);


    // ============================================
    // 加载咖啡店数据
    // ============================================
    useEffect(() => {
        loadCafeData();
    }, [id]);

    const loadCafeData = useCallback( async () => {
        try {
            setInitialLoading(true);
            const response = await getCafeById(id);
            const cafeData = response.data;

            // 检查权限
            if (!canEdit(cafeData.author?._id || cafeData.author?.id)) {
                navigate(`/cafes/${id}`);
                return;
            }

            setCafe(cafeData);

            // 填充表单
            setFormData({
                name: cafeData.name || '',
                description: cafeData.description || '',
                address: cafeData.address || '',
                city: cafeData.city || '',
                price: cafeData.price || 2,
                specialty: cafeData.specialty || 'Espresso',
                phoneNumber: cafeData.phoneNumber || '',
                website: cafeData.website || '',
                amenities: cafeData.amenities || [],
                openingHours: cafeData.openingHours || []
            });

            // 填充地理位置
            if (cafeData.geometry && cafeData.geometry.coordinates) {
                setLocation({
                    lng: cafeData.geometry.coordinates[0].toString(),
                    lat: cafeData.geometry.coordinates[1].toString()
                });
            }

        } catch (err) {
            console.error('Failed to load cafe:', err);
            setError(err.response?.data?.message || '加载失败');
        } finally {
            setInitialLoading(false);
        }
    },[]);

    // ============================================
    // 处理表单变化
    // ============================================
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
        setError('');
    };

    const handleLocationChange = (e) => {
        const { name, value } = e.target;
        setLocation(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleAmenityToggle = (amenity) => {
        setFormData(prev => ({
            ...prev,
            amenities: prev.amenities.includes(amenity)
                ? prev.amenities.filter(a => a !== amenity)
                : [...prev.amenities, amenity]
        }));
    };

    const handleHoursChange = (index, field, value) => {
        setFormData(prev => ({
            ...prev,
            openingHours: prev.openingHours.map((hour, i) =>
                i === index ? { ...hour, [field]: value } : hour
            )
        }));
    };

    // ============================================
    // 表单验证
    // ============================================
    const validateForm = () => {
        const newErrors = {};

        if (!formData.name.trim()) newErrors.name = '请输入咖啡店名称';
        if (!formData.description.trim()) newErrors.description = '请输入描述';
        if (formData.description.length < 10) newErrors.description = '描述至少10个字符';
        if (!formData.address.trim()) newErrors.address = '请输入地址';
        if (!formData.city.trim()) newErrors.city = '请输入城市';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // ============================================
    // 提交表单
    // ============================================
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            setError('请检查表单中的错误');
            return;
        }

        try {
            setLoading(true);
            setError('');

            // 构建更新数据
            const updateData = {
                ...formData
            };

            // 如果位置有变化，更新坐标
            if (location.lat && location.lng) {
                updateData.geometry = {
                    type: 'Point',
                    coordinates: [parseFloat(location.lng), parseFloat(location.lat)]
                };
            }

            // 更新咖啡店
            await updateCafe(id, updateData);

            // 成功后导航回详情页
            navigate(`/cafes/${id}`);

        } catch (err) {
            console.error('Update cafe failed:', err);
            setError(err.response?.data?.message || '更新失败，请稍后再试');
        } finally {
            setLoading(false);
        }
    };

    // ============================================
    // 加载状态
    // ============================================
    if (initialLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="inline-block w-16 h-16 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-4" />
                    <p className="text-gray-600">加载中...</p>
                </div>
            </div>
        );
    }

    if (!cafe) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">咖啡店不存在</h2>
                    <button onClick={() => navigate('/cafes')} className="btn btn-primary">
                        返回列表
                    </button>
                </div>
            </div>
        );
    }

    // ============================================
    // 主内容渲染
    // ============================================
    return (
        <div className="bg-gray-50 min-h-screen py-8">
            <div className="container-custom max-w-4xl">
                {/* 页面头部 */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        编辑咖啡店
                    </h1>
                    <p className="text-gray-600">
                        更新 {cafe.name} 的信息
                    </p>
                </div>

                {/* 表单 */}
                <form onSubmit={handleSubmit}>
                    <div className="bg-white rounded-xl shadow-md p-8 mb-6 space-y-6">
                        {/* 错误提示 */}
                        {error && (
                            <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
                                <svg className="w-5 h-5 text-red-500 mt-0.5 mr-3 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                                <p className="text-sm text-red-800">{error}</p>
                            </div>
                        )}

                        {/* 基本信息 */}
                        <div>
                            <h3 className="text-lg font-bold text-gray-900 mb-4">基本信息</h3>
                            
                            <div className="space-y-4">
                                {/* 名称 */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        咖啡店名称 *
                                    </label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                                            errors.name ? 'border-red-300' : 'border-gray-300'
                                        }`}
                                    />
                                    {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
                                </div>

                                {/* 描述 */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        描述 *
                                    </label>
                                    <textarea
                                        name="description"
                                        value={formData.description}
                                        onChange={handleChange}
                                        rows="5"
                                        maxLength="2000"
                                        className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                                            errors.description ? 'border-red-300' : 'border-gray-300'
                                        }`}
                                    />
                                    <div className="flex justify-between mt-1">
                                        {errors.description && <p className="text-sm text-red-600">{errors.description}</p>}
                                        <p className="text-sm text-gray-500 ml-auto">{formData.description.length}/2000</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 位置信息 */}
                        <div>
                            <h3 className="text-lg font-bold text-gray-900 mb-4">位置信息</h3>
                            
                            <div className="space-y-4">
                                <div className="grid md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            地址 *
                                        </label>
                                        <input
                                            type="text"
                                            name="address"
                                            value={formData.address}
                                            onChange={handleChange}
                                            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                                                errors.address ? 'border-red-300' : 'border-gray-300'
                                            }`}
                                        />
                                        {errors.address && <p className="mt-1 text-sm text-red-600">{errors.address}</p>}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            城市 *
                                        </label>
                                        <input
                                            type="text"
                                            name="city"
                                            value={formData.city}
                                            onChange={handleChange}
                                            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                                                errors.city ? 'border-red-300' : 'border-gray-300'
                                            }`}
                                        />
                                        {errors.city && <p className="mt-1 text-sm text-red-600">{errors.city}</p>}
                                    </div>
                                </div>

                                <div className="grid md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            纬度
                                        </label>
                                        <input
                                            type="number"
                                            name="lat"
                                            value={location.lat}
                                            onChange={handleLocationChange}
                                            step="any"
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            经度
                                        </label>
                                        <input
                                            type="number"
                                            name="lng"
                                            value={location.lng}
                                            onChange={handleLocationChange}
                                            step="any"
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 详细信息 */}
                        <div>
                            <h3 className="text-lg font-bold text-gray-900 mb-4">详细信息</h3>
                            
                            <div className="space-y-4">
                                {/* 价格和特色 */}
                                <div className="grid md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            价格等级
                                        </label>
                                        <div className="flex space-x-2">
                                            {[1, 2, 3, 4].map(level => (
                                                <button
                                                    key={level}
                                                    type="button"
                                                    onClick={() => setFormData(prev => ({ ...prev, price: level }))}
                                                    className={`flex-1 py-3 px-4 rounded-lg border-2 transition-colors ${
                                                        formData.price === level
                                                            ? 'bg-amber-500 text-white border-amber-500'
                                                            : 'bg-white text-gray-700 border-gray-300 hover:border-amber-500'
                                                    }`}
                                                >
                                                    {'$'.repeat(level)}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            特色
                                        </label>
                                        <select
                                            name="specialty"
                                            value={formData.specialty}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                                        >
                                            {specialtyOptions.map(option => (
                                                <option key={option} value={option}>{option}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {/* 联系方式 */}
                                <div className="grid md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            电话
                                        </label>
                                        <input
                                            type="tel"
                                            name="phoneNumber"
                                            value={formData.phoneNumber}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            网站
                                        </label>
                                        <input
                                            type="url"
                                            name="website"
                                            value={formData.website}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                                        />
                                    </div>
                                </div>

                                {/* 设施 */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        设施 ({formData.amenities.length})
                                    </label>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                        {amenityOptions.map(amenity => (
                                            <label
                                                key={amenity}
                                                className="flex items-center p-3 rounded-lg border-2 cursor-pointer transition-colors hover:bg-gray-50"
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={formData.amenities.includes(amenity)}
                                                    onChange={() => handleAmenityToggle(amenity)}
                                                    className="w-4 h-4 text-amber-600 rounded focus:ring-amber-500"
                                                />
                                                <span className="ml-2 text-sm text-gray-700">{amenity}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 营业时间 */}
                        {formData.openingHours && formData.openingHours.length > 0 && (
                            <div>
                                <h3 className="text-lg font-bold text-gray-900 mb-4">营业时间</h3>
                                
                                <div className="space-y-3">
                                    {formData.openingHours.map((hours, index) => (
                                        <div key={hours.day} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                                            <div className="w-24 font-medium text-gray-900">
                                                {hours.day}
                                            </div>

                                            <label className="flex items-center">
                                                <input
                                                    type="checkbox"
                                                    checked={hours.closed}
                                                    onChange={(e) => handleHoursChange(index, 'closed', e.target.checked)}
                                                    className="w-4 h-4 text-amber-600 rounded focus:ring-amber-500"
                                                />
                                                <span className="ml-2 text-sm text-gray-700">休息</span>
                                            </label>

                                            {!hours.closed && (
                                                <>
                                                    <input
                                                        type="time"
                                                        value={hours.open}
                                                        onChange={(e) => handleHoursChange(index, 'open', e.target.value)}
                                                        className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                                                    />
                                                    <span className="text-gray-600">-</span>
                                                    <input
                                                        type="time"
                                                        value={hours.close}
                                                        onChange={(e) => handleHoursChange(index, 'close', e.target.value)}
                                                        className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                                                    />
                                                </>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* 按钮 */}
                    <div className="flex justify-between">
                        <button
                            type="button"
                            onClick={() => navigate(`/cafes/${id}`)}
                            className="btn btn-ghost"
                        >
                            取消
                        </button>

                        <button
                            type="submit"
                            disabled={loading}
                            className="btn btn-primary"
                        >
                            {loading ? '保存中...' : '保存更改'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditCafePage;