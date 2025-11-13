// ============================================
// SipSpot Frontend - CreateCafePage
// 创建咖啡店页面
// ============================================

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { createCafe } from '../services/cafesAPI';

const CreateCafePage = () => {
    const navigate = useNavigate();
    const { isLoggedIn } = useAuth();


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
        openingHours: [
            { day: 'Monday', open: '08:00', close: '20:00', closed: false },
            { day: 'Tuesday', open: '08:00', close: '20:00', closed: false },
            { day: 'Wednesday', open: '08:00', close: '20:00', closed: false },
            { day: 'Thursday', open: '08:00', close: '20:00', closed: false },
            { day: 'Friday', open: '08:00', close: '20:00', closed: false },
            { day: 'Saturday', open: '09:00', close: '21:00', closed: false },
            { day: 'Sunday', open: '09:00', close: '21:00', closed: false }
        ]
    });

    // 地理位置数据
    const [location, setLocation] = useState({
        lat: '',
        lng: ''
    });

    // 图片文件
    const [images, setImages] = useState([]);
    const [imagePreviews, setImagePreviews] = useState([]);

    // UI状态
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [errors, setErrors] = useState({});
    const [currentStep, setCurrentStep] = useState(1); // 1: 基本信息, 2: 详细信息, 3: 营业时间

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
    // 处理表单变化
    // ============================================
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        // 清除该字段的错误
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
    // 处理图片上传
    // ============================================
    const handleImageChange = (e) => {
        const files = Array.from(e.target.files);
        
        if (files.length + images.length > 10) {
            setError('最多只能上传10张图片');
            return;
        }

        setImages(prev => [...prev, ...files]);

        // 生成预览
        files.forEach(file => {
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreviews(prev => [...prev, reader.result]);
            };
            reader.readAsDataURL(file);
        });
    };

    const removeImage = (index) => {
        setImages(prev => prev.filter((_, i) => i !== index));
        setImagePreviews(prev => prev.filter((_, i) => i !== index));
    };

    // ============================================
    // 获取当前位置
    // ============================================
    const handleGetCurrentLocation = () => {
        if ('geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setLocation({
                        lat: position.coords.latitude.toString(),
                        lng: position.coords.longitude.toString()
                    });
                },
                (error) => {
                    setError('无法获取位置: ' + error.message);
                }
            );
        } else {
            setError('您的浏览器不支持地理定位');
        }
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
        if (!location.lat || !location.lng) newErrors.location = '请提供地理坐标';

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

            // 构建提交数据
            const cafeData = {
                ...formData,
                geometry: {
                    type: 'Point',
                    coordinates: [parseFloat(location.lng), parseFloat(location.lat)]
                }
            };

            // 创建咖啡店
            const response = await createCafe(cafeData, images);

            // 成功后导航到详情页
            navigate(`/cafes/${response.data._id || response.data.id}`);

        } catch (err) {
            console.error('Create cafe failed:', err);
            setError(err.response?.data?.message || '创建失败，请稍后再试');
        } finally {
            setLoading(false);
        }
    };

    // ============================================
    // 渲染步骤
    // ============================================
    const renderStepIndicator = () => (
        <div className="flex items-center justify-center mb-8">
            {[1, 2, 3].map(step => (
                <React.Fragment key={step}>
                    <div
                        className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors ${
                            currentStep >= step
                                ? 'bg-amber-500 border-amber-500 text-white'
                                : 'bg-white border-gray-300 text-gray-400'
                        }`}
                    >
                        {step}
                    </div>
                    {step < 3 && (
                        <div
                            className={`w-20 h-1 mx-2 transition-colors ${
                                currentStep > step ? 'bg-amber-500' : 'bg-gray-300'
                            }`}
                        />
                    )}
                </React.Fragment>
            ))}
        </div>
    );

    const renderStep1 = () => (
        <div className="space-y-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">基本信息</h3>

            {/* 咖啡店名称 */}
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
                    placeholder="例如: 星巴克臻选烘焙工坊"
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
                    placeholder="介绍这家咖啡店的特色、氛围、咖啡质量等..."
                />
                <div className="flex justify-between mt-1">
                    {errors.description && <p className="text-sm text-red-600">{errors.description}</p>}
                    <p className="text-sm text-gray-500 ml-auto">{formData.description.length}/2000</p>
                </div>
            </div>

            {/* 图片上传 */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    图片 (最多10张)
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleImageChange}
                        className="hidden"
                        id="image-upload"
                    />
                    <label htmlFor="image-upload" className="cursor-pointer">
                        <div className="text-gray-600">
                            <svg className="w-12 h-12 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <p className="text-sm">点击上传图片</p>
                            <p className="text-xs text-gray-500 mt-1">支持 JPG, PNG (最大5MB)</p>
                        </div>
                    </label>
                </div>

                {/* 图片预览 */}
                {imagePreviews.length > 0 && (
                    <div className="grid grid-cols-3 md:grid-cols-5 gap-4 mt-4">
                        {imagePreviews.map((preview, index) => (
                            <div key={index} className="relative group">
                                <img
                                    src={preview}
                                    alt={`Preview ${index + 1}`}
                                    className="w-full h-24 object-cover rounded-lg"
                                />
                                <button
                                    type="button"
                                    onClick={() => removeImage(index)}
                                    className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );

    const renderStep2 = () => (
        <div className="space-y-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">详细信息</h3>

            {/* 地址 */}
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
                        placeholder="街道地址"
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
                        placeholder="城市名称"
                    />
                    {errors.city && <p className="mt-1 text-sm text-red-600">{errors.city}</p>}
                </div>
            </div>

            {/* 地理坐标 */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    地理坐标 *
                </label>
                <div className="grid md:grid-cols-3 gap-4">
                    <input
                        type="number"
                        name="lat"
                        value={location.lat}
                        onChange={handleLocationChange}
                        step="any"
                        className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                        placeholder="纬度"
                    />
                    <input
                        type="number"
                        name="lng"
                        value={location.lng}
                        onChange={handleLocationChange}
                        step="any"
                        className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                        placeholder="经度"
                    />
                    <button
                        type="button"
                        onClick={handleGetCurrentLocation}
                        className="btn btn-ghost"
                    >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        获取当前位置
                    </button>
                </div>
                {errors.location && <p className="mt-1 text-sm text-red-600">{errors.location}</p>}
            </div>

            {/* 价格等级和特色 */}
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
                        placeholder="+1 (555) 123-4567"
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
                        placeholder="https://example.com"
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
    );

    const renderStep3 = () => (
        <div className="space-y-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">营业时间</h3>

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
    );

    // ============================================
    // 主内容渲染
    // ============================================
    return (
        <div className="bg-gray-50 min-h-screen py-8">
            <div className="container-custom max-w-4xl">
                {/* 页面头部 */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        添加咖啡店
                    </h1>
                    <p className="text-gray-600">
                        分享你喜欢的咖啡店，让更多人发现它
                    </p>
                </div>

                {/* 步骤指示器 */}
                {renderStepIndicator()}

                {/* 表单 */}
                <form onSubmit={handleSubmit}>
                    <div className="bg-white rounded-xl shadow-md p-8 mb-6">
                        {/* 错误提示 */}
                        {error && (
                            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
                                <svg className="w-5 h-5 text-red-500 mt-0.5 mr-3 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                                <p className="text-sm text-red-800">{error}</p>
                            </div>
                        )}

                        {/* 步骤内容 */}
                        {currentStep === 1 && renderStep1()}
                        {currentStep === 2 && renderStep2()}
                        {currentStep === 3 && renderStep3()}
                    </div>

                    {/* 按钮 */}
                    <div className="flex justify-between">
                        <button
                            type="button"
                            onClick={() => {
                                if (currentStep === 1) {
                                    navigate(-1);
                                } else {
                                    setCurrentStep(prev => prev - 1);
                                }
                            }}
                            className="btn btn-ghost"
                        >
                            {currentStep === 1 ? '取消' : '上一步'}
                        </button>

                        {currentStep < 3 ? (
                            <button
                                type="button"
                                onClick={() => setCurrentStep(prev => prev + 1)}
                                className="btn btn-primary"
                            >
                                下一步
                            </button>
                        ) : (
                            <button
                                type="submit"
                                disabled={loading}
                                className="btn btn-primary"
                            >
                                {loading ? '创建中...' : '创建咖啡店'}
                            </button>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateCafePage;