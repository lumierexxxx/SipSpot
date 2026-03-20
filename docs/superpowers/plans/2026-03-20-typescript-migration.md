# TypeScript Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate the SipSpot backend from CommonJS JavaScript to TypeScript, with language-neutral enum keys throughout.

**Architecture:** All `.js` files become `.ts` files using ES module syntax (`import`/`export`); TypeScript compiles to CommonJS output. A shared `types/` directory provides interfaces used by models, controllers, middleware, and services. Three DB enum migrations normalize amenity, specialty, and day values to short English keys.

**Tech Stack:** TypeScript 5.4, tsx (dev runner), tsc (production build), Mongoose v8 (native TS support), Express 4 with `@types/express`.

---

## Notes Before Starting

- **No logic changes** — rename files, convert require/export syntax, add type annotations only
- **Loose mode** — `noImplicitAny: false`, `strictNullChecks: false`. TypeScript will not reject `any` types during this migration
- **Verification step** — no tests exist; use `cd backend && npx tsc --noEmit` after each task to confirm compilation
- **Syntax conversion pattern** everywhere:
  - `const X = require('y')` → `import X from 'y'`
  - `const { a, b } = require('y')` → `import { a, b } from 'y'`
  - `module.exports = X` → `export default X`
  - `exports.fn = ...` → `export const fn = ...`

---

## File Map

### New files created
| File | Purpose |
|---|---|
| `backend/tsconfig.json` | TypeScript compiler config |
| `backend/server/types/cafe.ts` | ICafe, AmenityKey, SpecialtyType, DayKey, etc. |
| `backend/server/types/user.ts` | IUser, IUserPreferences, IVisitedEntry, etc. |
| `backend/server/types/review.ts` | IReview, IMultiDimRatings, IAiAnalysis, etc. |
| `backend/server/types/api.ts` | AuthRequest, ApiResponse<T> |
| `backend/server/types/index.ts` | Barrel export |
| `backend/server/seeds/migrate_enum_keys.ts` | One-time DB migration script |
| `frontend/src/locales/en/amenities.json` | English amenity labels |
| `frontend/src/locales/zh/amenities.json` | Chinese amenity labels |
| `frontend/src/locales/en/specialties.json` | English specialty labels |
| `frontend/src/locales/zh/specialties.json` | Chinese specialty labels |
| `frontend/src/locales/en/days.json` | English day labels |
| `frontend/src/locales/zh/days.json` | Chinese day labels |

### Renamed files (`.js` → `.ts`)
`server.js`, `middleware/auth.js`, `models/{cafe,user,review}.js`, `controllers/{auth,cafe,aiSearch,user,review,recommendation}Controller.js`, `routes/{auth,cafes,users,reviews,reviewsStandalone,recommendations}.js`, `services/{aiService,emailService,cloudinary,embeddingService,vectorService}.js`, `utils/{asyncHandler,ExpressError,responseHelper,validation,geocoding}.js`

---

## Task 1: Install TypeScript tooling

**Files:**
- Modify: `backend/package.json`
- Create: `backend/tsconfig.json`

- [ ] **Step 1: Install dev dependencies**

```bash
cd backend
npm install --save-dev typescript tsx @types/node @types/express @types/bcryptjs @types/jsonwebtoken @types/cors @types/multer @types/nodemailer @types/cookie-parser
```

Expected: packages added to `devDependencies` in `package.json`.

- [ ] **Step 2: Update scripts in `backend/package.json`**

Replace the existing `scripts` block:

```json
"scripts": {
  "dev": "tsx watch server/server.ts",
  "start": "node dist/server.js",
  "build": "tsc",
  "seed": "tsx server/seeds/index.ts",
  "lint": "eslint server/",
  "format": "prettier --write server/"
}
```

- [ ] **Step 3: Create `backend/tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "moduleResolution": "node",
    "outDir": "./dist",
    "rootDir": "./server",
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "skipLibCheck": true,
    "noImplicitAny": false,
    "strictNullChecks": false
  },
  "include": ["server/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

- [ ] **Step 4: Commit**

```bash
git add backend/package.json backend/tsconfig.json
git commit -m "chore: add TypeScript tooling to backend"
```

---

## Task 2: Create type definitions — `cafe.ts`

**Files:**
- Create: `backend/server/types/cafe.ts`

- [ ] **Step 1: Create `backend/server/types/cafe.ts`**

```typescript
// Language-neutral amenity keys (replaces Chinese strings in DB)
export type AmenityKey =
  | 'wifi'
  | 'power_outlet'
  | 'quiet'
  | 'outdoor_seating'
  | 'pet_friendly'
  | 'no_smoking'
  | 'air_conditioning'
  | 'parking'
  | 'wheelchair_accessible'
  | 'laptop_friendly'
  | 'group_friendly'
  | 'work_friendly'

// Language-neutral specialty keys (replaces bilingual strings in DB)
export type SpecialtyType =
  | 'espresso'
  | 'pour_over'
  | 'cold_brew'
  | 'latte_art'
  | 'specialty_beans'
  | 'desserts'
  | 'light_meals'

// Language-neutral day keys (replaces Chinese day names in DB)
export type DayKey =
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
  | 'sunday'

