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
