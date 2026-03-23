# Frontend Sub-Spec 3B: Discovery + Detail — Design

**Date:** 2026-03-23
**Status:** Approved
**Preceding spec:** `2026-03-20-frontend-3a-infrastructure-home-design.md`
**Scope:** TypeScript migration for all discovery and cafe detail files. Fixes type mismatches introduced in 3A, adds AMap ambient declarations, and performs full clean migration (service layer + auth pattern) for CafeDetailPage and NearbyPage.

---

## Goals

1. Fix two field name mismatches in `types/cafe.ts` that were wrong in 3A (`specialties` → `specialty`, `location` → `geometry`)
2. Fix all downstream tsc errors left over from 3A (CafeCard, CafeListPage, CafeFilterPanel, cafe-list components)
3. Migrate remaining `.jsx` discovery/detail files to TypeScript: `Map.jsx`, `CafeDetail.jsx`, `NearbyPage.jsx`, `CafeDetailPage.jsx`
4. Full clean migration for `NearbyPage` and `CafeDetailPage`: replace direct `fetch()` with service layer calls, replace `localStorage.getItem('token')` with `useAuth()` hook

---

## Architecture

### Type correction first

Type corrections in `types/cafe.ts` cascade to all consumers. Task 1 fixes the types and all existing `.tsx` files that reference the wrong field names. This unblocks all subsequent tasks.

### Migration order

```
Task 1: Type corrections + downstream fixes (cafe.ts, CafeCard, CafeListPage, CafeFilterPanel, cafe-list/)
Task 2: AMap ambient types (types/amap.d.ts) + Map.jsx → Map.tsx
Task 3: CafeDetail.jsx → CafeDetail.tsx
Task 4: NearbyPage.jsx → NearbyPage.tsx (full clean)
Task 5: CafeDetailPage.jsx → CafeDetailPage.tsx (full clean)
```

Each task ends with `npx tsc --noEmit` and a commit. No new behavior is introduced — types and service-layer wiring only.

---

## Tech Stack

React 19, TypeScript 5 (strict), i18next, Axios, TailwindCSS v4, AMap (高德地图)

---

## Section 1: Type Corrections (`types/cafe.ts` + downstream)

### Changes to `frontend/src/types/cafe.ts`

**`specialty` (singular string — matches backend Mongoose schema):**
```ts
// Before (wrong — 3A introduced this):
specialties: SpecialtyType[]

// After:
specialty: SpecialtyType
```

**`geometry` (matches backend GeoJSON field name):**
```ts
// Before (wrong — 3A introduced this):
location: ILocation

// After:
geometry: ILocation
```
Rename the interface accordingly: `ILocation` → `IGeometry` for clarity.

**Remove `isFavorited?: boolean` from `ICafe`:** This is not a real DB field. Components compute it via `useAuth().user?.favorites.includes(cafe._id)`.

**Add `Vibe` type** (used by `CafeFilterPanel`):
```ts
export type Vibe =
  | 'work_friendly' | 'outdoor_seating' | 'quiet' | 'pet_friendly'
  | 'specialty' | 'power_outlet' | 'group_friendly' | 'new'
```

**Updated `IOpeningHours`** — uses `DayKey` (already correct in 3A):
```ts
export interface IOpeningHours {
  day: DayKey
  open: string
  close: string
  isClosed: boolean
}
```

### Downstream fixes (existing `.tsx` files — no renames)

**`CafeCard.tsx`:**
- `cafe.id` → `cafe._id` (lines ~130)
- `cafe.specialty` already correct (singular) — no change needed
- i18n dynamic key: existing `t as (k: string) => string` escape hatch from 3A is fine — leave as-is

**`CafeListPage.tsx`:**
- `cafe.id` → `cafe._id` (lines ~210, 214)

**`CafeFilterPanel.tsx`:**
- Fix `import { Vibe } from '../types/cafe'` — `Vibe` now exported ✓
- Replace `AMENITY_OPTIONS` Chinese string values with `AmenityKey` English short keys:
  ```ts
  // Before: { label: '...', value: 'WiFi' }
  // After:  { label: t('amenities.wifi'), value: 'wifi' as AmenityKey }
  ```

**`cafe-list/SortSelect.tsx`:**
- Fix i18n dynamic key error: `const td = t as (k: string) => string`

**`cafe-list/CafeListHeader.tsx` + `CafeListToolbar.tsx`:**
- Remove unused `totalCount` prop from interface and destructuring

---

## Section 2: AMap Ambient Types + Map.tsx

