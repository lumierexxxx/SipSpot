# Frontend 3E: Component Layer TypeScript Migration — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Delete 4 stale `.jsx` duplicate files, add `confidence` to `IReview.aiAnalysis`, and migrate `LangSelect.jsx`, `AIAnalysis.jsx`, `CafeList.jsx` → `.tsx` with strict TypeScript types.

**Architecture:** Type-only migration — no behavior changes. Each file gets TypeScript annotations added to the existing JSX. One behavioral fix is included: `CafeList` now passes `view={viewMode}` to `CafeCard` instead of the broken `className` approach.

**Tech Stack:** React 19, TypeScript 5 strict mode, TailwindCSS v4, i18next, lucide-react

---

### Task 0: Delete stale `.jsx` duplicates

**Files:**
- Delete: `frontend/src/components/CafeCard.jsx`
- Delete: `frontend/src/components/Navbar.jsx`
- Delete: `frontend/src/pages/CafeListPage.jsx`
- Delete: `frontend/src/pages/Home.jsx`

- [ ] **Step 1: Delete the 4 files**

```bash
rm frontend/src/components/CafeCard.jsx
rm frontend/src/components/Navbar.jsx
rm frontend/src/pages/CafeListPage.jsx
rm frontend/src/pages/Home.jsx
```

- [ ] **Step 2: Verify tsc still passes**

```bash
cd frontend && npx tsc --noEmit
```

Expected: zero errors (`.tsx` replacements were already the resolved imports).

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "chore: delete stale .jsx duplicates (replaced by .tsx)"
```

---

### Task 1: `IReview.aiAnalysis` — add `confidence` field

**Files:**
- Modify: `frontend/src/types/review.ts`

- [ ] **Step 1: Add `confidence?: number` to the `aiAnalysis` block**

In `frontend/src/types/review.ts`, find the `aiAnalysis` field and update it:

```ts
aiAnalysis?: {
  sentiment?: 'positive' | 'negative' | 'neutral'
  keywords?: string[]
  summary?: string
  confidence?: number
}
```

- [ ] **Step 2: Run tsc**

```bash
cd frontend && npx tsc --noEmit
```

Expected: zero errors.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/types/review.ts
git commit -m "feat(types): add confidence field to IReview.aiAnalysis"
```

---

### Task 2: `LangSelect.jsx` → `LangSelect.tsx`

**Files:**
- Create: `frontend/src/components/LangSelect.tsx`
- Delete: `frontend/src/components/LangSelect.jsx`

- [ ] **Step 1: Create `LangSelect.tsx`**

Copy the full content of `frontend/src/components/LangSelect.jsx` to `frontend/src/components/LangSelect.tsx`, then apply these changes:

**Ref type** — change:
```ts
// Before:
const ref = useRef(null)
// After:
const ref = useRef<HTMLDivElement>(null)
```

**handleSelect type** — change:
```ts
// Before:
const handleSelect = (lang) => {
// After:
const handleSelect = (lang: string): void => {
```

**onClickOutside type** — `onClickOutside` is defined *inside* the `useEffect` callback body (it is a closure, not a standalone function). Change it in place without moving it:
```ts
// Before (inside useEffect):
const onClickOutside = (e) => {
    if (ref.current && !ref.current.contains(e.target)) setOpen(false)
// After (inside useEffect — do not hoist out):
const onClickOutside = (e: MouseEvent): void => {
    if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
```

Note: `e.target` is `EventTarget | null`; `contains()` expects `Node | null` — the `as Node` cast is safe because `mousedown` always fires on a DOM node.

Note: `LangSelect.jsx` contains `style={{ fontSize: '0.8rem' }}` on its root `<div>`. This is a pre-existing inline style — keep it as-is in `.tsx`. Replacing it with a Tailwind class is out of scope for this type-only migration.

No other changes. Imports unchanged (already use named `useState`, `useRef`, `useEffect` — no `import React` present).

- [ ] **Step 2: Delete the `.jsx` source**

```bash
rm frontend/src/components/LangSelect.jsx
```

- [ ] **Step 3: Run tsc**

```bash
cd frontend && npx tsc --noEmit
```

Expected: zero errors.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/LangSelect.tsx
git rm --cached frontend/src/components/LangSelect.jsx 2>/dev/null || true
git commit -m "feat(ts): migrate LangSelect.jsx → LangSelect.tsx"
```

Note: the `.jsx` file was already deleted from disk in Step 2; `git rm --cached` stages that deletion for the commit.

---

### Task 3: `AIAnalysis.jsx` → `AIAnalysis.tsx`

**Files:**
- Create: `frontend/src/components/AIAnalysis.tsx`
- Delete: `frontend/src/components/AIAnalysis.jsx`

- [ ] **Step 1: Create `AIAnalysis.tsx`**

Copy the full content of `frontend/src/components/AIAnalysis.jsx` to `frontend/src/components/AIAnalysis.tsx`, then apply these changes:

**Remove React default import:**
```ts
// Remove this line entirely:
import React from 'react'
```

**Add type import at the top:**
```ts
import type { IReview } from '@/types'
```

**Add `SentimentKey` type and fix `sentimentConfig` typing in `ReviewAIAnalysis`:**

After the import block, before the component:
```ts
type SentimentKey = 'positive' | 'negative' | 'neutral'
```

Inside `ReviewAIAnalysis`, change the `sentimentConfig` declaration:
```ts
// Before:
const sentimentConfig = {
    positive: { ... },
    negative: { ... },
    neutral: { ... }
}
const config = sentimentConfig[sentiment] || sentimentConfig.neutral

