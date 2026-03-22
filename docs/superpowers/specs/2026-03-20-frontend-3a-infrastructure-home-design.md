# Frontend Sub-Spec 3A: Infrastructure + Home — Design Document

## Overview

This spec covers the first phase of the frontend TypeScript migration and UI redesign for SipSpot. It includes all shared infrastructure (services, hooks, contexts, i18n, types) and the Home page (Navbar + 14 sub-components + homeData utility). All downstream specs (3B: Discovery + Detail, 3C: Reviews + User + Auth) depend on this infrastructure.

**In scope:** ~33 files
**Out of scope:** CafeListPage, CafeDetailPage, Reviews, Profile, Auth pages (covered in 3B and 3C)

---

## 1. TypeScript Configuration

The frontend `tsconfig.json` already exists with `"strict": true`. All new and migrated `.tsx`/`.ts` files must comply with strict mode — no `@ts-nocheck`, no implicit any, no `any` casts unless explicitly justified with a comment.

No changes to `tsconfig.json` are needed.

---

## 2. Type Definitions (`frontend/src/types/`)

The frontend maintains its own `types/` folder. Types are not imported from the backend package — they are kept in sync manually.

### `types/cafe.ts`
Replace the entire existing file. **Note:** The existing file exports a type named `Cafe` — this is renamed to `ICafe`. Before migrating, grep for `import.*Cafe.*from.*@/types` across the codebase and update all consumers.

```ts
export type AmenityKey =
  | 'wifi' | 'power_outlet' | 'quiet' | 'outdoor_seating'
  | 'pet_friendly' | 'no_smoking' | 'air_conditioning' | 'parking'
  | 'wheelchair_accessible' | 'laptop_friendly' | 'group_friendly' | 'work_friendly'

// Matches frontend/src/locales/en/specialties.json exactly
export type SpecialtyType =
  | 'espresso' | 'pour_over' | 'cold_brew' | 'latte_art'
  | 'specialty_beans' | 'desserts' | 'light_meals'

export type DayKey = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday'

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
  isFavorited?: boolean   // computed from auth user's favorites — may be absent from API response
  createdAt: string
  updatedAt: string
}

export interface FilterState {
  search: string
  city: string
  minRating: string
  maxPrice: string
  amenities: string[]
  sort: string
}
```

> **Note on `AmenityKey` and `SpecialtyType`:** The backend DB migration (`npm run migrate`) renames all existing Chinese/bilingual enum values to these English short keys. These types are correct post-migration.

### `types/user.ts`
Create new file:

```ts
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

### `types/review.ts`
Create new file:

```ts
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

### `types/api.ts`
Create new file:

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
Create barrel export:

```ts
export * from './cafe'
export * from './user'
export * from './review'
export * from './api'
```

---

## 3. Services Typing

Migrate the three API service files and the Axios instance from `.js` to `.ts`. Each function returns the unwrapped data type (not the raw `ApiResponse` wrapper). No behavior changes — types are added over existing logic.

### `services/api.ts`
Add types to the existing Axios instance and interceptor logic. The interceptor (401 refresh queue, `clearAuth`) stays unchanged.

### `services/authAPI.ts`
```ts
import type { IUser, ApiResponse } from '@/types'

export const login = async (email: string, password: string): Promise<IUser>
export const register = async (username: string, email: string, password: string): Promise<IUser>
export const logout = async (): Promise<void>
export const forgotPassword = async (email: string): Promise<void>
export const resetPassword = async (token: string, password: string): Promise<void>
export const verifyEmail = async (token: string): Promise<void>
export const resendVerification = async (): Promise<void>
```

