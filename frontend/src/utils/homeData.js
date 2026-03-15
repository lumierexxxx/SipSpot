// ============================================
// SipSpot — Home page data constants & helpers
// ============================================

export const AMENITY_TO_ENGLISH = {
    'WiFi': 'WiFi',
    '电源插座': 'Power Outlets',
    '安静环境': 'Quiet Space',
    '户外座位': 'Outdoor Seating',
    '宠物友好': 'Dog Friendly',
    '禁烟': 'Non-Smoking',
    '空调': 'Air Conditioning',
    '提供停车位': 'Parking',
    '无障碍通行（轮椅可进入）': 'Accessible',
    '适合使用笔记本电脑': 'Laptop Friendly',
    '适合团体聚会': 'Group Friendly',
    '适合工作 / 办公': 'Work-Friendly',
};

export const SPECIALTY_TO_ENGLISH = {
    '意式浓缩 Espresso': 'Espresso',
    '手冲咖啡 Pour Over': 'Pour Over',
    '冷萃咖啡 Cold Brew': 'Cold Brew',
    '氮气咖啡 Nitro Coffee': 'Nitro Coffee',
    '虹吸咖啡 Siphon Coffee': 'Siphon Coffee',
    '摩卡壶 Moka Pot': 'Moka Pot',
    '法压壶 French Press': 'French Press',
    '澳白 Flat White': 'Flat White',
    '精品单品 Single Origin': 'Single Origin',
    '综合拼配 House Blend': 'House Blend',
};

export const DAY_NAMES = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

export const FALLBACK_IMAGES = [
    'https://images.unsplash.com/photo-1769259851797-cb4e2a98db68?w=600&q=80',
    'https://images.unsplash.com/photo-1552640958-291d4a2e2ab2?w=600&q=80',
    'https://images.unsplash.com/photo-1762715020147-9820679a6fdd?w=600&q=80',
    'https://images.unsplash.com/photo-1500916074555-9f1bfec9dd5d?w=600&q=80',
    'https://images.unsplash.com/photo-1680381724318-c8ac9fe3a484?w=600&q=80',
    'https://images.unsplash.com/photo-1642315160505-b3dff3a3c8b9?w=600&q=80',
];

export const CATEGORIES = ['All', 'Work-Friendly', 'Outdoor', 'Quiet Space', 'Dog Friendly', 'Specialty Coffee', 'New Openings'];

export const CATEGORY_FILTERS = {
    'All': () => true,
    'Work-Friendly': (c) => c.amenities?.includes('适合工作 / 办公'),
    'Outdoor': (c) => c.amenities?.includes('户外座位'),
    'Quiet Space': (c) => c.amenities?.includes('安静环境'),
    'Dog Friendly': (c) => c.amenities?.includes('宠物友好'),
    'Specialty Coffee': (c) => Boolean(c.specialty),
    'New Openings': (c) => new Date() - new Date(c.createdAt) < 60 * 24 * 60 * 60 * 1000,
};

export const CURATED_REVIEWS = [
    { id: 1, author: 'Maya Chen', avatar: 'MC', avatarColor: 'bg-amber-500', shop: 'Morning Light Café', rating: 5, date: 'March 10, 2026', helpful: 48, image: 'https://images.unsplash.com/photo-1680381724318-c8ac9fe3a484?w=300&q=80' },
    { id: 2, author: 'James Park', avatar: 'JP', avatarColor: 'bg-teal-500', shop: 'The Roastery Lab', rating: 5, date: 'March 8, 2026', helpful: 61, image: 'https://images.unsplash.com/photo-1552640958-291d4a2e2ab2?w=300&q=80' },
    { id: 3, author: 'Sofia Rivera', avatar: 'SR', avatarColor: 'bg-rose-500', shop: 'Garden Brew', rating: 4, date: 'March 5, 2026', helpful: 34, image: 'https://images.unsplash.com/photo-1762715020147-9820679a6fdd?w=300&q=80' },
];