export type VibeType =
  | 'Specialty'
  | 'Cozy Vibes'
  | 'Work-Friendly'
  | 'Outdoor'
  | 'Hidden Gems'
  | 'New Openings'

export interface ICafeImage {
  url: string
  filename: string
  publicId?: string
  uploadedAt: string
  thumbnail?: string  // virtual
  cardImage?: string  // virtual
}

export interface IOpeningHours {
  day: DayKey
  open: string    // e.g. "09:00"
  close: string   // e.g. "22:00"
  closed: boolean
}

export interface IGeometry {
  type: 'Point'
  coordinates: [number, number]  // [longitude, latitude]
}

export interface IAiSummary {
  features: string
  atmosphere: string
  highlights: string[]
  suitableFor: string[]
  generatedAt?: string
  needsUpdate: boolean
  version: number
}

export interface ICafe {
  _id: string
  name: string
  description: string
  images: ICafeImage[]
  geometry: IGeometry
  address: string
  city: string
  price: 1 | 2 | 3 | 4
  amenities: AmenityKey[]
  specialty: SpecialtyType
  vibe?: VibeType
  openingHours: IOpeningHours[]
  phoneNumber?: string
  rating: number
  reviewCount: number
  reviews: string[] | IReview[]
  aiSummary?: IAiSummary
  embedding?: number[]
  embeddingUpdatedAt?: string | null
  author: string | IUser
  isActive: boolean
  isVerified: boolean
  viewCount: number
  favoriteCount: number
  tags: string[]
  createdAt: string
  updatedAt: string
  // Virtuals
  owner?: string | IUser
  priceDisplay?: string
  ratingCategory?: string
  isOpen?: boolean | null
}

// Forward declarations to avoid circular import errors at the type level
// These are resolved at runtime — no actual circular dependency
import type { IUser } from './user'
import type { IReview } from './review'
```

- [ ] **Step 2: Commit**

```bash
git add backend/server/types/cafe.ts
git commit -m "feat(types): add cafe type definitions"
```

---

## Task 3: Create type definitions — `user.ts`, `review.ts`, `api.ts`, `index.ts`

**Files:**
- Create: `backend/server/types/user.ts`
- Create: `backend/server/types/review.ts`
- Create: `backend/server/types/api.ts`
- Create: `backend/server/types/index.ts`

- [ ] **Step 1: Create `backend/server/types/user.ts`**

```typescript
import type { AmenityKey, SpecialtyType } from './cafe'

export interface ILearnedAmenity {
  amenity: AmenityKey
  weight: number  // 0–1
}

export interface IPriceRange {
  min: number  // 1–4
  max: number  // 1–4
}

export interface IVisitedEntry {
  cafe: string  // ObjectId ref
  visitedAt: string
}

export interface IPreferenceHistory {
  cafeId: string
  weight: number  // favorite=2, high-rating review=1
  addedAt: string
}

export interface IUserPreferences {
  learned: {
    favoriteAmenities: ILearnedAmenity[]  // weighted objects, NOT flat strings
    favoriteSpecialties: SpecialtyType[]
    priceRange: IPriceRange               // {min, max} NOT number[]
    atmospherePreferences: string[]
  }
  manual: {
    dietaryRestrictions: string[]
    mustHaveAmenities: AmenityKey[]
    avoidAmenities: string[]
    preferredCities: string[]
  }
  lastUpdated: string
  confidence: number  // 0–1
}

export interface IUser {
  _id: string
  username: string
  email: string
  avatar?: string
  bio?: string
  role: 'user' | 'admin'
  favorites: string[]
  visited: IVisitedEntry[]
  preferences: IUserPreferences
  preferenceEmbedding?: number[]
  preferenceEmbeddingUpdatedAt?: string | null
  preferenceHistory?: IPreferenceHistory[]
  isActive: boolean
  isEmailVerified: boolean
  lastLogin?: string
  resetPasswordToken?: string
  resetPasswordExpire?: string
  emailVerificationToken?: string
  emailVerificationExpire?: string
  createdAt: string
  updatedAt: string
}
```

- [ ] **Step 2: Create `backend/server/types/review.ts`**

```typescript
import type { ICafe } from './cafe'
import type { IUser } from './user'

export interface IMultiDimRatings {
  taste: number        // required, 1–5
  price: number        // required, 1–5
  environment: number  // required, 1–5
  service: number      // required, 1–5
  workspace: number    // required, 1–5
  averageRating: number
}

export interface IDetailedRatings {
  coffee?: number
  ambience?: number
  service?: number
  value?: number
}

export interface IAiAnalysis {
  sentiment: 'positive' | 'negative' | 'neutral'
  keywords: string[]
  summary?: string
  confidence: number
  analyzedAt: string
}

export interface IHelpfulVote {
  user: string  // ObjectId ref
  vote: 'helpful' | 'not-helpful'
}

export interface IOwnerResponse {
  content: string
  respondedAt: string
  respondedBy: string  // ObjectId ref
}

export interface IReviewImage {
  url: string
  filename: string
  publicId?: string
  uploadedAt: string
  thumbnail?: string  // virtual
}

