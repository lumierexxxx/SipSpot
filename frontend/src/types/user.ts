// ============================================
// SipSpot — User domain types
// ============================================

// Note: AmenityKey and SpecialtyType are in cafe.ts.
// TypeScript handles this circular type-only import correctly — types are erased at runtime.
// HOWEVER: the old cafe.ts does not export AmenityKey/SpecialtyType yet. `tsc` will report
// an error on this import until Step 4 replaces cafe.ts. This is expected — do not stop.
import type { AmenityKey, SpecialtyType } from './cafe'

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

export interface IUserPreferences {
  learned: {
    favoriteAmenities: Array<{ amenity: AmenityKey; weight: number }>
    favoriteSpecialties: SpecialtyType[]
    preferredPriceRange: { min: number; max: number }
    visitCount: number
  }
  manual: {
    preferredAmenities: AmenityKey[]
    preferredSpecialties: SpecialtyType[]
    preferredPriceRange: { min: number; max: number }
    preferredCities: string[]
  }
}
