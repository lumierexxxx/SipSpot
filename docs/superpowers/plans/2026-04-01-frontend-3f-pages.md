# Frontend 3F: Remaining Pages TypeScript Migration — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate 8 remaining `.jsx` pages to `.tsx` with strict TypeScript types, plus 3 IUser field additions that unblock Profile compilation.

**Architecture:** Type-only migration — no behavior changes except required bug fixes where undefined references or incorrect field accesses would cause compile errors. Each task creates the `.tsx`, deletes the `.jsx`, runs `tsc --noEmit`, and commits.

**Tech Stack:** React 19, TypeScript 5 strict mode, TailwindCSS v4, React Router 7, i18next

---

### Task 1: `IUser` type additions

**Files:**
- Modify: `frontend/src/types/user.ts`

- [ ] **Step 1: Add 3 optional fields to `IUser`**

In `frontend/src/types/user.ts`, add after `updatedAt`:

```ts
reviewCount?: number
cafeCount?: number
lastLogin?: string
```

Full updated `IUser` interface (fields after `updatedAt`):

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
  reviewCount?: number
  cafeCount?: number
  lastLogin?: string
}
```

- [ ] **Step 2: Run tsc**

```bash
cd frontend && npx tsc --noEmit
```

Expected: zero errors.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/types/user.ts
git commit -m "feat(types): add reviewCount, cafeCount, lastLogin to IUser"
```

---

### Task 2: `NotFound.jsx` → `NotFound.tsx`

**Files:**
- Create: `frontend/src/pages/NotFound.tsx`
- Delete: `frontend/src/pages/NotFound.jsx`

- [ ] **Step 1: Create `NotFound.tsx`**

Copy `frontend/src/pages/NotFound.jsx` to `frontend/src/pages/NotFound.tsx`, then apply:

Remove `import React from 'react'` — the only change needed. `useNavigate` and `Link` are typed automatically.

- [ ] **Step 2: Delete the `.jsx` source**

```bash
rm frontend/src/pages/NotFound.jsx
```

- [ ] **Step 3: Run tsc**

```bash
cd frontend && npx tsc --noEmit
```

Expected: zero errors.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/pages/NotFound.tsx
git rm --cached frontend/src/pages/NotFound.jsx 2>/dev/null || true
git commit -m "feat(ts): migrate NotFound.jsx → NotFound.tsx"
```

---

### Task 3: `SubmitSuccessPage.jsx` → `SubmitSuccessPage.tsx`

**Files:**
- Create: `frontend/src/pages/SubmitSuccessPage.tsx`
- Delete: `frontend/src/pages/SubmitSuccessPage.jsx`

- [ ] **Step 1: Create `SubmitSuccessPage.tsx`**

Copy `frontend/src/pages/SubmitSuccessPage.jsx` to `frontend/src/pages/SubmitSuccessPage.tsx`, then apply:

**Add `ParticleProps` interface** (before the `Particle` component):
```ts
interface ParticleProps {
  x: number
  delay: number
}

function Particle({ x, delay }: ParticleProps) { ... }
```

**Cast `location.state`** — React Router 7 types it as `unknown`. Find the line that accesses `.cafeName` or `.city` and cast above it:
```ts
const state = location.state as { cafeName?: string; city?: string } | null
```

Then replace any `location.state?.cafeName` with `state?.cafeName` and `location.state?.city` with `state?.city`.

No `import React` to remove — file already uses named React imports.

- [ ] **Step 2: Delete the `.jsx` source**

```bash
rm frontend/src/pages/SubmitSuccessPage.jsx
```

- [ ] **Step 3: Run tsc**

```bash
cd frontend && npx tsc --noEmit
```

Expected: zero errors.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/pages/SubmitSuccessPage.tsx
git rm --cached frontend/src/pages/SubmitSuccessPage.jsx 2>/dev/null || true
git commit -m "feat(ts): migrate SubmitSuccessPage.jsx → SubmitSuccessPage.tsx"
```

---

### Task 4: `FavoritesPage.jsx` → `FavoritesPage.tsx`

**Files:**
- Create: `frontend/src/pages/FavoritesPage.tsx`
- Delete: `frontend/src/pages/FavoritesPage.jsx`