export const VIBES = [
    { emoji: '💻', gradient: 'from-stone-800 to-stone-600', filter: 'amenity=%E9%80%82%E5%90%88%E5%B7%A5%E4%BD%9C+%2F+%E5%8A%9E%E5%85%AC' },
    { emoji: '🌿', gradient: 'from-emerald-800 to-emerald-600', filter: 'amenity=%E6%88%B7%E5%A4%96%E5%BA%A7%E4%BD%8D' },
    { emoji: '🔇', gradient: 'from-blue-900 to-blue-700', filter: 'amenity=%E5%AE%89%E9%9D%99%E7%8E%AF%E5%A2%83' },
    { emoji: '🐾', gradient: 'from-amber-800 to-amber-600', filter: 'amenity=%E5%AE%A0%E7%89%A9%E5%8F%8B%E5%A5%BD' },
    { emoji: '☕', gradient: 'from-teal-800 to-teal-600', filter: 'specialty=1' },
    { emoji: '⚡', gradient: 'from-violet-800 to-violet-600', filter: 'amenity=%E7%94%B5%E6%BA%90%E6%8F%92%E5%BA%A7' },
    { emoji: '🎉', gradient: 'from-rose-800 to-rose-600', filter: 'amenity=%E9%80%82%E5%90%88%E5%9B%A2%E4%BD%93%E8%81%9A%E4%BC%9A' },
    { emoji: '✨', gradient: 'from-orange-800 to-orange-600', filter: 'new=1' },
];

import { Search, MapPin, BookOpen, Star } from 'lucide-react';
import React from 'react';

export const HOW_IT_WORKS_STEPS = [
    { icon: React.createElement(Search, { className: 'w-6 h-6' }), step: '01', color: 'bg-amber-50 text-amber-700', border: 'border-amber-200' },
    { icon: React.createElement(MapPin, { className: 'w-6 h-6' }), step: '02', color: 'bg-rose-50 text-rose-700', border: 'border-rose-200' },
    { icon: React.createElement(BookOpen, { className: 'w-6 h-6' }), step: '03', color: 'bg-violet-50 text-violet-700', border: 'border-violet-200' },
    { icon: React.createElement(Star, { className: 'w-6 h-6' }), step: '04', color: 'bg-emerald-50 text-emerald-700', border: 'border-emerald-200' },
];

// ── Helper functions ──────────────────────────────────────────────────────────

export function getCafeBadge(cafe) {
    const ageMs = new Date() - new Date(cafe.createdAt);
    if (ageMs < 60 * 24 * 60 * 60 * 1000) return { key: 'newOpening', color: 'bg-sky-600' };
    if (cafe.rating >= 4.8) return { key: 'editorsChoice', color: 'bg-violet-600' };
    if (cafe.isVerified) return { key: 'verified', color: 'bg-emerald-600' };
    if (cafe.rating >= 4.5) return { key: 'topPick', color: 'bg-amber-700' };
    return { key: 'featured', color: 'bg-stone-500' };
}

export function getCafeTags(cafe) {
    const tags = [];
    if (cafe.specialty) {
        const en = SPECIALTY_TO_ENGLISH[cafe.specialty];
        if (en) tags.push(en);
    }
    const amenityTags = (cafe.amenities || [])
        .map(a => AMENITY_TO_ENGLISH[a])
        .filter(Boolean);
    return [...tags, ...amenityTags].slice(0, 2);
}

export function getCafeHours(cafe) {
    const today = DAY_NAMES[new Date().getDay()];
    const entry = cafe.openingHours?.find(h => h.day === today);
    return entry ? `${entry.open} – ${entry.close}` : null;
}

export function getCafeImage(cafe, index) {
    return cafe.images?.[0]?.cardImage || cafe.images?.[0]?.url || FALLBACK_IMAGES[index % FALLBACK_IMAGES.length];
}

export function getCafeAmenityIcons(cafe) {
    const icons = [];
    if (cafe.amenities?.includes('WiFi')) icons.push('wifi');
    if (cafe.amenities?.includes('电源插座')) icons.push('power');
    return icons;
}