export interface IReview {
  _id: string
  content: string
  rating: number
  ratings: IMultiDimRatings   // field is `ratings` NOT `dimensions`
  detailedRatings?: IDetailedRatings
  cafe: string | ICafe
  author: string | IUser
  images: IReviewImage[]
  aiAnalysis?: IAiAnalysis
  helpfulCount: number
  notHelpfulCount: number
  helpfulVotes: IHelpfulVote[]
  isEdited: boolean
  editedAt?: string
  isReported: boolean          // field is `isReported` NOT `reported`
  reportCount: number
  isVerifiedVisit: boolean
  visitDate?: string
  ownerResponse?: IOwnerResponse  // field is `ownerResponse` NOT `response`
  createdAt: string
  updatedAt: string
}
```

- [ ] **Step 3: Create `backend/server/types/api.ts`**

```typescript
import { Request } from 'express'
import type { IUser } from './user'

// Extends Express Request with authenticated user (set by protect middleware)
export interface AuthRequest extends Request {
  user?: IUser
}

// Standard API response shape — matches responseHelper.js
export interface ApiResponse<T = unknown> {
  success: boolean
  message?: string
  data?: T
  pagination?: {
    page: number
    limit: number
    total: number
    pages: number
    count?: number
    hasNext?: boolean
    hasPrev?: boolean
  }
  errors?: string[]
}
```

- [ ] **Step 4: Create `backend/server/types/index.ts`**

```typescript
export * from './cafe'
export * from './user'
export * from './review'
export * from './api'
```

- [ ] **Step 5: Verify types compile**

```bash
cd backend && npx tsc --noEmit
```

Expected: No errors. (If you see "Cannot find module" errors, check the import paths in the type files.)

- [ ] **Step 6: Commit**

```bash
git add backend/server/types/
git commit -m "feat(types): add user, review, and api type definitions"
```

---

## Task 4: Migrate utility files

**Files:**
- Rename+modify: `backend/server/utils/asyncHandler.js` → `.ts`
- Rename+modify: `backend/server/utils/ExpressError.js` → `.ts`
- Rename+modify: `backend/server/utils/responseHelper.js` → `.ts`
- Rename+modify: `backend/server/utils/validation.js` → `.ts`
- Rename+modify: `backend/server/utils/geocoding.js` → `.ts`

- [ ] **Step 1: Migrate `asyncHandler.ts`**

Delete `asyncHandler.js` and create `asyncHandler.ts`:

```typescript
import { Request, Response, NextFunction } from 'express'

const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next)
  }
}

export default asyncHandler
```

- [ ] **Step 2: Migrate `ExpressError.ts`**

Delete `ExpressError.js` and create `ExpressError.ts`:

```typescript
class ExpressError extends Error {
  statusCode: number
  status: string
  isOperational: boolean

  constructor(message: string, statusCode: number) {
    super(message)
    this.statusCode = statusCode
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error'
    this.isOperational = true
    Error.captureStackTrace(this, this.constructor)
  }
}

export default ExpressError
```

- [ ] **Step 3: Migrate `responseHelper.ts`**

Delete `responseHelper.js` and create `responseHelper.ts`. Convert all `exports.fn = ` to `export const fn = `. Keep all function signatures and bodies identical — only change the export syntax:

```typescript
import { Response } from 'express'

export const successResponse = (res: Response, data: any, message = '操作成功', statusCode = 200) => {
  return res.status(statusCode).json({ success: true, message, data })
}

export const errorResponse = (res: Response, message = '操作失败', statusCode = 500, errors: any = null) => {
  const response: any = { success: false, message }
  if (errors) response.errors = errors
  return res.status(statusCode).json(response)
}

export const paginatedResponse = (res: Response, data: any[], total: number, page: number, limit: number, message = '获取成功') => {
  const pages = Math.ceil(total / limit)
  return res.status(200).json({
    success: true, message, data,
    pagination: {
      total, count: data.length, page: parseInt(String(page)),
      pages, limit: parseInt(String(limit)),
      hasNext: page < pages, hasPrev: page > 1
    }
  })
}

export const createdResponse = (res: Response, data: any, message = '创建成功') => {
  return res.status(201).json({ success: true, message, data })
}

export const deletedResponse = (res: Response, message = '删除成功', sendData = true) => {
  if (sendData) return res.status(200).json({ success: true, message, data: {} })
  return res.status(204).send()
}

export const notFoundResponse = (res: Response, message = '资源不存在') => {
  return res.status(404).json({ success: false, message })
}

export const unauthorizedResponse = (res: Response, message = '请先登录') => {
  return res.status(401).json({ success: false, message })
}

export const forbiddenResponse = (res: Response, message = '您没有权限访问此资源') => {
  return res.status(403).json({ success: false, message })
}

export const validationErrorResponse = (res: Response, errors: any, message = '数据验证失败') => {
  return res.status(400).json({ success: false, message, errors: Array.isArray(errors) ? errors : [errors] })
}

export const conflictResponse = (res: Response, message = '资源已存在') => {
  return res.status(409).json({ success: false, message })
}

export const rateLimitResponse = (res: Response, message = '请求过于频繁，请稍后再试') => {
  return res.status(429).json({ success: false, message })
}

