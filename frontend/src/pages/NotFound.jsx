// ============================================
// SipSpot Frontend - NotFound Page
// 404 错误页面
// ============================================

import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

const NotFound = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-linear-to-br from-amber-50 via-orange-50 to-amber-50 flex items-center justify-center px-4">
            <div className="max-w-2xl w-full text-center">
                {/* 咖啡杯图标和404 */}
                <div className="mb-8">
                    <div className="inline-flex items-center justify-center mb-6">
                        <div className="relative">
                            {/* 咖啡杯 */}
                            <div className="w-32 h-32 bg-linear-to-br from-amber-500 to-orange-600 rounded-3xl flex items-center justify-center shadow-2xl transform rotate-12 hover:rotate-0 transition-transform duration-300">
                                <span className="text-7xl">☕</span>
                            </div>
                            {/* 404 徽章 */}
                            <div className="absolute -top-3 -right-3 bg-red-500 text-white text-2xl font-bold px-4 py-2 rounded-full shadow-lg transform -rotate-12">
                                404
                            </div>
                        </div>
                    </div>

                    <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-4">
                        找不到页面
                    </h1>
                    <p className="text-xl text-gray-600 mb-2">
                        Oops! 这杯咖啡找不到了
                    </p>
                    <p className="text-gray-500">
                        您访问的页面不存在或已被移除
                    </p>
                </div>

                {/* 建议操作 */}
                <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">
                        您可以尝试
                    </h2>

                    <div className="grid md:grid-cols-3 gap-4">
                        {/* 返回首页 */}
                        <Link
                            to="/"
                            className="group p-6 bg-linear-to-br from-amber-50 to-orange-50 rounded-xl hover:shadow-lg transition-all transform hover:-translate-y-1"
                        >
                            <div className="w-12 h-12 bg-amber-500 rounded-lg flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                                </svg>
                            </div>
                            <h3 className="font-semibold text-gray-900 mb-1">返回首页</h3>
                            <p className="text-sm text-gray-600">回到主页浏览内容</p>
                        </Link>

                        {/* 浏览咖啡店 */}
                        <Link
                            to="/cafes"
                            className="group p-6 bg-linear-to-br from-blue-50 to-indigo-50 rounded-xl hover:shadow-lg transition-all transform hover:-translate-y-1"
                        >
                            <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                            <h3 className="font-semibold text-gray-900 mb-1">浏览咖啡店</h3>
                            <p className="text-sm text-gray-600">发现新的咖啡店</p>
                        </Link>

                        {/* 附近咖啡店 */}
                        <Link
                            to="/nearby"
                            className="group p-6 bg-linear-to-br from-green-50 to-teal-50 rounded-xl hover:shadow-lg transition-all transform hover:-translate-y-1"
                        >
                            <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                            </div>
                            <h3 className="font-semibold text-gray-900 mb-1">附近咖啡店</h3>
                            <p className="text-sm text-gray-600">查找身边的咖啡店</p>
                        </Link>
                    </div>
                </div>

                {/* 其他操作 */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="btn btn-ghost group"
                    >
                        <svg className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        返回上一页
                    </button>

                    <Link to="/cafes/new" className="btn btn-primary">
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        添加咖啡店
                    </Link>
                </div>

                {/* 底部提示 */}
                <div className="mt-12 text-gray-500 text-sm">
                    <p>如果您认为这是一个错误，请</p>
                    <a href="mailto:support@sipspot.com" className="text-amber-600 hover:text-amber-700 font-medium">
                        联系我们
                    </a>
                </div>

                {/* 装饰元素 */}
                <div className="absolute top-10 left-10 opacity-20">
                    <div className="text-9xl animate-bounce">☕</div>
                </div>
                <div className="absolute bottom-10 right-10 opacity-20">
                    <div className="text-9xl animate-pulse">🍰</div>
                </div>
            </div>
        </div>
    );
};

export default NotFound;