// ============================================
// SipSpot — ActiveFilterChips
// ============================================
import { X } from 'lucide-react';
import type { FilterState } from '@/types/cafe';
import { AMENITY_LABEL } from '@components/CafeFilterPanel';

interface Props {
    filters: FilterState;
    onFilterChange: (key: keyof FilterState, value: string) => void;
    onAmenityToggle: (key: string) => void;
}

export default function ActiveFilterChips({ filters, onFilterChange, onAmenityToggle }: Props) {
    const hasChips = filters.vibe || filters.city || filters.minRating || filters.maxPrice || filters.amenities.length > 0;
    if (!hasChips) return null;

    return (
        <div className="flex items-center gap-2 flex-wrap">
            {filters.vibe && (
                <button onClick={() => onFilterChange('vibe', '')} className="flex items-center gap-1.5 bg-amber-100 text-amber-700 rounded-full px-3 py-1 hover:bg-amber-200 transition-colors" style={{ fontSize: '0.75rem' }}>
                    {filters.vibe} <X className="w-3 h-3" />
                </button>
            )}
            {filters.city && (
                <button onClick={() => onFilterChange('city', '')} className="flex items-center gap-1.5 bg-amber-100 text-amber-700 rounded-full px-3 py-1 hover:bg-amber-200 transition-colors" style={{ fontSize: '0.75rem' }}>
                    {filters.city} <X className="w-3 h-3" />
                </button>
            )}
            {filters.minRating && (
                <button onClick={() => onFilterChange('minRating', '')} className="flex items-center gap-1.5 bg-amber-100 text-amber-700 rounded-full px-3 py-1 hover:bg-amber-200 transition-colors" style={{ fontSize: '0.75rem' }}>
                    {filters.minRating}+ stars <X className="w-3 h-3" />
                </button>
            )}
            {filters.maxPrice && (
                <button onClick={() => onFilterChange('maxPrice', '')} className="flex items-center gap-1.5 bg-amber-100 text-amber-700 rounded-full px-3 py-1 hover:bg-amber-200 transition-colors" style={{ fontSize: '0.75rem' }}>
                    {'$'.repeat(Number(filters.maxPrice))} <X className="w-3 h-3" />
                </button>
            )}
            {filters.amenities.map(a => (
                <button key={a} onClick={() => onAmenityToggle(a)} className="flex items-center gap-1.5 bg-amber-100 text-amber-700 rounded-full px-3 py-1 hover:bg-amber-200 transition-colors" style={{ fontSize: '0.75rem' }}>
                    {AMENITY_LABEL[a] ?? a} <X className="w-3 h-3" />
                </button>
            ))}
        </div>
    );
}