export const serverErrorResponse = (res: Response, message = '服务器内部错误', error: any = null) => {
  const response: any = { success: false, message }
  if (process.env.NODE_ENV !== 'production' && error) {
    response.error = { message: error.message, stack: error.stack }
  }
  return res.status(500).json(response)
}
```

- [ ] **Step 4: Migrate `validation.ts` and `geocoding.ts`**

For each file, delete the `.js` version and create a `.ts` version. The only changes are:
- Replace all `const { x } = require('y')` with `import { x } from 'y'`
- Replace `module.exports = { ... }` with `export { ... }` or add `export` keyword to each function/const
- Keep all logic identical

- [ ] **Step 5: Verify compilation**

```bash
cd backend && npx tsc --noEmit
```

Expected: No errors from the utils files. (Errors from files that still use `require` to import utils are fine — they'll be fixed in later tasks.)

- [ ] **Step 6: Commit**

```bash
git add backend/server/utils/
git commit -m "feat(ts): migrate utility files to TypeScript"
```

---

## Task 5: Migrate `middleware/auth.ts`

**Files:**
- Rename+modify: `backend/server/middleware/auth.js` → `.ts`

- [ ] **Step 1: Rename the file**

```bash
mv backend/server/middleware/auth.js backend/server/middleware/auth.ts
```

- [ ] **Step 2: Update imports at the top of `auth.ts`**

Replace all `require()` calls with `import` statements:

```typescript
import { Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import User from '../models/user'
import ExpressError from '../utils/ExpressError'
import asyncHandler from '../utils/asyncHandler'
import { AuthRequest } from '../types'
```

- [ ] **Step 3: Type the middleware function signatures**

Every middleware function currently has `(req, res, next)`. Update to:

```typescript
export const protect = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
  // body unchanged
})

export const optionalAuth = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
  // body unchanged
})

export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    // body unchanged
  }
}

