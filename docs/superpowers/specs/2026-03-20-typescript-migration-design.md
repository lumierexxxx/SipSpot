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
  // Virtuals (populated when toJSON virtuals: true)
  thumbnail?: string
  cardImage?: string
}

// Language-neutral day keys (replaces Chinese day names in DB)
export type DayKey =
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
  | 'sunday'

export interface IOpeningHours {
  day: DayKey
  open: string    // e.g. "09:00"
  close: string   // e.g. "22:00"
  closed: boolean // note: field is `closed`, not `isClosed`
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
  geometry: IGeometry           // GeoJSON field — NOT `location`
  address: string
  city: string
  price: 1 | 2 | 3 | 4
  amenities: AmenityKey[]
  specialty: SpecialtyType      // singular string — NOT an array
  vibe?: VibeType
  openingHours: IOpeningHours[]
  phoneNumber?: string
  rating: number
  reviewCount: number
  reviews: string[] | IReview[]
  aiSummary?: IAiSummary
  embedding?: number[]          // select: false — only present when explicitly selected
  embeddingUpdatedAt?: string | null
  author: string | IUser        // populated or ObjectId string; aliased as `owner`
  isActive: boolean
  isVerified: boolean
  viewCount: number
  favoriteCount: number
  tags: string[]
  createdAt: string
  updatedAt: string
  // Virtuals
  owner?: string | IUser        // alias of author
  priceDisplay?: string
  ratingCategory?: string
  isOpen?: boolean | null
}
```

### `user.ts`

```typescript
import { AmenityKey, SpecialtyType } from './cafe'

export interface ILearnedAmenity {
  amenity: AmenityKey   // weighted preference entry — NOT a flat string array
  weight: number        // 0–1
}

export interface IPriceRange {
  min: number           // 1–4
  max: number           // 1–4
}

export interface IVisitedEntry {
  cafe: string          // ObjectId ref to Cafe
  visitedAt: string
}

export interface IPreferenceHistory {
  cafeId: string
  weight: number        // favorite=2, high-rating review=1
  addedAt: string
}

export interface IUserPreferences {
  learned: {
    favoriteAmenities: ILearnedAmenity[]  // weighted objects, not flat array
    favoriteSpecialties: SpecialtyType[]
    priceRange: IPriceRange               // {min, max} — NOT number[]
    atmospherePreferences: string[]
  }
  manual: {
    dietaryRestrictions: string[]
    mustHaveAmenities: AmenityKey[]
    avoidAmenities: string[]
    preferredCities: string[]
  }
  lastUpdated: string
  confidence: number  // 0–1, based on volume of behavioral data
}

export interface IUser {
  _id: string
  username: string
  email: string
  avatar?: string
  bio?: string
  role: 'user' | 'admin'
  favorites: string[]
  visited: IVisitedEntry[]              // array of {cafe, visitedAt} objects
  preferences: IUserPreferences
  // Embedding fields (select: false — only present when explicitly selected)
  preferenceEmbedding?: number[]
  preferenceEmbeddingUpdatedAt?: string | null
  preferenceHistory?: IPreferenceHistory[]
  isActive: boolean
  isEmailVerified: boolean
  lastLogin?: string
  // Reset / verification tokens (select: false in practice via controller logic)
  resetPasswordToken?: string
  resetPasswordExpire?: string
  emailVerificationToken?: string
  emailVerificationExpire?: string
  createdAt: string
  updatedAt: string
}
```

### `review.ts`

```typescript
import { ICafe } from './cafe'
import { IUser } from './user'

export interface IMultiDimRatings {
  taste: number          // required, 1–5
  price: number          // required, 1–5
  environment: number    // required, 1–5
  service: number        // required, 1–5
  workspace: number      // required, 1–5
  averageRating: number  // auto-calculated on pre-save
}

export interface IDetailedRatings {
  coffee?: number        // optional, 1–5
  ambience?: number
  service?: number
  value?: number
}

export interface IAiAnalysis {
  sentiment: 'positive' | 'negative' | 'neutral'
  keywords: string[]
  summary?: string
  confidence: number     // 0–1
  analyzedAt: string
}

export interface IHelpfulVote {
  user: string           // ObjectId ref to User
  vote: 'helpful' | 'not-helpful'
}

export interface IOwnerResponse {
  content: string
  respondedAt: string
  respondedBy: string    // ObjectId ref to User
}

export interface IReview {
  _id: string
  content: string
  rating: number              // overall, 0.5 increments
  ratings: IMultiDimRatings   // field is `ratings` — NOT `dimensions`
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
  isReported: boolean         // field is `isReported` — NOT `reported`
  reportCount: number
  isVerifiedVisit: boolean
  visitDate?: string
  ownerResponse?: IOwnerResponse  // field is `ownerResponse` — NOT `response`
  createdAt: string
  updatedAt: string
}

export interface IReviewImage {
  url: string
  filename: string
  publicId?: string
  uploadedAt: string
  thumbnail?: string  // virtual
}
```

### `api.ts`

```typescript
import { Request } from 'express'
import { IUser } from './user'

