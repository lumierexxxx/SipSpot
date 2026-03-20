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
