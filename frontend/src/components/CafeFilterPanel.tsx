// ============================================
// SipSpot — CafeFilterPanel
// Filter sidebar: city, price, rating, amenities
// ============================================

import type React from 'react';
import { useTranslation } from 'react-i18next';
import { Star, Wifi, Zap, VolumeX, TreePine, Dog, Ban, Snowflake, Car, Accessibility, Laptop, Users, Briefcase, Coffee, Flame, Sparkles, MapPin } from 'lucide-react';
import FilterSection from './FilterSection';
import type { FilterState, Vibe } from '../types/cafe';

// ── Constants ─────────────────────────────────────────────────────────────────

const CITY_OPTIONS = [
    'Seattle', 'Portland', 'San Francisco', 'Los Angeles',
    'New York', 'Chicago', 'Boston', 'Austin',
];

export const AMENITY_OPTIONS = [
    { key: 'WiFi',                          label: 'Free WiFi',         icon: Wifi },
    { key: '电源插座',                      label: 'Power Outlets',     icon: Zap },
    { key: '安静环境',                      label: 'Quiet Space',       icon: VolumeX },
    { key: '户外座位',                      label: 'Outdoor Seating',   icon: TreePine },
    { key: '宠物友好',                      label: 'Dog Friendly',      icon: Dog },
    { key: '禁烟',                          label: 'Non-Smoking',       icon: Ban },
    { key: '空调',                          label: 'Air Conditioning',  icon: Snowflake },
    { key: '提供停车位',                    label: 'Parking',           icon: Car },
    { key: '无障碍通行（轮椅可进入）',      label: 'Accessible',        icon: Accessibility },
    { key: '适合使用笔记本电脑',            label: 'Laptop Friendly',   icon: Laptop },
    { key: '适合团体聚会',                  label: 'Group Gatherings',  icon: Users },
    { key: '适合工作 / 办公',               label: 'Work-Friendly',     icon: Briefcase },
] as const;

export const VIBE_OPTIONS: { key: Vibe; icon: React.ElementType }[] = [
    { key: 'Specialty',    icon: Coffee },
    { key: 'Cozy Vibes',   icon: Flame },
    { key: 'Work-Friendly', icon: Laptop },
    { key: 'Outdoor',      icon: TreePine },
    { key: 'Hidden Gems',  icon: MapPin },
    { key: 'New Openings', icon: Sparkles },
];

export const AMENITY_LABEL: Record<string, string> = Object.fromEntries(
    AMENITY_OPTIONS.map(({ key, label }) => [key, label])
);

// ── Types ─────────────────────────────────────────────────────────────────────

