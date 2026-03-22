# Frontend 3A: Infrastructure + Home — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate all shared frontend infrastructure and the Home page from JavaScript to TypeScript, adopting strict mode throughout and swapping raw HTML elements for the existing `components/ui/` primitives in Home components.

**Architecture:** Type definitions are created first (Task 1), then infrastructure files are migrated in dependency order (i18n → services → hooks → AuthContext), then the `homeData` utility, then Navbar and Home components. Each task ends with a `tsc --noEmit` check and a commit. No new behavior is introduced — types are added over existing logic.

**Tech Stack:** React 19, TypeScript 5 (strict), Vite, i18next, Axios, TailwindCSS v4, Shadcn/ui primitives

**Spec:** `docs/superpowers/specs/2026-03-20-frontend-3a-infrastructure-home-design.md`

---

## Pre-flight check

- [ ] Confirm you are working in the `frontend/` directory for all commands
- [ ] Run `npm run lint` — must pass before you start
- [ ] Run `npx tsc --noEmit` — note any pre-existing errors (do not fix them now; they are baseline)

---

## Task 1: Type Definitions

Replace `src/types/cafe.ts` and create `user.ts`, `review.ts`, `api.ts`, `index.ts`.

**Files:**
- Replace: `frontend/src/types/cafe.ts`
- Create: `frontend/src/types/user.ts`
- Create: `frontend/src/types/review.ts`
- Create: `frontend/src/types/api.ts`
- Create: `frontend/src/types/index.ts`

> **IMPORTANT — Cafe → ICafe rename:** The existing `cafe.ts` exports a type named `Cafe`. This plan renames it to `ICafe`. Two files are known consumers with relative imports that a simple alias grep will miss:
> - `frontend/src/components/CafeCard.tsx` imports `import type { Cafe } from '../types/cafe'`
> - `frontend/src/pages/CafeListPage.tsx` imports `import type { Cafe, FilterState } from '@/types/cafe'`
>
> After writing the new types, update both files to use `ICafe`. Also run the broader grep to catch any others:
> ```bash
> grep -rn "import.*\bCafe\b" frontend/src --include="*.tsx" --include="*.ts"
> ```

> **IMPORTANT — step order:** `user.ts` and `review.ts` must be created BEFORE `cafe.ts` rewrites its `author` and `reviews` fields. TypeScript's `import type` handles circular type-only imports at compile time. Follow the step order below exactly.

- [ ] **Step 1: Create `frontend/src/types/api.ts`** (no dependencies — create first)

```ts
// ============================================
// SipSpot — API response contract
// ============================================

export interface ApiResponse<T = unknown> {
  success: boolean
  message?: string
  data?: T
  pagination?: {
    page: number
    limit: number
    total: number
    pages: number
  }
  errors?: string[]
}
```

- [ ] **Step 2: Create `frontend/src/types/user.ts`**

```ts
// ============================================
// SipSpot — User domain types
// ============================================

// Note: AmenityKey and SpecialtyType are in cafe.ts.
// TypeScript handles this circular type-only import correctly — types are erased at runtime.
// HOWEVER: the old cafe.ts does not export AmenityKey/SpecialtyType yet. `tsc` will report
// an error on this import until Step 4 replaces cafe.ts. This is expected — do not stop.
import type { AmenityKey, SpecialtyType } from './cafe'

export interface IUser {
  _id: string
  username: string
  email: string
  avatar?: string
  bio?: string
  role: 'user' | 'admin'
  favorites: string[]
  visited: string[]
  preferences: IUserPreferences
  isEmailVerified: boolean
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface IUserPreferences {
  learned: {
    favoriteAmenities: Array<{ amenity: AmenityKey; weight: number }>
    favoriteSpecialties: SpecialtyType[]
    preferredPriceRange: { min: number; max: number }
    visitCount: number
  }
  manual: {
    preferredAmenities: AmenityKey[]
    preferredSpecialties: SpecialtyType[]
    preferredPriceRange: { min: number; max: number }
    preferredCities: string[]
  }
}
```

- [ ] **Step 3: Create `frontend/src/types/review.ts`**

> `review.ts` imports `ICafe` from `cafe.ts` via `import type` — this is safe even though `cafe.ts` hasn't been updated yet (it exists, just with the old `Cafe` type). TypeScript resolves type-only circular imports at compile time.

```ts
// ============================================
// SipSpot — Review domain types
// ============================================

import type { ICafe } from './cafe'
import type { IUser } from './user'

export interface IReview {
  _id: string
  content: string
  rating: number
  ratings: {
    taste?: number
    price?: number
    environment?: number
    service?: number
    workspace?: number
  }
  cafe: string | ICafe
  author: string | IUser
  images: string[]
  aiAnalysis?: {
    sentiment?: 'positive' | 'negative' | 'neutral'
    keywords?: string[]
    summary?: string
  }
  helpful: string[]
  isReported: boolean
  ownerResponse?: {
    content: string
    respondedAt: string
  }
  createdAt: string
  updatedAt: string
}
```

- [ ] **Step 4: Replace `frontend/src/types/cafe.ts`**

Now that `user.ts` and `review.ts` exist, `cafe.ts` can safely import from them using `import type`:

