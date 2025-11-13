// ============================================
// SipSpot Frontend - Main App Component
// 主应用组件和路由配置
// ============================================

import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from '@components/Navbar';
import { useAuth } from '@contexts/AuthContext';

// ============================================
// 懒加载页面组件（代码分割优化）
// ============================================
const Home = lazy(() => import('./pages/Home'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const CafeDetailPage = lazy(() => import('./pages/CafeDetailPage'));
const Profile = lazy(() => import('./pages/Profile'));
const CafeListPage = lazy(() => import('./pages/CafeListPage'));
const NearbyPage = lazy(() => import('./pages/NearbyPage'));
const CreateCafePage = lazy(() => import('./pages/CreateCafePage'));
const EditCafePage = lazy(() => import('./pages/EditCafePage'));
const FavoritesPage = lazy(() => import('./pages/FavoritesPage'));
const MyReviewsPage = lazy(() => import('./pages/MyReviewsPage'));
const NotFound = lazy(() => import('./pages/NotFound'));

// ============================================
// 加载占位组件
// ============================================
const LoadingFallback = () => (
    <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
            <div className="spinner w-12 h-12 mx-auto mb-4" />
            <p className="text-gray-600">加载中...</p>
        </div>
    </div>
);

// ============================================
// 受保护路由组件
// ============================================
const ProtectedRoute = ({ children }) => {
    const { isLoggedIn, loading } = useAuth();

    if (loading) {
        return <LoadingFallback />;
    }

    if (!isLoggedIn) {
        return <Navigate to="/login" replace />;
    }

    return children;
};

// ============================================
// 访客路由组件（仅未登录可访问）
// ============================================
const GuestRoute = ({ children }) => {
    const { isLoggedIn, loading } = useAuth();

    if (loading) {
        return <LoadingFallback />;
    }

    if (isLoggedIn) {
        return <Navigate to="/" replace />;
    }

    return children;
};

// ============================================
// 主应用组件
// ============================================
function App() {
    return (
        <Router>
            <div className="min-h-screen bg-gray-50">
                {/* 导航栏 */}
                <Navbar />

                {/* 主内容区域 */}
                <main className="pt-16">
                    <Suspense fallback={<LoadingFallback />}>
                        <Routes>
                            {/* ============================================ */}
                            {/* 公开路由 */}
                            {/* ============================================ */}
                            
                            {/* 首页 */}
                            <Route path="/" element={<Home />} />

                            {/* 咖啡店列表 */}
                            <Route path="/cafes" element={<CafeListPage />} />

                            {/* 咖啡店详情 */}
                            <Route path="/cafes/:id" element={<CafeDetailPage />} />

                            {/* 附近咖啡店 */}
                            <Route path="/nearby" element={<NearbyPage />} />

                            {/* 探索页面 */}
                            <Route path="/explore" element={<CafeListPage />} />

                            {/* ============================================ */}
                            {/* 访客路由（仅未登录） */}
                            {/* ============================================ */}
                            
                            {/* 登录 */}
                            <Route
                                path="/login"
                                element={
                                    <GuestRoute>
                                        <Login />
                                    </GuestRoute>
                                }
                            />

                            {/* 注册 */}
                            <Route
                                path="/register"
                                element={
                                    <GuestRoute>
                                        <Register />
                                    </GuestRoute>
                                }
                            />

                            {/* ============================================ */}
                            {/* 受保护路由（需要登录） */}
                            {/* ============================================ */}
                            
                            {/* 个人资料 */}
                            <Route
                                path="/profile"
                                element={
                                    <ProtectedRoute>
                                        <Profile />
                                    </ProtectedRoute>
                                }
                            />

                            {/* 创建咖啡店 */}
                            <Route
                                path="/cafes/new"
                                element={
                                    <ProtectedRoute>
                                        <CreateCafePage />
                                    </ProtectedRoute>
                                }
                            />

                            {/* 编辑咖啡店 */}
                            <Route
                                path="/cafes/:id/edit"
                                element={
                                    <ProtectedRoute>
                                        <EditCafePage />
                                    </ProtectedRoute>
                                }
                            />

                            {/* 我的收藏 */}
                            <Route
                                path="/favorites"
                                element={
                                    <ProtectedRoute>
                                        <FavoritesPage />
                                    </ProtectedRoute>
                                }
                            />

                            {/* 我的评论 */}
                            <Route
                                path="/my-reviews"
                                element={
                                    <ProtectedRoute>
                                        <MyReviewsPage />
                                    </ProtectedRoute>
                                }
                            />

                            {/* 我的咖啡店 */}
                            <Route
                                path="/my-cafes"
                                element={
                                    <ProtectedRoute>
                                        <CafeListPage myOnly />
                                    </ProtectedRoute>
                                }
                            />

                            {/* ============================================ */}
                            {/* 404 页面 */}
                            {/* ============================================ */}
                            <Route path="*" element={<NotFound />} />
                        </Routes>
                    </Suspense>
                </main>

                {/* ============================================ */}
                {/* 页脚 */}
                {/* ============================================ */}
                <footer className="bg-white border-t border-gray-200 mt-20">
                    <div className="container-custom py-8">
                        <div className="grid md:grid-cols-4 gap-8">
                            {/* 品牌信息 */}
                            <div className="col-span-2">
                                <div className="flex items-center space-x-2 mb-4">
                                    <div className="w-10 h-10 bg-linear-to-br from-amber-500 to-orange-600 rounded-lg flex items-center justify-center">
                                        <span className="text-2xl">☕</span>
                                    </div>
                                    <span className="text-xl font-bold text-gray-900">
                                        SipSpot
                                    </span>
                                </div>
                                <p className="text-gray-600 mb-4">
                                    发现身边最好的咖啡店，分享你的咖啡时光
                                </p>
                                <p className="text-sm text-gray-500">
                                    © 2024 SipSpot. All rights reserved.
                                </p>
                            </div>

                            {/* 快速链接 */}
                            <div>
                                <h3 className="font-semibold text-gray-900 mb-3">
                                    快速链接
                                </h3>
                                <ul className="space-y-2">
                                    <li>
                                        <a href="/cafes" className="text-gray-600 hover:text-amber-600 transition-colors">
                                            所有咖啡店
                                        </a>
                                    </li>
                                    <li>
                                        <a href="/nearby" className="text-gray-600 hover:text-amber-600 transition-colors">
                                            附近咖啡店
                                        </a>
                                    </li>
                                    <li>
                                        <a href="/cafes/new" className="text-gray-600 hover:text-amber-600 transition-colors">
                                            添加咖啡店
                                        </a>
                                    </li>
                                </ul>
                            </div>

                            {/* 关于 */}
                            <div>
                                <h3 className="font-semibold text-gray-900 mb-3">
                                    关于我们
                                </h3>
                                <ul className="space-y-2">
                                    <li>
                                        <a href="/about" className="text-gray-600 hover:text-amber-600 transition-colors">
                                            关于 SipSpot
                                        </a>
                                    </li>
                                    <li>
                                        <a href="/contact" className="text-gray-600 hover:text-amber-600 transition-colors">
                                            联系我们
                                        </a>
                                    </li>
                                    <li>
                                        <a href="/privacy" className="text-gray-600 hover:text-amber-600 transition-colors">
                                            隐私政策
                                        </a>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </footer>

                {/* ============================================ */}
                {/* 回到顶部按钮 */}
                {/* ============================================ */}
                <ScrollToTop />
            </div>
        </Router>
    );
}

// ============================================
// 回到顶部按钮组件
// ============================================
const ScrollToTop = () => {
    const [isVisible, setIsVisible] = React.useState(false);

    React.useEffect(() => {
        const toggleVisibility = () => {
            if (window.pageYOffset > 300) {
                setIsVisible(true);
            } else {
                setIsVisible(false);
            }
        };

        window.addEventListener('scroll', toggleVisibility);
        return () => window.removeEventListener('scroll', toggleVisibility);
    }, []);

    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    };

    if (!isVisible) return null;

    return (
        <button
            onClick={scrollToTop}
            className="fixed bottom-8 right-8 p-3 bg-amber-600 text-white rounded-full shadow-lg hover:bg-amber-700 transition-all hover:scale-110 z-50"
            aria-label="回到顶部"
        >
            <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
            >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 10l7-7m0 0l7 7m-7-7v18"
                />
            </svg>
        </button>
    );
};

export default App;