// After:
const sentimentConfig: Record<SentimentKey, { icon: string; color: string; bg: string; label: string }> = {
    positive: { icon: '😊', color: 'text-green-600', bg: 'bg-green-50', label: '正面' },
    negative: { icon: '😞', color: 'text-red-600',   bg: 'bg-red-50',   label: '负面' },
    neutral:  { icon: '😐', color: 'text-gray-600',  bg: 'bg-gray-50',  label: '中性' },
}
const config = sentimentConfig[sentiment ?? 'neutral']
```

**Add prop interfaces** (place before each component):
```ts
interface ReviewAIAnalysisProps {
    analysis: IReview['aiAnalysis']
    compact?: boolean
}

interface CafeSentimentStatsProps {
    stats: { positive: number; negative: number; neutral: number } | null
}

interface AIBadgeProps {
    sentiment: SentimentKey
    showLabel?: boolean
}

// AILoadingState — no props

interface AIErrorStateProps {
    onRetry?: () => void
}

interface AIFeaturePromoProps {
    onAnalyze?: () => void
}
```

**Apply prop interfaces to component signatures:**
```ts
export const ReviewAIAnalysis = ({ analysis, compact = false }: ReviewAIAnalysisProps) => {
export const CafeSentimentStats = ({ stats }: CafeSentimentStatsProps) => {
export const AIBadge = ({ sentiment, showLabel = true }: AIBadgeProps) => {
export const AILoadingState = () => {
export const AIErrorState = ({ onRetry }: AIErrorStateProps) => {
export const AIFeaturePromo = ({ onAnalyze }: AIFeaturePromoProps) => {
```

**Fix `AIBadge` config indexing** — apply same `Record<SentimentKey, ...>` pattern:
```ts
// Before:
const config = {
    positive: { icon: '😊', label: '正面', color: 'bg-green-100 text-green-700' },
    negative: { icon: '😞', label: '负面', color: 'bg-red-100 text-red-700' },
    neutral:  { icon: '😐', label: '中性', color: 'bg-gray-100 text-gray-700' }
}
const { icon, label, color } = config[sentiment] || config.neutral

// After:
const config: Record<SentimentKey, { icon: string; label: string; color: string }> = {
    positive: { icon: '😊', label: '正面', color: 'bg-green-100 text-green-700' },
    negative: { icon: '😞', label: '负面', color: 'bg-red-100 text-red-700' },
    neutral:  { icon: '😐', label: '中性', color: 'bg-gray-100 text-gray-700' },
}
const { icon, label, color } = config[sentiment]
```

Note: `AIBadge`'s `sentiment` prop is `SentimentKey` (non-optional), so no `?? 'neutral'` fallback needed.

- [ ] **Step 2: Delete the `.jsx` source**

```bash
rm frontend/src/components/AIAnalysis.jsx
```

- [ ] **Step 3: Run tsc**

```bash
cd frontend && npx tsc --noEmit
```

Expected: zero errors.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/AIAnalysis.tsx
git rm --cached frontend/src/components/AIAnalysis.jsx 2>/dev/null || true
git commit -m "feat(ts): migrate AIAnalysis.jsx → AIAnalysis.tsx"
```

---

### Task 4: `CafeList.jsx` → `CafeList.tsx`

**Files:**
- Create: `frontend/src/components/CafeList.tsx`
- Delete: `frontend/src/components/CafeList.jsx`

- [ ] **Step 1: Create `CafeList.tsx`**

Copy the full content of `frontend/src/components/CafeList.jsx` to `frontend/src/components/CafeList.tsx`, then apply these changes:

**Fix import:**
```ts
// Before:
import React, { useState } from 'react'
// After:
import { useState } from 'react'
```

**Add type import:**
```ts
import type { ICafe } from '@/types'
```

**Add props interface** (before the component function):
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

**Apply props interface to component signature:**
```ts
// Before:
const CafeList = ({
    cafes = [],
    ...
}) => {

// After:
const CafeList = ({
    cafes = [],
    loading = false,
    error = null,
    onFavoriteToggle,
    showDistance = false,
    getDistance = null,
    showViewToggle = true,
    onLoadMore = null,
    hasMore = false,
    emptyMessage = '暂无咖啡店'
}: CafeListProps) => {
```

**Add viewMode state type:**
```ts
// Before:
const [viewMode, setViewMode] = useState('grid')
// After:
const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
```

**Fix `CafeCard` props in the `.map()` callback** — replace `className` with `view`:

`CafeCard.tsx` controls its list/grid layout via `view?: 'grid' | 'list'`. The old `className={viewMode === 'list' ? 'flex' : ''}` had no effect on `CafeCard`'s internal layout branch — `view` is the correct prop.

```ts
// Before:
<CafeCard
    key={cafe._id || cafe.id}
    cafe={cafe}
    onFavoriteToggle={onFavoriteToggle}
    showDistance={showDistance}
    distance={distance}
    className={viewMode === 'list' ? 'flex' : ''}
/>

// After:
<CafeCard
    key={cafe._id || cafe.id}
    cafe={cafe}
    onFavoriteToggle={onFavoriteToggle}
    showDistance={showDistance}
    distance={distance}
    view={viewMode}
/>
```

- [ ] **Step 2: Delete the `.jsx` source**

```bash
rm frontend/src/components/CafeList.jsx
```

- [ ] **Step 3: Run tsc**

```bash
cd frontend && npx tsc --noEmit
```

Expected: zero errors.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/CafeList.tsx
git rm --cached frontend/src/components/CafeList.jsx 2>/dev/null || true
git commit -m "feat(ts): migrate CafeList.jsx → CafeList.tsx"
```

---

## Post-Migration Verification

After all tasks complete:

- [ ] `cd frontend && npx tsc --noEmit` — zero errors across all 3E files
- [ ] `npm run build` — clean production build, no warnings
