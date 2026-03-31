# Frontend Sub-Spec 3E: Component Layer — Design

**Date:** 2026-03-31
**Status:** Draft
**Preceding spec:** `2026-03-31-frontend-3d-infra-auth-design.md`
**Scope:** Delete 4 stale `.jsx` duplicate files; migrate `LangSelect.jsx`, `AIAnalysis.jsx`, and `CafeList.jsx` → `.tsx`. No behavior changes — types and import cleanup only.

---

## Goals

1. Delete stale `.jsx` files whose `.tsx` replacements already exist
2. Migrate `LangSelect.jsx` → `LangSelect.tsx`
3. Migrate `AIAnalysis.jsx` → `AIAnalysis.tsx`
4. Migrate `CafeList.jsx` → `CafeList.tsx`
5. Add `confidence?: number` to `IReview.aiAnalysis` (component uses it but type omits it)

---

## Architecture

### Approach: type-only migration

All three `.jsx` files are migrated by adding TypeScript types to existing JSX — no logic changes. The 4 stale `.jsx` deletions are housekeeping: the `.tsx` replacements are already imported by consumers; the `.jsx` files are never imported anywhere.

### Migration order

```
Task 0: Delete 4 stale .jsx files
Task 1: IReview.aiAnalysis type correction (types/review.ts)
Task 2: LangSelect.jsx → LangSelect.tsx
Task 3: AIAnalysis.jsx → AIAnalysis.tsx
Task 4: CafeList.jsx → CafeList.tsx
```

Each task ends with `npx tsc --noEmit` and a commit.

---

## Tech Stack

React 19, TypeScript 5 (strict — `tsconfig.json` has `"strict": true`, `noUnusedLocals: true`, `noUnusedParameters: true`), TailwindCSS v4, React Router 7, i18next

---

## Section 0: Delete Stale `.jsx` Files

These files have existing `.tsx` replacements. Deleting them removes dead code and eliminates any risk of bundler ambiguity when resolving extensionless imports.

| File to delete | Replaced by |
|---|---|
| `frontend/src/components/CafeCard.jsx` | `frontend/src/components/CafeCard.tsx` |
| `frontend/src/components/Navbar.jsx` | `frontend/src/components/Navbar.tsx` |
| `frontend/src/pages/CafeListPage.jsx` | `frontend/src/pages/CafeListPage.tsx` |
| `frontend/src/pages/Home.jsx` | `frontend/src/pages/Home.tsx` |

No import changes needed — consumers already import extensionlessly (e.g. `import CafeCard from './CafeCard'`) and the bundler (`moduleResolution: "bundler"`) prefers `.tsx` over `.jsx` when both exist.

---

## Section 1: IReview Type Correction (`types/review.ts`)

`AIAnalysis.jsx` accesses `analysis.confidence` in both compact and full render modes, but `IReview.aiAnalysis` currently omits `confidence`. Under strict mode this is `TS2339: Property 'confidence' does not exist on type '...'`.

### Change to `frontend/src/types/review.ts`

Add `confidence?: number` to the `aiAnalysis` optional block:

```ts
aiAnalysis?: {
  sentiment?: 'positive' | 'negative' | 'neutral'
  keywords?: string[]
  summary?: string
  confidence?: number   // ← add this
}
```

No other fields removed or renamed.

---

## Section 2: LangSelect.tsx

**File:** `frontend/src/components/LangSelect.tsx` (rename from `.jsx`)

### Changes

`LangSelect.jsx` already uses named React imports (`useState`, `useRef`, `useEffect`) — no `import React` to remove. The only additions are TypeScript type annotations.

#### Ref type

```ts
const ref = useRef<HTMLDivElement>(null)
```

#### Handler types

```ts
const handleSelect = (lang: string): void => {
  i18n.changeLanguage(lang)
  localStorage.setItem('sipspot_lang', lang)
  setOpen(false)
}
```

`useEffect` cleanup — `onClickOutside` receives a native DOM event:

```ts
const onClickOutside = (e: MouseEvent): void => {
  if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
}
```

Note: `e.target` is `EventTarget | null` — cast to `Node` is required for `contains()` which expects `Node | null`. This is safe: `mousedown` always fires on a DOM node.

### Imports

No changes — `useState`, `useRef`, `useEffect` already imported as named imports. `useTranslation` and `ChevronDown` unchanged.

---

## Section 3: AIAnalysis.tsx

**File:** `frontend/src/components/AIAnalysis.tsx` (rename from `.jsx`)

### Changes

Remove `import React from 'react'` (React 19 JSX transform). No React hooks are used in this file — no named React imports needed.

Add local prop interfaces for each of the 6 components:

```ts
import type { IReview } from '@/types'

interface ReviewAIAnalysisProps {
  analysis: IReview['aiAnalysis']
  compact?: boolean
}

interface CafeSentimentStatsProps {
  stats: { positive: number; negative: number; neutral: number } | null
}

interface AIBadgeProps {
  sentiment: 'positive' | 'negative' | 'neutral'
  showLabel?: boolean
}

// AILoadingState — no props (no interface needed)

interface AIErrorStateProps {
  onRetry?: () => void
}

interface AIFeaturePromoProps {
  onAnalyze?: () => void
}
```