- [ ] **Step 1: Create `FavoritesPage.tsx`**

Copy `frontend/src/pages/FavoritesPage.jsx` to `frontend/src/pages/FavoritesPage.tsx`, then apply all changes below in order:

**Fix imports:**
```ts
// Before:
import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import CafeCard from '../components/CafeCard'
import { getUserFavorites } from '../services/usersAPI'
import { toggleFavorite } from '../services/usersAPI'  // wrong function, wrong sig, remove

// After:
import { useState, useEffect, type ChangeEvent } from 'react'
import { useAuth } from '@contexts/AuthContext'
import CafeCard from '@components/CafeCard'
import { getUserFavorites, removeFromFavorites } from '@services/usersAPI'
import type { ICafe } from '@/types'
```

**Add state types:**
```ts
const [favorites, setFavorites] = useState<ICafe[]>([])
const [loading, setLoading] = useState<boolean>(true)
const [error, setError] = useState<string | null>(null)
const [sortBy, setSortBy] = useState<'recent' | 'rating' | 'name'>('recent')
const [filterCity, setFilterCity] = useState<string>('')
```

**Add handler types:**
```ts
const loadFavorites = async (): Promise<void> => { ... }
const handleUnfavorite = async (cafeId: string): Promise<void> => { ... }
const getFilteredAndSortedFavorites = (): ICafe[] => { ... }
```

**Fix `cafe._id || cafe.id`** — `ICafe` guarantees `_id`. Replace both occurrences with `cafe._id`.

**Fix select `onChange` event types:**
```ts
onChange={(e: ChangeEvent<HTMLSelectElement>) => setFilterCity(e.target.value)}
onChange={(e: ChangeEvent<HTMLSelectElement>) => setSortBy(e.target.value as 'recent' | 'rating' | 'name')}
```

- [ ] **Step 2: Delete the `.jsx` source**

```bash
rm frontend/src/pages/FavoritesPage.jsx
```

- [ ] **Step 3: Run tsc**

```bash
cd frontend && npx tsc --noEmit
```