export const checkOwnership = (Model: any) => asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
  // body unchanged
})
```

- [ ] **Step 4: Remove `module.exports` at the bottom**

The named `export const` declarations above replace `module.exports = { protect, optionalAuth, ... }`. Delete the `module.exports` line.

- [ ] **Step 5: Verify compilation**

```bash
cd backend && npx tsc --noEmit
```

- [ ] **Step 6: Commit**

```bash
git add backend/server/middleware/auth.ts
git commit -m "feat(ts): migrate auth middleware to TypeScript"
```

---

## Task 6: Migrate Mongoose models

**Files:**
- Rename+modify: `backend/server/models/cafe.js` → `.ts`
- Rename+modify: `backend/server/models/user.js` → `.ts`
- Rename+modify: `backend/server/models/review.js` → `.ts`

This task uses Mongoose v8's native TypeScript pattern: `new Schema<IModel>({...})` and `model<IModel>(...)`.

- [ ] **Step 1: Migrate `models/cafe.ts`**

Rename the file:
```bash
mv backend/server/models/cafe.js backend/server/models/cafe.ts
```

Replace the top of the file:
```typescript
import mongoose, { Schema, model, HydratedDocument } from 'mongoose'
import { ICafe, AmenityKey, SpecialtyType, DayKey, VibeType } from '../types'
// Remove the Review require — use mongoose.model('Review') lazily inside methods (already done)
```

Update `ImageSchema`:
```typescript
const ImageSchema = new Schema({
  // body unchanged
})
```

Update `OpeningHoursSchema` — update the `day` enum values to English keys:
```typescript
const OpeningHoursSchema = new Schema({
  day: {
    type: String,
    enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
  },
  open: String,
  close: String,
  closed: { type: Boolean, default: false }
}, { _id: false })
```

Update `CafeSchema` — add the generic type and update enum values:
```typescript
const CafeSchema = new Schema<ICafe>({
  // ... all fields unchanged EXCEPT:
  amenities: [{
    type: String,
    enum: ['wifi', 'power_outlet', 'quiet', 'outdoor_seating', 'pet_friendly',
           'no_smoking', 'air_conditioning', 'parking', 'wheelchair_accessible',
           'laptop_friendly', 'group_friendly', 'work_friendly'] as AmenityKey[]
  }],
  specialty: {
    type: String,
    enum: ['espresso', 'pour_over', 'cold_brew', 'latte_art', 'specialty_beans', 'desserts', 'light_meals'],
    default: 'espresso'
  },
  vibe: {
    type: String,
    enum: ['Specialty', 'Cozy Vibes', 'Work-Friendly', 'Outdoor', 'Hidden Gems', 'New Openings']
  },
  // all other fields unchanged
}, opts)
```

Replace `module.exports` at the bottom:
```typescript
export default model<ICafe>('Cafe', CafeSchema)
```

- [ ] **Step 2: Migrate `models/user.ts`**

```bash
mv backend/server/models/user.js backend/server/models/user.ts
```

Replace the top:
```typescript
import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { IUser, AmenityKey } from '../types'
```

Update `userSchema` to use the generic type and English enum values:
```typescript
const userSchema = new mongoose.Schema<IUser>({
  // all fields unchanged EXCEPT the amenity enums:
  // In preferences.learned.favoriteAmenities:
  favoriteAmenities: [{
    amenity: {
      type: String,
      enum: ['wifi', 'power_outlet', 'quiet', 'outdoor_seating', 'pet_friendly',
             'no_smoking', 'air_conditioning', 'parking', 'wheelchair_accessible',
             'laptop_friendly', 'group_friendly', 'work_friendly']
    },
    weight: { type: Number, min: 0, max: 1, default: 0.5 }
  }],
  // In preferences.manual.mustHaveAmenities and avoidAmenities — same enum list
})
```

Replace `module.exports`:
```typescript
export default mongoose.model<IUser>('User', userSchema)
```

- [ ] **Step 3: Migrate `models/review.ts`**

```bash
mv backend/server/models/review.js backend/server/models/review.ts
```

Replace the top:
```typescript
import mongoose, { Schema, model } from 'mongoose'
import { IReview } from '../types'
```

Update `reviewSchema`:
```typescript
const reviewSchema = new Schema<IReview>({
  // all fields unchanged
})
```

Replace `module.exports`:
```typescript
export default model<IReview>('Review', reviewSchema)
```

- [ ] **Step 4: Verify compilation**

```bash
cd backend && npx tsc --noEmit
```

Expected: No new errors from the model files. Errors in controllers/routes that still use `require` are fine.

- [ ] **Step 5: Commit**

```bash
git add backend/server/models/
git commit -m "feat(ts): migrate Mongoose models to TypeScript"
```

---

## Task 7: Migrate services

**Files:**
- Rename+modify: `backend/server/services/aiService.js` → `.ts`
- Rename+modify: `backend/server/services/emailService.js` → `.ts`
- Rename+modify: `backend/server/services/cloudinary.js` → `.ts`
- Rename+modify: `backend/server/services/embeddingService.js` → `.ts`
- Rename+modify: `backend/server/services/vectorService.js` → `.ts`

- [ ] **Step 1: Rename all service files**

```bash
mv backend/server/services/aiService.js backend/server/services/aiService.ts
mv backend/server/services/emailService.js backend/server/services/emailService.ts
mv backend/server/services/cloudinary.js backend/server/services/cloudinary.ts
mv backend/server/services/embeddingService.js backend/server/services/embeddingService.ts
mv backend/server/services/vectorService.js backend/server/services/vectorService.ts
```

- [ ] **Step 2: Update imports and exports in each service**

For each file, apply the standard conversion:
- Replace `const X = require('y')` → `import X from 'y'`
- Replace `const { a, b } = require('y')` → `import { a, b } from 'y'`
- Replace `module.exports = { fn1, fn2 }` → `export { fn1, fn2 }`
- Or replace `module.exports = X` → `export default X`

Keep all business logic identical. No type annotations required on service functions — loose mode means TypeScript will infer or allow `any`.

- [ ] **Step 3: Fix `embeddingService.ts` dynamic require**

`embeddingService.js` likely uses `require('@xenova/transformers')` with a dynamic import pattern. Update to:

```typescript
// If the file uses dynamic require:
const { pipeline } = await import('@xenova/transformers')
// This pattern is already async-compatible — no change needed to logic
```

If the file uses `require` at the top level (not dynamic), convert to `import`.

- [ ] **Step 4: Verify compilation**

```bash
cd backend && npx tsc --noEmit
```

- [ ] **Step 5: Commit**

```bash
git add backend/server/services/
git commit -m "feat(ts): migrate service files to TypeScript"
```

---

## Task 8: Migrate routes

**Files:**
- Rename+modify: `backend/server/routes/auth.js` → `.ts`
- Rename+modify: `backend/server/routes/cafes.js` → `.ts`
- Rename+modify: `backend/server/routes/users.js` → `.ts`
- Rename+modify: `backend/server/routes/reviews.js` → `.ts`
- Rename+modify: `backend/server/routes/reviewsStandalone.js` → `.ts`
- Rename+modify: `backend/server/routes/recommendations.js` → `.ts`

- [ ] **Step 1: Rename all route files**

```bash
mv backend/server/routes/auth.js backend/server/routes/auth.ts
mv backend/server/routes/cafes.js backend/server/routes/cafes.ts
mv backend/server/routes/users.js backend/server/routes/users.ts
mv backend/server/routes/reviews.js backend/server/routes/reviews.ts
mv backend/server/routes/reviewsStandalone.js backend/server/routes/reviewsStandalone.ts
mv backend/server/routes/recommendations.js backend/server/routes/recommendations.ts
```

- [ ] **Step 2: Update each route file**

For each route file, the pattern is:

```typescript
// Before:
const express = require('express')
const router = express.Router()
const { protect, authorize } = require('../middleware/auth')
const { login, register } = require('../controllers/authController')
module.exports = router

