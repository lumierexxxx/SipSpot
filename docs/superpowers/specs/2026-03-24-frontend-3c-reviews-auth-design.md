# Frontend Sub-Spec 3C: Reviews + Auth — Design

**Date:** 2026-03-24
**Status:** Approved
**Preceding spec:** `2026-03-23-frontend-3b-discovery-detail-design.md`
**Scope:** TypeScript migration for `ReviewForm`, `ReviewList`, and the full auth page cluster (`Login`, `Register`, `ForgotPasswordPage`, `ResetPasswordPage`, `VerifyEmailPage`). No behavior changes — types and import-alias fixes only.

---

## Goals

1. Add missing optional fields to `IReview` that `ReviewForm`/`ReviewList` reference but the current type omits
2. Migrate `ReviewForm.jsx` → `ReviewForm.tsx`
3. Migrate `ReviewList.jsx` → `ReviewList.tsx`
4. Migrate `Login.jsx` → `Login.tsx`
5. Migrate `Register.jsx` → `Register.tsx` (fix relative import → alias)
6. Migrate `ForgotPasswordPage.jsx` → `ForgotPasswordPage.tsx`
7. Migrate `ResetPasswordPage.jsx` → `ResetPasswordPage.tsx`
8. Migrate `VerifyEmailPage.jsx` → `VerifyEmailPage.tsx`

---

## Architecture

### Approach: type-only migration

All eight files are migrated by adding TypeScript types to existing JSX — no logic changes, no service layer replacements. Auth pages already use `useAuth()` or `authAPI` service functions; ReviewForm/ReviewList have no API calls at all.

### Migration order

```
Task 1: IReview type corrections (types/review.ts)
Task 2: ReviewForm.jsx → ReviewForm.tsx
Task 3: ReviewList.jsx → ReviewList.tsx
Task 4: Login.jsx → Login.tsx
Task 5: Register.jsx → Register.tsx
Task 6: ForgotPasswordPage.jsx → ForgotPasswordPage.tsx
Task 7: ResetPasswordPage.jsx → ResetPasswordPage.tsx
Task 8: VerifyEmailPage.jsx → VerifyEmailPage.tsx
```

Each task ends with `npx tsc --noEmit` and a commit.

---

## Tech Stack

React 19, TypeScript 5 (non-strict — consistent with 3A/3B), TailwindCSS v4, React Router 7, Axios

---

## Section 1: IReview Type Corrections (`types/review.ts`)

`ReviewForm.jsx` uses a `detailedRatings` object with keys `{coffee, ambience, service, value}` — distinct from `IReview.ratings` which uses `{taste, price, environment, service, workspace}` (the backend-accurate field). Per the 3C approach decision, `detailedRatings` is added as an optional field to `IReview` rather than reconciling component logic.

`ReviewList.jsx` additionally references `helpfulVotes`, `helpfulCount`, `isEdited`, and `isVerifiedVisit` — none of which exist in the current `IReview`.

### Changes to `frontend/src/types/review.ts`

