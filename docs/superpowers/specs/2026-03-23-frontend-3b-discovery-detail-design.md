# Frontend Sub-Spec 3B: Discovery + Detail — Design

**Date:** 2026-03-23
**Status:** Approved
**Preceding spec:** `2026-03-20-frontend-3a-infrastructure-home-design.md`
**Scope:** TypeScript migration for all discovery and cafe detail files. Fixes type mismatches introduced in 3A, adds AMap ambient declarations, and performs full clean migration (service layer + auth pattern) for CafeDetailPage and NearbyPage.

---

## Goals

1. Fix field name mismatches in `types/cafe.ts` that were wrong in 3A (`specialties` → `specialty`, `location` → `geometry`)
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

**`specialty: string` (singular — backend stores bilingual strings like `'意式浓缩 Espresso'`):**
```ts
// Before (wrong — 3A introduced this):
specialties: SpecialtyType[]

// After:
specialty: string
```
Note: `SpecialtyType` enum (English keys) remains in the file for i18n display logic. `ICafe.specialty` is typed as `string` because the backend Mongoose schema stores Chinese bilingual strings (`'意式浓缩 Espresso'`, `'手冲咖啡 Pour Over'`) that don't match the `SpecialtyType` enum values.

**`geometry` (matches backend GeoJSON field name):**
```ts
// Before (wrong — 3A introduced this):
location: ILocation

// After:
geometry: ILocation
```
Rename the interface accordingly: `ILocation` → `IGeometry` for clarity.

**Remove `isFavorited?: boolean` from `ICafe`:** This is not a real DB field. Components compute it via `useAuth().user?.favorites.includes(cafe._id)`.

