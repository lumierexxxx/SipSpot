// ============================================
// SipSpot Frontend - Main App Component
// 主应用组件和路由配置
// ============================================

import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import { useAuth } from './contexts/AuthContext';
import { Coffee, Instagram, Twitter, Youtube } from 'lucide-react';
import { Toaster } from '@components/ui/sonner';

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
const AISearchPage = lazy(() => import('./pages/AISearchPage'));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage'));
const VerifyEmailPage = lazy(() => import('./pages/VerifyEmailPage'));
const NotFound = lazy(() => import('./pages/NotFound'));

// ============================================
// 加载占位组件
// ============================================
const LoadingFallback = () => (
    <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto mb-4" />
            <p className="text-stone-500" style={{ fontSize: '0.9rem' }}>Loading...</p>
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
            <div className="min-h-screen bg-white">
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

                            {/* AI 智能搜索 */}
                            <Route path="/ai-search" element={<AISearchPage />} />

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

                            {/* 忘记密码 */}
                            <Route path="/forgot-password" element={<ForgotPasswordPage />} />

                            {/* 重置密码（通过邮件链接） */}
                            <Route path="/reset-password/:token" element={<ResetPasswordPage />} />

                            {/* 邮箱验证 */}
                            <Route path="/verify-email/:token" element={<VerifyEmailPage />} />

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
                {/* Footer — Brewly dark style */}
                {/* ============================================ */}
                <footer className="bg-stone-900 text-stone-400">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-8">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-10 mb-12">
                            {/* Brand */}
                            <div className="lg:col-span-1">
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="w-8 h-8 bg-amber-700 rounded-lg flex items-center justify-center">
                                        <Coffee className="w-4 h-4 text-white" />
                                    </div>
                                    <span className="text-white" style={{ fontSize: '1.15rem', fontWeight: 700 }}>SipSpot</span>
                                </div>
                                <p style={{ fontSize: '0.85rem', lineHeight: 1.65 }} className="text-stone-500 mb-5">
                                    The most trusted coffee shop discovery and review platform.
                                </p>
                                <div className="flex gap-3">
                                    {[Instagram, Twitter, Youtube].map((Icon, i) => (
                                        <a key={i} href="#" className="w-8 h-8 bg-stone-800 hover:bg-amber-700 rounded-lg flex items-center justify-center transition-colors">
                                            <Icon className="w-4 h-4" />
                                        </a>
                                    ))}
                                </div>
                            </div>

                            {/* Link columns */}
                            {Object.entries({
                                Discover: ['Top Rated', 'New Openings', 'Near Me', 'AI Search', 'All Cafés'],
                                Community: ['Write a Review', 'Add a Café', 'SipSpot Awards', 'Coffee Events', 'Ambassador Program'],
                                Company: ['About Us', 'Press', 'Careers', 'Partnerships', 'Contact'],
                                Support: ['Help Center', 'Privacy Policy', 'Terms of Use', 'Cookie Settings'],
                            }).map(([section, links]) => (
                                <div key={section}>
                                    <h4 className="text-white mb-4" style={{ fontSize: '0.85rem', fontWeight: 600, letterSpacing: '0.04em' }}>{section}</h4>
                                    <ul className="flex flex-col gap-2.5">
                                        {links.map(link => (
                                            <li key={link}>
                                                <a href="#" className="hover:text-amber-400 transition-colors" style={{ fontSize: '0.85rem' }}>{link}</a>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>

                        <div className="border-t border-stone-800 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
                            <p style={{ fontSize: '0.8rem' }}>© 2026 SipSpot, Inc. All rights reserved.</p>
                            <div className="flex items-center gap-1.5" style={{ fontSize: '0.8rem' }}>
                                <span>Made with</span>
                                <span className="text-amber-600">☕</span>
                                <span>for coffee lovers everywhere</span>
                            </div>
                        </div>
                    </div>
                </footer>

                {/* ============================================ */}
                {/* 回到顶部按钮 */}
                {/* ============================================ */}
                <ScrollToTop />
                <Toaster />
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