Add to `IReview`:

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
```

No existing fields are removed or renamed.

---

## Section 2: ReviewForm.tsx

**File:** `frontend/src/components/ReviewForm.tsx` (rename from `.jsx`)

### Local types

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

### State types

```ts
const [formData, setFormData] = useState<ReviewFormData>({
  rating: initialData?.rating ?? 0,
  content: initialData?.content ?? '',
  detailedRatings: initialData?.detailedRatings ?? { coffee: 0, ambience: 0, service: 0, value: 0 },
  visitDate: initialData?.visitDate
    ? new Date(initialData.visitDate).toISOString().split('T')[0]
    : ''
})
const [images, setImages] = useState<File[]>([])
const [imagePreviews, setImagePreviews] = useState<string[]>(
  initialData?.images ?? []
)
const [errors, setErrors] = useState<Record<string, string>>({})
const [submitting, setSubmitting] = useState<boolean>(false)
```

Note: `IReview.images` is `string[]` — not a `CafeImage` union. The original JSX accesses `img.url` which would be a compile error since elements are already strings. Fix: replace `initialData?.images?.map(img => img.url) || []` with `initialData?.images ?? []`.

### Event handler signatures

```ts
const handleRatingChange = (value: number): void => { ... }
const handleDetailedRatingChange = (category: keyof DetailedRatings, value: number): void => { ... }
const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>): void => { ... }
const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>): void => { ... }
const handleRemoveImage = (index: number): void => { ... }
const validateForm = (): boolean => { ... }
const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => { ... }
```

### Imports

Remove `import React` (React 19 JSX transform — consistent with all 3A/3B migrated files).
Keep: `import { useState } from 'react'`
Keep: `import { useAuth } from '@contexts/AuthContext'`
Add: `const { isLoggedIn } = useAuth()` (no type annotation needed — inferred from AuthContext)

---

## Section 3: ReviewList.tsx

**File:** `frontend/src/components/ReviewList.tsx` (rename from `.jsx`)

### Props interface

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

### Helper function signatures

```ts
const renderStars = (rating: number): JSX.Element => { ... }
const formatDate = (dateString: string): string => { ... }
```

Note: use `JSX.Element` (not `React.ReactElement`) — consistent with 3A/3B render helpers, and avoids a compile error when `import React` is removed.

### `useAuth()` destructure

```ts
const { user, userId, isAdmin, isOwner } = useAuth()
```

- `userId` is `string | null` (from AuthContext)
- `isAdmin` is a **function** `() => boolean` — must be called as `isAdmin()`, not used as a boolean directly
- `isOwner` is `(ownerId: string) => boolean`

### Author narrowing

`review.author` is `string | IUser`. Narrow **once at the top of each map callback**, replacing ALL `review.author?.xxx` accesses with the narrowed variable:

```ts
const author = typeof review.author === 'string' ? null : review.author
```

Every access — including `review.author?._id`, `review.author?.id`, `review.author?.avatar`, `review.author?.username` — must use `author?._id`, `author?.avatar`, `author?.username`, etc. Do NOT leave any `review.author?.xxx` direct accesses in JSX as these will produce tsc errors.

### `review.images` access

The source accesses `image.url || image` — treating each element as `{ url: string } | string`. However `IReview.images` is `string[]`, so `.url` would be a compile error. Fix: change `image.url || image` to just `image` everywhere in ReviewList.tsx (since the elements are already plain strings).

### Imports

Remove `import React` (React 19 JSX transform).
Keep: `import { useState } from 'react'`
Keep: `import { useAuth } from '@contexts/AuthContext'`
Add: `import type { IReview } from '@/types'`
Add: `import type { IUser } from '@/types'` (IUser needed for the narrowed author type)

---

## Section 4: Login.tsx

**File:** `frontend/src/pages/Login.tsx` (rename from `.jsx`)

### Local types

```ts
interface LoginFormData {
  identifier: string
  password: string
}
```

### State and handler types

```ts
const [searchParams] = useSearchParams()        // URLSearchParams
const redirectUrl: string = searchParams.get('redirect') || '/'
const expired: string | null = searchParams.get('expired')

const [formData, setFormData] = useState<LoginFormData>({ identifier: '', password: '' })
const [errors, setErrors] = useState<Record<string, string>>({})
const [loading, setLoading] = useState<boolean>(false)
const [showPassword, setShowPassword] = useState<boolean>(false)

const handleChange = (e: React.ChangeEvent<HTMLInputElement>): void => { ... }
const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => { ... }
```

### Imports

Remove `import React`.
Keep: `import { useNavigate, useSearchParams } from 'react-router-dom'`
Keep: `import { validateLoginData } from '@services/authAPI'`

---

## Section 5: Register.tsx

**File:** `frontend/src/pages/Register.tsx` (rename from `.jsx`)

### Import fix

Change relative import:
```ts
// Before:
import { useAuth } from '../contexts/AuthContext'
// After:
import { useAuth } from '@contexts/AuthContext'
```

### Local types

```ts
interface RegisterFormData {
  username: string
  email: string
  password: string
  confirmPassword: string
}
```

### State and handler types

```ts
const [formData, setFormData] = useState<RegisterFormData>({ username: '', email: '', password: '', confirmPassword: '' })
const [errors, setErrors] = useState<Record<string, string>>({})
const [isLoading, setIsLoading] = useState<boolean>(false)
const [serverError, setServerError] = useState<string>('')