Expected: zero errors.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/pages/FavoritesPage.tsx
git rm --cached frontend/src/pages/FavoritesPage.jsx 2>/dev/null || true
git commit -m "feat(ts): migrate FavoritesPage.jsx → FavoritesPage.tsx"
```

---

### Task 5: `MyReviewsPage.jsx` → `MyReviewsPage.tsx`

**Files:**
- Create: `frontend/src/pages/MyReviewsPage.tsx`
- Delete: `frontend/src/pages/MyReviewsPage.jsx`

- [ ] **Step 1: Create `MyReviewsPage.tsx`**

Copy `frontend/src/pages/MyReviewsPage.jsx` to `frontend/src/pages/MyReviewsPage.tsx`, then apply all changes below in order:

**Fix imports:**
```ts
// Before:
import React, { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { getUserReviews } from '../services/authAPI'
import { deleteReview } from '../services/cafesAPI'

// After:
import { useState, useEffect, useCallback, type JSX, type ChangeEvent } from 'react'
import { useAuth } from '@contexts/AuthContext'
import { getUserReviews } from '@services/authAPI'
import { deleteReview } from '@services/cafesAPI'
import type { IReview } from '@/types'
import type { ICafe } from '@/types'
```

**Add `SortOption` type and state types** (before the component function):
```ts
type SortOption = '-createdAt' | 'createdAt' | '-rating' | 'rating'
```

```ts
const [reviews, setReviews] = useState<IReview[]>([])
const [loading, setLoading] = useState<boolean>(true)
const [error, setError] = useState<string | null>(null)
const [currentPage, setCurrentPage] = useState<number>(1)
const [totalPages, setTotalPages] = useState<number>(1)
const [totalCount, setTotalCount] = useState<number>(0)
const [sortBy, setSortBy] = useState<SortOption>('-createdAt')
```

**Fix `review.cafe` narrowing** — inside the `.map()` callback, add at the top:
```ts
const cafeId = typeof review.cafe === 'string' ? review.cafe : review.cafe._id
const cafeName = typeof review.cafe === 'string' ? '咖啡店' : (review.cafe as ICafe).name
```
Replace all `review.cafe?._id`, `review.cafe?.id`, `review.cafe` (used as ID) with `cafeId`, and all `review.cafe?.name` with `cafeName`.

**Fix `review._id || review.id`** — `IReview` guarantees `_id`. Replace with `review._id` (both in `.map()` key and `handleDeleteReview` call).

**Fix `ownerResponse.createdAt`:**
```ts
// Before:
new Date(review.ownerResponse.createdAt).toLocaleDateString('zh-CN')
// After:
new Date(review.ownerResponse.respondedAt).toLocaleDateString('zh-CN')
```

**Fix `image.url || image`** — `IReview.images` is `string[]`, elements are plain strings:
```ts
// Before:
src={image.url || image}
// After:
src={image}
```

**Add handler types:**
```ts
const renderStars = (rating: number): JSX.Element => { ... }
const loadReviews = useCallback(async (): Promise<void> => { ... }, [currentPage, sortBy])
const handleDeleteReview = async (reviewId: string): Promise<void> => { ... }
```

Note: add `currentPage` and `sortBy` to the `useCallback` dependency array (source has `[]` which creates stale closures).

**Fix select `onChange`:**
```ts
onChange={(e: ChangeEvent<HTMLSelectElement>) => {
  setSortBy(e.target.value as SortOption)
  setCurrentPage(1)
}}
```

- [ ] **Step 2: Delete the `.jsx` source**

```bash
rm frontend/src/pages/MyReviewsPage.jsx
```

- [ ] **Step 3: Run tsc**

```bash
cd frontend && npx tsc --noEmit
```

Expected: zero errors.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/pages/MyReviewsPage.tsx
git rm --cached frontend/src/pages/MyReviewsPage.jsx 2>/dev/null || true
git commit -m "feat(ts): migrate MyReviewsPage.jsx → MyReviewsPage.tsx"
```

---

### Task 6: `AISearchPage.jsx` → `AISearchPage.tsx`

**Files:**
- Create: `frontend/src/pages/AISearchPage.tsx`
- Delete: `frontend/src/pages/AISearchPage.jsx`

- [ ] **Step 1: Create `AISearchPage.tsx`**

Copy `frontend/src/pages/AISearchPage.jsx` to `frontend/src/pages/AISearchPage.tsx`, then apply all changes below in order:

**Fix imports:**
```ts
// Before (relative paths):
import CafeCard from '../components/CafeCard'
import { useCurrentPosition } from '../hooks/useGeolocation'
// After:
import CafeCard from '@components/CafeCard'
import { useCurrentPosition } from '@hooks/useGeolocation'
import type { ICafe } from '@/types'
```

No `import React` to remove — file already uses named imports. However, the handler types use `React.FormEvent`, `React.ChangeEvent`, `React.KeyboardEvent` — these require named imports. Add them to the existing React import line:

```ts
// Add to existing React import:
import { ..., type FormEvent, type ChangeEvent, type KeyboardEvent } from 'react'
```

**Add `ChatMessage` interface** (before the component):
```ts
interface ChatMessage {
  type: 'user' | 'assistant'
  content: string
  timestamp: number
  cafes: ICafe[]
}
```

**Add state types:**
```ts
const [messages, setMessages] = useState<ChatMessage[]>([])
const [inputMessage, setInputMessage] = useState<string>('')
const [isLoading, setIsLoading] = useState<boolean>(false)
const [cafes, setCafes] = useState<ICafe[]>([])
const [explanation, setExplanation] = useState<string | null>(null)
const [explanationLoading, setExplanationLoading] = useState<boolean>(false)
const messagesEndRef = useRef<HTMLDivElement>(null)
const hasInitialized = useRef<boolean>(false)
```

**Fix `requestBody` mutation** — TypeScript rejects adding `lat`/`lng` to a narrowly-inferred object. Use explicit wider type:
```ts
const requestBody: { query: string; lat?: number; lng?: number } = { query }
if (latitude && longitude) {
  requestBody.lat = latitude
  requestBody.lng = longitude
}
```

**Fix `cafe.images[0]` narrowing** — `ICafe.images` is `Array<CafeImage | string>`. Replace `.url` access:
```ts
// Before:
src={cafe.images[0]?.url || cafe.images[0]}
// After:
src={typeof cafe.images[0] === 'string' ? cafe.images[0] : (cafe.images[0]?.url ?? '')}
```

**Add handler types:**
```ts
const scrollToBottom = (): void => { ... }
const handleAISearch = async (query: string): Promise<void> => { ... }
const handleSendMessage = (e: FormEvent<HTMLFormElement>): void => { ... }
const handleReset = (): void => { ... }
```

**Fix event handlers on textarea/form:**
```ts
onKeyDown={(e: KeyboardEvent<HTMLTextAreaElement>) => { ... }}
onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setInputMessage(e.target.value)}
```

- [ ] **Step 2: Delete the `.jsx` source**

```bash
rm frontend/src/pages/AISearchPage.jsx
```

- [ ] **Step 3: Run tsc**

```bash
cd frontend && npx tsc --noEmit
```

Expected: zero errors.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/pages/AISearchPage.tsx
git rm --cached frontend/src/pages/AISearchPage.jsx 2>/dev/null || true
git commit -m "feat(ts): migrate AISearchPage.jsx → AISearchPage.tsx"
```

---

### Task 7: `Profile.jsx` → `Profile.tsx`

**Files:**
- Create: `frontend/src/pages/Profile.tsx`
- Delete: `frontend/src/pages/Profile.jsx`

- [ ] **Step 1: Create `Profile.tsx`**

Copy `frontend/src/pages/Profile.jsx` to `frontend/src/pages/Profile.tsx`, then apply all changes below in order:

**Fix imports:**
```ts
// Before:
import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { getCurrentUser, updateProfile, updatePassword, getUserFavorites } from '../services/authAPI'
import CafeCard from '../components/CafeCard'

// After:
import { useState, useEffect, type ChangeEvent, type FormEvent } from 'react'
import { useAuth } from '@contexts/AuthContext'
import { getCurrentUser, updateProfile, updatePassword, getUserFavorites } from '@services/authAPI'
import CafeCard from '@components/CafeCard'
import type { IUser } from '@/types'
import type { ICafe } from '@/types'
```

**Add local type interfaces** (before the component):
```ts
interface EditProfileForm {
  username: string
  email: string
  bio: string
  avatar: string
}

interface PasswordForm {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}
```

**Add state types:**
```ts
const [user, setUser] = useState<IUser | null>(null)
const [favorites, setFavorites] = useState<ICafe[]>([])
const [loading, setLoading] = useState<boolean>(true)
const [error, setError] = useState<string | null>(null)
const [isEditing, setIsEditing] = useState<boolean>(false)
const [editForm, setEditForm] = useState<EditProfileForm>({ username: '', email: '', bio: '', avatar: '' })
const [editLoading, setEditLoading] = useState<boolean>(false)
const [editError, setEditError] = useState<string>('')
const [showPasswordModal, setShowPasswordModal] = useState<boolean>(false)
const [passwordForm, setPasswordForm] = useState<PasswordForm>({ currentPassword: '', newPassword: '', confirmPassword: '' })
const [passwordLoading, setPasswordLoading] = useState<boolean>(false)
const [passwordError, setPasswordError] = useState<string>('')
const [passwordSuccess, setPasswordSuccess] = useState<string>('')
const [activeTab, setActiveTab] = useState<'overview' | 'favorites' | 'reviews'>('overview')
```

**Fix `handleCancelEdit` null guard** — add early return before accessing `user`:
```ts
const handleCancelEdit = (): void => {
  if (!user) return
  setEditForm({ username: user.username, email: user.email, bio: user.bio ?? '', avatar: user.avatar ?? '' })
  setIsEditing(false)
}
```

**Add handler types:**
```ts
const loadUserData = async (): Promise<void> => { ... }
const handleEditChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>): void => { ... }
const handleEditSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => { ... }
const handlePasswordChange = (e: ChangeEvent<HTMLInputElement>): void => { ... }
const handlePasswordSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => { ... }
const handleLogout = async (): Promise<void> => { ... }
```

**Fix `cafe._id || cafe.id`** — replace with `cafe._id`.

- [ ] **Step 2: Delete the `.jsx` source**

```bash
rm frontend/src/pages/Profile.jsx
```

- [ ] **Step 3: Run tsc**

```bash
cd frontend && npx tsc --noEmit
```

Expected: zero errors.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/pages/Profile.tsx
git rm --cached frontend/src/pages/Profile.jsx 2>/dev/null || true
git commit -m "feat(ts): migrate Profile.jsx → Profile.tsx"
```

