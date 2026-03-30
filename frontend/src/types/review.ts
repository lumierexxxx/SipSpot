// ============================================
// SipSpot — Review domain types
// ============================================

import type { ICafe } from './cafe'
import type { IUser } from './user'

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