const handleChange = (e: React.ChangeEvent<HTMLInputElement>): void => { ... }
const validateForm = (): boolean => { ... }
const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => { ... }
```

### Imports

Remove `import React`. Keep `import { Link, useNavigate } from 'react-router-dom'`.

---

## Section 6: ForgotPasswordPage.tsx

**File:** `frontend/src/pages/ForgotPasswordPage.tsx` (rename from `.jsx`)

### Local types

```ts
type ForgotStatus = 'idle' | 'loading' | 'success' | 'error'
```

### State and handler types

```ts
const [email, setEmail] = useState<string>('')
const [status, setStatus] = useState<ForgotStatus>('idle')
const [errorMsg, setErrorMsg] = useState<string>('')

const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => { ... }
```

### Imports

Remove `import React`.
Keep: `import { useState } from 'react'`
Keep: `import { forgotPassword } from '@services/authAPI'`

---

## Section 7: ResetPasswordPage.tsx

**File:** `frontend/src/pages/ResetPasswordPage.tsx` (rename from `.jsx`)

### Local types

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

### State and handler types

```ts
const { token } = useParams<{ token: string }>()
const [formData, setFormData] = useState<ResetFormData>({ password: '', confirm: '' })
const [showPassword, setShowPassword] = useState<boolean>(false)
const [showConfirm, setShowConfirm] = useState<boolean>(false)
const [status, setStatus] = useState<ResetStatus>('idle')
const [errors, setErrors] = useState<Record<string, string>>({})

const getStrength = (pw: string): PasswordStrength => { ... }
const validate = (): Record<string, string> => { ... }
const handleChange = (e: React.ChangeEvent<HTMLInputElement>): void => { ... }
const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => { ... }
```

### Imports

Remove `import React`.
Keep: `import { useState } from 'react'`
Keep: `import { useParams, useNavigate } from 'react-router-dom'`
Keep: `import { resetPassword } from '@services/authAPI'`
Add: `const navigate = useNavigate()` (typed automatically, no annotation needed)

---

## Section 8: VerifyEmailPage.tsx

**File:** `frontend/src/pages/VerifyEmailPage.tsx` (rename from `.jsx`)

### Local types

```ts
type VerifyStatus = 'verifying' | 'success' | 'error'
type ResendStatus = 'idle' | 'loading' | 'sent' | 'error'
```

### State and handler types

```ts
const { token } = useParams<{ token: string }>()
const navigate = useNavigate()
const { isLoggedIn, refreshUser } = useAuth()

const [status, setStatus] = useState<VerifyStatus>('verifying')
const [errorMsg, setErrorMsg] = useState<string>('')
const [resendStatus, setResendStatus] = useState<ResendStatus>('idle')
const [resendError, setResendError] = useState<string>('')

const handleResend = async (): Promise<void> => { ... }
```

`refreshUser` is called as `await refreshUser()` — its return type from AuthContext is `Promise<IUser | null>`.

Uses `get()` from `@services/api` as a named import — keep the import `import { get } from '@services/api'` exactly as-is (named export, not default).

### Imports

Remove `import React`.
Keep: `import { useEffect, useState } from 'react'`
Keep: `import { useParams, useNavigate } from 'react-router-dom'`
Keep: `import { get } from '@services/api'`
Keep: `import { resendVerificationEmail } from '@services/authAPI'`
Keep: `import { useAuth } from '@contexts/AuthContext'`

---

## What This Spec Does NOT Cover

- `App.jsx`, `main.jsx` migration (separate spec)
- `Navbar.jsx`, `AuthContext.jsx`, `LangSelect.jsx` migration (separate spec)
- Remaining pages: `Profile.jsx`, `FavoritesPage.jsx`, `MyReviewsPage.jsx`, `CreateCafePage.jsx`, `EditCafePage.jsx`, `AISearchPage.jsx`, `NotFound.jsx` (separate spec)
- Fixing `detailedRatings` vs `ratings` mismatch between ReviewForm and backend (separate refactor)
- Backend changes

---

## Post-Migration Verification

After all 8 tasks:
1. `npx tsc --noEmit` — zero errors in 3C files
2. `npm run lint` — zero new warnings beyond pre-existing baseline
3. `npm run build` — clean production build