```ts
// ============================================
// SipSpot — Cafe domain types
// ============================================

import type { IUser } from './user'
import type { IReview } from './review'

export type AmenityKey =
  | 'wifi' | 'power_outlet' | 'quiet' | 'outdoor_seating'
  | 'pet_friendly' | 'no_smoking' | 'air_conditioning' | 'parking'
  | 'wheelchair_accessible' | 'laptop_friendly' | 'group_friendly' | 'work_friendly'

// Matches frontend/src/locales/en/specialties.json exactly
export type SpecialtyType =
  | 'espresso' | 'pour_over' | 'cold_brew' | 'latte_art'
  | 'specialty_beans' | 'desserts' | 'light_meals'

export type DayKey =
  | 'monday' | 'tuesday' | 'wednesday' | 'thursday'
  | 'friday' | 'saturday' | 'sunday'

export interface CafeImage {
  cardImage?: string
  url?: string
}

export interface IOpeningHours {
  day: DayKey
  open: string    // e.g. "09:00"
  close: string   // e.g. "22:00"
  isClosed: boolean
}

export interface ILocation {
  type: 'Point'
  coordinates: [number, number]  // [longitude, latitude]
}

export interface ICafe {
  _id: string
  name: string
  description: string
  images: Array<CafeImage | string>
  location: ILocation
  address: string
  city: string
  price: 1 | 2 | 3 | 4
  amenities: AmenityKey[]
  specialties: SpecialtyType[]
  openingHours: IOpeningHours[]
  rating: number
  reviewCount: number
  author: string | IUser
  reviews: string[] | IReview[]
  aiSummary?: string
  isVerified?: boolean
  isFavorited?: boolean   // computed client-side from auth user's favorites
  createdAt: string
  updatedAt: string
}

export interface FilterState {
  search: string
  city: string
  minRating: string
  maxPrice: string
  amenities: string[]
  vibe: string    // used by CafeListPage for amenity/vibe URL filter param
  sort: string
}
```

- [ ] **Step 5: Create `frontend/src/types/index.ts`**

```ts
export * from './cafe'
export * from './user'
export * from './review'
export * from './api'
```

- [ ] **Step 6: Update all files that imported the old `Cafe` type**

The two known consumers with non-alias imports that the grep may miss — update these manually:
- `frontend/src/components/CafeCard.tsx` line 16: `import type { Cafe } from '../types/cafe'` → `import type { ICafe } from '../types/cafe'` and rename all `Cafe` usages to `ICafe`
  - **Note:** `CafeCard.tsx` will have additional tsc errors beyond the rename (it uses `cafe.specialty` singular, Chinese day strings, old amenity map keys). These are expected and will be fixed in the 3B spec. Do NOT fix them now — just do the rename.
- `frontend/src/pages/CafeListPage.tsx` line 10: `import type { Cafe, FilterState } from '@/types/cafe'` → `import type { ICafe, FilterState } from '@/types/cafe'` and rename

Run the broad grep to find any others:
```bash
grep -rn "import.*\bCafe\b" frontend/src --include="*.tsx" --include="*.ts"
```

- [ ] **Step 7: Verify compilation**

```bash
cd frontend && npx tsc --noEmit 2>&1 | head -40
```

Expected: zero new errors compared to your baseline from pre-flight. If you see errors in files you haven't touched yet, note them — they will be fixed in later tasks.

- [ ] **Step 8: Commit**

```bash
git add frontend/src/types/ frontend/src/components/CafeCard.tsx frontend/src/pages/CafeListPage.tsx
git commit -m "feat(types): add ICafe, IUser, IReview, ApiResponse — replace old Cafe type"
```

---

## Task 2: i18n Migration

Migrate `src/i18n.js` → `src/i18n.ts`, export `resources` + `defaultNS`, and create `src/types/i18n.d.ts` (which depends on those exports).

**Files:**
- Rename+edit: `frontend/src/i18n.js` → `frontend/src/i18n.ts`
- Create: `frontend/src/types/i18n.d.ts`

- [ ] **Step 1: Rename the file**

```bash
mv frontend/src/i18n.js frontend/src/i18n.ts
```

- [ ] **Step 2: Update `frontend/src/i18n.ts`**

Replace the entire file content:

```ts
// ============================================
// SipSpot — i18next initialisation
// Inline-bundled resources, sipspot_lang localStorage
// ============================================
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

import enCommon from './locales/en/common.json'
import enHome from './locales/en/home.json'
import enCafeList from './locales/en/cafeList.json'
import enAmenities from './locales/en/amenities.json'
import enSpecialties from './locales/en/specialties.json'
import enDays from './locales/en/days.json'
import zhCommon from './locales/zh/common.json'
import zhHome from './locales/zh/home.json'
import zhCafeList from './locales/zh/cafeList.json'
import zhAmenities from './locales/zh/amenities.json'
import zhSpecialties from './locales/zh/specialties.json'
import zhDays from './locales/zh/days.json'

export const defaultNS = 'common' as const

export const resources = {
  en: { common: enCommon, home: enHome, cafeList: enCafeList, amenities: enAmenities, specialties: enSpecialties, days: enDays },
  zh: { common: zhCommon, home: zhHome, cafeList: zhCafeList, amenities: zhAmenities, specialties: zhSpecialties, days: zhDays },
} as const

i18n.use(initReactI18next).init({
  resources,
  lng: localStorage.getItem('sipspot_lang') ?? 'zh',   // SipSpot targets Chinese market
  fallbackLng: 'zh',
  defaultNS,
  interpolation: { escapeValue: false },
}).catch(console.error)

export default i18n
```

- [ ] **Step 3: Create `frontend/src/types/i18n.d.ts`**

This file can now be created safely since `i18n.ts` exports `resources` and `defaultNS`:

```ts
// Typed t() — TypeScript will catch missing/misspelled i18n keys
import { resources, defaultNS } from '../i18n'

declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: typeof defaultNS
    resources: typeof resources['en']
  }
}
```

- [ ] **Step 4: Verify compilation**

```bash
cd frontend && npx tsc --noEmit 2>&1 | head -40
```

- [ ] **Step 5: Run dev server briefly to confirm i18n loads**

```bash
cd frontend && npm run dev
```

