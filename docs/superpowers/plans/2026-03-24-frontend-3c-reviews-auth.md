# Frontend 3C: Reviews + Auth TypeScript Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate ReviewForm, ReviewList, Login, Register, ForgotPasswordPage, ResetPasswordPage, and VerifyEmailPage from JSX to TSX by adding TypeScript types — no logic changes.

**Architecture:** Each file is renamed (git mv) and receives type annotations on props, state, and event handlers. IReview is extended first to cover fields these components reference. Each task ends with `npx tsc --noEmit` passing clean before committing.

**Tech Stack:** React 19, TypeScript 5 (strict mode — `strict: true` is active in tsconfig.json), TailwindCSS v4, React Router 7

**Spec:** `docs/superpowers/specs/2026-03-24-frontend-3c-reviews-auth-design.md`

---

## Context for implementers

### tsconfig is STRICT
`frontend/tsconfig.json` has `"strict": true`, `"noUnusedLocals": true`, `"noUnusedParameters": true`. These are enforced on all `.tsx` files. JS files pass `allowJs: true` without strict checking — but once renamed to `.tsx`, full strict checking applies.

### Import aliases (always use these, never relative `../../` paths)
```
@/          → src/
@components → src/components/
@pages      → src/pages/
@hooks      → src/hooks/
@contexts   → src/contexts/
@services   → src/services/
@utils      → src/utils/
```

### React 19 JSX transform
All migrated files: remove `import React from 'react'`. Keep named hook imports e.g. `import { useState, useEffect } from 'react'`.

### Type imports location
`IReview`, `IUser`, `ICafe` etc. are re-exported from `frontend/src/types/index.ts`. Import as:
```ts
import type { IReview } from '@/types'
import type { IUser } from '@/types'
```

### Verification command (run after each task)
```bash
cd frontend && npx tsc --noEmit
```
Expected: zero errors.

---

## File Map

| Status | File | Change |
|--------|------|--------|
| Modify | `frontend/src/types/review.ts` | Add 6 optional fields to IReview |
| Rename | `frontend/src/components/ReviewForm.jsx` → `.tsx` | Full type annotation |
| Rename | `frontend/src/components/ReviewList.jsx` → `.tsx` | Full type annotation |
| Rename | `frontend/src/pages/Login.jsx` → `.tsx` | Full type annotation |
| Rename | `frontend/src/pages/Register.jsx` → `.tsx` | Fix relative import + types |
| Rename | `frontend/src/pages/ForgotPasswordPage.jsx` → `.tsx` | Full type annotation |
| Rename | `frontend/src/pages/ResetPasswordPage.jsx` → `.tsx` | Full type annotation |
| Rename | `frontend/src/pages/VerifyEmailPage.jsx` → `.tsx` | Full type annotation |

---

## Task 1: IReview Type Corrections

**Files:**
- Modify: `frontend/src/types/review.ts`

Current `IReview` is missing fields that ReviewForm and ReviewList reference. Add them now so Tasks 2–3 can use them without compile errors.

- [ ] **Step 1: Add missing fields to IReview**

Open `frontend/src/types/review.ts`. After the closing `}` of `ownerResponse?:` block (before `createdAt`), add:

```ts
detailedRatings?: {
  coffee?: number
  ambience?: number
  service?: number
  value?: number
}
helpfulVotes?: Array<{ user: string; vote: 'helpful' | 'not-helpful' }>
helpfulCount?: number
isEdited?: boolean
isVerifiedVisit?: boolean
visitDate?: string
```

`visitDate` is needed because ReviewForm reads `initialData?.visitDate` and ReviewList renders `review.visitDate`.

