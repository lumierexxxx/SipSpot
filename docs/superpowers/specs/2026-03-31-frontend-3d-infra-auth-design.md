# Frontend Sub-Spec 3D: Infrastructure Layer — Design

**Date:** 2026-03-31
**Status:** Approved
**Preceding spec:** `2026-03-24-frontend-3c-reviews-auth-design.md`
**Scope:** TypeScript migration for `main.jsx`, `App.jsx`, and `AuthContext.jsx`. No behavior changes — types and import-alias fixes only.

---

## Goals

1. Migrate `main.jsx` → `main.tsx`
2. Migrate `App.jsx` → `App.tsx`
3. Migrate `AuthContext.jsx` → `AuthContext.tsx` — define `IAuthContext` interface so all consumers get typed `useAuth()` return values

---

## Architecture

### Approach: type-only migration

All three files are migrated by adding TypeScript types to existing JSX — no logic changes. `AuthContext` is the most impactful file: once `IAuthContext` is defined and `createContext` is properly typed, every component that calls `useAuth()` gets full type inference.

### Migration order

```
Task 1: main.jsx → main.tsx
Task 2: App.jsx → App.tsx
Task 3: AuthContext.jsx → AuthContext.tsx
```

Each task ends with `npx tsc --noEmit` and a commit.

---

## Tech Stack

React 19, TypeScript 5 (strict — `tsconfig.json` has `"strict": true`, `noUnusedLocals: true`, `noUnusedParameters: true`), TailwindCSS v4, React Router 7, Axios

---

## Section 1: main.tsx

**File:** `frontend/src/main.tsx` (rename from `.jsx`)

### Changes

1. Replace `import React from 'react'` and `import ReactDOM from 'react-dom/client'` with:
   ```ts
   import { StrictMode } from 'react'
   import { createRoot } from 'react-dom/client'
   ```
2. Replace `<React.StrictMode>` with `<StrictMode>`
3. Add non-null assertion to the root element lookup:
   ```ts
   createRoot(document.getElementById('root')!).render(...)
   ```
   The `!` is safe — `root` div is guaranteed present in `index.html`.

### Imports

Remove `import React from 'react'`.
Keep: `import './i18n'`
Keep: `import App from './App'`
Fix alias: `import { AuthProvider } from '@contexts/AuthContext'`
Keep: `import './index.css'`

---

## Section 2: App.tsx

**File:** `frontend/src/App.jsx` (rename from `.jsx`)

### Import changes

```ts
// Before:
import React, { Suspense, lazy } from 'react';
import { useAuth } from './contexts/AuthContext';

// After:
import { Suspense, lazy, useState, useEffect, type ReactNode, type JSX } from 'react'
import { useAuth } from '@contexts/AuthContext'
```

Note: `type JSX` must be explicitly imported — with `"jsx": "react-jsx"` (React 19 automatic transform) the global `JSX` namespace is not in scope. `ProtectedRoute` and `GuestRoute` use `: JSX.Element` return annotations so the import is required.

All other imports remain unchanged.

### ProtectedRoute and GuestRoute

Add `{ children: ReactNode }` prop type. Wrap bare `children` return in a fragment so the return type is consistently `JSX.Element`:

```ts
const ProtectedRoute = ({ children }: { children: ReactNode }): JSX.Element => {
  const { isLoggedIn, loading } = useAuth()
  if (loading) return <LoadingFallback />
  if (!isLoggedIn) return <Navigate to="/login" replace />
  return <>{children}</>
}

const GuestRoute = ({ children }: { children: ReactNode }): JSX.Element => {
  const { isLoggedIn, loading } = useAuth()
  if (loading) return <LoadingFallback />
  if (isLoggedIn) return <Navigate to="/" replace />
  return <>{children}</>
}
```

### ScrollToTop

Replace `React.useState` and `React.useEffect` with the imported named hooks:

```ts
const ScrollToTop = () => {
  const [isVisible, setIsVisible] = useState(false)
  useEffect(() => { ... }, [])
  ...
}
```

No explicit return type annotation needed — TypeScript infers `JSX.Element | null`.

### LoadingFallback

No changes — TypeScript infers the return type from JSX.

### CafeListPage myOnly prop

`<CafeListPage myOnly />` at line 214 of `App.jsx` is safe — `CafeListPage.tsx` already exists at `frontend/src/pages/CafeListPage.tsx` with `myOnly?: boolean` in its props interface. With `moduleResolution: "bundler"`, TypeScript resolves the extensionless lazy import to the `.tsx` file first. No error.

---

## Section 3: AuthContext.tsx

**File:** `frontend/src/contexts/AuthContext.tsx` (rename from `.jsx`)

### Local types

```ts
type AuthResult =
  | { success: true; user: IUser }
  | { success: false; message: string }

interface IAuthContext {
  // State
  user: IUser | null
  loading: boolean
  isLoggedIn: boolean
  isAuthenticated: boolean  // alias for isLoggedIn

  // Auth methods
  login: (credentials: Record<string, string>) => Promise<AuthResult>
  register: (userData: Record<string, string>) => Promise<AuthResult>
  logout: () => Promise<void>
  updateUser: (updatedUser: IUser) => void
  refreshUser: () => Promise<IUser | null>

  // Permission helpers
  hasRole: (role: string) => boolean
  isAdmin: () => boolean
  isOwner: (ownerId: string) => boolean
  canEdit: (ownerId: string) => boolean

  // User shortcut fields
  userId: string | null
  username: string | null
  email: string | null
  avatar: string | null
  role: string
}
```