### `frontend/src/types/amap.d.ts` (new file)

Minimal ambient declarations for the ~5 AMap classes `Map.tsx` actually uses. No attempt to type the full AMap API.

```ts
declare namespace AMap {
  class Map {
    constructor(container: string | HTMLElement, options?: MapOptions)
    destroy(): void
    setCenter(position: [number, number]): void
    setZoom(zoom: number): void
    add(overlay: Marker | InfoWindow | ControlBar): void
    remove(overlay: Marker | InfoWindow): void
    on(event: string, handler: (...args: unknown[]) => void): void
    off(event: string, handler: (...args: unknown[]) => void): void
  }
  interface MapOptions {
    zoom?: number
    center?: [number, number]
    mapStyle?: string
    resizeEnable?: boolean
    rotateEnable?: boolean
    pitchEnable?: boolean
  }
  class Marker {
    constructor(options?: MarkerOptions)
    setMap(map: Map | null): void
    on(event: string, handler: () => void): void
    getPosition(): { lng: number; lat: number } | null
    getExtData(): unknown
  }
  interface MarkerOptions {
    position?: [number, number]
    title?: string
    content?: string | HTMLElement
    icon?: string | Icon
    offset?: Pixel
    extData?: unknown
    animation?: string
  }
  class InfoWindow {
    constructor(options?: InfoWindowOptions)
    open(map: Map, position: [number, number]): void
    close(): void
  }
  interface InfoWindowOptions {
    content?: string | HTMLElement
    offset?: Pixel
    closeWhenClickMap?: boolean
    isCustom?: boolean
  }
  class Icon { constructor(options?: { size?: Size; image?: string; imageOffset?: Pixel; imageSize?: Size }) }
  class Size { constructor(width: number, height: number) }
  class Pixel { constructor(x: number, y: number) }
  class ControlBar { constructor(options?: { position?: { right?: string; top?: string } }) }
}

interface Window {
  AMap: typeof AMap
}

declare module '@amap/amap-jsapi-loader' {
  interface LoadConfig {
    key: string
    version?: string
    plugins?: string[]
    securityJsCode?: string
  }
  function load(config: LoadConfig): Promise<typeof AMap>
  export default { load }
}
```

### `Map.jsx` → `Map.tsx`

**Prop interface:**
```ts
interface MapProps {
  cafes?: ICafe[]
  center?: [number, number]
  zoom?: number
  onMarkerClick?: (cafe: ICafe) => void
  showUserLocation?: boolean
  selectedCafe?: ICafe | null
}
export default function Map({
  cafes = [],
  center,
  zoom = 13,
  onMarkerClick,
  showUserLocation = false,
  selectedCafe = null,
}: MapProps) {
```

**Ref typing:**
```ts
const mapRef = useRef<AMap.Map | null>(null)
const markersRef = useRef<AMap.Marker[]>([])
const infoWindowRef = useRef<AMap.InfoWindow | null>(null)
```

**`geometry` fix:** Map component likely accesses `cafe.location` or `cafe.geometry` for coordinates. Update to `cafe.geometry.coordinates`.

**Note on innerHTML:** The existing string template for InfoWindow content (lines ~105–148) is pre-existing. Add a comment noting the XSS risk but do NOT refactor the innerHTML logic — that is outside 3B scope.

---

## Section 3: CafeDetail.tsx

`CafeDetail.jsx` (445 lines) is a display-only component — receives a `cafe` prop and renders the full detail view: images, hours, amenities, map embed.

### Prop interface

```ts
interface CafeDetailProps {
  cafe: ICafe
  isFavorited?: boolean
  onFavoriteToggle?: (cafeId: string, isFavorited: boolean) => void
}
export default function CafeDetail({ cafe, isFavorited = false, onFavoriteToggle }: CafeDetailProps) {
```

### Helper function types

```ts
function getAmenityIcon(amenity: AmenityKey): React.ReactElement { ... }
function translateDay(day: DayKey): string {
  return t(`days.${day}`)  // uses i18n days namespace
}
```

### Field corrections

- `cafe.location` → `cafe.geometry` for map coordinate access
- `cafe.specialty` (singular) already correct
- Amenity comparisons updated to use `AmenityKey` English short keys (e.g. `amenity === 'wifi'` not `'WiFi'`)
- Day comparisons use `DayKey` English names (e.g. `'monday'` not `'周一'`)

### State

```ts
const [currentImageIndex, setCurrentImageIndex] = useState<number>(0)
```

