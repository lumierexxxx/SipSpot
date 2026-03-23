# Frontend 3B: Discovery + Detail TypeScript Migration — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate all discovery and cafe-detail files to strict TypeScript, fix ICafe field name mismatches from 3A, and replace raw fetch/localStorage with service layer + useAuth() in NearbyPage and CafeDetailPage.

**Architecture:** Five sequential tasks — type corrections first (they cascade to all consumers), then file-by-file migration in dependency order: AMap ambient declarations before Map.tsx, CafeDetail before CafeDetailPage, NearbyPage and CafeDetailPage last. Each task ends with a clean `npx tsc --noEmit` and a commit.

**Tech Stack:** React 19, TypeScript 5 strict, i18next, Axios (`@services/cafesAPI`, `@services/usersAPI`), TailwindCSS v4, AMap (高德地图)

---

## File Map

| File | Action | Task |
|---|---|---|
| `frontend/src/types/cafe.ts` | Modify — 4 changes | 1 |
| `frontend/src/components/CafeCard.tsx` | Modify — 2 fixes | 1 |
| `frontend/src/pages/CafeListPage.tsx` | Modify — 3 fixes | 1 |
| `frontend/src/components/CafeFilterPanel.tsx` | No code change — Vibe now exported | 1 |
| `frontend/src/components/cafe-list/CafeListHeader.tsx` | Modify — remove totalCount | 1 |
| `frontend/src/components/cafe-list/CafeListToolbar.tsx` | Modify — remove totalCount | 1 |
| `frontend/src/components/cafe-list/SortSelect.tsx` | Modify if tsc errors — i18n escape | 1 |
| `frontend/src/types/amap.d.ts` | Create | 2 |
| `frontend/src/components/Map.jsx` → `Map.tsx` | Rename + type | 2 |
| `frontend/src/components/CafeDetail.jsx` → `CafeDetail.tsx` | Rename + type | 3 |
| `frontend/src/pages/NearbyPage.jsx` → `NearbyPage.tsx` | Rename + full clean | 4 |
| `frontend/src/pages/CafeDetailPage.jsx` → `CafeDetailPage.tsx` | Rename + full clean | 5 |

All paths relative to the repo root. Work in a dedicated git worktree for this branch.

---

## Task 1: Type Corrections + Downstream Fixes

**Context:** `types/cafe.ts` has three wrong fields from 3A: `specialties: SpecialtyType[]` (should be `specialty: string`), `location: ILocation` (should be `geometry: ILocation`), and `isFavorited?: boolean` (not a DB field). These cascade to all `.tsx` consumers. Fix types first, then fix each consumer.

**Files:**
- Modify: `frontend/src/types/cafe.ts`
- Modify: `frontend/src/components/CafeCard.tsx:127,130`
- Modify: `frontend/src/pages/CafeListPage.tsx:157,185,210,214`
- Modify: `frontend/src/components/cafe-list/CafeListHeader.tsx:9,14`
- Modify: `frontend/src/components/cafe-list/CafeListToolbar.tsx:13,23`
- Modify (conditional): `frontend/src/components/cafe-list/SortSelect.tsx`

---

- [ ] **Step 1: Fix `types/cafe.ts` — four changes**

Open `frontend/src/types/cafe.ts`. Apply these four changes:

**Change 1** — rename `ILocation` interface to `IGeometry`:
```ts
// Before (line 34):
export interface ILocation {
  type: 'Point'
  coordinates: [number, number]  // [longitude, latitude]
}

// After:
export interface IGeometry {
  type: 'Point'
  coordinates: [number, number]  // [longitude, latitude]
}
```

**Change 2** — rename field and update type in `ICafe` (line 44):
```ts
// Before:
  location: ILocation

// After:
  geometry: IGeometry
```