### `services/cafesAPI.ts`
```ts
import type { ICafe, AmenityKey, ApiResponse } from '@/types'

export interface CafeSearchParams {
  page?: number
  limit?: number
  city?: string
  price?: number[]
  amenities?: AmenityKey[]
  sort?: string
  query?: string
}

export const getCafes = async (params?: CafeSearchParams): Promise<ICafe[]>
export const getCafe = async (id: string): Promise<ICafe>
export const createCafe = async (data: FormData): Promise<ICafe>
export const updateCafe = async (id: string, data: FormData): Promise<ICafe>
export const deleteCafe = async (id: string): Promise<void>
export const searchCafes = async (query: string): Promise<ICafe[]>
export const getNearby = async (lat: number, lng: number, radius?: number): Promise<ICafe[]>
```

### `services/usersAPI.ts`
```ts
import type { IUser, ICafe, ApiResponse } from '@/types'

export const getCurrentUser = async (): Promise<IUser>
export const updateProfile = async (data: Partial<IUser>): Promise<IUser>
export const toggleFavorite = async (cafeId: string): Promise<{ favorites: string[] }>
export const getFavorites = async (): Promise<ICafe[]>
```

---

## 4. Hooks

### `hooks/useAPI.ts`
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

`AuthContext.jsx` → `AuthContext.tsx` with a typed context interface. No behavior changes — types are added over existing logic.

```ts
// contexts/AuthContext.tsx
import type { IUser } from '@/types'

interface AuthContextValue {
  // State
  user: IUser | null
  loading: boolean
  isLoggedIn: boolean
  isAuthenticated: boolean  // alias for isLoggedIn

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

  // Shortcut accessors (derived from user — null if not logged in)
  userId: string | null
  username: string | null
  email: string | null
  avatar: string | null
  role: 'user' | 'admin'
}

const AuthContext = createContext<AuthContextValue | null>(null)

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
```

---

## 6. i18n TypeScript

`i18n.js` → `i18n.ts` with module augmentation for a fully typed `t()` function.

### `i18n.ts`
```ts
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import enCommon from './locales/en/common.json'
import enAmenities from './locales/en/amenities.json'
import enSpecialties from './locales/en/specialties.json'
import enDays from './locales/en/days.json'
import enHome from './locales/en/home.json'
import enCafeList from './locales/en/cafeList.json'
import zhCommon from './locales/zh/common.json'
import zhAmenities from './locales/zh/amenities.json'
import zhSpecialties from './locales/zh/specialties.json'
import zhDays from './locales/zh/days.json'
import zhHome from './locales/zh/home.json'
import zhCafeList from './locales/zh/cafeList.json'

export const defaultNS = 'common'
export const resources = {
  en: { common: enCommon, amenities: enAmenities, specialties: enSpecialties, days: enDays, home: enHome, cafeList: enCafeList },
  zh: { common: zhCommon, amenities: zhAmenities, specialties: zhSpecialties, days: zhDays, home: zhHome, cafeList: zhCafeList },
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

## 7. `utils/homeData.ts`

Migrate `homeData.js` → `homeData.ts`. Add types for all exports. The `VIBES` array keeps the `filter` string pattern (URL query string appended to `/cafes?`) — vibe card labels come from i18n (`t('vibes.items.' + i + '.name')`), not from the `Vibe` interface. No `label` field is needed.

```ts
import type { ICafe, AmenityKey } from '@/types'