Images are `Array<CafeImage | string>` — access pattern: `typeof img === 'string' ? img : img.url ?? img.cardImage ?? ''`

---

## Section 4: NearbyPage.tsx — Full Clean Migration

`NearbyPage.jsx` (494 lines) — geolocation-based discovery.

### State types

```ts
const [cafes, setCafes] = useState<ICafe[]>([])
const [loading, setLoading] = useState<boolean>(false)
const [error, setError] = useState<string | null>(null)
const [userPosition, setUserPosition] = useState<SipSpotPosition | null>(null)
```

(`SipSpotPosition` is exported from `hooks/useGeolocation.ts` — already typed in 3A)

### Service layer replacement

Replace all `fetch()` calls:

| Old (direct fetch) | New (service layer) |
|---|---|
| `fetch('/api/cafes/nearby?lat=...')` with manual auth header | `cafesAPI.getNearbyCafes({ lat, lng, radius })` |

Remove all `localStorage.getItem('token')` calls — the Axios instance in `api.ts` already injects auth tokens via interceptor.

Use `useGeolocation()` hook (already typed in 3A) instead of raw `navigator.geolocation` calls where applicable.

### Debug logging removal

Remove the extensive `console.log` statements in lines ~6–7, ~30–62. These are development artifacts, not meaningful error handling.

### Event handlers

```ts
const handleSearch = async (): Promise<void> => { ... }
const handleRadiusChange = (e: React.ChangeEvent<HTMLInputElement>): void => { ... }
```

---

## Section 5: CafeDetailPage.tsx — Full Clean Migration

`CafeDetailPage.jsx` (898 lines) — single cafe view with reviews, images, map, favorites.

### State types

```ts
const [cafe, setCafe] = useState<ICafe | null>(null)
const [reviews, setReviews] = useState<IReview[]>([])
const [loading, setLoading] = useState<boolean>(true)
const [reviewsLoading, setReviewsLoading] = useState<boolean>(false)
const [error, setError] = useState<string | null>(null)
const [isFavorited, setIsFavorited] = useState<boolean>(false)
```

### Service layer replacement

All direct `fetch()` calls replaced with typed service calls:

| Old (direct fetch) | New (service layer) |
|---|---|
| `fetch('/api/cafes/${id}')` with manual auth header | `cafesAPI.getCafeById(id)` |
| `fetch('/api/cafes/${id}/reviews')` | `cafesAPI.getCafeReviews(id)` |
| `fetch('/api/cafes/${id}/reviews', { method: 'POST' })` | `cafesAPI.createReview(id, reviewData)` |
| `fetch('/api/users/me/favorites/${id}')` (toggle) | `usersAPI.toggleFavorite(id, isFavorited)` |
| `fetch('/api/reviews/${reviewId}/helpful', ...)` | `cafesAPI.voteReviewHelpful(reviewId, voteType)` |
| `fetch('/api/reviews/${reviewId}/report', ...)` | `cafesAPI.reportReview(reviewId, reason)` |

### Auth pattern

Remove `localStorage.getItem('token')` — the Axios interceptor handles token injection. Use `useAuth()` for user state:

```ts
const { user, isLoggedIn } = useAuth()
// isFavorited computed from:
const isFav = user?.favorites.includes(cafe?._id ?? '') ?? false
```

### Review form data type

```ts
interface ReviewFormData {
  content: string
  rating: number
  ratings: {
    taste?: number
    price?: number
    environment?: number
    service?: number
    workspace?: number
  }
  visitDate?: string
}
const [reviewForm, setReviewForm] = useState<ReviewFormData>({
  content: '',
  rating: 5,
  ratings: {},
})
```

### Event handlers

```ts
const handleFavoriteToggle = async (): Promise<void> => { ... }
const handleReviewSubmit = async (e: React.FormEvent): Promise<void> => { ... }
const handleHelpfulVote = async (reviewId: string, voteType: 'helpful' | 'not-helpful'): Promise<void> => { ... }
const handleReportReview = async (reviewId: string): Promise<void> => { ... }
```

---

## What This Spec Does NOT Cover

- ReviewForm component (3C scope)
- ReviewList component (3C scope)
- Fixing `innerHTML` XSS in Map.tsx (separate security task)
- Adding new features or changing rendering logic
- Backend changes

---

## Post-Migration Verification

After all 5 tasks:
1. `npx tsc --noEmit` — zero errors in 3B files
2. `npm run lint` — zero warnings
3. `npm run build` — clean production build
