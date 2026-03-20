# Frontend Sub-Spec 3A: Infrastructure + Home — Design Document

## Overview

This spec covers the first phase of the frontend TypeScript migration and UI redesign for SipSpot. It includes all shared infrastructure (services, hooks, contexts, i18n, types) and the Home page (Navbar + 14 sub-components). All downstream specs (3B: Discovery + Detail, 3C: Reviews + User + Auth) depend on this infrastructure.

**In scope:** ~30 files
**Out of scope:** CafeList, CafeDetail, Reviews, Profile, Auth pages (covered in 3B and 3C)

---

## 1. TypeScript Configuration

The frontend `tsconfig.json` already exists with `"strict": true`. All new and migrated `.tsx`/`.ts` files must comply with strict mode — no `@ts-nocheck`, no `any` casts unless explicitly justified, no implicit any.

No changes to `tsconfig.json` are needed.

---

## 2. Type Definitions (`frontend/src/types/`)

The frontend maintains its own `types/` folder mirroring the backend. Types are not imported from the backend package — they are kept in sync manually.

### `types/cafe.ts`
Update the existing file to use English short keys (matching the backend migration):

```ts
export type AmenityKey =
  | 'wifi' | 'power_outlet' | 'quiet' | 'outdoor_seating'
  | 'pet_friendly' | 'no_smoking' | 'air_conditioning' | 'parking'
  | 'wheelchair_accessible' | 'laptop_friendly' | 'group_friendly' | 'work_friendly'

export type SpecialtyType =
  | 'espresso' | 'pour_over' | 'cold_brew' | 'matcha'
  | 'single_origin' | 'seasonal' | string

export type DayKey = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday'

export type VibeType = 'work' | 'date' | 'hangout' | 'quiet' | 'study'

export interface IOpeningHours {
  day: DayKey
  open: string
  close: string
  isClosed: boolean
}

export interface ILocation {
  type: 'Point'
  coordinates: [number, number]
}

export interface ICafe {
  _id: string
  name: string
  description: string
  images: string[]
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
  createdAt: string
  updatedAt: string
}
```

### `types/user.ts`
```ts
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

### `types/review.ts`
```ts
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

### `types/api.ts`
```ts
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

### `types/index.ts`
Barrel export for all types:
```ts
export * from './cafe'
export * from './user'
export * from './review'
export * from './api'
```

---

## 3. Services Typing

The three API service files are migrated from `.js` to `.ts`. Each function returns the unwrapped data type (not the raw `ApiResponse` wrapper).

### Pattern
```ts
// services/cafesAPI.ts
import api from './api'
import type { ApiResponse, ICafe } from '@/types'

export interface CafeSearchParams {
  page?: number
  limit?: number
  city?: string
  price?: number[]
  amenities?: AmenityKey[]
  sort?: string
  query?: string
}

export const getCafes = async (params?: CafeSearchParams): Promise<ICafe[]> => {
  const { data } = await api.get<ApiResponse<ICafe[]>>('/cafes', { params })
  return data.data ?? []
}
```

The `api.ts` (Axios instance) is migrated from `.js` to `.ts`. The existing interceptor logic (401 refresh queue, `clearAuth`) stays unchanged — only types are added.

### Files
- `services/api.ts` — Axios instance + interceptors
- `services/authAPI.ts` — login, register, logout, forgotPassword, resetPassword, verifyEmail
- `services/cafesAPI.ts` — getCafes, getCafe, createCafe, updateCafe, deleteCafe, searchCafes, getNearby
- `services/usersAPI.ts` — getCurrentUser, updateProfile, toggleFavorite, getFavorites

---

## 4. Hooks

Two hook files are migrated:

### `hooks/useAPI.ts`
Generic fetch hook gets a type parameter:
```ts
export function useAPI<T>(fetchFn: () => Promise<T>): {
  data: T | null
  loading: boolean
  error: string | null
  refetch: () => void
}
```

### `hooks/useGeolocation.ts`
```ts
export interface GeolocationState {
  coords: { latitude: number; longitude: number } | null
  error: string | null
  loading: boolean
}

export function useGeolocation(): GeolocationState
```

---

## 5. AuthContext

`AuthContext.jsx` → `AuthContext.tsx` with a typed context interface.

```ts
// contexts/AuthContext.tsx
import type { IUser } from '@/types'

interface AuthContextValue {
  user: IUser | null
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  updateUser: (updated: Partial<IUser>) => void
  loading: boolean
}

const AuthContext = createContext<AuthContextValue | null>(null)

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
```

No behavior changes — types are added over existing logic.

---

## 6. i18n TypeScript

`i18n.js` → `i18n.ts` with module augmentation for a fully typed `t()` function. TypeScript will catch typos like `t('amenities.wfi')` and provide autocomplete on all keys.

### `i18n.ts`
```ts
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import enCommon from './locales/en/common.json'
import enAmenities from './locales/en/amenities.json'
import enSpecialties from './locales/en/specialties.json'
import enDays from './locales/en/days.json'
import zhCommon from './locales/zh/common.json'
import zhAmenities from './locales/zh/amenities.json'
import zhSpecialties from './locales/zh/specialties.json'
import zhDays from './locales/zh/days.json'