### createContext call

```ts
const AuthContext = createContext<IAuthContext | null>(null)
```

### AuthProvider props

```ts
export const AuthProvider = ({ children }: { children: ReactNode }): JSX.Element => {
```

### State types

```ts
const [user, setUser] = useState<IUser | null>(null)
const [loading, setLoading] = useState<boolean>(true)
const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false)
```

### login method

`loginAPI` returns `Promise<ApiResponse<IUser>>` which has `.data?: IUser` — but the backend auth response uses a `.user` field (not `.data`). Cast to access `.user`:

```ts
const login = async (credentials: Record<string, string>): Promise<AuthResult> => {
  try {
    setLoading(true)
    const response = await loginAPI(credentials) as ApiResponse<IUser> & { user?: IUser }
    if (response.success && response.user) {
      setUser(response.user)
      setIsLoggedIn(true)
      return { success: true, user: response.user }
    }
    return { success: false, message: response.message || '登录失败' }
  } catch (error) {
    console.error('Login error:', error)
    return { success: false, message: (error as Error).message || '登录失败，请检查您的凭据' }
  } finally {
    setLoading(false)
  }
}
```

### register method

Same cast pattern as `login`:

```ts
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
    return { success: false, message: (error as Error).message || '注册失败，请稍后重试' }
  } finally {
    setLoading(false)
  }
}
```

### logout, handleLogout, updateUser

```ts
const logout = async (): Promise<void> => { ... }
const handleLogout = (): void => { ... }
const updateUser = (updatedUser: IUser): void => { setUser(updatedUser) }
```

### refreshUser

`getCurrentUser()` returns `Promise<any>` (inferred from `get()` which is typed `Promise<any>`), so no cast needed — `any` is assignable to `IUser | null`:

```ts
const refreshUser = async (): Promise<IUser | null> => {
  try {
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
```

### hasRole

Original returns `user && user.role === role` which is `IUser | false | null` — not `boolean`. Fix with double-negation:

```ts
const hasRole = (role: string): boolean => {
  return !!(user && user.role === role)
}
```

### isAdmin

```ts
const isAdmin = useCallback((): boolean => {
  return hasRole('admin')
}, [user])
```

### isOwner

`IUser` has `_id: string` but no `id` field. `user.id || user._id` always evaluates to `user._id` since `user.id` is always `undefined`. Simplify:

```ts
const isOwner = (ownerId: string): boolean => {
  if (!user) return false
  return user._id === ownerId || user._id === ownerId.toString()
}
```

### canEdit

```ts
const canEdit = (ownerId: string): boolean => {
  return isAdmin() || isOwner(ownerId)
}
```

### userId in context value object

The original source sets `userId: user?.id || user?._id || null`. `IUser` has no `id` field — only `_id`. `user?.id` is always `undefined`, so the expression always falls through to `user?._id`. Under strict mode this is `TS2339: Property 'id' does not exist on type 'IUser'`.

Fix — use only `_id`:
```ts
userId: user?._id ?? null,
```

### HOC functions

All three HOCs receive a generic component type and return a wrapped `FC<P>`:

```ts
export const withAuth = <P extends object>(Component: ComponentType<P>): FC<P> => {
  return function AuthComponent(props: P) {
    const { isLoggedIn, loading } = useAuth()
    const navigate = typeof window !== 'undefined' ? window.location : null
    useEffect(() => {
      if (!loading && !isLoggedIn && navigate) {
        const currentPath = window.location.pathname
        navigate.href = `/login?redirect=${encodeURIComponent(currentPath)}`
      }
    }, [loading, isLoggedIn, navigate])
    if (loading) { return <div className="..."><div className="..." /></div> }
    if (!isLoggedIn) return null
    return <Component {...props} />
  }
}
```

`withGuest` and `withAdmin` follow the same `<P extends object>(Component: ComponentType<P>): FC<P>` signature.

### Imports

```ts
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
```

Note: `checkAuthStatus` is removed — it was imported in the original but never called in this file. Keeping it would trigger `noUnusedLocals`.

Relative paths `'../services/authAPI'` and `'../services/api'` are replaced with `'@services/authAPI'` and `'@services/api'` per project alias convention.

---

## What This Spec Does NOT Cover

- `Navbar.jsx`, `LangSelect.jsx`, `CafeCard.jsx`, `CafeList.jsx`, `AIAnalysis.jsx` migration (spec 3E)
- Remaining pages: `Profile.jsx`, `FavoritesPage.jsx`, `MyReviewsPage.jsx`, `CreateCafePage.jsx`, `EditCafePage.jsx`, `CafeListPage.jsx`, `AISearchPage.jsx`, `SubmitSuccessPage.jsx`, `NotFound.jsx` (spec 3F)
- Fixing the `ApiResponse.data` vs backend `response.user` mismatch at the API layer (separate refactor)
- Fixing the `detailedRatings` vs `ratings` mismatch in ReviewForm (separate refactor, tracked in 3C spec)

---

## Post-Migration Verification

After all 3 tasks:
1. `npx tsc --noEmit` — zero errors in 3D files
2. `npm run lint` — zero new warnings beyond pre-existing baseline
3. `npm run build` — clean production build