export interface Vibe {
  emoji: string
  gradient: string
  filter: string   // URL query string appended to /cafes? e.g. 'amenity=work_friendly'
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

export type CategoryFilter = (cafe: ICafe) => boolean

export interface HowItWorksStep {
  icon: React.ReactElement
  step: string         // e.g. '01', '02'
  color: string        // Tailwind classes, e.g. 'bg-amber-50 text-amber-700'
  border: string       // Tailwind classes, e.g. 'border-amber-200'
}

// Constants
export const CATEGORIES: string[]
export const CATEGORY_FILTERS: Record<string, CategoryFilter>
export const VIBES: Vibe[]
export const CURATED_REVIEWS: CuratedReview[]
export const FALLBACK_IMAGES: string[]
export const HOW_IT_WORKS_STEPS: HowItWorksStep[]

// Helper functions
export function getCafeBadge(cafe: ICafe): CafeBadge
export function getCafeTags(cafe: ICafe): string[]
export function getCafeHours(cafe: ICafe): string | null
export function getCafeImage(cafe: ICafe, index?: number): string
export function getCafeAmenityIcons(cafe: ICafe): Array<'wifi' | 'power'>
```

> **Note on VIBES filter strings:** The existing `filter` values are URL-encoded Chinese amenity strings. Update them to use English short keys as part of this migration (e.g. `amenity=work_friendly` instead of `amenity=%E9%80%82%E5%90%88%E5%B7%A5%E4%BD%9C...`).
>
> **Note on helper functions:** `getCafeTags` and `getCafeAmenityIcons` currently use `AMENITY_TO_ENGLISH` and `SPECIALTY_TO_ENGLISH` maps keyed on Chinese strings. Update these helpers to work with the new English short key values (e.g. `cafe.amenities.includes('wifi')` instead of `cafe.amenities.includes('WiFi')`). The translation maps (`AMENITY_TO_ENGLISH`, `SPECIALTY_TO_ENGLISH`) can be removed — display labels now come from i18n JSON.

---

## 8. Navbar

`Navbar.jsx` → `Navbar.tsx`

```ts
interface NavbarProps {
  transparent?: boolean  // for hero overlay mode on Home
}
```

---

## 9. Home Page Components

`pages/Home.jsx` → `pages/Home.tsx` plus all 14 sub-components in `components/home/`. Each sub-component gets a prop interface and is converted to `.tsx`. The UI redesign swaps raw `<button>`, `<input>`, `<div className="card">` elements for the existing `components/ui/` primitives where they fit. No layout changes.

### Prop interfaces

**`HeroSection.tsx`** — renders child components via `children` prop
```ts
interface HeroSectionProps {
  children: React.ReactNode
}
```

**`HeroSearchBar.tsx`**
```ts
interface HeroSearchBarProps {
  query: string
  location: string
  onQueryChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onLocationChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onSubmit: (e: React.FormEvent) => void
}
// Replace <input> with <Input> from ui/input
// Replace <button type="submit"> with <Button> from ui/button
```

**`AISearchBar.tsx`** — no props (manages own state, navigates internally)
```ts
// Replace <input> with <Input> from ui/input
// Replace <button> with <Button> from ui/button
```

**`HeroStats.tsx`** — no props (static curated content)

**`FeaturedShopsSection.tsx`**
```ts
interface FeaturedShopsSectionProps {
  cafes: ICafe[]
  loading: boolean
  activeCategory: string
  onCategoryChange: (category: string) => void
  isPersonalized: boolean
}
```

**`CategoryFilterBar.tsx`**
```ts
interface CategoryFilterBarProps {
  categories: string[]
  active: string
  onChange: (category: string) => void
  getLabel: (category: string) => string
}
// Replace <button> with <Button variant="ghost"> from ui/button
```

**`ShopCard.tsx`**
```ts
interface ShopCardProps {
  cafe: ICafe
  index?: number
}
// Uses: <Card> from ui/card for the outer container
```

**`CardSkeleton.tsx`** — no props (pure presentational)

**`ExploreByVibeSection.tsx`** — no props (uses VIBES constant from homeData.ts, navigates internally)

**`VibeCard` is not a separate file** — the vibe cards are rendered inline in `ExploreByVibeSection` using the `VIBES` array. No separate component needed.

**`CommunityReviewsSection.tsx`**
```ts
interface CommunityReviewsSectionProps {
  reviews: CuratedReview[]  // from homeData.ts
}
```

**`ReviewCard.tsx`**
```ts
interface ReviewCardProps {
  review: CuratedReview
  index?: number
}
```

**`StarRating.tsx`**
```ts
interface StarRatingProps {
  rating: number
}
```

**`HowItWorksSection.tsx`** — no props (uses HOW_IT_WORKS_STEPS constant from homeData.ts)

**`NewsletterSection.tsx`** — state is lifted to `Home.tsx`; receives 4 props
```ts
interface NewsletterSectionProps {
  email: string
  submitted: boolean
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onSubmit: (e: React.FormEvent) => void
}
// Replace <input> with <Input> from ui/input
// Replace <button> with <Button> from ui/button
```

---

## 10. File Migration Summary

| File | Action |
|---|---|
| `src/types/cafe.ts` | Replace entirely — update enum keys, add `CafeImage`, `isFavorited`, `isVerified` |
| `src/types/user.ts` | Create |
| `src/types/review.ts` | Create |
| `src/types/api.ts` | Create |
| `src/types/index.ts` | Create (barrel) |
| `src/types/i18n.d.ts` | Create (i18next module augmentation) |
| `src/i18n.js` | Migrate to `i18n.ts` — add `home` and `cafeList` namespace imports |
| `src/services/api.js` | Migrate to `api.ts` |
| `src/services/authAPI.js` | Migrate to `authAPI.ts` |
| `src/services/cafesAPI.js` | Migrate to `cafesAPI.ts` |
| `src/services/usersAPI.js` | Migrate to `usersAPI.ts` |
| `src/hooks/useAPI.js` | Migrate to `useAPI.ts` |
| `src/hooks/useGeolocation.js` | Migrate to `useGeolocation.ts` |
| `src/contexts/AuthContext.jsx` | Migrate to `AuthContext.tsx` |
| `src/utils/homeData.js` | Migrate to `homeData.ts` — add type interfaces, update VIBES filter strings to English short keys |
| `src/components/Navbar.jsx` | Migrate to `Navbar.tsx` |
| `src/pages/Home.jsx` | Migrate to `Home.tsx` |
| `src/components/home/HeroSection.jsx` | Migrate to `HeroSection.tsx` |
| `src/components/home/HeroSearchBar.jsx` | Migrate to `HeroSearchBar.tsx` |
| `src/components/home/AISearchBar.jsx` | Migrate to `AISearchBar.tsx` |
| `src/components/home/HeroStats.jsx` | Migrate to `HeroStats.tsx` |
| `src/components/home/FeaturedShopsSection.jsx` | Migrate to `FeaturedShopsSection.tsx` |
| `src/components/home/CategoryFilterBar.jsx` | Migrate to `CategoryFilterBar.tsx` |
| `src/components/home/ShopCard.jsx` | Migrate to `ShopCard.tsx` |
| `src/components/home/CardSkeleton.jsx` | Migrate to `CardSkeleton.tsx` |
| `src/components/home/ExploreByVibeSection.jsx` | Migrate to `ExploreByVibeSection.tsx` |
| `src/components/home/CommunityReviewsSection.jsx` | Migrate to `CommunityReviewsSection.tsx` |
| `src/components/home/ReviewCard.jsx` | Migrate to `ReviewCard.tsx` |
| `src/components/home/StarRating.jsx` | Migrate to `StarRating.tsx` |
| `src/components/home/HowItWorksSection.jsx` | Migrate to `HowItWorksSection.tsx` |
| `src/components/home/NewsletterSection.jsx` | Migrate to `NewsletterSection.tsx` |

Total: 31 files

---

## 11. Non-Goals

- No changes to routing (`App.jsx`) — covered in 3B
- No changes to `CafeListPage`, `CafeDetailPage`, `ReviewForm`, `ReviewList`, `Profile`, `FavoritesPage`, or any auth pages
- No new features — migration and UI primitive adoption only
- No backend changes
- Do not migrate the `components/cafe-list/` components — already TypeScript, covered in 3B
- Do not migrate the `components/ui/` Shadcn primitives — already TypeScript