export const defaultNS = 'common'
export const resources = {
  en: { common: enCommon, amenities: enAmenities, specialties: enSpecialties, days: enDays },
  zh: { common: zhCommon, amenities: zhAmenities, specialties: zhSpecialties, days: zhDays },
} as const

i18n.use(initReactI18next).init({
  resources,
  lng: 'zh',
  fallbackLng: 'zh',
  defaultNS,
  interpolation: { escapeValue: false },
})

export default i18n
```

### `types/i18n.d.ts`
```ts
import { resources, defaultNS } from '../i18n'

declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: typeof defaultNS
    resources: typeof resources['en']
  }
}
```

---

## 7. Navbar

`Navbar.jsx` → `Navbar.tsx`

```ts
interface NavbarProps {
  transparent?: boolean  // for hero overlay mode on Home
}
```

The mobile menu open/close state is typed as `useState<boolean>`. The `useAuth()` return value is typed via the updated `AuthContext`. No UI changes.

---

## 8. Home Page Components

`pages/Home.jsx` → `pages/Home.tsx` plus 14 sub-components in `components/home/`. Each sub-component gets a prop interface. The UI redesign swaps raw `<button>`, `<input>`, `<div className="card">` elements for the existing `components/ui/` primitives (Button, Input, Card) where present. No layout changes — the structure already matches the reference project.

### Component prop interfaces

**`HeroSection.tsx`**
```ts
interface HeroSectionProps {
  onSearch: (query: string) => void
}
// Uses: <Input> from ui/input, <Button> from ui/button
```

**`FeaturedShops.tsx`**
```ts
interface FeaturedShopsProps {
  cafes: ICafe[]
  loading: boolean
}
// Uses: <Card> from ui/card for each shop tile
```

**`ExploreByVibe.tsx`**
```ts
interface ExploreByVibeProps {
  onVibeSelect: (vibe: VibeType) => void
}
```

**`NewsletterSection.tsx`**
```ts
interface NewsletterSectionProps {
  onSubscribe: (email: string) => Promise<void>
}
// Uses: <Input> + <Button>
```

**`ShopCard.tsx`** (used inside FeaturedShops)
```ts
interface ShopCardProps {
  cafe: ICafe
  onFavorite?: (id: string) => void
}
// Uses: <Card> from ui/card
```

**`VibeCard.tsx`** (used inside ExploreByVibe)
```ts
interface VibeCardProps {
  vibe: VibeType
  label: string
  icon: string
  onClick: () => void
}
```

**Pure presentational (no props interface needed):**
- `HowItWorks.tsx` — static content
- `AppDownload.tsx` — static content
- `StatsSection.tsx` — static content

**Data-fetching sub-components** (fetch own data, no props needed beyond optional callbacks):
- `TopRatedSection.tsx`
- `RecentReviewsSection.tsx`
- `NearbySection.tsx`

---

## 9. File Migration Summary

| File | Action |
|---|---|
| `src/types/cafe.ts` | Update enum keys to English short keys |
| `src/types/user.ts` | Create |
| `src/types/review.ts` | Create |
| `src/types/api.ts` | Create |
| `src/types/index.ts` | Create (barrel) |
| `src/types/i18n.d.ts` | Create (module augmentation) |
| `src/i18n.js` | Migrate to `i18n.ts` |
| `src/services/api.js` | Migrate to `api.ts` |
| `src/services/authAPI.js` | Migrate to `authAPI.ts` |
| `src/services/cafesAPI.js` | Migrate to `cafesAPI.ts` |
| `src/services/usersAPI.js` | Migrate to `usersAPI.ts` |
| `src/hooks/useAPI.js` | Migrate to `useAPI.ts` |
| `src/hooks/useGeolocation.js` | Migrate to `useGeolocation.ts` |
| `src/contexts/AuthContext.jsx` | Migrate to `AuthContext.tsx` |
| `src/components/Navbar.jsx` | Migrate to `Navbar.tsx` |
| `src/pages/Home.jsx` | Migrate to `Home.tsx` |
| `src/components/home/*.jsx` | Migrate all (~14 files) to `.tsx` |

---

## 10. Non-Goals

- No changes to routing (`App.jsx`) in this spec — that is covered in 3B when page components are ready
- No changes to `CafeListPage`, `CafeDetailPage`, `ReviewForm`, `ReviewList`, `Profile`, `FavoritesPage`, or any auth pages
- No new features — migration and UI primitive adoption only
- No backend changes