Open `http://localhost:5173` — the Home page should render in Chinese by default. Stop the server.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/i18n.ts frontend/src/types/i18n.d.ts
git commit -m "feat(i18n): migrate i18n.js to i18n.ts with typed resources export and i18n.d.ts augmentation"
```

---

## Task 3: Services Migration

Migrate `api.js`, `authAPI.js`, `cafesAPI.js`, `usersAPI.js` to TypeScript.

**Files:**
- Rename+edit: `frontend/src/services/api.js` → `api.ts`
- Rename+edit: `frontend/src/services/authAPI.js` → `authAPI.ts`
- Rename+edit: `frontend/src/services/cafesAPI.js` → `cafesAPI.ts`
- Rename+edit: `frontend/src/services/usersAPI.js` → `usersAPI.ts`

### 3a: api.ts

- [ ] **Step 1: Rename**

```bash
mv frontend/src/services/api.js frontend/src/services/api.ts
```

- [ ] **Step 2: Add types to `api.ts`**

The file is large (~220 lines). Make only these targeted changes — do not rewrite the file:

1. At the top, add the import:
```ts
import type { AxiosInstance, AxiosRequestConfig, InternalAxiosRequestConfig, AxiosResponse, AxiosError } from 'axios'
```

2. Type the `failedQueue` array:
```ts
interface QueuedRequest {
  resolve: (value: unknown) => void
  reject: (reason?: unknown) => void
}
let failedQueue: QueuedRequest[] = []
```

3. Type the interceptor callbacks. Find `api.interceptors.request.use(` and type the config:
```ts
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => { ... },
  (error: AxiosError) => { ... }
)
```

4. Type the response interceptor:
```ts
api.interceptors.response.use(
  (response: AxiosResponse) => { ... },
  async (error: AxiosError & { config?: InternalAxiosRequestConfig & { _retry?: boolean } }) => { ... }
)
```

5. Type the `handleApiError` function:
```ts
function handleApiError(error: AxiosError<{ message?: string }>): string { ... }
```

6. Type the `uploadFile` helper parameters:
```ts
export const uploadFile = (
  url: string,
  files: File | File[],
  fieldName = 'images',
  additionalData: Record<string, unknown> = {}
): Promise<unknown> => { ... }
```

7. Export type for the api instance (add at bottom of file):
```ts
export type ApiInstance = AxiosInstance
```

### 3b: authAPI.ts

- [ ] **Step 3: Rename**

```bash
mv frontend/src/services/authAPI.js frontend/src/services/authAPI.ts
```

- [ ] **Step 4: Update imports and add return types to `authAPI.ts`**

Replace the import line at top:
```ts
import { post, put } from './api'
import { setUser, clearAuth } from './api'
import type { IUser, ApiResponse } from '@/types'
```

Add return types to the exported functions (keep function bodies unchanged).

> **Note on return types:** The runtime API actually returns the full `ApiResponse` wrapper (with `success`, `data`, etc.) — the spec shows unwrapped types, but that would require changes to every call site. Use `ApiResponse<IUser>` to match the actual runtime shape and keep AuthContext working without changes.

```ts
export const register = async (userData: Record<string, string>): Promise<ApiResponse<IUser>> => { ... }
export const login = async (credentials: Record<string, string>): Promise<ApiResponse<IUser>> => { ... }
export const logout = async (): Promise<void> => { ... }
export const updatePassword = async (passwordData: Record<string, string>): Promise<ApiResponse<unknown>> => { ... }
export const forgotPassword = async (email: string): Promise<ApiResponse<unknown>> => { ... }
export const resetPassword = async (token: string, password: string): Promise<ApiResponse<unknown>> => { ... }
export const refreshToken = async (): Promise<ApiResponse<unknown>> => { ... }
export const resendVerificationEmail = async (): Promise<ApiResponse<unknown>> => { ... }
```

Type the validation helpers:
```ts
interface ValidationResult {
  isValid: boolean
  errors: Record<string, string>
}
export const validateRegistrationData = (data: Record<string, string>): ValidationResult => { ... }
export const validateLoginData = (data: Record<string, string>): ValidationResult => { ... }
```

### 3c: cafesAPI.ts

- [ ] **Step 5: Rename**

```bash
mv frontend/src/services/cafesAPI.js frontend/src/services/cafesAPI.ts
```

- [ ] **Step 6: Update `cafesAPI.ts`**

Replace import line:
```ts
import { get, post, put, del, uploadFile } from './api'
import type { ICafe, AmenityKey, ApiResponse } from '@/types'
```

Add `CafeSearchParams` interface before the functions:
```ts
export interface CafeSearchParams {
  page?: number
  limit?: number
  city?: string
  price?: number[]
  amenities?: AmenityKey[]
  sort?: string
  query?: string
}
```

Type the key functions (bodies unchanged):
```ts
export const getCafes = (params: CafeSearchParams = {}): Promise<ApiResponse<ICafe[]>> => get('/cafes', { params })
export const getCafeById = (cafeId: string): Promise<ApiResponse<ICafe>> => get(`/cafes/${cafeId}`)
export const createCafe = (cafeData: Record<string, unknown>, images: File[] = []): Promise<ApiResponse<ICafe>> => { ... }
export const updateCafe = (cafeId: string, updateData: Record<string, unknown>): Promise<ApiResponse<ICafe>> => put(`/cafes/${cafeId}`, updateData)
export const deleteCafe = (cafeId: string): Promise<ApiResponse<void>> => del(`/cafes/${cafeId}`)
export const searchCafes = (params: Record<string, unknown>): Promise<ApiResponse<ICafe[]>> => get('/cafes/search', { params })
export const getNearbyCafes = (params: { lat: number; lng: number; radius?: number }): Promise<ApiResponse<ICafe[]>> => get('/cafes/nearby', { params })
```

### 3d: usersAPI.ts

- [ ] **Step 7: Rename**

```bash
mv frontend/src/services/usersAPI.js frontend/src/services/usersAPI.ts
```

- [ ] **Step 8: Update `usersAPI.ts`**

Replace import line:
```ts
import { get, post, put, del, uploadFile } from './api'
import { setUser } from './api'
import type { IUser, ICafe, ApiResponse } from '@/types'
```

Type the key functions:
```ts
export const getCurrentUser = (): Promise<ApiResponse<IUser>> => { ... }
export const updateProfile = (updateData: Partial<IUser>): Promise<ApiResponse<IUser>> => { ... }
export const getFavorites = (params?: Record<string, unknown>): Promise<ApiResponse<ICafe[]>> => get('/users/me/favorites', { params })
export const addToFavorites = (cafeId: string): Promise<ApiResponse<{ favorites: string[] }>> => post(`/users/me/favorites/${cafeId}`)
export const removeFromFavorites = (cafeId: string): Promise<ApiResponse<{ favorites: string[] }>> => del(`/users/me/favorites/${cafeId}`)
// toggleFavorite is imported by CafeCard.tsx — must be typed
export const toggleFavorite = async (cafeId: string, isFavorited: boolean): Promise<boolean> => { ... }
```

- [ ] **Step 9: Verify compilation**

```bash
cd frontend && npx tsc --noEmit 2>&1 | head -60
```

Fix any errors in the files you just edited. If errors are in files not yet migrated, note them and continue.

- [ ] **Step 10: Commit**

```bash
git add frontend/src/services/
git commit -m "feat(services): migrate api, authAPI, cafesAPI, usersAPI to TypeScript"
```

---

## Task 4: Hooks Migration

**Files:**
- Rename+edit: `frontend/src/hooks/useAPI.js` → `useAPI.ts`
- Rename+edit: `frontend/src/hooks/useGeolocation.js` → `useGeolocation.ts`

### 4a: useAPI.ts

- [ ] **Step 1: Rename**

```bash
mv frontend/src/hooks/useAPI.js frontend/src/hooks/useAPI.ts
```

- [ ] **Step 2: Add generics to `useAPI.ts`**

The hook is ~170 lines. Make only these targeted changes:

1. Change the function signature. Use `() => Promise<T>` (zero params) — this matches how `useAPI` is actually called (`useAPI(() => getCafes(...))`) and avoids `strictFunctionTypes` errors:
```ts
// Before:
export const useAPI = (apiFunc, options = {}) => {
// After:
export const useAPI = <T>(apiFunc: () => Promise<T>, options: {
  immediate?: boolean
  deps?: unknown[]
  onSuccess?: (data: T) => void
  onError?: (error: unknown) => void
  retryCount?: number
  retryDelay?: number
} = {}) => {
```

2. Type the state variables:
```ts
const [data, setData] = useState<T | null>(null)
const [loading, setLoading] = useState<boolean>(immediate)
const [error, setError] = useState<unknown>(null)
const [isSuccess, setIsSuccess] = useState<boolean>(false)
```

3. Type the `apiFuncRef`:
```ts
const apiFuncRef = useRef<() => Promise<T>>(apiFunc)
```

4. The `useLazyAPI` export:
```ts
export const useLazyAPI = <T>(apiFunc: () => Promise<T>, options = {}) => {
  return useAPI<T>(apiFunc, { ...options, immediate: false })
}
```

Leave `usePaginatedAPI`, `useCachedAPI`, `useMultipleAPIs`, `useMutation` unchanged for now — they have placeholder bodies (`// ...（完全不动）`).

### 4b: useGeolocation.ts

- [ ] **Step 3: Rename**

```bash
mv frontend/src/hooks/useGeolocation.js frontend/src/hooks/useGeolocation.ts
```

- [ ] **Step 4: Add types to `useGeolocation.ts`**

Add these interfaces near the top (after imports).

> **IMPORTANT:** Do NOT name the interface `GeolocationPosition` — TypeScript's DOM lib already declares that name globally and you will get a duplicate identifier error. Use `SipSpotPosition` instead.

```ts
interface SipSpotPosition {
  latitude: number
  longitude: number
  accuracy?: number | null
  altitude?: number | null
  altitudeAccuracy?: number | null
  heading?: number | null
  speed?: number | null
  timestamp?: number
  savedAt?: string
  city?: string
}

interface GeoError {
  message: string
  type: string
  code?: number
}

type GeoPermissionState = 'granted' | 'denied' | 'prompt'
```

Type the state variables:
```ts
const [position, setPosition] = useState<SipSpotPosition | null>(null)
const [error, setError] = useState<GeoError | null>(null)
const [loading, setLoading] = useState<boolean>(false)
const [permission, setPermission] = useState<GeoPermissionState>('prompt')
```

Export the interfaces so callers can type their usage:
```ts
export type { SipSpotPosition, GeoError }
```

- [ ] **Step 5: Verify compilation**

```bash
cd frontend && npx tsc --noEmit 2>&1 | head -40
```

- [ ] **Step 6: Commit**

```bash
git add frontend/src/hooks/
git commit -m "feat(hooks): migrate useAPI and useGeolocation to TypeScript"
```

---

## Task 5: AuthContext Migration

**Files:**
- Rename+edit: `frontend/src/contexts/AuthContext.jsx` → `AuthContext.tsx`

- [ ] **Step 1: Rename**

```bash
mv frontend/src/contexts/AuthContext.jsx frontend/src/contexts/AuthContext.tsx
```

- [ ] **Step 2: Add imports and the context value interface**

At the top of the file, after the existing imports, add:

```ts
import type { IUser } from '@/types'
```

After the `createContext(null)` line, add the interface:

```ts
interface AuthContextValue {
  // State
  user: IUser | null
  loading: boolean
  isLoggedIn: boolean
  isAuthenticated: boolean

  // Auth methods
  login: (email: string, password: string) => Promise<void>
  register: (username: string, email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  updateUser: (updated: Partial<IUser>) => void
  refreshUser: () => Promise<void>

  // Permission helpers
  hasRole: (role: string) => boolean
  isAdmin: () => boolean
  isOwner: (ownerId: string) => boolean
  canEdit: (ownerId: string) => boolean

  // Shortcut accessors
  userId: string | null
  username: string | null
  email: string | null
  avatar: string | null
  role: 'user' | 'admin'
}
```

- [ ] **Step 3: Type the context and hook**

Change:
```ts
const AuthContext = createContext(null)
```
To:
```ts
const AuthContext = createContext<AuthContextValue | null>(null)
```

Change:
```ts
export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
```
To:
```ts
export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
```

- [ ] **Step 4: Type the state variables inside AuthProvider**

```ts
const [user, setUser] = useState<IUser | null>(null)
const [loading, setLoading] = useState<boolean>(true)
const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false)
```

- [ ] **Step 5: Type the `AuthProvider` children prop**

```ts
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
```

- [ ] **Step 6: Verify compilation**

```bash
cd frontend && npx tsc --noEmit 2>&1 | head -40
```

Fix any type errors introduced by the strict interface. Common issues:
- `user?.id` — the IUser interface uses `_id`, not `id`. Check the `userId` shortcut line and use `user?._id ?? null`
- If `register` in the context calls `registerAPI` which takes `userData: Record<string, string>`, you may need to adjust the call site to match the typed signature

- [ ] **Step 7: Commit**

```bash
git add frontend/src/contexts/AuthContext.tsx
git commit -m "feat(auth): migrate AuthContext to TypeScript with full typed interface"
```

---

## Task 6: homeData Migration

**Files:**
- Rename+edit: `frontend/src/utils/homeData.js` → `homeData.ts`

- [ ] **Step 1: Rename**

```bash
mv frontend/src/utils/homeData.js frontend/src/utils/homeData.ts
```

- [ ] **Step 2: Add imports and interfaces at the top of `homeData.ts`**

Add after the existing section divider comment:

```ts
import React from 'react'
import type { ICafe, AmenityKey } from '@/types'

// ============================================
// Type definitions
// ============================================

export interface Vibe {
  emoji: string
  gradient: string
  filter: string  // URL query string, e.g. 'amenity=work_friendly'
}

export interface CuratedReview {
  id: number
  author: string
  avatar: string
  avatarColor: string
  shop: string
  rating: number
  date: string
  helpful: number
  image: string
}

export interface CafeBadge {
  key: 'newOpening' | 'editorsChoice' | 'verified' | 'topPick' | 'featured'
  color: string
}

export interface HowItWorksStep {
  icon: React.ReactElement
  step: string
  color: string
  border: string
}

export type CategoryFilter = (cafe: ICafe) => boolean
```

- [ ] **Step 3: Update `VIBES` filter strings to English short keys**

The existing `filter` values contain URL-encoded Chinese strings. Replace the entire `VIBES` array:

```ts
export const VIBES: Vibe[] = [
  { emoji: '💻', gradient: 'from-stone-800 to-stone-600',   filter: 'amenity=work_friendly' },
  { emoji: '🌿', gradient: 'from-emerald-800 to-emerald-600', filter: 'amenity=outdoor_seating' },
  { emoji: '🔇', gradient: 'from-blue-900 to-blue-700',     filter: 'amenity=quiet' },
  { emoji: '🐾', gradient: 'from-amber-800 to-amber-600',   filter: 'amenity=pet_friendly' },
  { emoji: '☕', gradient: 'from-teal-800 to-teal-600',     filter: 'specialty=1' },
  { emoji: '⚡', gradient: 'from-violet-800 to-violet-600', filter: 'amenity=power_outlet' },
  { emoji: '🎉', gradient: 'from-rose-800 to-rose-600',     filter: 'amenity=group_friendly' },
  { emoji: '✨', gradient: 'from-orange-800 to-orange-600', filter: 'new=1' },
]
```

- [ ] **Step 4: Add explicit types to the remaining constants**

```ts
export const CATEGORIES: string[] = ['All', 'Work-Friendly', 'Outdoor', 'Quiet Space', 'Dog Friendly', 'Specialty Coffee', 'New Openings']

export const CATEGORY_FILTERS: Record<string, CategoryFilter> = {
  'All': () => true,
  'Work-Friendly': (c) => c.amenities?.includes('work_friendly' as AmenityKey) ?? false,
  'Outdoor': (c) => c.amenities?.includes('outdoor_seating' as AmenityKey) ?? false,
  'Quiet Space': (c) => c.amenities?.includes('quiet' as AmenityKey) ?? false,
  'Dog Friendly': (c) => c.amenities?.includes('pet_friendly' as AmenityKey) ?? false,
  'Specialty Coffee': (c) => Boolean(c.specialties?.length),
  'New Openings': (c) => new Date().getTime() - new Date(c.createdAt).getTime() < 60 * 24 * 60 * 60 * 1000,
}
```

- [ ] **Step 5: Update helper functions to use English short keys**

Replace `getCafeTags` and `getCafeAmenityIcons` — they previously referenced Chinese strings. The old `AMENITY_TO_ENGLISH` and `SPECIALTY_TO_ENGLISH` maps can be removed since display labels now come from i18n:

```ts
// Remove AMENITY_TO_ENGLISH and SPECIALTY_TO_ENGLISH — no longer needed

export function getCafeBadge(cafe: ICafe): CafeBadge {
  const ageMs = new Date().getTime() - new Date(cafe.createdAt).getTime()
  if (ageMs < 60 * 24 * 60 * 60 * 1000) return { key: 'newOpening', color: 'bg-sky-600' }
  if (cafe.rating >= 4.8) return { key: 'editorsChoice', color: 'bg-violet-600' }
  if (cafe.isVerified) return { key: 'verified', color: 'bg-emerald-600' }
  if (cafe.rating >= 4.5) return { key: 'topPick', color: 'bg-amber-700' }
  return { key: 'featured', color: 'bg-stone-500' }
}

export function getCafeTags(cafe: ICafe): string[] {
  // Tags are now amenity keys — callers translate with t('amenities.<key>')
  const specialtyTags = cafe.specialties?.slice(0, 1) ?? []
  const amenityTags = cafe.amenities?.slice(0, 1) ?? []
  return [...specialtyTags, ...amenityTags].slice(0, 2)
}

export function getCafeHours(cafe: ICafe): string | null {
  const days: Record<string, number> = {
    sunday: 0, monday: 1, tuesday: 2, wednesday: 3,
    thursday: 4, friday: 5, saturday: 6
  }
  const todayIndex = new Date().getDay()
  const todayKey = Object.keys(days).find(k => days[k] === todayIndex) ?? ''
  const entry = cafe.openingHours?.find(h => h.day === todayKey)
  return entry && !entry.isClosed ? `${entry.open} – ${entry.close}` : null
}

// Note: ICafe.images is now Array<CafeImage | string> so we check typeof first.
// This is a deliberate behavior improvement over the old code which could not handle
// plain string images (the old type didn't include string in the union).
export function getCafeImage(cafe: ICafe, index = 0): string {
  const first = cafe.images?.[0]
  if (typeof first === 'string') return first
  if (first?.cardImage) return first.cardImage
  if (first?.url) return first.url
  return FALLBACK_IMAGES[index % FALLBACK_IMAGES.length]
}

export function getCafeAmenityIcons(cafe: ICafe): Array<'wifi' | 'power'> {
  const icons: Array<'wifi' | 'power'> = []
  if (cafe.amenities?.includes('wifi')) icons.push('wifi')
  if (cafe.amenities?.includes('power_outlet')) icons.push('power')
  return icons
}
```

- [ ] **Step 6: Add `HOW_IT_WORKS_STEPS` type annotation**

Find the `HOW_IT_WORKS_STEPS` constant and add the type:

```ts
export const HOW_IT_WORKS_STEPS: HowItWorksStep[] = [
  // existing array unchanged
]
```

- [ ] **Step 7: Verify compilation**

```bash
cd frontend && npx tsc --noEmit 2>&1 | head -40
```

- [ ] **Step 8: Commit**

```bash
git add frontend/src/utils/homeData.ts
git commit -m "feat(utils): migrate homeData to TypeScript, update filter strings to English short keys"
```

---

## Task 7: Navbar Migration

**Files:**
- Rename+edit: `frontend/src/components/Navbar.jsx` → `Navbar.tsx`

- [ ] **Step 1: Rename**

```bash
mv frontend/src/components/Navbar.jsx frontend/src/components/Navbar.tsx
```

- [ ] **Step 2: Add prop interface**

At the top of the function, add the interface and type the component:

```ts
interface NavbarProps {
  transparent?: boolean
}

export default function Navbar({ transparent = false }: NavbarProps) {
```

- [ ] **Step 3: Type the auth hook usage**

Find where `useAuth()` is called and ensure destructured fields are used as typed (they will be, since AuthContext is now typed):

```ts
const { isLoggedIn, user, logout } = useAuth()
// All of these are now typed — no changes needed to usage
```

- [ ] **Step 4: Type the mobile menu state**

```ts
const [menuOpen, setMenuOpen] = useState<boolean>(false)
```

- [ ] **Step 5: Verify**

```bash
cd frontend && npx tsc --noEmit 2>&1 | head -20
```

- [ ] **Step 6: Commit**

```bash
git add frontend/src/components/Navbar.tsx
git commit -m "feat(navbar): migrate Navbar to TypeScript"
```

---

## Task 8: Hero Cluster (HeroSection, HeroSearchBar, AISearchBar, HeroStats)

**Files:**
- Rename+edit: `frontend/src/components/home/HeroSection.jsx` → `HeroSection.tsx`
- Rename+edit: `frontend/src/components/home/HeroSearchBar.jsx` → `HeroSearchBar.tsx`
- Rename+edit: `frontend/src/components/home/AISearchBar.jsx` → `AISearchBar.tsx`
- Rename+edit: `frontend/src/components/home/HeroStats.jsx` → `HeroStats.tsx`

- [ ] **Step 1: Rename all four files**

```bash
mv frontend/src/components/home/HeroSection.jsx frontend/src/components/home/HeroSection.tsx
mv frontend/src/components/home/HeroSearchBar.jsx frontend/src/components/home/HeroSearchBar.tsx
mv frontend/src/components/home/AISearchBar.jsx frontend/src/components/home/AISearchBar.tsx
mv frontend/src/components/home/HeroStats.jsx frontend/src/components/home/HeroStats.tsx
```

- [ ] **Step 2: Type `HeroSection.tsx`**

```ts
interface HeroSectionProps {
  children: React.ReactNode
}
export default function HeroSection({ children }: HeroSectionProps) {
```

- [ ] **Step 3: Type `HeroSearchBar.tsx`**

```ts
interface HeroSearchBarProps {
  query: string
  location: string
  onQueryChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onLocationChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onSubmit: (e: React.FormEvent) => void
}
export default function HeroSearchBar({ query, location, onQueryChange, onLocationChange, onSubmit }: HeroSearchBarProps) {
```

Swap raw `<input>` elements for `<Input>` from `@components/ui/input`:
```ts
import { Input } from '@components/ui/input'
// Replace: <input type="text" ... value={query} onChange={onQueryChange} />
// With:    <Input type="text" ... value={query} onChange={onQueryChange} />
```

Swap the submit `<button>` for `<Button>` from `@components/ui/button`:
```ts
import { Button } from '@components/ui/button'
// Replace: <button type="submit" ...>Search</button>
// With:    <Button type="submit" ...>Search</Button>
```

- [ ] **Step 4: Type `AISearchBar.tsx`**

No props (manages own state):
```ts
export default function AISearchBar() {
```

Type the state:
```ts
const [aiQuery, setAiQuery] = useState<string>('')
```

Swap `<input>` → `<Input>` and search `<button>` → `<Button>`:
```ts
import { Input } from '@components/ui/input'
import { Button } from '@components/ui/button'
```

- [ ] **Step 5: Type `HeroStats.tsx`**

No props:
```ts
export default function HeroStats() {
```

No other changes needed.

- [ ] **Step 6: Verify**

```bash
cd frontend && npx tsc --noEmit 2>&1 | head -40
```

- [ ] **Step 7: Commit**

```bash
git add frontend/src/components/home/HeroSection.tsx frontend/src/components/home/HeroSearchBar.tsx frontend/src/components/home/AISearchBar.tsx frontend/src/components/home/HeroStats.tsx
git commit -m "feat(home): migrate hero cluster to TypeScript, adopt Input/Button ui primitives"
```

---

## Task 9: FeaturedShops Cluster (FeaturedShopsSection, CategoryFilterBar, ShopCard, CardSkeleton)

**Files:**
- Rename+edit: `frontend/src/components/home/FeaturedShopsSection.jsx` → `FeaturedShopsSection.tsx`
- Rename+edit: `frontend/src/components/home/CategoryFilterBar.jsx` → `CategoryFilterBar.tsx`
- Rename+edit: `frontend/src/components/home/ShopCard.jsx` → `ShopCard.tsx`
- Rename+edit: `frontend/src/components/home/CardSkeleton.jsx` → `CardSkeleton.tsx`

- [ ] **Step 1: Rename all four files**

```bash
mv frontend/src/components/home/FeaturedShopsSection.jsx frontend/src/components/home/FeaturedShopsSection.tsx
mv frontend/src/components/home/CategoryFilterBar.jsx frontend/src/components/home/CategoryFilterBar.tsx
mv frontend/src/components/home/ShopCard.jsx frontend/src/components/home/ShopCard.tsx
mv frontend/src/components/home/CardSkeleton.jsx frontend/src/components/home/CardSkeleton.tsx
```

- [ ] **Step 2: Type `FeaturedShopsSection.tsx`**

```ts
import type { ICafe } from '@/types'

interface FeaturedShopsSectionProps {
  cafes: ICafe[]
  loading: boolean
  activeCategory: string
  onCategoryChange: (category: string) => void
  isPersonalized: boolean
}
export default function FeaturedShopsSection({ cafes, loading, activeCategory, onCategoryChange, isPersonalized }: FeaturedShopsSectionProps) {
```

- [ ] **Step 3: Type `CategoryFilterBar.tsx`**

```ts
interface CategoryFilterBarProps {
  categories: string[]
  active: string
  onChange: (category: string) => void
  getLabel: (category: string) => string
}
export default function CategoryFilterBar({ categories, active, onChange, getLabel }: CategoryFilterBarProps) {
```

Swap filter `<button>` elements for `<Button variant="ghost">`:
```ts
import { Button } from '@components/ui/button'
// Replace each <button onClick={...}> with <Button variant="ghost" onClick={...}>
```

- [ ] **Step 4: Type `ShopCard.tsx`**

```ts
import type { ICafe } from '@/types'
import { Card } from '@components/ui/card'

interface ShopCardProps {
  cafe: ICafe
  index?: number
}
export default function ShopCard({ cafe, index = 0 }: ShopCardProps) {
```

Wrap the outer `<Link>` container in `<Card>`:
```ts
// The outer <Link className="bg-white rounded-2xl ..."> acts as a card container.
// Wrap it: <Card className="overflow-hidden ..."><Link ...>...</Link></Card>
// Remove the card-like classes from the Link since Card provides them.
```

Update the `getCafeTags` usage — tags now return amenity/specialty keys, not display strings. The updated `getCafeTags` in `homeData.ts` returns specialty keys first, then amenity keys. Translate in JSX using separate namespace lookups per source:
```ts
const tags = getCafeTags(cafe)
// cafe.specialties slice comes first in the tags array, amenities slice second.
// Translate knowing the source: first tag is from specialties, second from amenities.
// Simple approach — try specialties namespace first, fall back to amenities:
{tags.map((tag, i) => (
  <span key={tag}>
    {cafe.specialties?.includes(tag as SpecialtyType)
      ? t(`specialties.${tag}`)
      : t(`amenities.${tag}`)}
  </span>
))}
```


- [ ] **Step 5: Type `CardSkeleton.tsx`** — no props, no other changes

```ts
export default function CardSkeleton() {
```

- [ ] **Step 6: Verify**

```bash
cd frontend && npx tsc --noEmit 2>&1 | head -40
```

- [ ] **Step 7: Commit**

```bash
git add frontend/src/components/home/FeaturedShopsSection.tsx frontend/src/components/home/CategoryFilterBar.tsx frontend/src/components/home/ShopCard.tsx frontend/src/components/home/CardSkeleton.tsx
git commit -m "feat(home): migrate FeaturedShops cluster to TypeScript, adopt Card/Button ui primitives"
```

---

## Task 10: ExploreByVibeSection

**Files:**
- Rename+edit: `frontend/src/components/home/ExploreByVibeSection.jsx` → `ExploreByVibeSection.tsx`

- [ ] **Step 1: Rename**

```bash
mv frontend/src/components/home/ExploreByVibeSection.jsx frontend/src/components/home/ExploreByVibeSection.tsx
```

- [ ] **Step 2: Type the component**

No props — manages navigation internally:
```ts
import type { Vibe } from '@utils/homeData'

export default function ExploreByVibeSection() {
```

The `VIBES.map((vibe, i) => ...)` callback gets `vibe: Vibe` automatically once `homeData.ts` exports the typed array. No explicit typing needed in the callback.

- [ ] **Step 3: Verify**

```bash
cd frontend && npx tsc --noEmit 2>&1 | head -20
```

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/home/ExploreByVibeSection.tsx
git commit -m "feat(home): migrate ExploreByVibeSection to TypeScript"
```

---

## Task 11: Community Cluster (CommunityReviewsSection, ReviewCard, StarRating)

**Files:**
- Rename+edit: `frontend/src/components/home/CommunityReviewsSection.jsx` → `CommunityReviewsSection.tsx`
- Rename+edit: `frontend/src/components/home/ReviewCard.jsx` → `ReviewCard.tsx`
- Rename+edit: `frontend/src/components/home/StarRating.jsx` → `StarRating.tsx`

- [ ] **Step 1: Rename all three**

```bash
mv frontend/src/components/home/CommunityReviewsSection.jsx frontend/src/components/home/CommunityReviewsSection.tsx
mv frontend/src/components/home/ReviewCard.jsx frontend/src/components/home/ReviewCard.tsx
mv frontend/src/components/home/StarRating.jsx frontend/src/components/home/StarRating.tsx
```

- [ ] **Step 2: Type `CommunityReviewsSection.tsx`**

```ts
import type { CuratedReview } from '@utils/homeData'

interface CommunityReviewsSectionProps {
  reviews: CuratedReview[]
}
export default function CommunityReviewsSection({ reviews }: CommunityReviewsSectionProps) {
```

- [ ] **Step 3: Type `ReviewCard.tsx`**

```ts
import type { CuratedReview } from '@utils/homeData'

interface ReviewCardProps {
  review: CuratedReview
  index?: number
}
export default function ReviewCard({ review, index = 0 }: ReviewCardProps) {
```

- [ ] **Step 4: Type `StarRating.tsx`**

```ts
interface StarRatingProps {
  rating: number
}
export default function StarRating({ rating }: StarRatingProps) {
```

- [ ] **Step 5: Verify**

```bash
cd frontend && npx tsc --noEmit 2>&1 | head -20
```

- [ ] **Step 6: Commit**

```bash
git add frontend/src/components/home/CommunityReviewsSection.tsx frontend/src/components/home/ReviewCard.tsx frontend/src/components/home/StarRating.tsx
git commit -m "feat(home): migrate community cluster to TypeScript"
```

---

## Task 12: HowItWorksSection + NewsletterSection

**Files:**
- Rename+edit: `frontend/src/components/home/HowItWorksSection.jsx` → `HowItWorksSection.tsx`
- Rename+edit: `frontend/src/components/home/NewsletterSection.jsx` → `NewsletterSection.tsx`

- [ ] **Step 1: Rename both**

```bash
mv frontend/src/components/home/HowItWorksSection.jsx frontend/src/components/home/HowItWorksSection.tsx
mv frontend/src/components/home/NewsletterSection.jsx frontend/src/components/home/NewsletterSection.tsx
```

- [ ] **Step 2: Type `HowItWorksSection.tsx`** — no props

```ts
export default function HowItWorksSection() {
```

- [ ] **Step 3: Type `NewsletterSection.tsx`**

```ts
import { Input } from '@components/ui/input'
import { Button } from '@components/ui/button'

interface NewsletterSectionProps {
  email: string
  submitted: boolean
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onSubmit: (e: React.FormEvent) => void
}
export default function NewsletterSection({ email, submitted, onChange, onSubmit }: NewsletterSectionProps) {
```

Swap raw `<input>` → `<Input>` and submit `<button>` → `<Button>`.

- [ ] **Step 4: Verify**

```bash
cd frontend && npx tsc --noEmit 2>&1 | head -20
```

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/home/HowItWorksSection.tsx frontend/src/components/home/NewsletterSection.tsx
git commit -m "feat(home): migrate HowItWorks + NewsletterSection to TypeScript"
```

---

## Task 13: Home.tsx Final Assembly

**Files:**
- Rename+edit: `frontend/src/pages/Home.jsx` → `Home.tsx`

- [ ] **Step 1: Rename**

```bash
mv frontend/src/pages/Home.jsx frontend/src/pages/Home.tsx
```

- [ ] **Step 2: Add imports for types**

```ts
import type { ICafe } from '@/types'
```

- [ ] **Step 3: Type the state variables**

```ts
const [cafes, setCafes] = useState<ICafe[]>([])
const [loading, setLoading] = useState<boolean>(false)
const [query, setQuery] = useState<string>('')
const [location, setLocation] = useState<string>('')
const [activeCategory, setActiveCategory] = useState<string>('All')
const [email, setEmail] = useState<string>('')
const [newsletterSubmitted, setNewsletterSubmitted] = useState<boolean>(false)
```

- [ ] **Step 4: Add return type to the component**

```ts
export default function Home(): JSX.Element {
```

- [ ] **Step 5: Final compilation check**

```bash
cd frontend && npx tsc --noEmit
```

This should now produce zero errors (or only errors in files outside 3A scope). Fix any remaining errors in files you've touched.

- [ ] **Step 6: Run the dev server and verify Home page renders correctly**

```bash
cd frontend && npm run dev
```

Check:
- [ ] Home page loads at `http://localhost:5173`
- [ ] Language toggle works (EN/ZH)
- [ ] HeroSearchBar inputs are functional
- [ ] FeaturedShops displays cafes (or empty state if no backend running)
- [ ] No console errors

Stop the server.

- [ ] **Step 7: Run lint**

```bash
cd frontend && npm run lint
```

Fix any lint errors.

- [ ] **Step 8: Final commit**

```bash
git add frontend/src/pages/Home.tsx
git commit -m "feat(home): migrate Home.tsx to TypeScript — completes 3A infrastructure + home migration"
```

---

## Post-task verification

- [ ] Run `npx tsc --noEmit` one final time — confirm zero errors in 3A files
- [ ] Run `npm run lint` — confirm zero warnings
- [ ] Run `npm run build` — confirm production build succeeds

```bash
cd frontend && npm run build
```

Expected: build completes with no type errors.