The final `IReview` interface (showing only the new additions in context):

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
  detailedRatings?: {
    coffee?: number
    ambience?: number
    service?: number
    value?: number
  }
  helpfulVotes?: Array<{ user: string; vote: 'helpful' | 'not-helpful' }>
  helpfulCount?: number
  isEdited?: boolean
  isVerifiedVisit?: boolean
  visitDate?: string
  createdAt: string
  updatedAt: string
}
```

- [ ] **Step 2: Verify**

```bash
cd frontend && npx tsc --noEmit
```

Expected: zero errors.

- [ ] **Step 3: Commit**

```bash
cd frontend && git add src/types/review.ts
git commit -m "feat(3c): extend IReview with detailedRatings, helpfulVotes, isEdited, isVerifiedVisit, visitDate"
```

---

## Task 2: ReviewForm.jsx → ReviewForm.tsx

**Files:**
- Rename+modify: `frontend/src/components/ReviewForm.jsx` → `frontend/src/components/ReviewForm.tsx`

### Known issues to fix during migration

**Issue A — `imagePreviews` initializer**: Source has `initialData?.images?.map(img => img.url) || []`. `IReview.images` is `string[]`, so `.url` is a compile error. Replace with `initialData?.images ?? []`.

**Issue B — `errors` state type**: Source clears fields with `null` (e.g. `setErrors(prev => ({ ...prev, rating: null }))`). Type must be `Record<string, string | null>`, not `Record<string, string>`.

**Issue C — `reader.result` type**: `FileReader.result` is `string | ArrayBuffer | null`. Must cast: `reader.result as string` when pushing to `imagePreviews`.

**Issue D — `handleDetailedRatingChange` category type**: The map array `[{ key: 'coffee', ... }]` needs to be typed `Array<{ key: keyof DetailedRatings; label: string }>` so that `key` passes as `keyof DetailedRatings` rather than plain `string`.

- [ ] **Step 1: Rename the file**

```bash
cd frontend && git mv src/components/ReviewForm.jsx src/components/ReviewForm.tsx
```

- [ ] **Step 2: Replace the import block at the top of the file**

Remove:
```js
import React, { useState } from 'react';
import { useAuth } from '@contexts/AuthContext';
```

Replace with:
```ts
import { useState } from 'react'
import { useAuth } from '@contexts/AuthContext'
import type { IReview } from '@/types'
```

- [ ] **Step 3: Add local interfaces before the component function**

Add these interfaces after the imports:

```ts
interface DetailedRatings {
  coffee: number
  ambience: number
  service: number
  value: number
}

interface ReviewFormData {
  rating: number
  content: string
  detailedRatings: DetailedRatings
  visitDate: string
}

interface ReviewFormProps {
  cafeId: string
  onSubmit: (formData: ReviewFormData, images: File[]) => Promise<void>
  onCancel?: () => void
  initialData?: Partial<IReview> | null
  isEdit?: boolean
}
```

- [ ] **Step 4: Type the component signature**

Change:
```js
const ReviewForm = ({
    cafeId,
    onSubmit,
    onCancel,
    initialData = null,
    isEdit = false
}) => {
```

To:
```ts
const ReviewForm = ({
  cafeId,
  onSubmit,
  onCancel,
  initialData = null,
  isEdit = false,
}: ReviewFormProps) => {
```

Note: `cafeId` is in the props but not used inside the component body. With `noUnusedLocals` active, prefix it with an underscore: `_cafeId` in the destructure, OR keep it and TypeScript will warn. Since it's a prop that callers supply (and may be needed for context), add a leading underscore to suppress the warning: change `cafeId` to `_cafeId` in the destructure only (the interface stays as `cafeId`).

- [ ] **Step 5: Type the state declarations**

Replace the four `useState` calls:

```ts
const [formData, setFormData] = useState<ReviewFormData>({
  rating: initialData?.rating ?? 0,
  content: initialData?.content ?? '',
  detailedRatings: initialData?.detailedRatings ?? { coffee: 0, ambience: 0, service: 0, value: 0 },
  visitDate: initialData?.visitDate
    ? new Date(initialData.visitDate).toISOString().split('T')[0]
    : '',
})
const [images, setImages] = useState<File[]>([])
const [imagePreviews, setImagePreviews] = useState<string[]>(
  initialData?.images ?? []          // ← was: initialData?.images?.map(img => img.url) || []
)
const [errors, setErrors] = useState<Record<string, string | null>>({})
const [submitting, setSubmitting] = useState<boolean>(false)
```

- [ ] **Step 6: Type the event handlers**

Add return types and parameter types to each handler:

```ts
const handleRatingChange = (value: number): void => { ... }

const handleDetailedRatingChange = (category: keyof DetailedRatings, value: number): void => { ... }

const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>): void => { ... }

const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>): void => { ... }

const handleRemoveImage = (index: number): void => { ... }

const validateForm = (): boolean => { ... }