// Extends Express Request to include the authenticated user
// (attached by the protect middleware)
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
    "@types/nodemailer": "^6.4.14",
    "@types/cookie-parser": "^1.4.7"
  }
}
```

Notes:
- Mongoose v8 ships its own types — no `@types/mongoose` needed
- `helmet`, `express-rate-limit`, `express-mongo-sanitize` all ship their own types
- `cookie-parser` does not ship its own types — `@types/cookie-parser` is required

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

**Loose mode rationale:** `noImplicitAny` and `strictNullChecks` are disabled for the migration. They will be enabled in a separate tightening pass after the codebase is fully compiling — one file at a time, with explanations for each error.

**`moduleResolution: "node"`** is explicit to ensure `@types/*` packages resolve correctly.

### File renames

Every file in `backend/server/` is renamed `.js` → `.ts`. No exceptions. The renamed files are the only change at the file system level.

### Mongoose model typing pattern (Mongoose v8)

The project uses Mongoose v8. The correct pattern passes the plain interface to `Schema<T>` and `model<T>()` — **not** `T & Document` (that is the deprecated Mongoose v5 pattern).

```typescript
import { Schema, model, HydratedDocument } from 'mongoose'
import { ICafe } from '../types'

// Schema receives the plain interface
const cafeSchema = new Schema<ICafe>({
  // schema definition unchanged
})

// Model is typed with the plain interface
export default model<ICafe>('Cafe', cafeSchema)

// When you need to type a specific document instance (e.g. in methods):
// type CafeDoc = HydratedDocument<ICafe>
```

This pattern is applied to all three models: `Cafe`, `User`, `Review`.

### Controller typing pattern

```typescript
import { Response } from 'express'
import { AuthRequest, ApiResponse, IUser } from '../types'

// @desc   Get my profile
// @route  GET /api/users/me
// @access Private
const getMe = asyncHandler(
  async (req: AuthRequest, res: Response<ApiResponse<IUser>>) => {
    // req.user is now typed as IUser | undefined — full autocomplete
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

## DB Migrations

All three DB migrations run from the same script at `backend/server/seeds/migrate_enum_keys.ts`. Each section is idempotent — if a value is already a short key, the mapping lookup returns undefined and no update is made.

### Rationale

`Cafe.amenities`, `Cafe.specialty`, `Cafe.openingHours[].day`, and related user preference fields currently store Chinese or bilingual strings in MongoDB. Migrating all to language-neutral English keys:
- Enables future languages (Japanese, Korean, etc.) with only a new JSON translation file
- Makes TypeScript union types the single source of truth for valid values
- Fixes the amenity enum mismatch bug between Cafe and User models

### 1. Amenity key mapping

| Old value | New key |
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

**Affected fields:**
- `Cafe.amenities[]` — flat string array
- `User.preferences.learned.favoriteAmenities[].amenity` — nested field inside `{ amenity, weight }` objects
- `User.preferences.manual.mustHaveAmenities[]` — flat string array
- `User.preferences.manual.avoidAmenities[]` — flat string array

### 2. Specialty key mapping

| Old value | New key |
|---|---|
| `意式浓缩 Espresso` | `espresso` |
| `手冲咖啡 Pour Over` | `pour_over` |
| `冷萃咖啡 Cold Brew` | `cold_brew` |
| `拉花咖啡 Latte Art` | `latte_art` |
| `精品咖啡豆 Specialty Beans` | `specialty_beans` |
| `甜点 Desserts` | `desserts` |
| `轻食 Light Meals` | `light_meals` |

**Affected fields:**
- `Cafe.specialty` — single string field
- `User.preferences.learned.favoriteSpecialties[]` — flat string array

### 3. Day key mapping

| Old value | New key |
|---|---|
| `周一` | `monday` |
| `周二` | `tuesday` |
| `周三` | `wednesday` |
| `周四` | `thursday` |
| `周五` | `friday` |
| `周六` | `saturday` |
| `周日` | `sunday` |

**Affected fields:**
- `Cafe.openingHours[].day` — nested field inside each opening hours entry

### Migration script behaviour

`backend/server/seeds/migrate_enum_keys.ts`:
- Runs all three mappings in sequence
- Uses MongoDB bulk write operations for performance
- Logs a summary per collection: X cafes updated, Y users updated, Z errors
- Is idempotent — safe to run multiple times

### i18n translation additions

Add three new namespaces to the existing translation files:

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

```json
// frontend/src/locales/en/specialties.json
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

```json
// frontend/src/locales/zh/specialties.json
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

```json
// frontend/src/locales/en/days.json
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

```json
// frontend/src/locales/zh/days.json
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

Frontend usage: `t('amenities:wifi')`, `t('specialties:pour_over')`, `t('days:monday')` — each returns the correct label in the active language.

---

## What Does Not Change

- All business logic in controllers, services, and middleware
- MongoDB schema shapes (only amenity, specialty, and day enum values change)
- API routes and response formats
- Auth flow (JWT, refresh token rotation)
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
- `backend/server/seeds/migrate_enum_keys.ts`
- `frontend/src/locales/en/amenities.json`
- `frontend/src/locales/zh/amenities.json`
- `frontend/src/locales/en/specialties.json`
- `frontend/src/locales/zh/specialties.json`
- `frontend/src/locales/en/days.json`
- `frontend/src/locales/zh/days.json`

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
- `backend/server/utils/geocoding.js`