### Component signatures

```ts
export const ReviewAIAnalysis = ({ analysis, compact = false }: ReviewAIAnalysisProps) => { ... }
export const CafeSentimentStats = ({ stats }: CafeSentimentStatsProps) => { ... }
export const AIBadge = ({ sentiment, showLabel = true }: AIBadgeProps) => { ... }
export const AILoadingState = () => { ... }
export const AIErrorState = ({ onRetry }: AIErrorStateProps) => { ... }
export const AIFeaturePromo = ({ onAnalyze }: AIFeaturePromoProps) => { ... }
export default ReviewAIAnalysis
```

No explicit return type annotations needed — TypeScript infers `JSX.Element | null` from JSX returns.

### sentimentConfig narrowing

`analysis.sentiment` is `'positive' | 'negative' | 'neutral' | undefined` (from `IReview['aiAnalysis']`). Indexing a plain object literal with `undefined` is a strict-mode error (`TS7053`). Fix: use `sentiment ?? 'neutral'` as the key, typed with an explicit `Record`:

```ts
type SentimentKey = 'positive' | 'negative' | 'neutral'

const sentimentConfig: Record<SentimentKey, { icon: string; color: string; bg: string; label: string }> = {
  positive: { icon: '😊', color: 'text-green-600', bg: 'bg-green-50', label: '正面' },
  negative: { icon: '😞', color: 'text-red-600',   bg: 'bg-red-50',   label: '负面' },
  neutral:  { icon: '😐', color: 'text-gray-600',  bg: 'bg-gray-50',  label: '中性' },
}

const config = sentimentConfig[sentiment ?? 'neutral']
```

Apply the same `Record<SentimentKey, ...>` pattern in `AIBadge` for its `config` object and `config[sentiment]` access.

### Analysis guard

`ReviewAIAnalysis` begins with `if (!analysis) return null` before destructuring `analysis`. This guard must remain above the destructure — it narrows `analysis` from `T | undefined` to `T`, preventing `TS18048: 'analysis' is possibly 'undefined'` on the destructure line. Do not reorder.

### Imports

```ts
import type { IReview } from '@/types'
```

No other import changes.

---

## Section 4: CafeList.tsx

**File:** `frontend/src/components/CafeList.tsx` (rename from `.jsx`)

### Changes

Remove `import React` from `import React, { useState } from 'react'`. Replace with:

```ts
import { useState } from 'react'
```

### Props interface

`getDistance` returns a value passed directly as `distance` to `CafeCard`, which expects `distance?: number | null`. Therefore `getDistance` must return `number | null`:

```ts
interface CafeListProps {
  cafes?: ICafe[]
  loading?: boolean
  error?: { message?: string } | null
  onFavoriteToggle?: (id: string, state: boolean) => void
  showDistance?: boolean
  getDistance?: ((cafe: ICafe) => number | null) | null
  showViewToggle?: boolean
  onLoadMore?: (() => void) | null
  hasMore?: boolean
  emptyMessage?: string
}
```

Note: `onFavoriteToggle` signature matches `CafeCard`'s prop type `(id: string, state: boolean) => void` (from `CafeCard.tsx:108`).

### State type

```ts
const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
```

### `distance` variable

```ts
const distance = getDistance ? getDistance(cafe) : null
```

TypeScript infers `number | null` from `getDistance`'s return type — no annotation needed.

### `view` prop fix

`CafeCard.tsx` controls its layout via `view?: 'grid' | 'list'` (not `className`). The original `CafeList.jsx` passes `className={viewMode === 'list' ? 'flex' : ''}` which has no effect on `CafeCard`'s internal layout branch. Fix: pass `view={viewMode}` instead:

```ts
<CafeCard
  key={cafe._id || cafe.id}
  cafe={cafe}
  onFavoriteToggle={onFavoriteToggle}
  showDistance={showDistance}
  distance={distance}
  view={viewMode}
/>
```

Remove the `className` prop entirely — it was a no-op in `.jsx` and should not be carried forward.

### Imports

```ts
import { useState } from 'react'
import CafeCard from './CafeCard'
import type { ICafe } from '@/types'
```

---

## What This Spec Does NOT Cover

- `Navbar.tsx`, `CafeCard.tsx`, `CafeListPage.tsx`, `Home.tsx` internals — only their stale `.jsx` duplicates are deleted
- Remaining pages: `Profile.jsx`, `FavoritesPage.jsx`, `MyReviewsPage.jsx`, `CreateCafePage.jsx`, `EditCafePage.jsx`, `AISearchPage.jsx`, `SubmitSuccessPage.jsx`, `NotFound.jsx` (spec 3F)
- Fixing `detailedRatings` vs `ratings` mismatch in ReviewForm (deferred per 3C spec)

---

## Post-Migration Verification

After all 4 tasks:
1. `npx tsc --noEmit` — zero errors in 3E files
2. `npm run build` — clean production build
