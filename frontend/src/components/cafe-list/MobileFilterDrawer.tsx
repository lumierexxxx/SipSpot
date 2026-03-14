// ============================================
// SipSpot — MobileFilterDrawer (Sheet)
// ============================================
import { X, SlidersHorizontal } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@components/ui/sheet';
import CafeFilterPanel from '@components/CafeFilterPanel';
import type { FilterState } from '@/types/cafe';

interface Props {
    open: boolean;
    onClose: () => void;
    filters: FilterState;
    activeFilterCount: number;
    resultCount: number;
    onFilterChange: (key: keyof FilterState, value: string) => void;
    onAmenityToggle: (key: string) => void;
    onClear: () => void;
}

export default function MobileFilterDrawer({
    open, onClose, filters, activeFilterCount, resultCount,
    onFilterChange, onAmenityToggle, onClear,
}: Props) {
    return (
        <Sheet open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
            <SheetContent side="right" className="w-80 flex flex-col p-0">
                <SheetHeader className="flex flex-row items-center justify-between p-5 border-b border-stone-100">
                    <div className="flex items-center gap-2">
                        <SlidersHorizontal className="w-4 h-4 text-amber-700" />
                        <SheetTitle className="text-stone-900" style={{ fontSize: '0.95rem', fontWeight: 700 }}>Filters</SheetTitle>
                        {activeFilterCount > 0 && (
                            <span className="bg-amber-100 text-amber-700 rounded-full px-2 py-0.5" style={{ fontSize: '0.72rem', fontWeight: 600 }}>{activeFilterCount}</span>
                        )}
                    </div>
                    <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-stone-100 flex items-center justify-center">
                        <X className="w-4 h-4 text-stone-500" />
                    </button>
                </SheetHeader>

                <div className="flex-1 overflow-y-auto p-5">
                    <CafeFilterPanel
                        filters={filters}
                        onFilterChange={onFilterChange}
                        onAmenityToggle={onAmenityToggle}
                    />
                </div>

                <div className="p-5 border-t border-stone-100 flex gap-3">
                    <button onClick={onClear} className="flex-1 border border-stone-200 text-stone-600 py-3 rounded-xl" style={{ fontSize: '0.88rem' }}>
                        Clear All
                    </button>
                    <button onClick={onClose} className="flex-1 bg-amber-700 text-white py-3 rounded-xl" style={{ fontSize: '0.88rem', fontWeight: 600 }}>
                        Show {resultCount} Results
                    </button>
                </div>
            </SheetContent>
        </Sheet>
    );
}
