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