---

### Task 8: `CreateCafePage.jsx` → `CreateCafePage.tsx`

**Files:**
- Create: `frontend/src/pages/CreateCafePage.tsx`
- Delete: `frontend/src/pages/CreateCafePage.jsx`

- [ ] **Step 1: Create `CreateCafePage.tsx`**

Copy `frontend/src/pages/CreateCafePage.jsx` to `frontend/src/pages/CreateCafePage.tsx`, then apply all changes below in order:

**Fix imports:**
```ts
// Before:
import React, { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { createCafe } from '../services/cafesAPI'

// After:
import { useState, useEffect, Fragment, type ChangeEvent, type FormEvent } from 'react'
import { useAuth } from '@contexts/AuthContext'
import { createCafe } from '@services/cafesAPI'
```

Note: `useEffect` and `Fragment` must both be added. The source uses `React.useEffect` and `React.Fragment` — after removing `import React`, replace `React.useEffect` with `useEffect` and `React.Fragment` with `Fragment` throughout the file.

**Add local type interfaces** (before the component):
```ts
interface OpeningHourForm {
  day: string
  open: string
  close: string
  closed: boolean
}

interface CafeFormData {
  name: string
  description: string
  address: string
  city: string
  price: number
  specialty: string
  phoneNumber: string
  website: string
  amenities: string[]
  openingHours: OpeningHourForm[]
}

interface LocationData {
  lat: string
  lng: string
}
```