**Add `Vibe` type** (used by `CafeFilterPanel` VIBE_OPTIONS, must match existing string values exactly):
```ts
export type Vibe =
  | 'Specialty' | 'Cozy Vibes' | 'Work-Friendly' | 'Outdoor'
  | 'Hidden Gems' | 'New Openings'
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
- `cafe.id` → `cafe._id` (line ~130)
- Fix `isFavorited` initialization (line 127): replace `cafe.isFavorited ?? false` with `user?.favorites?.includes(cafe._id) ?? false` — `user` is already available from `useAuth()` on line 126. Use `cafe._id` directly (not `cafeId` — that const is defined after line 127 and not yet available).

**Task 1 audit step:** Before committing Task 1, run `grep -r "cafe\.location" frontend/src --include="*.tsx"` and fix any remaining usages not listed here. The rename `location` → `geometry` in `ICafe` will break any `.tsx` file that references `cafe.location`.

**`CafeListPage.tsx`:**
- `cafe.id` → `cafe._id` (lines ~210, 214)

**`CafeFilterPanel.tsx`:**
- `Vibe` is now exported from `types/cafe.ts` ✓ — no change to `AMENITY_OPTIONS` or `VIBE_OPTIONS` values (they use Chinese strings and must stay that way to match backend data)
- The `import type { FilterState, Vibe }` import will resolve once `Vibe` is exported

**`cafe-list/SortSelect.tsx`:**
- Add i18n dynamic key escape hatch if tsc reports error: `const td = t as (key: string) => string`

**`cafe-list/CafeListHeader.tsx` + `CafeListToolbar.tsx`:**
- Remove unused `totalCount` prop from interface and destructuring
- Also remove the `totalCount={totalCount}` prop pass in `CafeListPage.tsx` (line ~157)

---

## Section 2: AMap Ambient Types + Map.tsx

### `frontend/src/types/amap.d.ts` (new file)

Minimal ambient declarations for the AMap classes `Map.tsx` actually uses. No attempt to type the full AMap API.

```ts
declare namespace AMap {
  class Map {
    constructor(container: string | HTMLElement, options?: MapOptions)
    destroy(): void
    setCenter(position: [number, number]): void
    setZoom(zoom: number): void
    add(overlay: Marker | InfoWindow | ControlBar): void
    remove(overlay: Marker | InfoWindow): void
    addControl(control: Scale | ToolBar | Geolocation | ControlBar): void
    setFitView(): void
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
    viewMode?: string
    showLabel?: boolean
    features?: string[]
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
    cursor?: string
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
  class Scale { constructor(options?: Record<string, unknown>) }
  class ToolBar { constructor(options?: { position?: { top?: string; right?: string; bottom?: string; left?: string } }) }
  class Geolocation {
    constructor(options?: GeolocationOptions)
    getCurrentPosition(callback?: (status: string, result: unknown) => void): void
  }
  interface GeolocationOptions {
    enableHighAccuracy?: boolean
    timeout?: number
    buttonPosition?: string
    buttonOffset?: Pixel
    zoomToAccuracy?: boolean
  }
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
  export default function load(config: LoadConfig): Promise<typeof AMap>
}
```

### `Map.jsx` → `Map.tsx`

**Prop interface:**
```ts
interface MapProps {
  cafes?: ICafe[]
  center?: [number, number]
  zoom?: number
  height?: string
  onMarkerClick?: (cafe: ICafe) => void
  showUserLocation?: boolean
  selectedCafe?: ICafe | null
}
export default function Map({
  cafes = [],
  center,
  zoom = 13,
  height = '600px',
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

**`geometry` fix:** Map component uses `cafe.geometry.coordinates` for marker coordinates — this is already correct in the existing `.jsx` file (the field was never `location` in Map.jsx). Keep as-is.

**Note on innerHTML:** The existing string template for InfoWindow content is pre-existing. Add a comment noting the XSS risk but do NOT refactor the innerHTML logic — that is outside 3B scope.

---

## Section 3: CafeDetail.tsx

`CafeDetail.jsx` (445 lines) is a display-only component — receives a `cafe` prop and renders the full detail view: images, hours, amenities, map embed.

### Prop interface

```ts
interface CafeDetailProps {
  cafe: ICafe
  isFavorited?: boolean
  onFavoriteToggle?: (cafeId: string, isFavorited: boolean) => void
  onEdit?: (cafe: ICafe) => void
  onDelete?: (cafeId: string) => void
}
export default function CafeDetail({ cafe, isFavorited = false, onFavoriteToggle, onEdit, onDelete }: CafeDetailProps) {
```

### Internal state

The existing component has `const [isFavorited, setIsFavorited] = useState(cafe.isFavorited || false)` (line 24). Replace with the `isFavorited` prop — the parent (`CafeDetailPage`) owns favorite state. Remove internal isFavorited state and use the prop directly throughout. If a local loading state is needed for the toggle button, keep only `const [favoriteLoading, setFavoriteLoading] = useState(false)`.

### Helper function types

```ts
function getAmenityIcon(amenity: string): React.ReactElement { ... }
function translateDay(day: DayKey): string {
  return t(`days.${day}`)  // uses i18n days namespace
}
```

Note: `getAmenityIcon` takes `string` (not `AmenityKey`) since `cafe.amenities[]` contains Chinese backend strings that don't match `AmenityKey` enum values.

### Field corrections

- `cafe.location` → `cafe.geometry` for map coordinate access
- `cafe.specialty` (singular string) — no icon lookup, display as-is
- `getTodayHours`: change `const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']` to lowercase `['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']` to match `DayKey` values used in `IOpeningHours.day`

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
interface LocationError {
  title: string
  message: string
  type: string
}

interface ApiError {
  type: string
  message: string
  details?: string
}

const [cafes, setCafes] = useState<ICafe[]>([])
const [loading, setLoading] = useState<boolean>(false)
const [error, setError] = useState<string | null>(null)
const [locationError, setLocationError] = useState<LocationError | null>(null)
const [apiError, setApiError] = useState<ApiError | null>(null)
const [userPosition, setUserPosition] = useState<SipSpotPosition | null>(null)
```

(`SipSpotPosition` is exported from `hooks/useGeolocation.ts` — already typed in 3A)

### Service layer replacement

Replace `fetchNearbyCafes` direct fetch with service layer:

```ts
// Old:
fetch(`${apiUrl}/cafes/nearby?lng=${location.lng}&lat=${location.lat}&distance=${distance * 1000}`, {
  headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
})

// New:
import * as cafesAPI from '@services/cafesAPI'
await cafesAPI.getNearbyCafes({ lat: location.lat, lng: location.lng, distance: distance * 1000 })
```

Note: `getNearbyCafes` accepts `distance` in **meters** — pass `distance * 1000` (the `distance` state is in km).

Remove all `localStorage.getItem('token')` calls — the Axios instance in `api.ts` already injects auth tokens via interceptor.

### Debug logging removal

Remove the `console.log` statements in lines ~6–7, ~30–62. These are development artifacts, not meaningful error handling.

### Event handlers

```ts
const handleSearch = async (): Promise<void> => { ... }
const handleDistanceChange = (e: React.ChangeEvent<HTMLInputElement>): void => { ... }
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

`isFavorited` state is initialized via `useEffect` after `cafe` and `user` load:
```ts
useEffect(() => {
  if (user && cafe) {
    setIsFavorited(user.favorites?.includes(cafe._id) ?? false)
  }
}, [user, cafe])
```

### Service layer replacement

All direct `fetch()` calls replaced with typed service calls:

| Old (direct fetch) | New (service layer) |
|---|---|
| `fetch('/api/cafes/${id}')` with manual auth header | `cafesAPI.getCafeById(id)` |
| `fetch('/api/cafes/${id}/reviews')` | `cafesAPI.getCafeReviews(id)` |
| `fetch('/api/cafes/${id}/reviews', { method: 'POST' })` | `cafesAPI.createReview(id, reviewForm as Record<string, unknown>)` |
| `fetch('/api/users/me/favorites/${id}')` (toggle) | `usersAPI.toggleFavorite(id, isFavorited)` |
| `fetch('/api/reviews/${reviewId}/helpful', ...)` | `cafesAPI.voteReviewHelpful(reviewId, voteType)` |
| `fetch('/api/reviews/${reviewId}/report', ...)` | `cafesAPI.reportReview(reviewId, reason)` |

Use `usersAPI.toggleFavorite` (not `cafesAPI.toggleFavorite` — a deprecated duplicate exists in cafesAPI). `usersAPI.toggleFavorite(cafeId, isFavorited)` returns `Promise<boolean>` (the new favorite state).

### Auth pattern

Remove `localStorage.getItem('token')` — the Axios interceptor handles token injection. Use `useAuth()` for user state:

```ts
const { user, isLoggedIn } = useAuth()
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

Pass to `createReview` as `reviewForm as Record<string, unknown>` (the service function accepts `Record<string, unknown>`).

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
- Fixing amenity enum mismatch between backend Chinese strings and `AmenityKey` TypeScript enum (separate refactor)
- Adding new features or changing rendering logic
- Backend changes

---

## Post-Migration Verification

After all 5 tasks:
1. `npx tsc --noEmit` — zero errors in 3B files
2. `npm run lint` — zero warnings
3. `npm run build` — clean production build