**Change 3** — fix `specialties` → `specialty: string` in `ICafe` (line 49):
```ts
// Before:
  specialties: SpecialtyType[]

// After:
  specialty: string
```
Note: `SpecialtyType` enum remains in the file — it is used for i18n display key lookups. `ICafe.specialty` is `string` because the backend stores Chinese bilingual strings like `'意式浓缩 Espresso'`.

**Change 4** — remove `isFavorited` from `ICafe` (line 57):
```ts
// Remove this line entirely:
  isFavorited?: boolean   // computed client-side from auth user's favorites
```

**Add `Vibe` type** — append after `FilterState` interface (end of file):
```ts
export type Vibe =
  | 'Specialty' | 'Cozy Vibes' | 'Work-Friendly' | 'Outdoor'
  | 'Hidden Gems' | 'New Openings'
```

---

- [ ] **Step 2: Audit for remaining `cafe.location` usages**

```bash
grep -r "cafe\.location" frontend/src --include="*.tsx"
```

Expected: no matches (Map.jsx already uses `cafe.geometry`, CafeDetailPage.jsx will be migrated in Task 5). If any `.tsx` file has `cafe.location`, fix it to `cafe.geometry` before continuing.

---

- [ ] **Step 3: Fix `CafeCard.tsx` — two changes**

Open `frontend/src/components/CafeCard.tsx`.

**Change 1** — fix `isFavorited` initialization (line 127). The existing code is `useState(cafe.isFavorited ?? false)` — `cafe.isFavorited` no longer exists on `ICafe`. Replace using `user` (already destructured from `useAuth()` on line 126, but currently only `isLoggedIn` is destructured — add `user`):

```ts
// Before line 126-127:
    const { isLoggedIn } = useAuth();
    const [isFavorited, setIsFavorited] = useState(cafe.isFavorited ?? false);

// After:
    const { isLoggedIn, user } = useAuth();
    const [isFavorited, setIsFavorited] = useState(user?.favorites?.includes(cafe._id) ?? false);
```

**Change 2** — remove `?? cafe.id` fallback from `cafeId` (line 130). `id` is not in `ICafe`:
```ts
// Before:
    const cafeId = cafe._id ?? cafe.id ?? '';

// After:
    const cafeId = cafe._id ?? '';
```

---

- [ ] **Step 4: Fix `CafeListPage.tsx` — three changes**

Open `frontend/src/pages/CafeListPage.tsx`.

**Change 1 & 2** — remove `?? cafe.id` fallbacks in the `.map()` key props (lines ~210, 214):
```tsx
// Before (both occurrences):
{cafes.map(cafe => <CafeCard key={cafe._id ?? cafe.id} cafe={cafe} />)}

// After:
{cafes.map(cafe => <CafeCard key={cafe._id} cafe={cafe} />)}
```

**Change 3** — remove the two `totalCount={totalCount}` prop passes. Find and remove both occurrences:
```tsx
// Line ~157 — CafeListHeader:
// Before:
<CafeListHeader
    myOnly={myOnly}
    totalCount={totalCount}
    isLoggedIn={isLoggedIn}
    onAddCafe={handleAddCafe}
/>
// After: remove the totalCount={totalCount} line

// Line ~185 — CafeListToolbar:
// Before:
<CafeListToolbar
    resultCount={cafes.length}
    totalCount={totalCount}
    ...
/>
// After: remove the totalCount={totalCount} line
```

---

- [ ] **Step 5: Fix `CafeListHeader.tsx` — remove totalCount**

Open `frontend/src/components/cafe-list/CafeListHeader.tsx`.

Remove `totalCount: number` from Props interface and from destructuring in the function signature:
```ts
// Before:
interface Props {
    myOnly: boolean;
    totalCount: number;
    isLoggedIn: boolean;
    onAddCafe: () => void;
}
export default function CafeListHeader({ myOnly, totalCount, isLoggedIn, onAddCafe }: Props) {

// After:
interface Props {
    myOnly: boolean;
    isLoggedIn: boolean;
    onAddCafe: () => void;
}
export default function CafeListHeader({ myOnly, isLoggedIn, onAddCafe }: Props) {
```