// After:
import express from 'express'
const router = express.Router()
import { protect, authorize } from '../middleware/auth'
import { login, register } from '../controllers/authController'
export default router
```

Route definitions (`.get()`, `.post()`, etc.) stay completely unchanged.

- [ ] **Step 3: Verify compilation**

```bash
cd backend && npx tsc --noEmit
```

- [ ] **Step 4: Commit**

```bash
git add backend/server/routes/
git commit -m "feat(ts): migrate route files to TypeScript"
```

---

## Task 9: Migrate controllers — `authController`, `cafeController`, `aiSearchController`

**Files:**
- Rename+modify: `backend/server/controllers/authController.js` → `.ts`
- Rename+modify: `backend/server/controllers/cafeController.js` → `.ts`
- Rename+modify: `backend/server/controllers/aiSearchController.js` → `.ts`

Controllers are the largest files. The key changes per controller are:
1. Convert all `require` to `import`
2. Add `req: AuthRequest` type annotation to every function
3. Convert `module.exports` to named exports

- [ ] **Step 1: Rename files**

```bash
mv backend/server/controllers/authController.js backend/server/controllers/authController.ts
mv backend/server/controllers/cafeController.js backend/server/controllers/cafeController.ts
mv backend/server/controllers/aiSearchController.js backend/server/controllers/aiSearchController.ts
```

- [ ] **Step 2: Update `authController.ts`**

Replace imports at the top:

```typescript
import { Response } from 'express'
import User from '../models/user'
import asyncHandler from '../utils/asyncHandler'
import ExpressError from '../utils/ExpressError'
import { AuthRequest } from '../types'
// keep any other imports (crypto, emailService, etc.) converted to import syntax
```

Update every controller function signature. Pattern:

```typescript
// Before:
const login = asyncHandler(async (req, res) => { ... })

// After:
const login = asyncHandler(async (req: AuthRequest, res: Response) => { ... })
```

Remove `module.exports` at the bottom and replace with named exports:

```typescript
export { login, register, logout, forgotPassword, resetPassword, refreshToken, verifyEmail, resendVerificationEmail, updatePassword }
```

Keep all function bodies identical.

- [ ] **Step 3: Update `cafeController.ts`**

Same pattern as `authController.ts`:
- Convert `require` → `import`
- Add `req: AuthRequest` to all functions
- Replace `module.exports` with named `export { ... }`

- [ ] **Step 4: Update `aiSearchController.ts`**

Same pattern.

- [ ] **Step 5: Verify compilation**

```bash
cd backend && npx tsc --noEmit
```

- [ ] **Step 6: Commit**

```bash
git add backend/server/controllers/authController.ts backend/server/controllers/cafeController.ts backend/server/controllers/aiSearchController.ts
git commit -m "feat(ts): migrate auth, cafe, and AI search controllers to TypeScript"
```

---

## Task 10: Migrate controllers — `userController`, `reviewController`, `recommendationController`

**Files:**
- Rename+modify: `backend/server/controllers/userController.js` → `.ts`
- Rename+modify: `backend/server/controllers/reviewController.js` → `.ts`
- Rename+modify: `backend/server/controllers/recommendationController.js` → `.ts`

- [ ] **Step 1: Rename files**

```bash
mv backend/server/controllers/userController.js backend/server/controllers/userController.ts
mv backend/server/controllers/reviewController.js backend/server/controllers/reviewController.ts
mv backend/server/controllers/recommendationController.js backend/server/controllers/recommendationController.ts
```

- [ ] **Step 2: Apply the same pattern to all three**

For each file:
- Replace all `require()` with `import`
- Add `req: AuthRequest, res: Response` to every function
- Replace `module.exports = { ... }` with `export { ... }`
- Keep all function bodies identical

- [ ] **Step 3: Verify compilation**

```bash
cd backend && npx tsc --noEmit
```

Expected: Zero errors. If errors remain, they will be import path issues — check that all renamed files are being imported with the correct `.ts`-less path.

- [ ] **Step 4: Commit**

```bash
git add backend/server/controllers/userController.ts backend/server/controllers/reviewController.ts backend/server/controllers/recommendationController.ts
git commit -m "feat(ts): migrate user, review, and recommendation controllers to TypeScript"
```

---

## Task 11: Migrate `server.ts`

**Files:**
- Rename+modify: `backend/server/server.js` → `.ts`

- [ ] **Step 1: Rename the file**

```bash
mv backend/server/server.js backend/server/server.ts
```

- [ ] **Step 2: Replace all `require()` with `import`**

```typescript
import express from 'express'
import mongoose from 'mongoose'
import cors from 'cors'
import helmet from 'helmet'
import mongoSanitize from 'express-mongo-sanitize'
import rateLimit from 'express-rate-limit'
import cookieParser from 'cookie-parser'
import dotenv from 'dotenv'
import authRoutes from './routes/auth'
import userRoutes from './routes/users'
import cafeRoutes from './routes/cafes'
import reviewRoutes from './routes/reviews'
import reviewsStandaloneRoutes from './routes/reviewsStandalone'
import recommendationRoutes from './routes/recommendations'
// ... any other imports (check server.js for the full list)
```

Keep all middleware setup, route mounting, error handler, and server listen logic identical.

- [ ] **Step 3: Verify full build**

```bash
cd backend && npx tsc --noEmit
```

Expected: Zero errors across the entire codebase.

- [ ] **Step 4: Verify the dev server starts**

```bash
cd backend && npm run dev
```

Expected: Server starts on port 5001, MongoDB connects, no runtime errors in the console.

- [ ] **Step 5: Commit**

```bash
git add backend/server/server.ts
git commit -m "feat(ts): migrate server entry point to TypeScript"
```

---

## Task 12: Write DB enum migration script

**Files:**
- Create: `backend/server/seeds/migrate_enum_keys.ts`

This script runs once against the live database to rename all Chinese/bilingual enum values to English short keys.

- [ ] **Step 1: Create `backend/server/seeds/migrate_enum_keys.ts`**

```typescript
import mongoose from 'mongoose'
import dotenv from 'dotenv'
dotenv.config()