interface CafeFilterPanelProps {
    filters: FilterState;
    onFilterChange: (key: keyof FilterState, value: string) => void;
    onAmenityToggle: (key: string) => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function CafeFilterPanel({ filters, onFilterChange, onAmenityToggle }: CafeFilterPanelProps) {
    const { t } = useTranslation('cafeList');
    return (
        <div className="flex flex-col gap-0">

            {/* Vibe */}
            <FilterSection title={t('filters.vibe')}>
                <div className="flex flex-col gap-1 pt-1">
                    <button
                        onClick={() => onFilterChange('vibe', '')}
                        className={`text-left px-3 py-2 rounded-lg transition-colors ${!filters.vibe ? 'bg-amber-50 text-amber-700' : 'text-stone-600 hover:bg-stone-50'}`}
                        style={{ fontSize: '0.83rem' }}
                    >
                        All Vibes
                    </button>
                    {VIBE_OPTIONS.map(({ key, icon: Icon }) => (
                        <button
                            key={key}
                            onClick={() => onFilterChange('vibe', filters.vibe === key ? '' : key)}
                            className={`flex items-center gap-2.5 text-left px-3 py-2 rounded-lg transition-colors ${filters.vibe === key ? 'bg-amber-50 text-amber-700' : 'text-stone-600 hover:bg-stone-50'}`}
                            style={{ fontSize: '0.83rem' }}
                        >
                            <Icon className={`w-3.5 h-3.5 flex-shrink-0 ${filters.vibe === key ? 'text-amber-600' : 'text-stone-400'}`} />
                            {key}
                        </button>
                    ))}
                </div>
            </FilterSection>

            {/* City */}
            <FilterSection title={t('filters.city')}>
                <div className="flex flex-col gap-1 pt-1">
                    <button
                        onClick={() => onFilterChange('city', '')}
                        className={`text-left px-3 py-2 rounded-lg transition-colors ${!filters.city ? 'bg-amber-50 text-amber-700' : 'text-stone-600 hover:bg-stone-50'}`}
                        style={{ fontSize: '0.83rem' }}
                    >
                        All Cities
                    </button>
                    {CITY_OPTIONS.map(city => (
                        <button
                            key={city}
                            onClick={() => onFilterChange('city', city)}
                            className={`text-left px-3 py-2 rounded-lg transition-colors ${filters.city === city ? 'bg-amber-50 text-amber-700' : 'text-stone-600 hover:bg-stone-50'}`}
                            style={{ fontSize: '0.83rem' }}
                        >
                            {city}
                        </button>
                    ))}
                </div>
            </FilterSection>

            {/* Price Range */}
            <FilterSection title={t('filters.price')}>
                <div className="flex flex-col gap-1 pt-2">
                    {(['budget', 'moderate', 'upscale', 'luxury'] as const).map((key, i) => (
                        <button
                            key={key}
                            onClick={() => onFilterChange('maxPrice', filters.maxPrice === String(i + 1) ? '' : String(i + 1))}
                            className={`text-left px-3 py-2 rounded-lg transition-colors ${
                                filters.maxPrice === String(i + 1)
                                    ? 'bg-amber-50 text-amber-700'
                                    : 'text-stone-600 hover:bg-stone-50'
                            }`}
                            style={{ fontSize: '0.83rem' }}
                        >
                            {t(`filters.priceLabels.${key}`)}
                        </button>
                    ))}
                </div>
            </FilterSection>

            {/* Minimum Rating */}
            <FilterSection title={t('filters.rating')}>
                <div className="flex flex-col gap-1.5 pt-2">
                    {([ ['', 'Any rating'], ['4', '4+ stars'], ['4.5', '4.5+ stars'], ['4.8', '4.8+ stars'] ] as [string, string][]).map(([val, label]) => (
                        <button
                            key={val}
                            onClick={() => onFilterChange('minRating', val)}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-left ${filters.minRating === val ? 'bg-amber-50 text-amber-700' : 'text-stone-600 hover:bg-stone-50'}`}
                            style={{ fontSize: '0.83rem' }}
                        >
                            <Star className={`w-3.5 h-3.5 ${filters.minRating === val && val ? 'fill-amber-500 text-amber-500' : 'text-stone-300'}`} />
                            {label}
                        </button>
                    ))}
                </div>
            </FilterSection>

            {/* Amenities */}
            <FilterSection title={`${t('filters.amenities')}${filters.amenities.length > 0 ? ` (${filters.amenities.length})` : ''}`}>
                <div className="flex flex-col gap-2 pt-1">
                    {AMENITY_OPTIONS.map(({ key, label, icon: Icon }) => (
                        <label key={key} className="flex items-center gap-2.5 cursor-pointer group">
                            <div
                                onClick={() => onAmenityToggle(key)}
                                className={`w-4 h-4 rounded flex items-center justify-center border transition-all flex-shrink-0 ${
                                    filters.amenities.includes(key)
                                        ? 'bg-amber-700 border-amber-700'
                                        : 'border-stone-300 group-hover:border-amber-400'
                                }`}
                            >
                                {filters.amenities.includes(key) && (
                                    <svg viewBox="0 0 8 8" className="w-2.5 h-2.5">
                                        <path d="M1.5 4L3 5.5L6.5 2" stroke="white" strokeWidth="1.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                )}
                            </div>
                            <Icon className="w-3.5 h-3.5 text-stone-400 flex-shrink-0" />
                            <span className="text-stone-600 group-hover:text-stone-900 transition-colors" style={{ fontSize: '0.83rem' }}>{label}</span>
                        </label>
                    ))}
                </div>
            </FilterSection>
        </div>
    );
}
