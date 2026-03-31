# Frontend 3D: Infrastructure Layer TypeScript Migration

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate `main.jsx`, `App.jsx`, and `AuthContext.jsx` to TypeScript — type annotations only, no behavior changes.

**Architecture:** Delete each `.jsx` file and replace with a `.tsx` counterpart containing full TypeScript types. `AuthContext.tsx` introduces `IAuthContext` and `AuthResult` types, giving all `useAuth()` consumers typed inference. `App.tsx` types `ProtectedRoute`/`GuestRoute` children props and removes the `React` namespace. `main.tsx` is a trivial entry-point migration.

**Tech Stack:** React 19, TypeScript 5 strict (`strict: true`, `noUnusedLocals: true`, `noUnusedParameters: true`, `"jsx": "react-jsx"`), React Router 7, TailwindCSS v4

---

## File Map

| Action | Path |
|--------|------|
| Delete → Create | `frontend/src/main.jsx` → `frontend/src/main.tsx` |
| Delete → Create | `frontend/src/App.jsx` → `frontend/src/App.tsx` |
| Delete → Create | `frontend/src/contexts/AuthContext.jsx` → `frontend/src/contexts/AuthContext.tsx` |

**Reference files (do not modify):**
- `frontend/src/types/user.ts` — `IUser` definition (`_id`, no `id` field)
- `frontend/src/types/api.ts` — `ApiResponse<T>` (has `.data?: T`, no `.user` field)
- `frontend/src/services/authAPI.ts` — `login`, `register`, `logout`, `getCurrentUser` exports
- `frontend/src/services/api.ts` — `getUser`, `isAuthenticated`, `clearAuth` exports
- `frontend/src/pages/CafeListPage.tsx` — already has `myOnly?: boolean` prop (no action needed)
- `frontend/tsconfig.json` — compiler settings

---

### Task 1: main.jsx → main.tsx

**Files:**
- Delete: `frontend/src/main.jsx`
- Create: `frontend/src/main.tsx`

**Context:** Entry point for the React app. Three changes: named `StrictMode` import instead of `React.StrictMode`, `createRoot` from `react-dom/client`, non-null assertion on `getElementById`, and alias for `AuthProvider` import.

- [ ] **Step 1: Delete the old file**

```bash
rm frontend/src/main.jsx
```

- [ ] **Step 2: Create `frontend/src/main.tsx`**

```tsx
// ============================================
// SipSpot Frontend - Main Entry Point
// React应用入口文件
// ============================================

import './i18n'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { AuthProvider } from '@contexts/AuthContext'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>
)
```

- [ ] **Step 3: Run tsc**

```bash
cd frontend && npx tsc --noEmit 2>&1 | head -30
```

Expected: zero errors referencing `main.tsx`.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/main.tsx frontend/src/main.jsx
git commit -m "feat(ts): migrate main.jsx → main.tsx"
```

---

### Task 2: App.jsx → App.tsx

**Files:**
- Delete: `frontend/src/App.jsx`
- Create: `frontend/src/App.tsx`

**Context:** Main router component. Changes:
1. React import: `import React, { Suspense, lazy }` → `import { Suspense, lazy, useState, useEffect, type ReactNode, type JSX }` — removes namespace, adds named hooks and type imports needed by `ScrollToTop` and route guard components.
2. `useAuth` import: relative path → `@contexts/AuthContext` alias.
3. `ProtectedRoute` / `GuestRoute`: add `{ children: ReactNode }: JSX.Element` typing, return `<>{children}</>` (fragment) instead of bare `children`.
4. `ScrollToTop`: `React.useState` → `useState`, `React.useEffect` → `useEffect`.

**Important:** `type JSX` must be imported — `"jsx": "react-jsx"` does not put `JSX` in global scope. `CafeListPage.tsx` already declares `myOnly?: boolean` so `<CafeListPage myOnly />` compiles without changes.

- [ ] **Step 1: Delete the old file**

```bash
rm frontend/src/App.jsx
```

- [ ] **Step 2: Create `frontend/src/App.tsx` with the full content below**

```tsx
// ============================================
// SipSpot Frontend - Main App Component
// 主应用组件和路由配置
// ============================================

import { Suspense, lazy, useState, useEffect, type ReactNode, type JSX } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Navbar from './components/Navbar';
import LangSelect from './components/LangSelect';
import { useAuth } from '@contexts/AuthContext';
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
const SubmitSuccessPage = lazy(() => import('./pages/SubmitSuccessPage'));
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
const ProtectedRoute = ({ children }: { children: ReactNode }): JSX.Element => {
    const { isLoggedIn, loading } = useAuth();

    if (loading) {
        return <LoadingFallback />;
    }

    if (!isLoggedIn) {
        return <Navigate to="/login" replace />;
    }

    return <>{children}</>;
};

