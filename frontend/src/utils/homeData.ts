// ============================================
// SipSpot — Home page data constants & helpers
// ============================================

import React from 'react'
import type { ICafe, AmenityKey } from '@/types'

// ============================================
// Type definitions
// ============================================

export interface Vibe {
  emoji: string
  gradient: string
  filter: string  // URL query string, e.g. 'amenity=work_friendly'
}

export interface CuratedReview {
  id: number
  author: string
  avatar: string
  avatarColor: string
  shop: string
  rating: number
  date: string
  helpful: number
  image: string
}

export interface CafeBadge {
  key: 'newOpening' | 'editorsChoice' | 'verified' | 'topPick' | 'featured'
  color: string
}

export interface HowItWorksStep {
  icon: React.ReactElement
  step: string
  color: string
  border: string
}

export type CategoryFilter = (cafe: ICafe) => boolean

export const DAY_NAMES = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

export const FALLBACK_IMAGES = [
    'https://images.unsplash.com/photo-1769259851797-cb4e2a98db68?w=600&q=80',
    'https://images.unsplash.com/photo-1552640958-291d4a2e2ab2?w=600&q=80',
    'https://images.unsplash.com/photo-1762715020147-9820679a6fdd?w=600&q=80',
    'https://images.unsplash.com/photo-1500916074555-9f1bfec9dd5d?w=600&q=80',
    'https://images.unsplash.com/photo-1680381724318-c8ac9fe3a484?w=600&q=80',
    'https://images.unsplash.com/photo-1642315160505-b3dff3a3c8b9?w=600&q=80',
];

export const CATEGORIES: string[] = ['All', 'Work-Friendly', 'Outdoor', 'Quiet Space', 'Dog Friendly', 'Specialty Coffee', 'New Openings'];

export const CATEGORY_FILTERS: Record<string, CategoryFilter> = {
    'All': () => true,
    'Work-Friendly': (c) => c.amenities?.includes('work_friendly' as AmenityKey) ?? false,
    'Outdoor': (c) => c.amenities?.includes('outdoor_seating' as AmenityKey) ?? false,
    'Quiet Space': (c) => c.amenities?.includes('quiet' as AmenityKey) ?? false,
    'Dog Friendly': (c) => c.amenities?.includes('pet_friendly' as AmenityKey) ?? false,
    'Specialty Coffee': (c) => Boolean(c.specialties?.length),
    'New Openings': (c) => new Date().getTime() - new Date(c.createdAt).getTime() < 60 * 24 * 60 * 60 * 1000,
};

export const CURATED_REVIEWS: CuratedReview[] = [
    { id: 1, author: 'Maya Chen', avatar: 'MC', avatarColor: 'bg-amber-500', shop: 'Morning Light Café', rating: 5, date: 'March 10, 2026', helpful: 48, image: 'https://images.unsplash.com/photo-1680381724318-c8ac9fe3a484?w=300&q=80' },
    { id: 2, author: 'James Park', avatar: 'JP', avatarColor: 'bg-teal-500', shop: 'The Roastery Lab', rating: 5, date: 'March 8, 2026', helpful: 61, image: 'https://images.unsplash.com/photo-1552640958-291d4a2e2ab2?w=300&q=80' },
    { id: 3, author: 'Sofia Rivera', avatar: 'SR', avatarColor: 'bg-rose-500', shop: 'Garden Brew', rating: 4, date: 'March 5, 2026', helpful: 34, image: 'https://images.unsplash.com/photo-1762715020147-9820679a6fdd?w=300&q=80' },
];

export const VIBES: Vibe[] = [
    { emoji: '💻', gradient: 'from-stone-800 to-stone-600',   filter: 'amenity=work_friendly' },
    { emoji: '🌿', gradient: 'from-emerald-800 to-emerald-600', filter: 'amenity=outdoor_seating' },
    { emoji: '🔇', gradient: 'from-blue-900 to-blue-700',     filter: 'amenity=quiet' },
    { emoji: '🐾', gradient: 'from-amber-800 to-amber-600',   filter: 'amenity=pet_friendly' },
    { emoji: '☕', gradient: 'from-teal-800 to-teal-600',     filter: 'specialty=1' },
    { emoji: '⚡', gradient: 'from-violet-800 to-violet-600', filter: 'amenity=power_outlet' },
    { emoji: '🎉', gradient: 'from-rose-800 to-rose-600',     filter: 'amenity=group_friendly' },
    { emoji: '✨', gradient: 'from-orange-800 to-orange-600', filter: 'new=1' },
];

import { Search, MapPin, BookOpen, Star } from 'lucide-react';

export const HOW_IT_WORKS_STEPS: HowItWorksStep[] = [
    { icon: React.createElement(Search, { className: 'w-6 h-6' }), step: '01', color: 'bg-amber-50 text-amber-700', border: 'border-amber-200' },
    { icon: React.createElement(MapPin, { className: 'w-6 h-6' }), step: '02', color: 'bg-rose-50 text-rose-700', border: 'border-rose-200' },
    { icon: React.createElement(BookOpen, { className: 'w-6 h-6' }), step: '03', color: 'bg-violet-50 text-violet-700', border: 'border-violet-200' },
    { icon: React.createElement(Star, { className: 'w-6 h-6' }), step: '04', color: 'bg-emerald-50 text-emerald-700', border: 'border-emerald-200' },
];

// ── Helper functions ──────────────────────────────────────────────────────────

export function getCafeBadge(cafe: ICafe): CafeBadge {
    const ageMs = new Date().getTime() - new Date(cafe.createdAt).getTime()
    if (ageMs < 60 * 24 * 60 * 60 * 1000) return { key: 'newOpening', color: 'bg-sky-600' }
    if (cafe.rating >= 4.8) return { key: 'editorsChoice', color: 'bg-violet-600' }
    if (cafe.isVerified) return { key: 'verified', color: 'bg-emerald-600' }
    if (cafe.rating >= 4.5) return { key: 'topPick', color: 'bg-amber-700' }
    return { key: 'featured', color: 'bg-stone-500' }
}

export function getCafeTags(cafe: ICafe): string[] {
    // Tags are now amenity keys — callers translate with t('amenities.<key>')
    const specialtyTags = cafe.specialties?.slice(0, 1) ?? []
    const amenityTags = cafe.amenities?.slice(0, 1) ?? []
    return [...specialtyTags, ...amenityTags].slice(0, 2)
}

export function getCafeHours(cafe: ICafe): string | null {
    const days: Record<string, number> = {
        sunday: 0, monday: 1, tuesday: 2, wednesday: 3,
        thursday: 4, friday: 5, saturday: 6
    }
    const todayIndex = new Date().getDay()
    const todayKey = Object.keys(days).find(k => days[k] === todayIndex) ?? ''
    const entry = cafe.openingHours?.find(h => h.day === todayKey)
    return entry && !entry.isClosed ? `${entry.open} – ${entry.close}` : null
}

export function getCafeImage(cafe: ICafe, index = 0): string {
    const first = cafe.images?.[0]
    if (typeof first === 'string') return first
    if (first?.cardImage) return first.cardImage
    if (first?.url) return first.url
    return FALLBACK_IMAGES[index % FALLBACK_IMAGES.length]
}

export function getCafeAmenityIcons(cafe: ICafe): Array<'wifi' | 'power'> {
    const icons: Array<'wifi' | 'power'> = []
    if (cafe.amenities?.includes('wifi')) icons.push('wifi')
    if (cafe.amenities?.includes('power_outlet')) icons.push('power')
    return icons
}
