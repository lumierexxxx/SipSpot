# Full-Stack TypeScript Migration — Design Spec

**Date:** 2026-03-20
**Status:** Approved
**Scope:** Backend TypeScript migration (Phases 1 + 2). Frontend migration + UI redesign is a separate spec.

---

## Overview

Migrate SipSpot from JavaScript (CommonJS) to TypeScript across the full stack. The migration is split into three phases executed sequentially; this spec covers Phases 1 and 2 only.

**Goals:**
- Type-safe API contracts from model → controller → response → frontend service
- Catch bugs at compile time (especially null access, enum mismatches, wrong field names)
- Enable the frontend UI redesign to consume typed data shapes
- Fix the known amenity enum mismatch bug via language-neutral keys

**Non-goals:**
- No logic changes — this is types only, business logic stays identical
- No strict mode — `noImplicitAny` and `strictNullChecks` are disabled initially and tightened in a separate pass
- No frontend migration (Phase 3 is a separate spec)
- No refactoring of unrelated code

---

## Phases

| Phase | Scope | This spec? |
|---|---|---|
| 1 | Type definitions (`backend/server/types/`) | ✅ |
| 2 | Backend TypeScript migration | ✅ |
| 3 | Frontend TS migration + UI redesign | ❌ Separate spec |

---

## Phase 1: Type Definitions

### Location

`backend/server/types/` — four files exported through a barrel `index.ts`.

### `cafe.ts`

```typescript
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

export type SpecialtyType =
  | '意式浓缩 Espresso'
  | '手冲咖啡 Pour Over'
  | string // allow future additions

export interface IOpeningHours {
  day: '周一' | '周二' | '周三' | '周四' | '周五' | '周六' | '周日'
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
  images: string[]
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
  createdAt: string
  updatedAt: string
}
```

### `user.ts`

```typescript
import { AmenityKey, SpecialtyType } from './cafe'

export interface IUserPreferences {
  learned: {
    favoriteAmenities: AmenityKey[]        // uses short keys, not Chinese strings
    favoriteSpecialties: SpecialtyType[]
    preferredPriceRange: number[]
    visitCount: number
  }
  manual: {
    preferredAmenities: AmenityKey[]
    preferredSpecialties: SpecialtyType[]
    preferredPriceRange: number[]
    preferredCities: string[]
  }
}

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
```

### `review.ts`

```typescript
import { ICafe } from './cafe'
import { IUser } from './user'

export interface IMultiDimRating {
  taste?: number
  price?: number
  environment?: number
  service?: number
  workspace?: number
}

export interface IAiAnalysis {
  sentiment?: 'positive' | 'negative' | 'neutral'
  keywords?: string[]
  summary?: string
}

export interface IReview {
  _id: string
  content: string
  rating: number           // overall, 0.5 increments
  dimensions: IMultiDimRating
  cafe: string | ICafe
  author: string | IUser
  images: string[]
  aiAnalysis?: IAiAnalysis
  helpful: string[]
  reported: boolean
  response?: string
  createdAt: string
  updatedAt: string
}
```

### `api.ts`

```typescript
import { Request } from 'express'
import { IUser } from './user'

export interface AuthRequest extends Request {
  user?: IUser
}

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

### `index.ts` (barrel export)

```typescript
export * from './cafe'
export * from './user'
export * from './review'
export * from './api'
```

---

## Phase 2: Backend Migration

### New dependencies

```json
{
  "devDependencies": {
    "typescript": "^5.4.0",
    "tsx": "^4.7.0",
    "@types/node": "^20.0.0",
    "@types/express": "^4.17.21",
    "@types/bcryptjs": "^2.4.6",
    "@types/jsonwebtoken": "^9.0.6",
    "@types/cors": "^2.8.17",
    "@types/multer": "^1.4.11",
    "@types/nodemailer": "^6.4.14"
  }
}
```

Mongoose ships its own types — no `@types/mongoose` needed.

### Dev script changes (`package.json`)

```json
{
  "scripts": {
    "dev": "tsx watch server/server.ts",
    "start": "node dist/server.js",
    "build": "tsc"
  }
}
```

`tsx` replaces `nodemon` — runs TypeScript directly in development with no compilation step. The production `start` script runs the compiled output from `tsc`.

### `tsconfig.json` (backend root)

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
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

**Loose mode rationale:** `noImplicitAny` and `strictNullChecks` are disabled for the migration. They will be enabled in a separate tightening pass after the codebase is fully compiling — one file at a time, with explanations for each error.

### File renames

Every file in `backend/server/` is renamed `.js` → `.ts`. No exceptions. The renamed files are the only change at the file system level.

### Mongoose model typing pattern

```typescript
import { Schema, model, Document } from 'mongoose'
import { ICafe } from '../types'

type CafeDocument = ICafe & Document

