// ============================================
// SipSpot — FilterSidebarWrapper (desktop)
// ============================================
import { SlidersHorizontal } from 'lucide-react';
import CafeFilterPanel from '@components/CafeFilterPanel';
import type { FilterState } from '@/types/cafe';

interface Props {
    filters: FilterState;
    activeFilterCount: number;
    onFilterChange: (key: keyof FilterState, value: string) => void;
    onAmenityToggle: (key: string) => void;
    onClear: () => void;
}

export default function FilterSidebarWrapper({ filters, activeFilterCount, onFilterChange, onAmenityToggle, onClear }: Props) {
    return (
        <aside className="hidden lg:block w-60 flex-shrink-0">
            <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-5 sticky top-24">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <SlidersHorizontal className="w-4 h-4 text-amber-700" />
                        <span className="text-stone-900" style={{ fontSize: '0.9rem', fontWeight: 700 }}>Filters</span>
                        {activeFilterCount > 0 && (
                            <span className="bg-amber-100 text-amber-700 rounded-full px-2 py-0.5" style={{ fontSize: '0.7rem', fontWeight: 600 }}>{activeFilterCount}</span>
                        )}
                    </div>
                    {activeFilterCount > 0 && (
                        <button onClick={onClear} className="text-stone-400 hover:text-rose-500 transition-colors" style={{ fontSize: '0.75rem' }}>
                            Clear all
                        </button>
                    )}
                </div>
                <CafeFilterPanel
                    filters={filters}
                    onFilterChange={onFilterChange}
                    onAmenityToggle={onAmenityToggle}
                />
            </div>
        </aside>
    );
}
