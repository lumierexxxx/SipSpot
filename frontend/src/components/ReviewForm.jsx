// ============================================
// SipSpot Frontend - ReviewForm Component
// 评论表单组件
// ============================================

import React, { useState } from 'react';
import { useAuth } from '@contexts/AuthContext';

/**
 * ReviewForm 组件
 * @param {string} cafeId - 咖啡店ID
 * @param {Function} onSubmit - 提交回调
 * @param {Function} onCancel - 取消回调
 * @param {Object} initialData - 初始数据（编辑模式）
 * @param {boolean} isEdit - 是否为编辑模式
 */
const ReviewForm = ({
    cafeId,
    onSubmit,
    onCancel,
    initialData = null,
    isEdit = false
}) => {
    const { isLoggedIn } = useAuth();
    
    // 表单状态
    const [formData, setFormData] = useState({
        rating: initialData?.rating || 0,
        content: initialData?.content || '',
        detailedRatings: initialData?.detailedRatings || {
            coffee: 0,
            ambience: 0,
            service: 0,
            value: 0
        },
        visitDate: initialData?.visitDate 
            ? new Date(initialData.visitDate).toISOString().split('T')[0]
            : ''
    });

    const [images, setImages] = useState([]);
    const [imagePreviews, setImagePreviews] = useState(
        initialData?.images?.map(img => img.url) || []
    );
    const [errors, setErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);

    // ============================================
    // 处理评分变化
    // ============================================
    const handleRatingChange = (value) => {
        setFormData(prev => ({ ...prev, rating: value }));
        if (errors.rating) {
            setErrors(prev => ({ ...prev, rating: null }));
        }
    };

    // ============================================
    // 处理详细评分变化
    // ============================================
    const handleDetailedRatingChange = (category, value) => {
        setFormData(prev => ({
            ...prev,
            detailedRatings: {
                ...prev.detailedRatings,
                [category]: value
            }
        }));
    };

    // ============================================
    // 处理输入变化
    // ============================================
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: null }));
        }
    };

    // ============================================
    // 处理图片上传
    // ============================================
    const handleImageChange = (e) => {
        const files = Array.from(e.target.files);
        
        if (files.length + images.length + imagePreviews.length > 5) {
            setErrors(prev => ({ ...prev, images: '最多只能上传5张图片' }));
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

        if (errors.images) {
            setErrors(prev => ({ ...prev, images: null }));
        }
    };

    // ============================================
    // 删除图片
    // ============================================
    const handleRemoveImage = (index) => {
        setImagePreviews(prev => prev.filter((_, i) => i !== index));
        setImages(prev => prev.filter((_, i) => i !== index));
    };

    // ============================================
    // 表单验证
    // ============================================
    const validateForm = () => {
        const newErrors = {};

        if (formData.rating === 0) {
            newErrors.rating = '请选择评分';
        }

        if (!formData.content.trim()) {
            newErrors.content = '请输入评论内容';
        } else if (formData.content.trim().length < 10) {
            newErrors.content = '评论内容至少10个字符';
        } else if (formData.content.trim().length > 2000) {
            newErrors.content = '评论内容最多2000个字符';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // ============================================
    // 处理提交
    // ============================================
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) return;

        try {
            setSubmitting(true);
            await onSubmit(formData, images);
        } catch (error) {
            setErrors({ submit: error.message || '提交失败，请重试' });
        } finally {
            setSubmitting(false);
        }
    };

    // 未登录状态
    if (!isLoggedIn) {
        return (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 text-center">
                <p className="text-amber-800 mb-4">请先登录后再发表评论</p>
                <a href="/login" className="btn btn-primary">
                    立即登录
                </a>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6 space-y-6">
            {/* ============================================ */}
            {/* 标题 */}
            {/* ============================================ */}
            <div>
                <h3 className="text-xl font-bold text-gray-900">
                    {isEdit ? '编辑评论' : '发表评论'}
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                    分享你的咖啡时光体验
                </p>
            </div>

            {/* ============================================ */}
            {/* 总体评分 */}
            {/* ============================================ */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    总体评分 <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center space-x-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                        <button
                            key={star}
                            type="button"
                            onClick={() => handleRatingChange(star)}
                            className="focus:outline-none transition-transform hover:scale-110"
                        >
                            <svg
                                className={`w-10 h-10 ${
                                    star <= formData.rating
                                        ? 'text-amber-400 fill-current'
                                        : 'text-gray-300'
                                }`}
                                viewBox="0 0 20 20"
                            >
                                <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                            </svg>
                        </button>
                    ))}
                    {formData.rating > 0 && (
                        <span className="text-lg font-semibold text-gray-700 ml-2">
                            {formData.rating}.0
                        </span>
                    )}
                </div>
                {errors.rating && (
                    <p className="text-sm text-red-600 mt-1">{errors.rating}</p>
                )}
            </div>

            {/* ============================================ */}
            {/* 详细评分（可选） */}
            {/* ============================================ */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                    详细评分（可选）
                </label>
                <div className="grid grid-cols-2 gap-4">
                    {[
                        { key: 'coffee', label: '☕ 咖啡品质' },
                        { key: 'ambience', label: '🏠 环境氛围' },
                        { key: 'service', label: '👥 服务态度' },
                        { key: 'value', label: '💰 性价比' }
                    ].map(({ key, label }) => (
                        <div key={key}>
                            <div className="text-sm text-gray-600 mb-1">{label}</div>
                            <div className="flex items-center space-x-1">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                        key={star}
                                        type="button"
                                        onClick={() => handleDetailedRatingChange(key, star)}
                                        className="focus:outline-none"
                                    >
                                        <svg
                                            className={`w-6 h-6 ${
                                                star <= formData.detailedRatings[key]
                                                    ? 'text-amber-400 fill-current'
                                                    : 'text-gray-300'
                                            }`}
                                            viewBox="0 0 20 20"
                                        >
                                            <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                                        </svg>
                                    </button>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* ============================================ */}
            {/* 评论内容 */}
            {/* ============================================ */}
            <div>
                <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
                    评论内容 <span className="text-red-500">*</span>
                </label>
                <textarea
                    id="content"
                    name="content"
                    rows={6}
                    value={formData.content}
                    onChange={handleInputChange}
                    placeholder="分享你的体验..."
                    className={`input ${errors.content ? 'input-error' : ''}`}
                />
                <div className="flex items-center justify-between mt-1">
                    {errors.content ? (
                        <p className="text-sm text-red-600">{errors.content}</p>
                    ) : (
                        <p className="text-sm text-gray-500">
                            {formData.content.length}/2000
                        </p>
                    )}
                </div>
            </div>

            {/* ============================================ */}
            {/* 访问日期 */}
            {/* ============================================ */}
            <div>
                <label htmlFor="visitDate" className="block text-sm font-medium text-gray-700 mb-2">
                    访问日期（可选）
                </label>
                <input
                    type="date"
                    id="visitDate"
                    name="visitDate"
                    value={formData.visitDate}
                    onChange={handleInputChange}
                    max={new Date().toISOString().split('T')[0]}
                    className="input"
                />
            </div>

            {/* ============================================ */}
            {/* 图片上传 */}
            {/* ============================================ */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    上传图片（可选，最多5张）
                </label>
                
                {/* 图片预览 */}
                {imagePreviews.length > 0 && (
                    <div className="grid grid-cols-3 gap-3 mb-3">
                        {imagePreviews.map((preview, index) => (
                            <div key={index} className="relative group">
                                <img
                                    src={preview}
                                    alt={`预览 ${index + 1}`}
                                    className="w-full h-24 object-cover rounded-lg"
                                />
                                <button
                                    type="button"
                                    onClick={() => handleRemoveImage(index)}
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

                {/* 上传按钮 */}
                {imagePreviews.length < 5 && (
                    <label className="flex items-center justify-center w-full h-24 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-amber-500 transition-colors">
                        <div className="text-center">
                            <svg className="w-8 h-8 text-gray-400 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            <span className="text-sm text-gray-600">点击上传图片</span>
                        </div>
                        <input
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={handleImageChange}
                            className="hidden"
                        />
                    </label>
                )}
                
                {errors.images && (
                    <p className="text-sm text-red-600 mt-1">{errors.images}</p>
                )}
            </div>

            {/* ============================================ */}
            {/* 提交错误 */}
            {/* ============================================ */}
            {errors.submit && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-sm text-red-800">{errors.submit}</p>
                </div>
            )}

            {/* ============================================ */}
            {/* 操作按钮 */}
            {/* ============================================ */}
            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
                {onCancel && (
                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={submitting}
                        className="btn btn-ghost"
                    >
                        取消
                    </button>
                )}
                <button
                    type="submit"
                    disabled={submitting}
                    className="btn btn-primary"
                >
                    {submitting ? (
                        <>
                            <div className="spinner w-5 h-5 mr-2" />
                            提交中...
                        </>
                    ) : (
                        <>
                            {isEdit ? '保存修改' : '发表评论'}
                        </>
                    )}
                </button>
            </div>
        </form>
    );
};

export default ReviewForm;