const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => { ... }
```

- [ ] **Step 7: Fix `reader.result` cast in `handleImageChange`**

Find the line:
```js
setImagePreviews(prev => [...prev, reader.result]);
```
Change to:
```ts
setImagePreviews(prev => [...prev, reader.result as string])
```

- [ ] **Step 8: Fix the detailed ratings category array**

Find the array in JSX:
```js
{[
    { key: 'coffee', label: '☕ 咖啡品质' },
    { key: 'ambience', label: '🏠 环境氛围' },
    { key: 'service', label: '👥 服务态度' },
    { key: 'value', label: '💰 性价比' }
].map(({ key, label }) => (
```

Replace with a typed array:
```ts
{([
  { key: 'coffee' as const, label: '☕ 咖啡品质' },
  { key: 'ambience' as const, label: '🏠 环境氛围' },
  { key: 'service' as const, label: '👥 服务态度' },
  { key: 'value' as const, label: '💰 性价比' },
] satisfies Array<{ key: keyof DetailedRatings; label: string }>).map(({ key, label }) => (
```

This ensures `key` is narrowed to `keyof DetailedRatings` (not `string`) so `handleDetailedRatingChange(key, star)` type-checks.

- [ ] **Step 9: Verify**

```bash
cd frontend && npx tsc --noEmit
```

Expected: zero errors. If errors remain, read each carefully — they will be type mismatches in the places documented above.

- [ ] **Step 10: Commit**

```bash
cd frontend && git add src/components/ReviewForm.tsx src/components/ReviewForm.jsx
git commit -m "feat(3c): migrate ReviewForm.jsx → ReviewForm.tsx"
```

---

## Task 3: ReviewList.jsx → ReviewList.tsx

**Files:**
- Rename+modify: `frontend/src/components/ReviewList.jsx` → `frontend/src/components/ReviewList.tsx`

### Known issues to fix during migration

**Issue A — unused destructures**: `user` and `isOwner` are destructured from `useAuth()` but never used in the JSX. With `noUnusedLocals: true`, remove them from the destructure.

**Issue B — `review.author?.xxx` direct accesses**: `review.author` is `string | IUser`. Direct property access fails. Narrow once at the top of each map callback: `const author = typeof review.author === 'string' ? null : review.author`, then use `author?.avatar`, `author?.username`, `author?._id`.

**Issue C — `review._id || review.id`**: `IReview` has `_id: string` (required) but no `id` field. Change `review._id || review.id` → `review._id` everywhere (3 places: `key=`, `onVote(...)`, `onDelete(...)`).

**Issue D — `image.url || image`**: `IReview.images` is `string[]`. Elements are already strings — `.url` doesn't exist. Change `image.url || image` → `image` in both the `src` attribute and the `onClick` handler.

**Issue E — `renderStars` return type**: Must be `JSX.Element`, not `React.ReactElement` (which requires the React import).

- [ ] **Step 1: Rename the file**

```bash
cd frontend && git mv src/components/ReviewList.jsx src/components/ReviewList.tsx
```

- [ ] **Step 2: Replace the import block**

Remove:
```js
import React, { useState } from 'react';
import { useAuth } from '@contexts/AuthContext';
```

Replace with:
```ts
import { useState } from 'react'
import { useAuth } from '@contexts/AuthContext'
import type { IReview } from '@/types'
import type { IUser } from '@/types'
```

- [ ] **Step 3: Add the ReviewListProps interface before the component**

```ts
interface ReviewListProps {
  reviews?: IReview[]
  loading?: boolean
  onVote?: (reviewId: string, voteType: 'helpful' | 'not-helpful') => void
  onReport?: (reviewId: string) => void
  onEdit?: (review: IReview) => void
  onDelete?: (reviewId: string) => void
  sortBy?: string
  onSortChange?: (sort: string) => void
}
```

- [ ] **Step 4: Type the component signature**

Change:
```js
const ReviewList = ({
    reviews = [],
    loading = false,
    ...
}) => {
```

To:
```ts
const ReviewList = ({
  reviews = [],
  loading = false,
  onVote,
  onReport,
  onEdit,
  onDelete,
  sortBy = '-createdAt',
  onSortChange,
}: ReviewListProps) => {
```

- [ ] **Step 5: Fix the useAuth destructure — remove unused `user` and `isOwner`**

Change:
```js
const { user, userId, isAdmin, isOwner } = useAuth();
```

To:
```ts
const { userId, isAdmin } = useAuth()
```

`user` and `isOwner` are never referenced in the JSX. Keeping them would cause `noUnusedLocals` errors.

- [ ] **Step 6: Add return types to helper functions**

```ts
const renderStars = (rating: number): JSX.Element => {
  // ...existing body unchanged...
}

const formatDate = (dateString: string): string => {
  // ...existing body unchanged...
}
```

- [ ] **Step 7: Fix author narrowing inside the map callback**

Find the start of the `{reviews.map((review) => {` callback. Add the narrowing line immediately after:

```ts
{reviews.map((review) => {
  const author = typeof review.author === 'string' ? null : (review.author as IUser)
  const isAuthor = userId && (author?._id === userId || (author as IUser & { id?: string })?.id === userId)
  const canEdit = isAuthor || isAdmin()
  const hasVoted = review.helpfulVotes?.some(v => v.user === userId)
  const userVote = review.helpfulVotes?.find(v => v.user === userId)
```

Then replace every direct `review.author?.xxx` access in the JSX with `author?.xxx`:

- `review.author?.avatar` → `author?.avatar`
- `review.author?.username` → `author?.username`

- [ ] **Step 8: Fix `review._id || review.id` — 3 occurrences**

1. `key={review._id || review.id}` → `key={review._id}`
2. `onVote(review._id || review.id, 'helpful')` → `onVote(review._id, 'helpful')`
3. `onDelete(review._id || review.id)` → `onDelete(review._id)`

- [ ] **Step 9: Fix image access — 2 occurrences**

Find the images map block:
```js
{review.images.map((image, index) => (
    <img
        key={index}
        src={image.url || image}
        ...
        onClick={() => window.open(image.url || image, '_blank')}
    />
))}
```

Change both `image.url || image` to just `image`:
```ts
{review.images.map((image, index) => (
  <img
    key={index}
    src={image}
    alt={`评论图片 ${index + 1}`}
    className="w-full h-24 object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
    onClick={() => window.open(image, '_blank')}
  />
))}
```

- [ ] **Step 10: Verify**

```bash
cd frontend && npx tsc --noEmit
```

Expected: zero errors.

- [ ] **Step 11: Commit**

```bash
cd frontend && git add src/components/ReviewList.tsx src/components/ReviewList.jsx
git commit -m "feat(3c): migrate ReviewList.jsx → ReviewList.tsx"
```

---

## Task 4: Login.jsx → Login.tsx

**Files:**
- Rename+modify: `frontend/src/pages/Login.jsx` → `frontend/src/pages/Login.tsx`

Simple migration — all state uses strings (no null clearing), so `Record<string, string>` is fine.

- [ ] **Step 1: Rename**

```bash
cd frontend && git mv src/pages/Login.jsx src/pages/Login.tsx
```

- [ ] **Step 2: Replace imports**

Remove `import React, { useState } from 'react';`

Replace with:
```ts
import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '@contexts/AuthContext'
import { validateLoginData } from '@services/authAPI'
```

(Imports for react-router-dom and authAPI and useAuth are already in the source — just remove React and reformat.)

- [ ] **Step 3: Add LoginFormData interface before the component**

```ts
interface LoginFormData {
  identifier: string
  password: string
}
```

- [ ] **Step 4: Type state declarations**

```ts
const [formData, setFormData] = useState<LoginFormData>({ identifier: '', password: '' })
const [errors, setErrors] = useState<Record<string, string>>({})
const [loading, setLoading] = useState<boolean>(false)
const [showPassword, setShowPassword] = useState<boolean>(false)
```

- [ ] **Step 5: Type the URL param variables**

```ts
const redirectUrl: string = searchParams.get('redirect') || '/'
const expired: string | null = searchParams.get('expired')
```

- [ ] **Step 6: Type event handlers**

```ts
const handleChange = (e: React.ChangeEvent<HTMLInputElement>): void => { ... }
const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => { ... }
```

- [ ] **Step 7: Verify**

```bash
cd frontend && npx tsc --noEmit
```

Expected: zero errors.

- [ ] **Step 8: Commit**

```bash
cd frontend && git add src/pages/Login.tsx src/pages/Login.jsx
git commit -m "feat(3c): migrate Login.jsx → Login.tsx"
```

---

## Task 5: Register.jsx → Register.tsx

**Files:**
- Rename+modify: `frontend/src/pages/Register.jsx` → `frontend/src/pages/Register.tsx`

Has one special issue: the `useAuth` import uses a **relative path** that must be changed to an alias.

- [ ] **Step 1: Rename**

```bash
cd frontend && git mv src/pages/Register.jsx src/pages/Register.tsx
```

- [ ] **Step 2: Replace imports**

Remove:
```js
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';  // ← relative path: must fix
```

Replace with:
```ts
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@contexts/AuthContext'    // ← alias
```

- [ ] **Step 3: Add RegisterFormData interface**

```ts
interface RegisterFormData {
  username: string
  email: string
  password: string
  confirmPassword: string
}
```

- [ ] **Step 4: Type state declarations**

```ts
const [formData, setFormData] = useState<RegisterFormData>({ username: '', email: '', password: '', confirmPassword: '' })
const [errors, setErrors] = useState<Record<string, string>>({})
const [isLoading, setIsLoading] = useState<boolean>(false)
const [serverError, setServerError] = useState<string>('')
```

- [ ] **Step 5: Type event handlers**

```ts
const handleChange = (e: React.ChangeEvent<HTMLInputElement>): void => { ... }
const validateForm = (): boolean => { ... }
const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => { ... }
```

- [ ] **Step 6: Verify**

```bash
cd frontend && npx tsc --noEmit
```

Expected: zero errors.

- [ ] **Step 7: Commit**

```bash
cd frontend && git add src/pages/Register.tsx src/pages/Register.jsx
git commit -m "feat(3c): migrate Register.jsx → Register.tsx, fix relative import to alias"
```

---

## Task 6: ForgotPasswordPage.jsx → ForgotPasswordPage.tsx

**Files:**
- Rename+modify: `frontend/src/pages/ForgotPasswordPage.jsx` → `frontend/src/pages/ForgotPasswordPage.tsx`

Simplest of the auth pages — only 3 state variables and one handler.

- [ ] **Step 1: Rename**

```bash
cd frontend && git mv src/pages/ForgotPasswordPage.jsx src/pages/ForgotPasswordPage.tsx
```

- [ ] **Step 2: Replace imports**

Remove `import React, { useState } from 'react';`

Replace with:
```ts
import { useState } from 'react'
import { forgotPassword } from '@services/authAPI'
```

(The `forgotPassword` import is already in the source — just remove React and reformat.)

- [ ] **Step 3: Add ForgotStatus type before the component**

```ts
type ForgotStatus = 'idle' | 'loading' | 'success' | 'error'
```

- [ ] **Step 4: Type state declarations**

```ts
const [email, setEmail] = useState<string>('')
const [status, setStatus] = useState<ForgotStatus>('idle')
const [errorMsg, setErrorMsg] = useState<string>('')
```

- [ ] **Step 5: Type the handler**

```ts
const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => { ... }
```

- [ ] **Step 6: Verify**

```bash
cd frontend && npx tsc --noEmit
```

Expected: zero errors.

- [ ] **Step 7: Commit**

```bash
cd frontend && git add src/pages/ForgotPasswordPage.tsx src/pages/ForgotPasswordPage.jsx
git commit -m "feat(3c): migrate ForgotPasswordPage.jsx → ForgotPasswordPage.tsx"
```

---

## Task 7: ResetPasswordPage.jsx → ResetPasswordPage.tsx

**Files:**
- Rename+modify: `frontend/src/pages/ResetPasswordPage.jsx` → `frontend/src/pages/ResetPasswordPage.tsx`

- [ ] **Step 1: Rename**

```bash
cd frontend && git mv src/pages/ResetPasswordPage.jsx src/pages/ResetPasswordPage.tsx
```

- [ ] **Step 2: Replace imports**

Remove `import React, { useState } from 'react';`

Replace with:
```ts
import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { resetPassword } from '@services/authAPI'
```

(`useParams`, `useNavigate`, `resetPassword` already exist in source — just remove React and reformat.)

- [ ] **Step 3: Add types before the component**

```ts
interface ResetFormData {
  password: string
  confirm: string
}

interface PasswordStrength {
  level: number
  label: string
  color: string
}

type ResetStatus = 'idle' | 'loading' | 'success' | 'error'
```

- [ ] **Step 4: Type the useParams call**

Change:
```js
const { token } = useParams();
```

To:
```ts
const { token } = useParams<{ token: string }>()
```

- [ ] **Step 5: Type state declarations**

```ts
const [formData, setFormData] = useState<ResetFormData>({ password: '', confirm: '' })
const [showPassword, setShowPassword] = useState<boolean>(false)
const [showConfirm, setShowConfirm] = useState<boolean>(false)
const [status, setStatus] = useState<ResetStatus>('idle')
const [errors, setErrors] = useState<Record<string, string>>({})
```

- [ ] **Step 6: Type the helper and handler functions**

```ts
const getStrength = (pw: string): PasswordStrength => { ... }
const validate = (): Record<string, string> => { ... }
const handleChange = (e: React.ChangeEvent<HTMLInputElement>): void => { ... }
const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => { ... }
```

- [ ] **Step 7: Check `token` usage in handleSubmit**

The source calls `resetPassword(token, formData.password)`. With `useParams<{ token: string }>()`, `token` is typed as `string | undefined`. If `resetPassword` expects `string`, this needs a guard or non-null assertion:

```ts
await resetPassword(token!, formData.password)
```

(Token will always be present when this page is rendered via the route, so `!` assertion is safe.)

- [ ] **Step 8: Verify**

```bash
cd frontend && npx tsc --noEmit
```

Expected: zero errors.

- [ ] **Step 9: Commit**

```bash
cd frontend && git add src/pages/ResetPasswordPage.tsx src/pages/ResetPasswordPage.jsx
git commit -m "feat(3c): migrate ResetPasswordPage.jsx → ResetPasswordPage.tsx"
```

---

## Task 8: VerifyEmailPage.jsx → VerifyEmailPage.tsx

**Files:**
- Rename+modify: `frontend/src/pages/VerifyEmailPage.jsx` → `frontend/src/pages/VerifyEmailPage.tsx`

- [ ] **Step 1: Rename**

```bash
cd frontend && git mv src/pages/VerifyEmailPage.jsx src/pages/VerifyEmailPage.tsx
```

- [ ] **Step 2: Replace imports**

Remove `import React, { useEffect, useState } from 'react';`

Replace with:
```ts
import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { get } from '@services/api'
import { resendVerificationEmail } from '@services/authAPI'
import { useAuth } from '@contexts/AuthContext'
```

(All of these already exist in source — just remove React and reformat.)

- [ ] **Step 3: Add type aliases before the component**

```ts
type VerifyStatus = 'verifying' | 'success' | 'error'
type ResendStatus = 'idle' | 'loading' | 'sent' | 'error'
```

- [ ] **Step 4: Type the useParams call**

Change:
```js
const { token } = useParams();
```

To:
```ts
const { token } = useParams<{ token: string }>()
```

- [ ] **Step 5: Type state declarations**

```ts
const [status, setStatus] = useState<VerifyStatus>('verifying')
const [errorMsg, setErrorMsg] = useState<string>('')
const [resendStatus, setResendStatus] = useState<ResendStatus>('idle')
const [resendError, setResendError] = useState<string>('')
```

- [ ] **Step 6: Type the handleResend handler**

```ts
const handleResend = async (): Promise<void> => { ... }
```

- [ ] **Step 7: Guard `token` in the useEffect**

The `verify` function inside `useEffect` calls `get(\`/auth/verify-email/${token}\`)`. With `token` typed as `string | undefined`, add a guard:

```ts
useEffect(() => {
  if (!token) return
  const verify = async () => {
    // ...existing body unchanged...
  }
  verify()
}, [token])
```

- [ ] **Step 8: Verify**

```bash
cd frontend && npx tsc --noEmit
```

Expected: zero errors.

- [ ] **Step 9: Commit**

```bash
cd frontend && git add src/pages/VerifyEmailPage.tsx src/pages/VerifyEmailPage.jsx
git commit -m "feat(3c): migrate VerifyEmailPage.jsx → VerifyEmailPage.tsx"
```

---

## Post-Migration Verification

After all 8 tasks are complete:

- [ ] **Final tsc check**

```bash
cd frontend && npx tsc --noEmit
```

Expected: zero errors across all 3C files.

- [ ] **Lint check**

```bash
cd frontend && npm run lint
```

Expected: zero new warnings beyond the pre-existing baseline.

- [ ] **Build check**

```bash
cd frontend && npm run build
```

Expected: clean production build.
