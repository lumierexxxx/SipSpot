// ============================================
// SipSpot — Cafe domain types
// ============================================

import type { IUser } from './user'
import type { IReview } from './review'

export type AmenityKey =
  | 'wifi' | 'power_outlet' | 'quiet' | 'outdoor_seating'
  | 'pet_friendly' | 'no_smoking' | 'air_conditioning' | 'parking'
  | 'wheelchair_accessible' | 'laptop_friendly' | 'group_friendly' | 'work_friendly'

// Matches frontend/src/locales/en/specialties.json exactly
export type SpecialtyType =
  | 'espresso' | 'pour_over' | 'cold_brew' | 'latte_art'
  | 'specialty_beans' | 'desserts' | 'light_meals'

export type DayKey =
  | 'monday' | 'tuesday' | 'wednesday' | 'thursday'
  | 'friday' | 'saturday' | 'sunday'

export interface CafeImage {
  cardImage?: string
  url?: string
}

export interface IOpeningHours {
  day: DayKey
  open: string    // e.g. "09:00"
  close: string   // e.g. "22:00"
  isClosed: boolean
}

export interface IGeometry {
  type: 'Point'
  coordinates: [number, number]  // [longitude, latitude]
}

export interface ICafe {
  _id: string
  name: string
  description: string
  images: Array<CafeImage | string>
  geometry: IGeometry
  address: string
  city: string
  price: 1 | 2 | 3 | 4
  amenities: AmenityKey[]
  specialty: string
  openingHours: IOpeningHours[]
  rating: number
  reviewCount: number
  author: string | IUser
  reviews: string[] | IReview[]
  aiSummary?: string
  isVerified?: boolean
  createdAt: string
  updatedAt: string
}

export interface FilterState {
  search: string
  city: string
  minRating: string
  maxPrice: string
  amenities: string[]
  vibe: string    // used by CafeListPage for amenity/vibe URL filter param
  sort: string
}

export type Vibe =
  | 'Specialty' | 'Cozy Vibes' | 'Work-Friendly' | 'Outdoor'
  | 'Hidden Gems' | 'New Openings'