---

- [ ] **Step 6: Fix `CafeListToolbar.tsx` — remove totalCount**

Open `frontend/src/components/cafe-list/CafeListToolbar.tsx`.

Remove `totalCount: number` from Props interface and from destructuring:
```ts
// Before:
interface Props {
    resultCount: number;
    totalCount: number;
    filters: FilterState;
    ...
}
export default function CafeListToolbar({
    resultCount, totalCount, filters, view,
    ...

// After:
interface Props {
    resultCount: number;
    filters: FilterState;
    ...
}
export default function CafeListToolbar({
    resultCount, filters, view,
    ...
```

---

- [ ] **Step 7: Run tsc and fix any remaining errors**

```bash
cd frontend && npx tsc --noEmit 2>&1 | head -60
```

Expected: zero errors in the files touched so far. If `SortSelect.tsx` reports an i18n dynamic key error on `t(opt.labelKey)`, add the escape hatch at the top of the function body:
```ts
const td = t as (key: string) => string
// then change: t(opt.labelKey) → td(opt.labelKey)
```

If `CafeFilterPanel.tsx` reports a `Vibe` import error — verify the `Vibe` type was exported in Step 1.

Fix any other errors reported before continuing.

---

- [ ] **Step 8: Run lint**

```bash
cd frontend && npm run lint 2>&1 | head -40
```

Expected: zero warnings/errors in modified files.

---

- [ ] **Step 9: Commit**

```bash
cd frontend && git add src/types/cafe.ts src/components/CafeCard.tsx src/pages/CafeListPage.tsx src/components/CafeFilterPanel.tsx src/components/cafe-list/CafeListHeader.tsx src/components/cafe-list/CafeListToolbar.tsx src/components/cafe-list/SortSelect.tsx
git commit -m "fix(types): correct ICafe field names and fix downstream tsc errors"
```

---

## Task 2: AMap Ambient Declarations + Map.tsx

**Context:** AMap has no official TypeScript definitions. We create a minimal `amap.d.ts` covering only the classes used in `Map.jsx`, then rename the file to `.tsx` and add prop/ref types.

**Files:**
- Create: `frontend/src/types/amap.d.ts`
- Rename + Modify: `frontend/src/components/Map.jsx` → `Map.tsx`

---

- [ ] **Step 1: Create `frontend/src/types/amap.d.ts`**

Create the file with this exact content:

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

---

- [ ] **Step 2: Rename Map.jsx → Map.tsx**

```bash
git mv frontend/src/components/Map.jsx frontend/src/components/Map.tsx
```

---

- [ ] **Step 3: Add TypeScript to Map.tsx**

Open `frontend/src/components/Map.tsx`. Apply these changes:

**Add import** at the top:
```ts
import type { ICafe } from '@/types/cafe'
```

**Replace the prop destructuring** (lines 13–20 in the original):
```ts
// Before:
export default function Map({
    cafes = [],
    center,
    zoom = 13,
    height = '600px',
    onMarkerClick,
    showUserLocation = false
}) {

// After:
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

**Type the refs** (lines 21–23 in the original):
```ts
// Before:
    const mapRef = useRef(null);
    const mapInstance = useRef(null);
    const markersRef = useRef([]);

// After:
    const mapRef = useRef<HTMLDivElement | null>(null)
    const mapInstance = useRef<AMap.Map | null>(null)
    const markersRef = useRef<AMap.Marker[]>([])
```

Note: `infoWindow` in Map.jsx is a local variable created inside `cafes.forEach` — not stored in a ref. No `infoWindowRef` needs to be typed.

**Add state types**:
```ts
    const [loading, setLoading] = useState<boolean>(true)
    const [error, setError] = useState<string | null>(null)