**Add state types:**
```ts
const [formData, setFormData] = useState<CafeFormData>({ ... })
const [location, setLocation] = useState<LocationData>({ lat: '', lng: '' })
const [images, setImages] = useState<File[]>([])
const [imagePreviews, setImagePreviews] = useState<string[]>([])
const [loading, setLoading] = useState<boolean>(false)
const [error, setError] = useState<string>('')
const [errors, setErrors] = useState<Record<string, string>>({})
const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1)
```

**Fix `e.target.files` null** — `HTMLInputElement.files` is `FileList | null`:
```ts
const handleImageChange = (e: ChangeEvent<HTMLInputElement>): void => {
  const files = Array.from(e.target.files ?? [])
  ...
}
```

**Fix `FileReader.result` narrowing** — `result` is `string | ArrayBuffer | null`:
```ts
reader.onloadend = () => {
  if (typeof reader.result === 'string') {
    setImagePreviews(prev => [...prev, reader.result as string])
  }
}
```

**Fix `rows` attribute** — JSX expects a number, not a string:
```tsx
rows={5}   // not rows="5"
```

**Add handler types:**
```ts
const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>): void => { ... }
const handleLocationChange = (e: ChangeEvent<HTMLInputElement>): void => { ... }
const handleAmenityToggle = (amenity: string): void => { ... }
const handleHoursChange = (index: number, field: keyof OpeningHourForm, value: string | boolean): void => { ... }
const handleImageChange = (e: ChangeEvent<HTMLInputElement>): void => { ... }
const removeImage = (index: number): void => { ... }
const handleGetCurrentLocation = (): void => { ... }
const validateForm = (): boolean => { ... }
const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => { ... }
```

- [ ] **Step 2: Delete the `.jsx` source**

```bash
rm frontend/src/pages/CreateCafePage.jsx
```

- [ ] **Step 3: Run tsc**

```bash
cd frontend && npx tsc --noEmit
```

