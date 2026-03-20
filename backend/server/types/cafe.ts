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