const cafeSchema = new Schema<CafeDocument>({
  // schema definition unchanged
})

export default model<CafeDocument>('Cafe', cafeSchema)
```

This pattern is applied to all three models: `Cafe`, `User`, `Review`.

### Controller typing pattern

```typescript
import { Response } from 'express'
import { AuthRequest, ApiResponse, IUser } from '../types'

const getMe = asyncHandler(
  async (req: AuthRequest, res: Response<ApiResponse<IUser>>) => {
    const user = await User.findById(req.user?._id)
    res.json({ success: true, data: user })
  }
)
```

`AuthRequest` replaces all `(req as any).user` casts across the six controller files.

### Middleware typing

```typescript
import { Response, NextFunction } from 'express'
import { AuthRequest } from '../types'

export const protect = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  // existing logic unchanged
}
```

---

## Amenity Key DB Migration

### Rationale

The current `Cafe.amenities` enum stores Chinese strings (e.g. `'电源插座'`). The `User.preferences.learned.favoriteAmenities` enum uses English strings (e.g. `'Power Outlets'`). This mismatch means the recommendation engine can never match user preferences to cafe amenities.

Migrating to language-neutral short keys fixes this permanently and enables future languages (Japanese, Korean, etc.) with no further DB changes — only a new i18n JSON file.

### Key mapping

| Old value (Chinese/mixed) | New key |
|---|---|
| `WiFi` | `wifi` |
| `电源插座` | `power_outlet` |
| `安静环境` | `quiet` |
| `户外座位` | `outdoor_seating` |
| `宠物友好` | `pet_friendly` |
| `禁烟` | `no_smoking` |
| `空调` | `air_conditioning` |
| `提供停车位` | `parking` |
| `无障碍通行（轮椅可进入）` | `wheelchair_accessible` |
| `适合使用笔记本电脑` | `laptop_friendly` |
| `适合团体聚会` | `group_friendly` |
| `适合工作 / 办公` | `work_friendly` |

### Migration script

A one-time script at `backend/server/seeds/migrate_amenity_keys.ts`:
- Loads the mapping above
- Iterates all Cafe documents and replaces amenity values
- Iterates all User documents and replaces preference amenity values
- Logs a summary (X cafes updated, Y users updated)
- Is idempotent — safe to run multiple times

### i18n translation additions

After the migration, add an `amenities` namespace to existing translation files:

```json
// frontend/src/locales/en/amenities.json
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

```json
// frontend/src/locales/zh/amenities.json
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

---

## What Does Not Change

- All business logic in controllers, services, and middleware
- MongoDB schema shapes (only amenity enum values change)
- API routes and response formats
- Auth flow (JWT in cookies, refresh token rotation)
- Rate limiting, security middleware
- Cloudinary, email service, AI service logic
- Frontend (Phase 3 spec)

---

## Strictness Tightening Plan (Post-Migration)

After the full migration compiles cleanly, a separate tightening pass enables strict flags one at a time:

1. Enable `noImplicitAny: true` — fix all untyped variables file by file
2. Enable `strictNullChecks: true` — fix all potential null/undefined access
3. Enable `strict: true` — catches remaining edge cases

Each step is done file by file with explanations for every error encountered.

---

## File Checklist

### New files
- `backend/tsconfig.json`
- `backend/server/types/index.ts`
- `backend/server/types/cafe.ts`
- `backend/server/types/user.ts`
- `backend/server/types/review.ts`
- `backend/server/types/api.ts`
- `backend/server/seeds/migrate_amenity_keys.ts`
- `frontend/src/locales/en/amenities.json`
- `frontend/src/locales/zh/amenities.json`

### Renamed files (`.js` → `.ts`)
- `backend/server/server.js`
- `backend/server/controllers/authController.js`
- `backend/server/controllers/cafeController.js`
- `backend/server/controllers/aiSearchController.js`
- `backend/server/controllers/userController.js`
- `backend/server/controllers/reviewController.js`
- `backend/server/controllers/recommendationController.js`
- `backend/server/models/cafe.js`
- `backend/server/models/user.js`
- `backend/server/models/review.js`
- `backend/server/routes/auth.js`
- `backend/server/routes/cafes.js`
- `backend/server/routes/users.js`
- `backend/server/routes/reviews.js`
- `backend/server/routes/reviewsStandalone.js`
- `backend/server/routes/recommendations.js`
- `backend/server/middleware/auth.js`
- `backend/server/services/aiService.js`
- `backend/server/services/emailService.js`
- `backend/server/services/cloudinary.js`
- `backend/server/services/embeddingService.js`
- `backend/server/services/vectorService.js`
- `backend/server/utils/ExpressError.js`
- `backend/server/utils/asyncHandler.js`
- `backend/server/utils/validation.js`
- `backend/server/utils/responseHelper.js`