Expected: zero errors.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/pages/CreateCafePage.tsx
git rm --cached frontend/src/pages/CreateCafePage.jsx 2>/dev/null || true
git commit -m "feat(ts): migrate CreateCafePage.jsx → CreateCafePage.tsx"
```

---

### Task 9: `EditCafePage.jsx` → `EditCafePage.tsx`

**Files:**
- Create: `frontend/src/pages/EditCafePage.tsx`
- Delete: `frontend/src/pages/EditCafePage.jsx`

- [ ] **Step 1: Create `EditCafePage.tsx`**

Copy `frontend/src/pages/EditCafePage.jsx` to `frontend/src/pages/EditCafePage.tsx`, then apply all changes below in order:

**Fix imports** (same pattern as CreateCafePage):
```ts
// Before:
import React, { useState, useCallback, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { getCafe, updateCafe } from '../services/cafesAPI'

// After:
import { useState, useCallback, useEffect, Fragment, type ChangeEvent, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '@contexts/AuthContext'
import { getCafe, updateCafe } from '@services/cafesAPI'
import type { ICafe } from '@/types'
```

Replace `React.Fragment` with `Fragment`. Replace `React.useEffect`/`React.useCallback`/`React.useState` (if any remain) with the named imports.

**Add `useParams` typing:**
```ts
const { id } = useParams<{ id: string }>()
```

`id` is now `string | undefined`.

**Declare ALL hooks first** (useState, useCallback, useEffect), then add the `!id` guard after the last hook:
```ts
// All useState declarations...
// useCallback declaration...
// useEffect declarations...

// After ALL hooks:
if (!id) return null
```

Important: the `if (!id) return null` must come after every hook call in the component. Placing it before any hook violates Rules of Hooks. After this guard, `id` is narrowed to `string` for the rest of the component body.

**Add local type interfaces** (same as CreateCafePage — place before the component):
```ts
interface OpeningHourForm {
  day: string
  open: string
  close: string
  closed: boolean
}

interface CafeFormData {
  name: string
  description: string
  address: string
  city: string
  price: number
  specialty: string
  phoneNumber: string
  website: string
  amenities: string[]
  openingHours: OpeningHourForm[]
}

interface LocationData {
  lat: string
  lng: string
}
```

**Add state types** (same as CreateCafePage, plus):
```ts
const [formData, setFormData] = useState<CafeFormData>({ ... })
const [location, setLocation] = useState<LocationData>({ lat: '', lng: '' })
const [loading, setLoading] = useState<boolean>(false)
const [initialLoading, setInitialLoading] = useState<boolean>(true)
const [error, setError] = useState<string>('')
const [errors, setErrors] = useState<Record<string, string>>({})
const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1)
const [cafe, setCafe] = useState<ICafe | null>(null)
```

**Fix `author` narrowing in `loadCafeData`** — `cafeData.author` is `string | IUser`:
```ts
const authorId = typeof cafeData.author === 'string' ? cafeData.author : cafeData.author._id
```
Replace `cafeData.author?._id || cafeData.author?.id` with `authorId`.

**Fix `useCallback` dependency array** — source has `[]` but callback uses `id`:
```ts
const loadCafeData = useCallback(async (): Promise<void> => { ... }, [id])
```

**Fix `rows` attribute:**
```tsx
rows={5}   // not rows="5"
```

**Add handler types** (same set as CreateCafePage, minus `handleImageChange`/`removeImage` — EditCafePage has no image upload):
```ts
const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>): void => { ... }
const handleLocationChange = (e: ChangeEvent<HTMLInputElement>): void => { ... }
const handleAmenityToggle = (amenity: string): void => { ... }
const handleHoursChange = (index: number, field: keyof OpeningHourForm, value: string | boolean): void => { ... }
const handleGetCurrentLocation = (): void => { ... }
const validateForm = (): boolean => { ... }
const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => { ... }
const loadCafeData = useCallback(async (): Promise<void> => { ... }, [id])
```

- [ ] **Step 2: Delete the `.jsx` source**

```bash
rm frontend/src/pages/EditCafePage.jsx
```

- [ ] **Step 3: Run tsc**

```bash
cd frontend && npx tsc --noEmit
```

Expected: zero errors.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/pages/EditCafePage.tsx
git rm --cached frontend/src/pages/EditCafePage.jsx 2>/dev/null || true
git commit -m "feat(ts): migrate EditCafePage.jsx → EditCafePage.tsx"
```

---

## Post-Migration Verification

After all 9 tasks complete:

- [ ] `cd frontend && npx tsc --noEmit` — zero errors across all 3F files
- [ ] `npm run build` — clean production build, no warnings
