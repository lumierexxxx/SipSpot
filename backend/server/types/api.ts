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