// ============================================
// 访客路由组件（仅未登录可访问）
// ============================================
const GuestRoute = ({ children }: { children: ReactNode }): JSX.Element => {
    const { isLoggedIn, loading } = useAuth();

    if (loading) {
        return <LoadingFallback />;
    }

    if (isLoggedIn) {
        return <Navigate to="/" replace />;
    }

    return <>{children}</>;
};

// ============================================
// 主应用组件
// ============================================
function App() {
    const { t } = useTranslation('common');
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

                            {/* 提交成功页面（须在 /cafes/new 之前，避免被 /cafes/:id 匹配） */}
                            <Route path="/cafes/new/success" element={<SubmitSuccessPage />} />

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
                                    {t('footer.tagline')}
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
                                [t('footer.sections.discover')]: [
                                    t('footer.links.topRated'), t('footer.links.newOpenings'),
                                    t('footer.links.nearMe'), t('footer.links.aiSearch'), t('footer.links.allCafes')
                                ],
                                [t('footer.sections.community')]: [
                                    t('footer.links.writeReview'), t('footer.links.addCafe'),
                                    t('footer.links.awards'), t('footer.links.events'), t('footer.links.ambassador')
                                ],
                                [t('footer.sections.company')]: [
                                    t('footer.links.about'), t('footer.links.press'),
                                    t('footer.links.careers'), t('footer.links.partnerships'), t('footer.links.contact')
                                ],
                                [t('footer.sections.support')]: [
                                    t('footer.links.helpCenter'), t('footer.links.privacy'),
                                    t('footer.links.terms'), t('footer.links.cookies')
                                ],
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
                            <p style={{ fontSize: '0.8rem' }}>{t('footer.copyright')}</p>
                            <LangSelect />
                            <div className="flex items-center gap-1.5" style={{ fontSize: '0.8rem' }}>
                                <span>{t('footer.madeWith')}</span>
                                <span className="text-amber-600">☕</span>
                                <span>{t('footer.madeWithSuffix')}</span>
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
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
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
```

- [ ] **Step 3: Run tsc**

```bash
cd frontend && npx tsc --noEmit 2>&1 | head -40
```

Expected: zero errors referencing `App.tsx`.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/App.tsx frontend/src/App.jsx
git commit -m "feat(ts): migrate App.jsx → App.tsx"
```

---

### Task 3: AuthContext.jsx → AuthContext.tsx

**Files:**
- Delete: `frontend/src/contexts/AuthContext.jsx`
- Create: `frontend/src/contexts/AuthContext.tsx`

**Context:** The most impactful migration. Defines `IAuthContext` and `AuthResult` types that flow to every `useAuth()` caller. Key non-obvious fixes:
- `checkAuthStatus` removed from imports (imported but unused — `noUnusedLocals` would error)
- `loginAPI` / `registerAPI` responses cast as `ApiResponse<IUser> & { user?: IUser }` — the backend auth response uses `.user` but `ApiResponse<T>` only defines `.data`
- `hasRole` returns `!!(user && user.role === role)` — double-negation needed because the expression type is `IUser | false | null`, not `boolean`
- `isOwner` uses `user._id` only — `IUser` has no `id` field (despite the original `user.id || user._id`)
- `userId` in value object: `user?._id ?? null` (same reason)
- HOC functions typed with `<P extends object>(Component: ComponentType<P>): FC<P>` generics
- `type JSX` must be explicitly imported for `JSX.Element` return annotation on `AuthProvider`

- [ ] **Step 1: Delete the old file**

```bash
rm frontend/src/contexts/AuthContext.jsx
```

- [ ] **Step 2: Create `frontend/src/contexts/AuthContext.tsx` with the full content below**

```tsx
// ============================================
// SipSpot Frontend - Auth Context
// 全局认证状态管理
// ============================================

import {
    createContext, useContext, useState, useEffect, useCallback,
    type ReactNode, type ComponentType, type FC, type JSX
} from 'react'
import type { IUser } from '@/types'
import type { ApiResponse } from '@/types'
import {
    login as loginAPI,
    register as registerAPI,
    logout as logoutAPI,
    getCurrentUser,
} from '@services/authAPI'
import { getUser, isAuthenticated, clearAuth } from '@services/api'

// ============================================
// 本地类型定义
// ============================================

type AuthResult =
    | { success: true; user: IUser }
    | { success: false; message: string }

interface IAuthContext {
    // 状态
    user: IUser | null
    loading: boolean
    isLoggedIn: boolean
    isAuthenticated: boolean

    // 认证方法
    login: (credentials: Record<string, string>) => Promise<AuthResult>
    register: (userData: Record<string, string>) => Promise<AuthResult>
    logout: () => Promise<void>
    updateUser: (updatedUser: IUser) => void
    refreshUser: () => Promise<IUser | null>

    // 权限检查
    hasRole: (role: string) => boolean
    isAdmin: () => boolean
    isOwner: (ownerId: string) => boolean
    canEdit: (ownerId: string) => boolean

    // 用户信息快捷访问
    userId: string | null
    username: string | null
    email: string | null
    avatar: string | null
    role: string
}

// ============================================
// 创建 Context
// ============================================
const AuthContext = createContext<IAuthContext | null>(null)

// ============================================
// AuthProvider 组件
// ============================================
export const AuthProvider = ({ children }: { children: ReactNode }): JSX.Element => {
    const [user, setUser] = useState<IUser | null>(null)
    const [loading, setLoading] = useState<boolean>(true)
    const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false)

    // ============================================
    // 初始化：检查认证状态
    // ============================================
    useEffect(() => {
        const initAuth = async () => {
            try {
                // 检查本地是否有token
                if (isAuthenticated()) {
                    // 从localStorage恢复用户信息
                    const localUser = getUser()

                    if (localUser) {
                        setUser(localUser)
                        setIsLoggedIn(true)

                        // 在后台验证token是否有效
                        try {
                            const response = await getCurrentUser()
                            if (response.success && response.data) {
                                setUser(response.data)
                            }
                        } catch (error) {
                            console.error('Token validation failed:', error)
                            // Token无效，清除认证信息
                            handleLogout()
                        }
                    } else {
                        // 有token但没有用户信息，尝试获取
                        try {
                            const response = await getCurrentUser()
                            if (response.success && response.data) {
                                setUser(response.data)
                                setIsLoggedIn(true)
                            } else {
                                clearAuth()
                            }
                        } catch (error) {
                            clearAuth()
                        }
                    }
                }
            } catch (error) {
                console.error('Auth initialization error:', error)
                clearAuth()
            } finally {
                setLoading(false)
            }
        }

        initAuth()
    }, [])

    // ============================================
    // 登录方法
    // ============================================
    const login = async (credentials: Record<string, string>): Promise<AuthResult> => {
        try {
            setLoading(true)
            // loginAPI returns ApiResponse<IUser> (.data), but the backend auth
            // response uses .user — cast to access it without a compile error
            const response = await loginAPI(credentials) as ApiResponse<IUser> & { user?: IUser }

            if (response.success && response.user) {
                setUser(response.user)
                setIsLoggedIn(true)
                return { success: true, user: response.user }
            }

            return { success: false, message: response.message || '登录失败' }
        } catch (error) {
            console.error('Login error:', error)
            return {
                success: false,
                message: (error as Error).message || '登录失败，请检查您的凭据'
            }
        } finally {
            setLoading(false)
        }
    }

    // ============================================
    // 注册方法
    // ============================================
    const register = async (userData: Record<string, string>): Promise<AuthResult> => {
        try {
            setLoading(true)
            const response = await registerAPI(userData) as ApiResponse<IUser> & { user?: IUser }

            if (response.success && response.user) {
                setUser(response.user)
                setIsLoggedIn(true)
                return { success: true, user: response.user }
            }

            return { success: false, message: response.message || '注册失败' }
        } catch (error) {
            console.error('Register error:', error)
            return {
                success: false,
                message: (error as Error).message || '注册失败，请稍后重试'
            }
        } finally {
            setLoading(false)
        }
    }

    // ============================================
    // 登出方法
    // ============================================
    const logout = async (): Promise<void> => {
        try {
            await logoutAPI()
        } catch (error) {
            console.error('Logout error:', error)
        } finally {
            handleLogout()
        }
    }

    // ============================================
    // 处理登出（清除状态）
    // ============================================
    const handleLogout = (): void => {
        setUser(null)
        setIsLoggedIn(false)
        clearAuth()
    }

    // ============================================
    // 更新用户信息
    // ============================================
    const updateUser = (updatedUser: IUser): void => {
        setUser(updatedUser)
    }

    // ============================================
    // 刷新用户信息
    // ============================================
    const refreshUser = async (): Promise<IUser | null> => {
        try {
            // getCurrentUser() returns Promise<any> — no cast needed
            const response = await getCurrentUser()
            if (response.success && response.data) {
                setUser(response.data)
                return response.data
            }
            return null
        } catch (error) {
            console.error('Refresh user error:', error)
            return null
        }
    }

    // ============================================
    // 检查用户权限
    // ============================================
    // Double-negation: expression type is `IUser | false | null`, not `boolean`
    const hasRole = (role: string): boolean => {
        return !!(user && user.role === role)
    }

    const isAdmin = useCallback((): boolean => {
        return hasRole('admin')
    }, [user])

    // ============================================
    // 检查是否是资源所有者
    // ============================================
    // IUser has only `_id` — no `id` field, so user.id was always undefined
    const isOwner = (ownerId: string): boolean => {
        if (!user) return false
        return user._id === ownerId || user._id === ownerId.toString()
    }

    // ============================================
    // 检查是否可以编辑资源
    // ============================================
    const canEdit = (ownerId: string): boolean => {
        return isAdmin() || isOwner(ownerId)
    }

    // ============================================
    // Context 值
    // ============================================
    const value: IAuthContext = {
        // 状态
        user,
        loading,
        isLoggedIn,
        isAuthenticated: isLoggedIn,

        // 方法
        login,
        register,
        logout,
        updateUser,
        refreshUser,

        // 权限检查
        hasRole,
        isAdmin,
        isOwner,
        canEdit,

        // 用户信息快捷访问
        // user?._id ?? null: IUser has no `id` field, only `_id`
        userId: user?._id ?? null,
        username: user?.username || null,
        email: user?.email || null,
        avatar: user?.avatar || null,
        role: user?.role || 'user'
    }

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    )
}

// ============================================
// useAuth Hook
// ============================================
export const useAuth = () => {
    const context = useContext(AuthContext)

    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider')
    }

    return context
}

// ============================================
// 受保护路由的 HOC
// ============================================
export const withAuth = <P extends object>(Component: ComponentType<P>): FC<P> => {
    return function AuthComponent(props: P) {
        const { isLoggedIn, loading } = useAuth()
        const navigate = typeof window !== 'undefined' ? window.location : null

        useEffect(() => {
            if (!loading && !isLoggedIn && navigate) {
                // 保存当前路径，登录后可以返回
                const currentPath = window.location.pathname
                navigate.href = `/login?redirect=${encodeURIComponent(currentPath)}`
            }
        }, [loading, isLoggedIn, navigate])

        if (loading) {
            return (
                <div className="flex items-center justify-center min-h-screen">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
                </div>
            )
        }

        if (!isLoggedIn) {
            return null
        }

        return <Component {...props} />
    }
}

// ============================================
// 仅供未登录用户访问的 HOC（如登录、注册页面）
// ============================================
export const withGuest = <P extends object>(Component: ComponentType<P>): FC<P> => {
    return function GuestComponent(props: P) {
        const { isLoggedIn, loading } = useAuth()
        const navigate = typeof window !== 'undefined' ? window.location : null

        useEffect(() => {
            if (!loading && isLoggedIn && navigate) {
                // 已登录，跳转到首页
                navigate.href = '/'
            }
        }, [loading, isLoggedIn, navigate])

        if (loading) {
            return (
                <div className="flex items-center justify-center min-h-screen">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
                </div>
            )
        }

        if (isLoggedIn) {
            return null
        }

        return <Component {...props} />
    }
}

// ============================================
// 管理员专用 HOC
// ============================================
export const withAdmin = <P extends object>(Component: ComponentType<P>): FC<P> => {
    return function AdminComponent(props: P) {
        const { isLoggedIn, isAdmin, loading } = useAuth()
        const navigate = typeof window !== 'undefined' ? window.location : null

        useEffect(() => {
            if (!loading) {
                if (!isLoggedIn && navigate) {
                    navigate.href = '/login'
                } else if (isLoggedIn && !isAdmin() && navigate) {
                    navigate.href = '/'
                }
            }
        }, [loading, isLoggedIn, navigate])

        if (loading) {
            return (
                <div className="flex items-center justify-center min-h-screen">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
                </div>
            )
        }

        if (!isLoggedIn || !isAdmin()) {
            return (
                <div className="flex items-center justify-center min-h-screen">
                    <div className="text-center">
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">
                            访问受限
                        </h2>
                        <p className="text-gray-600">
                            您没有权限访问此页面
                        </p>
                    </div>
                </div>
            )
        }

        return <Component {...props} />
    }
}

// ============================================
// 默认导出
// ============================================
export default AuthContext
```

- [ ] **Step 3: Run tsc and verify zero errors**

```bash
cd frontend && npx tsc --noEmit 2>&1 | head -50
```

Expected: zero errors in `main.tsx`, `App.tsx`, `AuthContext.tsx`. Any errors in still-unmigrated `.jsx` files (e.g. `Navbar.jsx`, `Profile.jsx`) are pre-existing and out of scope for 3D.

- [ ] **Step 4: Run lint**

```bash
cd frontend && npm run lint 2>&1 | tail -20
```

Expected: zero new warnings beyond pre-existing baseline.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/contexts/AuthContext.tsx frontend/src/contexts/AuthContext.jsx
git commit -m "feat(ts): migrate AuthContext.jsx → AuthContext.tsx, add IAuthContext type"
```

---

## Post-Migration Verification

After all three tasks complete:

- [ ] `cd frontend && npx tsc --noEmit` — zero errors in 3D files
- [ ] `cd frontend && npm run lint` — zero new lint warnings
- [ ] `cd frontend && npm run build` — clean production build (Vite)
