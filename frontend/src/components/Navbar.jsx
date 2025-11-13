// ============================================
// SipSpot Frontend - Navbar Component
// 顶部导航栏组件（纯 Tailwind CSS）
// ============================================

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@contexts/AuthContext';

/**
 * Navbar 组件
 */
const Navbar = () => {
    const { user, isLoggedIn, logout } = useAuth();
    
    // 状态
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    
    // Refs
    const userMenuRef = useRef(null);
    const mobileMenuRef = useRef(null);

    // ============================================
    // 滚动效果
    // ============================================
    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // ============================================
    // 点击外部关闭菜单
    // ============================================
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
                setIsUserMenuOpen(false);
            }
            if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target)) {
                setIsMobileMenuOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // ============================================
    // 搜索处理
    // ============================================
    const handleSearch = (e) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            window.location.href = `/cafes?search=${encodeURIComponent(searchQuery.trim())}`;
        }
    };

    // ============================================
    // 登出处理
    // ============================================
    const handleLogout = async () => {
        await logout();
        setIsUserMenuOpen(false);
        window.location.href = '/';
    };

    // ============================================
    // 导航链接数据
    // ============================================
    const navLinks = [
        { name: '首页', href: '/', icon: '🏠' },
        { name: '咖啡店', href: '/cafes', icon: '☕' },
        { name: '附近', href: '/nearby', icon: '📍' },
        { name: '探索', href: '/explore', icon: '🔍' }
    ];

    return (
        <nav
            className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
                isScrolled
                    ? 'bg-white shadow-md'
                    : 'bg-white/95 backdrop-blur-sm'
            }`}
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    
                    {/* ============================================ */}
                    {/* Logo 和品牌名 */}
                    {/* ============================================ */}
                    <div className="flex items-center shrink-0">
                        <a href="/" className="flex items-center space-x-2">
                            <div className="w-10 h-10 bg-linear-to-br from-amber-500 to-orange-600 rounded-lg flex items-center justify-center">
                                <span className="text-2xl">☕</span>
                            </div>
                            <span className="text-xl font-bold text-gray-900 hidden sm:block">
                                SipSpot
                            </span>
                        </a>
                    </div>

                    {/* ============================================ */}
                    {/* 桌面端导航链接 */}
                    {/* ============================================ */}
                    <div className="hidden md:flex items-center space-x-1">
                        {navLinks.map((link) => (
                            <a
                                key={link.name}
                                href={link.href}
                                className="px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-amber-50 hover:text-amber-600 transition-colors"
                            >
                                <span className="mr-1">{link.icon}</span>
                                {link.name}
                            </a>
                        ))}
                    </div>

                    {/* ============================================ */}
                    {/* 搜索框（桌面端） */}
                    {/* ============================================ */}
                    <div className="hidden lg:flex flex-1 max-w-md mx-8">
                        <form onSubmit={handleSearch} className="w-full">
                            <div className="relative">
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="搜索咖啡店..."
                                    className="w-full px-4 py-2 pl-10 pr-4 text-sm text-gray-900 bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all"
                                />
                                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                    <svg
                                        className="w-5 h-5 text-gray-400"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                                        />
                                    </svg>
                                </div>
                            </div>
                        </form>
                    </div>

                    {/* ============================================ */}
                    {/* 右侧按钮组 */}
                    {/* ============================================ */}
                    <div className="flex items-center space-x-4">
                        
                        {/* 添加咖啡店按钮 */}
                        {isLoggedIn && (
                            <a
                                href="/cafes/new"
                                className="hidden md:flex items-center px-4 py-2 text-sm font-medium text-white bg-amber-600 rounded-lg hover:bg-amber-700 transition-colors"
                            >
                                <svg
                                    className="w-5 h-5 mr-1"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M12 4v16m8-8H4"
                                    />
                                </svg>
                                添加咖啡店
                            </a>
                        )}

                        {/* 用户菜单或登录按钮 */}
                        {isLoggedIn ? (
                            <div className="relative" ref={userMenuRef}>
                                <button
                                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                                    className="flex items-center space-x-2 focus:outline-none"
                                >
                                    <img
                                        src={user?.avatar || 'https://via.placeholder.com/40'}
                                        alt={user?.username}
                                        className="w-10 h-10 rounded-full border-2 border-gray-200 hover:border-amber-500 transition-colors"
                                    />
                                    <svg
                                        className={`hidden md:block w-4 h-4 text-gray-600 transition-transform ${
                                            isUserMenuOpen ? 'rotate-180' : ''
                                        }`}
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M19 9l-7 7-7-7"
                                        />
                                    </svg>
                                </button>

                                {/* 用户下拉菜单 */}
                                {isUserMenuOpen && (
                                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg py-1 border border-gray-200">
                                        <div className="px-4 py-3 border-b border-gray-100">
                                            <p className="text-sm font-medium text-gray-900">
                                                {user?.username}
                                            </p>
                                            <p className="text-sm text-gray-500 truncate">
                                                {user?.email}
                                            </p>
                                        </div>
                                        
                                        <a
                                            href="/profile"
                                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                        >
                                            👤 个人资料
                                        </a>
                                        
                                        <a
                                            href="/my-cafes"
                                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                        >
                                            ☕ 我的咖啡店
                                        </a>
                                        
                                        <a
                                            href="/favorites"
                                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                        >
                                            ⭐ 我的收藏
                                        </a>
                                        
                                        <a
                                            href="/my-reviews"
                                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                        >
                                            💬 我的评论
                                        </a>
                                        
                                        {user?.role === 'admin' && (
                                            <a
                                                href="/admin"
                                                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 border-t border-gray-100"
                                            >
                                                🛡️ 管理面板
                                            </a>
                                        )}
                                        
                                        <button
                                            onClick={handleLogout}
                                            className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 border-t border-gray-100"
                                        >
                                            🚪 登出
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="hidden md:flex items-center space-x-2">
                                <a
                                    href="/login"
                                    className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-amber-600 transition-colors"
                                >
                                    登录
                                </a>
                                <a
                                    href="/register"
                                    className="px-4 py-2 text-sm font-medium text-white bg-amber-600 rounded-lg hover:bg-amber-700 transition-colors"
                                >
                                    注册
                                </a>
                            </div>
                        )}

                        {/* 移动端菜单按钮 */}
                        <button
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100 focus:outline-none"
                        >
                            <svg
                                className="w-6 h-6"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                {isMobileMenuOpen ? (
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M6 18L18 6M6 6l12 12"
                                    />
                                ) : (
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M4 6h16M4 12h16M4 18h16"
                                    />
                                )}
                            </svg>
                        </button>
                    </div>
                </div>

                {/* ============================================ */}
                {/* 移动端菜单 */}
                {/* ============================================ */}
                {isMobileMenuOpen && (
                    <div
                        ref={mobileMenuRef}
                        className="md:hidden py-4 border-t border-gray-200"
                    >
                        {/* 搜索框（移动端） */}
                        <div className="mb-4">
                            <form onSubmit={handleSearch}>
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="搜索咖啡店..."
                                    className="w-full px-4 py-2 text-sm text-gray-900 bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                                />
                            </form>
                        </div>

                        {/* 导航链接 */}
                        <div className="space-y-1">
                            {navLinks.map((link) => (
                                <a
                                    key={link.name}
                                    href={link.href}
                                    className="block px-4 py-2 text-base font-medium text-gray-700 hover:bg-amber-50 hover:text-amber-600 rounded-lg transition-colors"
                                >
                                    <span className="mr-2">{link.icon}</span>
                                    {link.name}
                                </a>
                            ))}
                        </div>

                        {/* 用户操作 */}
                        <div className="mt-4 pt-4 border-t border-gray-200">
                            {isLoggedIn ? (
                                <>
                                    <a
                                        href="/cafes/new"
                                        className="block px-4 py-2 text-base font-medium text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                                    >
                                        ➕ 添加咖啡店
                                    </a>
                                    <a
                                        href="/profile"
                                        className="block px-4 py-2 text-base font-medium text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                                    >
                                        👤 个人资料
                                    </a>
                                    <a
                                        href="/favorites"
                                        className="block px-4 py-2 text-base font-medium text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                                    >
                                        ⭐ 我的收藏
                                    </a>
                                    <button
                                        onClick={handleLogout}
                                        className="block w-full text-left px-4 py-2 text-base font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    >
                                        🚪 登出
                                    </button>
                                </>
                            ) : (
                                <>
                                    <a
                                        href="/login"
                                        className="block px-4 py-2 text-base font-medium text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                                    >
                                        登录
                                    </a>
                                    <a
                                        href="/register"
                                        className="block px-4 py-2 text-base font-medium text-white bg-amber-600 hover:bg-amber-700 rounded-lg text-center transition-colors"
                                    >
                                        注册
                                    </a>
                                </>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </nav>
    );
};

export default Navbar;