const AMENITY_MAP: Record<string, string> = {
  'WiFi': 'wifi',
  '电源插座': 'power_outlet',
  '安静环境': 'quiet',
  '户外座位': 'outdoor_seating',
  '宠物友好': 'pet_friendly',
  '禁烟': 'no_smoking',
  '空调': 'air_conditioning',
  '提供停车位': 'parking',
  '无障碍通行（轮椅可进入）': 'wheelchair_accessible',
  '适合使用笔记本电脑': 'laptop_friendly',
  '适合团体聚会': 'group_friendly',
  '适合工作 / 办公': 'work_friendly',
}

const SPECIALTY_MAP: Record<string, string> = {
  '意式浓缩 Espresso': 'espresso',
  '手冲咖啡 Pour Over': 'pour_over',
  '冷萃咖啡 Cold Brew': 'cold_brew',
  '拉花咖啡 Latte Art': 'latte_art',
  '精品咖啡豆 Specialty Beans': 'specialty_beans',
  '甜点 Desserts': 'desserts',
  '轻食 Light Meals': 'light_meals',
}

const DAY_MAP: Record<string, string> = {
  '周一': 'monday',
  '周二': 'tuesday',
  '周三': 'wednesday',
  '周四': 'thursday',
  '周五': 'friday',
  '周六': 'saturday',
  '周日': 'sunday',
}

async function migrateEnums() {
  const db = mongoose.connection.db!
  const cafes = db.collection('cafes')
  const users = db.collection('users')

  // --- Cafe bulk write ---
  const allCafes = await cafes.find({}).toArray()
  const cafeBulk = allCafes.map((cafe: any) => ({
    updateOne: {
      filter: { _id: cafe._id },
      update: {
        $set: {
          amenities: (cafe.amenities || []).map((a: string) => AMENITY_MAP[a] ?? a),
          specialty: SPECIALTY_MAP[cafe.specialty] ?? cafe.specialty,
          openingHours: (cafe.openingHours || []).map((h: any) => ({
            ...h,
            day: DAY_MAP[h.day] ?? h.day
          }))
        }
      }
    }
  }))
  if (cafeBulk.length > 0) await cafes.bulkWrite(cafeBulk)
  console.log(`✅ Cafes updated: ${cafeBulk.length}`)

  // --- User bulk write ---
  const allUsers = await users.find({}).toArray()
  const userBulk = allUsers.map((user: any) => {
    const learned = user.preferences?.learned || {}
    const manual = user.preferences?.manual || {}

    // favoriteAmenities is [{amenity, weight}] — update the nested amenity field
    const newFavoriteAmenities = (learned.favoriteAmenities || []).map((entry: any) => ({
      ...entry,
      amenity: AMENITY_MAP[entry.amenity] ?? entry.amenity
    }))
    const newFavoriteSpecialties = (learned.favoriteSpecialties || []).map((s: string) => SPECIALTY_MAP[s] ?? s)
    const newMustHave = (manual.mustHaveAmenities || []).map((a: string) => AMENITY_MAP[a] ?? a)
    const newAvoid = (manual.avoidAmenities || []).map((a: string) => AMENITY_MAP[a] ?? a)

    return {
      updateOne: {
        filter: { _id: user._id },
        update: {
          $set: {
            'preferences.learned.favoriteAmenities': newFavoriteAmenities,
            'preferences.learned.favoriteSpecialties': newFavoriteSpecialties,
            'preferences.manual.mustHaveAmenities': newMustHave,
            'preferences.manual.avoidAmenities': newAvoid,
          }
        }
      }
    }
  })
  if (userBulk.length > 0) await users.bulkWrite(userBulk)
  console.log(`✅ Users updated: ${userBulk.length}`)
}

async function main() {
  await mongoose.connect(process.env.MONGODB_URI!)
  console.log('Connected to MongoDB')
  try {
    await migrateEnums()
    console.log('✅ Migration complete')
  } catch (err) {
    console.error('❌ Migration failed:', err)
  } finally {
    await mongoose.disconnect()
  }
}

