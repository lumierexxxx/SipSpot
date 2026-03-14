// ============================================
// SipSpot — CafeListToolbar
// ============================================
import type { FilterState } from '@/types/cafe';
import { SORT_OPTIONS } from '@utils/cafeListData';
import ActiveFilterChips from '@components/cafe-list/ActiveFilterChips';
import SortSelect from '@components/cafe-list/SortSelect';
import ViewToggle from '@components/cafe-list/ViewToggle';

interface Props {
    resultCount: number;
    totalCount: number;
    filters: FilterState;
    view: 'grid' | 'list';
    onSortChange: (value: string) => void;
    onViewChange: (view: 'grid' | 'list') => void;
    onFilterChange: (key: keyof FilterState, value: string) => void;
    onAmenityToggle: (key: string) => void;
}

export default function CafeListToolbar({
    resultCount, totalCount, filters, view,
    onSortChange, onViewChange, onFilterChange, onAmenityToggle,
}: Props) {
    return (
        <div className="flex items-center justify-between mb-5 gap-4">
            <div className="flex items-center gap-3 flex-wrap">
                <span className="text-stone-500" style={{ fontSize: '0.88rem' }}>
                    <strong className="text-stone-800">{resultCount}</strong>
                    {' / '}
                    <strong className="text-stone-800">{totalCount}</strong>
                    {' '}{totalCount === 1 ? 'café' : 'cafés'}
                </span>
                <ActiveFilterChips
                    filters={filters}
                    onFilterChange={onFilterChange}
                    onAmenityToggle={onAmenityToggle}
                />
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
                <SortSelect value={filters.sort} onChange={onSortChange} options={SORT_OPTIONS} />
                <ViewToggle view={view} onChange={onViewChange} />
            </div>
        </div>
    );
}