```

**Add XSS warning comment** above the infoWindowContent template string (around line 105):
```ts
// WARNING: XSS risk — InfoWindow uses innerHTML with cafe data.
// Do not add user-generated content here without sanitization. Fix in separate security task.
const infoWindowContent = `...`
```

**Fix `mapInstance.current` usage** — the original code uses `mapInstance` (a ref object) but calls `mapInstance.current.destroy()`. This is already correct; TypeScript just needs the ref typed (done above). No code logic changes.

**Note on `cafe.geometry`:** The existing `Map.jsx` already uses `cafe.geometry.coordinates[0]` and `cafe.geometry.coordinates[1]` for marker positions — no field name changes needed.

---

- [ ] **Step 4: Run tsc**

```bash
cd frontend && npx tsc --noEmit 2>&1 | grep -E "Map\.tsx|amap"
```

Expected: zero errors in Map.tsx.

---

- [ ] **Step 5: Run lint**

```bash
cd frontend && npm run lint -- --max-warnings=0 src/components/Map.tsx src/types/amap.d.ts
```

---

- [ ] **Step 6: Commit**

```bash
git add frontend/src/types/amap.d.ts frontend/src/components/Map.tsx
git commit -m "feat(types): add AMap ambient declarations and migrate Map.jsx to TypeScript"
```

---

## Task 3: CafeDetail.tsx

**Context:** `CafeDetail.jsx` (445 lines) is a pure display component. It receives a `cafe` prop and renders images, hours, amenities, and a map embed. Full migration: add prop interface, remove internal `isFavorited` state (parent owns it), fix `getTodayHours` day case, fix `cafe.location` → `cafe.geometry`, fix `hours.closed` → `hours.isClosed`.

**Files:**
- Rename + Modify: `frontend/src/components/CafeDetail.jsx` → `CafeDetail.tsx`

---

- [ ] **Step 1: Rename CafeDetail.jsx → CafeDetail.tsx**

```bash
git mv frontend/src/components/CafeDetail.jsx frontend/src/components/CafeDetail.tsx
```

---

- [ ] **Step 2: Add imports to CafeDetail.tsx**

At the top of the file, ensure these imports are present:
```ts
import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@contexts/AuthContext'
import type { ICafe, IOpeningHours, DayKey } from '@/types/cafe'
import type { IReview } from '@/types/review'
```

---

- [ ] **Step 3: Replace prop destructuring with typed interface**

Replace the existing prop destructuring (lines 16–21):
```ts
// Before:
const CafeDetail = ({
    cafe,
    onFavoriteToggle,
    onEdit,
    onDelete
}) => {

// After:
interface CafeDetailProps {
  cafe: ICafe
  isFavorited?: boolean
  onFavoriteToggle?: (cafeId: string, isFavorited: boolean) => void
  onEdit?: (cafe: ICafe) => void
  onDelete?: (cafeId: string) => void
}

export default function CafeDetail({ cafe, isFavorited = false, onFavoriteToggle, onEdit, onDelete }: CafeDetailProps) {
```

Note: change from `const CafeDetail = (...)` arrow function + `export default CafeDetail` at the bottom to a named `export default function` declaration. Remove the old `export default CafeDetail` line at the bottom of the file.

---

- [ ] **Step 4: Remove internal `isFavorited` state — use prop**

Line 24: `const [isFavorited, setIsFavorited] = useState(cafe.isFavorited || false);`

Remove this line. The `isFavorited` value now comes from the prop (defaulted to `false`). Keep only:
```ts
const [favoriteLoading, setFavoriteLoading] = useState<boolean>(false)
```

Search for any `setIsFavorited(...)` calls in the component body. These are local state updates that kept the button in sync — they are now handled by the parent. Remove all `setIsFavorited(...)` calls from event handlers inside CafeDetail.tsx (the parent will update its state and pass the new `isFavorited` prop value down).

---

- [ ] **Step 5: Add state type for image index**

Find: `const [currentImageIndex, setCurrentImageIndex] = useState(0);`
Replace: `const [currentImageIndex, setCurrentImageIndex] = useState<number>(0)`

---

- [ ] **Step 6: Fix `getTodayHours` day case**

Find the `getTodayHours` function (around line 135–145). It uses:
```js
const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const today = days[new Date().getDay()];
return openingHours?.find(h => h.day === today);
```

`IOpeningHours.day` uses `DayKey` (lowercase: `'sunday'`, `'monday'`, etc.). Change to lowercase:
```ts
function getTodayHours(openingHours: IOpeningHours[]): IOpeningHours | undefined {
  const days: DayKey[] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
  const today = days[new Date().getDay()]
  return openingHours?.find(h => h.day === today)
}
```

---

- [ ] **Step 7: Fix `hours.closed` → `hours.isClosed`**

Search for `.closed` in the file:
```bash
grep -n "\.closed" frontend/src/components/CafeDetail.tsx
```

Replace all `hours.closed` (or `h.closed`) with `hours.isClosed` (or `h.isClosed`) to match the `IOpeningHours` interface field name.

---

- [ ] **Step 8: Fix `cafe.location` → `cafe.geometry`**

```bash
grep -n "cafe\.location" frontend/src/components/CafeDetail.tsx
```

Replace any `cafe.location.coordinates` with `cafe.geometry.coordinates`.

---

- [ ] **Step 9: Type the helper functions**

```ts
function getAmenityIcon(amenity: string): React.ReactElement { ... }
```

Note: parameter type is `string` (not `AmenityKey`) because `cafe.amenities` contains Chinese strings from the backend.

```ts
function translateDay(day: DayKey): string {
  return t(`days.${day}`)
}
```

---

- [ ] **Step 10: Run tsc**

```bash
cd frontend && npx tsc --noEmit 2>&1 | grep "CafeDetail"
```

Expected: zero errors.

---

- [ ] **Step 11: Run lint**

```bash
cd frontend && npm run lint -- --max-warnings=0 src/components/CafeDetail.tsx
```

---

- [ ] **Step 12: Commit**

```bash
git add frontend/src/components/CafeDetail.tsx
git commit -m "feat(migration): CafeDetail.jsx → CafeDetail.tsx with prop interface and field fixes"
```

---

## Task 4: NearbyPage.tsx — Full Clean Migration

**Context:** `NearbyPage.jsx` (494 lines) uses raw `fetch()` with `localStorage.getItem('token')` and has many `console.log` debug statements. Replace the fetch call with `cafesAPI.getNearbyCafes()`, remove localStorage, remove debug logging, add TypeScript types to all state.

**Files:**
- Rename + Modify: `frontend/src/pages/NearbyPage.jsx` → `NearbyPage.tsx`

---

- [ ] **Step 1: Rename NearbyPage.jsx → NearbyPage.tsx**

```bash
git mv frontend/src/pages/NearbyPage.jsx frontend/src/pages/NearbyPage.tsx
```

---

- [ ] **Step 2: Update imports**

Replace the existing imports at the top:
```ts
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Map from '@components/Map'
import { getUserLocation, sortCafesByDistance, formatDistance } from '@utils/mapUtils'
import * as cafesAPI from '@services/cafesAPI'
import type { ICafe } from '@/types/cafe'
import type { SipSpotPosition } from '@hooks/useGeolocation'
```

Remove the two `console.log` lines at the top of the file (lines 6–7, the ENV debug logs).

---

- [ ] **Step 3: Define error interfaces and type all state**

After the imports, before `export default function NearbyPage()`, add:
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
```

Then inside the component, type all state:
```ts
const [cafes, setCafes] = useState<ICafe[]>([])
const [userLocation, setUserLocation] = useState<SipSpotPosition | null>(null)
const [loading, setLoading] = useState<boolean>(true)
const [error, setError] = useState<string | null>(null)
const [distance, setDistance] = useState<number>(5)
const [locationError, setLocationError] = useState<LocationError | null>(null)
const [apiError, setApiError] = useState<ApiError | null>(null)
```

---

- [ ] **Step 4: Replace `fetchNearbyCafes` with service layer**

The existing `fetchNearbyCafes` function (lines 55–134) makes a raw fetch call with many console.logs and manual error handling. Replace the entire function body with:

```ts
const fetchNearbyCafes = async (location: SipSpotPosition): Promise<void> => {
    try {
        const response = await cafesAPI.getNearbyCafes({
            lat: location.lat,
            lng: location.lng,
            distance: distance * 1000  // getNearbyCafes accepts meters; distance state is km
        })
        const data = response.data ?? []
        const sorted = sortCafesByDistance(data, location)
        setCafes(sorted)
    } catch (err) {
        const message = err instanceof Error ? err.message : '加载附近咖啡店失败'
        setApiError({ type: 'api_error', message })
    }
}
```

---

- [ ] **Step 5: Remove all `console.log` statements**

```bash
grep -n "console\." frontend/src/pages/NearbyPage.tsx
```

Remove every `console.log`, `console.error`, and `console.warn` line. These are development debugging artifacts. Keep real error state updates (`setLocationError`, `setApiError`, `setError`) — only remove `console.*` calls.

---

- [ ] **Step 6: Type event handlers**

```ts
const handleSearch = async (): Promise<void> => { ... }
const handleDistanceChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setDistance(Number(e.target.value))
}
```

---

- [ ] **Step 7: Type any remaining untyped variables**

Run tsc to find errors:
```bash
cd frontend && npx tsc --noEmit 2>&1 | grep "NearbyPage"
```

Common patterns to fix:
- `err` in catch blocks: `catch (err) { const msg = err instanceof Error ? err.message : String(err) }`
- JSX event handlers: `(e: React.MouseEvent)` or `(e: React.ChangeEvent<HTMLInputElement>)`

---

- [ ] **Step 8: Run tsc and lint**

```bash
cd frontend && npx tsc --noEmit 2>&1 | grep "NearbyPage"
cd frontend && npm run lint -- --max-warnings=0 src/pages/NearbyPage.tsx
```

Expected: zero errors.

---

- [ ] **Step 9: Commit**

```bash
git add frontend/src/pages/NearbyPage.tsx
git commit -m "feat(migration): NearbyPage.jsx → NearbyPage.tsx, replace fetch with cafesAPI.getNearbyCafes"
```

---

## Task 5: CafeDetailPage.tsx — Full Clean Migration

**Context:** `CafeDetailPage.jsx` (898 lines) has 5+ direct `fetch()` calls, all with `localStorage.getItem('token')`. The `isFavorited` state is currently stored inside `cafe` object itself (mutated via `setCafe(prev => ({...prev, isFavorited: ...}))`). Migration: extract `isFavorited` into its own state, replace all fetch calls with service layer, replace localStorage with useAuth().

**Files:**
- Rename + Modify: `frontend/src/pages/CafeDetailPage.jsx` → `CafeDetailPage.tsx`

---

- [ ] **Step 1: Rename CafeDetailPage.jsx → CafeDetailPage.tsx**

```bash
git mv frontend/src/pages/CafeDetailPage.jsx frontend/src/pages/CafeDetailPage.tsx
```

---

- [ ] **Step 2: Update imports**

Replace the existing imports at the top:
```ts
import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '@contexts/AuthContext'
import Map from '@components/Map'
import CafeDetail from '@components/CafeDetail'
import * as cafesAPI from '@services/cafesAPI'
import * as usersAPI from '@services/usersAPI'
import type { ICafe } from '@/types/cafe'
import type { IReview } from '@/types/review'
```

---

- [ ] **Step 3: Add `ReviewFormData` interface and type `calculateAverageRatings`**

After the imports, add the `ReviewFormData` interface (used to type `reviewData` in the submit handler):
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
```

Also add a type signature to `calculateAverageRatings` (existing function around line 112):
```ts
const calculateAverageRatings = (reviewsList: IReview[]): void => {
    // ... keep existing body unchanged
}
```

---

- [ ] **Step 4: Type all state**

Inside the component, replace untyped `useState` calls:
```ts
const { id } = useParams<{ id: string }>()
const navigate = useNavigate()
const { isLoggedIn, user } = useAuth()

const [cafe, setCafe] = useState<ICafe | null>(null)
const [reviews, setReviews] = useState<IReview[]>([])
const [averageRatings, setAverageRatings] = useState<Record<string, string> | null>(null)
const [loading, setLoading] = useState<boolean>(true)
const [reviewsLoading, setReviewsLoading] = useState<boolean>(false)
const [error, setError] = useState<string | null>(null)
const [isFavorited, setIsFavorited] = useState<boolean>(false)

const [currentPage, setCurrentPage] = useState<number>(1)
const [totalPages, setTotalPages] = useState<number>(1)
const [sortBy, setSortBy] = useState<string>('-createdAt')

const [showReviewForm, setShowReviewForm] = useState<boolean>(false)
const [activeTab, setActiveTab] = useState<string>('overview')
```

Note: no `reviewForm` controlled state — the existing form uses `FormData(e.target)` and we keep that pattern (no JSX changes required). The `ReviewFormData` interface is used to type `reviewData` in the submit handler (Step 9).

---

- [ ] **Step 5: Add `isFavorited` initialization useEffect**

Add this useEffect after the existing useEffects:
```ts
useEffect(() => {
  if (user && cafe) {
    setIsFavorited(user.favorites?.includes(cafe._id) ?? false)
  }
}, [user, cafe])
```

---

- [ ] **Step 6: Replace `loadCafeData` fetch with service layer**

The existing `loadCafeData` function (lines 46–75) uses `fetch()` with localStorage token. Replace the fetch call:
```ts
const loadCafeData = async (): Promise<void> => {
    try {
        setLoading(true)
        setError(null)
        const response = await cafesAPI.getCafeById(id!)
        const cafeData = response.data
        setCafe(cafeData)
    } catch (err) {
        const message = err instanceof Error ? err.message : '加载咖啡店失败'
        setError(message)
    } finally {
        setLoading(false)
    }
}
```

---

- [ ] **Step 7: Replace `loadReviews` fetch with service layer**

Find `loadReviews` function. Replace:
```ts
const loadReviews = async (): Promise<void> => {
    try {
        setReviewsLoading(true)
        const response = await cafesAPI.getReviews(id!, {
            page: currentPage,
            sort: sortBy,
        })
        const reviewsList: IReview[] = response.data ?? []
        setReviews(reviewsList)
        setTotalPages(response.pagination?.pages ?? 1)   // API uses .pages not .totalPages
        calculateAverageRatings(reviewsList)
    } catch (err) {
        console.error('Failed to load reviews:', err)
    } finally {
        setReviewsLoading(false)
    }
}
```

---

- [ ] **Step 8: Replace `handleFavoriteToggle` fetch with usersAPI**

The existing favorite toggle (around line 155–185) uses `fetch('/api/cafes/${id}/favorite')` and mutates `cafe.isFavorited`. Replace entirely:
```ts
const handleFavoriteToggle = async (): Promise<void> => {
    if (!isLoggedIn || !cafe) return
    try {
        const newState = await usersAPI.toggleFavorite(cafe._id, isFavorited)
        setIsFavorited(newState)
    } catch (err) {
        console.error('Failed to toggle favorite:', err)
    }
}
```

Important: use `usersAPI.toggleFavorite` (not `cafesAPI.toggleFavorite` — a deprecated duplicate exists in cafesAPI).

---

- [ ] **Step 9: Replace `handleReviewSubmit` fetch with service layer**

The existing code builds `reviewData` from `FormData(e.target)` — keep this pattern (no JSX changes). Just replace the fetch call with the service layer and add types:

```ts
const handleReviewSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault()
    if (!isLoggedIn) { navigate('/login'); return }
    if (!cafe) return

    const formData = new FormData(e.currentTarget)
    const reviewData: ReviewFormData = {
        content: formData.get('content') as string,
        rating: parseFloat(formData.get('rating') as string),
        ratings: {
            taste: parseFloat(formData.get('taste') as string),
            price: parseFloat(formData.get('price') as string),
            environment: parseFloat(formData.get('environment') as string),
            service: parseFloat(formData.get('service') as string),
            workspace: parseFloat(formData.get('workspace') as string),
        },
    }

    try {
        await cafesAPI.createReview(cafe._id, reviewData as Record<string, unknown>)
        await loadCafeData()
        await loadReviews()
        setShowReviewForm(false)
    } catch (err) {
        const message = err instanceof Error ? err.message : '提交评论失败'
        console.error('Submit review failed:', message)
    }
}
```

Note: `e.target` in the original becomes `e.currentTarget` for correct typing in TypeScript.

---

- [ ] **Step 10: Replace `handleHelpfulVote` and `handleReportReview` with service layer**

```ts
const handleHelpfulVote = async (reviewId: string, voteType: 'helpful' | 'not-helpful'): Promise<void> => {
    try {
        await cafesAPI.voteReviewHelpful(reviewId, voteType)
        await loadReviews()
    } catch (err) {
        console.error('Failed to vote:', err)
    }
}

const handleReportReview = async (reviewId: string): Promise<void> => {
    try {
        await cafesAPI.reportReview(reviewId, '不当内容')
    } catch (err) {
        console.error('Failed to report review:', err)
    }
}
```

---

- [ ] **Step 11: Fix `cafe.isFavorited` references in JSX**

The existing JSX (around lines 815–825) reads `cafe.isFavorited` directly. Since we removed `isFavorited` from `ICafe`, replace all `cafe.isFavorited` in the JSX with the `isFavorited` state variable.

Search for them:
```bash
grep -n "cafe\.isFavorited" frontend/src/pages/CafeDetailPage.tsx
```

Replace each `cafe.isFavorited` with `isFavorited`.

---

- [ ] **Step 12: Remove all `localStorage.getItem` calls**

```bash
grep -n "localStorage" frontend/src/pages/CafeDetailPage.tsx
```

All should be gone after Steps 6–10. If any remain, remove them — the Axios interceptor in `api.ts` injects auth tokens automatically.

---

- [ ] **Step 13: Run tsc**

```bash
cd frontend && npx tsc --noEmit 2>&1 | grep "CafeDetailPage"
```

Expected: zero errors. Common issues to fix:
- `id` from `useParams` is `string | undefined` — use `id!` (non-null assertion) or guard with `if (!id) return`
- `err` in catch blocks — use `err instanceof Error ? err.message : String(err)`
- Any remaining `cafe.isFavorited` references → `isFavorited`

---

- [ ] **Step 14: Run lint**

```bash
cd frontend && npm run lint -- --max-warnings=0 src/pages/CafeDetailPage.tsx
```

---

- [ ] **Step 15: Final full tsc + build verification**

```bash
cd frontend && npx tsc --noEmit
```

Expected: zero errors across all files.

```bash
cd frontend && npm run build 2>&1 | tail -20
```

Expected: clean build, no TypeScript errors.

---

- [ ] **Step 16: Commit**

```bash
git add frontend/src/pages/CafeDetailPage.tsx
git commit -m "feat(migration): CafeDetailPage.jsx → CafeDetailPage.tsx, replace fetch/localStorage with service layer"
```

---

## Post-Migration Verification Checklist

After all 5 tasks complete:

- [ ] `cd frontend && npx tsc --noEmit` — zero errors
- [ ] `cd frontend && npm run lint` — zero warnings
- [ ] `cd frontend && npm run build` — clean production build
- [ ] Map renders without console errors at `/cafes` page
- [ ] Nearby page loads and shows cafes without network errors
- [ ] Cafe detail page loads, favorites toggle works, reviews load