main()
```

- [ ] **Step 2: Verify the script compiles**

```bash
cd backend && npx tsc --noEmit
```

- [ ] **Step 3: Run the migration against the database**

⚠️ Make sure MongoDB is running and `.env` is configured before this step.

```bash
cd backend && npx tsx server/seeds/migrate_enum_keys.ts
```

Expected output:
```
Connected to MongoDB
✅ Cafes updated: N
✅ Users updated: N
✅ Migration complete
```

- [ ] **Step 4: Commit**

```bash
git add backend/server/seeds/migrate_enum_keys.ts
git commit -m "feat(db): add enum key migration script for amenities, specialties, and days"
```

---

## Task 13: Create i18n translation files

**Files:**
- Create: `frontend/src/locales/en/amenities.json`
- Create: `frontend/src/locales/zh/amenities.json`
- Create: `frontend/src/locales/en/specialties.json`
- Create: `frontend/src/locales/zh/specialties.json`
- Create: `frontend/src/locales/en/days.json`
- Create: `frontend/src/locales/zh/days.json`

- [ ] **Step 1: Create `frontend/src/locales/en/amenities.json`**

```json
{
  "wifi": "WiFi",
  "power_outlet": "Power Outlet",
  "quiet": "Quiet Space",
  "outdoor_seating": "Outdoor Seating",
  "pet_friendly": "Pet Friendly",
  "no_smoking": "No Smoking",
  "air_conditioning": "Air Conditioning",
  "parking": "Parking",
  "wheelchair_accessible": "Wheelchair Accessible",
  "laptop_friendly": "Laptop Friendly",
  "group_friendly": "Group Friendly",
  "work_friendly": "Work Friendly"
}
```

- [ ] **Step 2: Create `frontend/src/locales/zh/amenities.json`**

```json
{
  "wifi": "WiFi",
  "power_outlet": "电源插座",
  "quiet": "安静环境",
  "outdoor_seating": "户外座位",
  "pet_friendly": "宠物友好",
  "no_smoking": "禁烟",
  "air_conditioning": "空调",
  "parking": "提供停车位",
  "wheelchair_accessible": "无障碍通行（轮椅可进入）",
  "laptop_friendly": "适合使用笔记本电脑",
  "group_friendly": "适合团体聚会",
  "work_friendly": "适合工作 / 办公"
}
```

- [ ] **Step 3: Create `frontend/src/locales/en/specialties.json`**

```json
{
  "espresso": "Espresso",
  "pour_over": "Pour Over",
  "cold_brew": "Cold Brew",
  "latte_art": "Latte Art",
  "specialty_beans": "Specialty Beans",
  "desserts": "Desserts",
  "light_meals": "Light Meals"
}
```

- [ ] **Step 4: Create `frontend/src/locales/zh/specialties.json`**

```json
{
  "espresso": "意式浓缩",
  "pour_over": "手冲咖啡",
  "cold_brew": "冷萃咖啡",
  "latte_art": "拉花咖啡",
  "specialty_beans": "精品咖啡豆",
  "desserts": "甜点",
  "light_meals": "轻食"
}
```

- [ ] **Step 5: Create `frontend/src/locales/en/days.json`**

```json
{
  "monday": "Monday",
  "tuesday": "Tuesday",
  "wednesday": "Wednesday",
  "thursday": "Thursday",
  "friday": "Friday",
  "saturday": "Saturday",
  "sunday": "Sunday"
}
```

- [ ] **Step 6: Create `frontend/src/locales/zh/days.json`**

```json
{
  "monday": "周一",
  "tuesday": "周二",
  "wednesday": "周三",
  "thursday": "周四",
  "friday": "周五",
  "saturday": "周六",
  "sunday": "周日"
}
```

- [ ] **Step 7: Register new namespaces in `frontend/src/i18n.js`**

Replace the existing import block and resources object in `frontend/src/i18n.js`:

```javascript
// Before:
import enCommon from './locales/en/common.json';
import enHome from './locales/en/home.json';
import enCafeList from './locales/en/cafeList.json';
import zhCommon from './locales/zh/common.json';
import zhHome from './locales/zh/home.json';
import zhCafeList from './locales/zh/cafeList.json';

// resources:
resources: {
    en: { common: enCommon, home: enHome, cafeList: enCafeList },
    zh: { common: zhCommon, home: zhHome, cafeList: zhCafeList },
},

// After:
import enCommon from './locales/en/common.json';
import enHome from './locales/en/home.json';
import enCafeList from './locales/en/cafeList.json';
import enAmenities from './locales/en/amenities.json';
import enSpecialties from './locales/en/specialties.json';
import enDays from './locales/en/days.json';
import zhCommon from './locales/zh/common.json';
import zhHome from './locales/zh/home.json';
import zhCafeList from './locales/zh/cafeList.json';
import zhAmenities from './locales/zh/amenities.json';
import zhSpecialties from './locales/zh/specialties.json';
import zhDays from './locales/zh/days.json';

// resources:
resources: {
    en: { common: enCommon, home: enHome, cafeList: enCafeList, amenities: enAmenities, specialties: enSpecialties, days: enDays },
    zh: { common: zhCommon, home: zhHome, cafeList: zhCafeList, amenities: zhAmenities, specialties: zhSpecialties, days: zhDays },
},
```

- [ ] **Step 8: Commit**

```bash
git add frontend/src/locales/
git commit -m "feat(i18n): add amenities, specialties, and days translation namespaces"
```

---

## Task 14: Final verification

- [ ] **Step 1: Clean build**

```bash
cd backend && npm run build
```

Expected: `dist/` directory created, no TypeScript errors.

- [ ] **Step 2: Start dev server and verify runtime**

```bash
cd backend && npm run dev
```

Expected: Server starts, MongoDB connects, no runtime errors.

- [ ] **Step 3: Smoke test key endpoints**

With the server running, test a few endpoints manually or with curl:

```bash
# Should return cafes from DB
curl http://localhost:5001/api/cafes

# Should return 401 (no token)
curl http://localhost:5001/api/users/me
```

- [ ] **Step 4: Final commit**

```bash
git add .
git commit -m "feat: complete backend TypeScript migration (Phases 1 + 2)"
```
