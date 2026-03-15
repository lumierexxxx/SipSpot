// ============================================
// SipSpot — CafeSearchBar
// ============================================
import { Search, X, Filter } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface Props {
    value: string;
    onChange: (value: string) => void;
    onClear: () => void;
    onSubmit: (e: React.FormEvent) => void;
    onOpenFilters: () => void;
    activeFilterCount: number;
}

export default function CafeSearchBar({ value, onChange, onClear, onSubmit, onOpenFilters, activeFilterCount }: Props) {
    const { t } = useTranslation('cafeList');
    return (
        <div className="mt-6 flex gap-3">
            <form onSubmit={onSubmit} className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" style={{ width: '1.1rem', height: '1.1rem' }} />
                <input
                    type="text"
                    value={value}
                    onChange={e => onChange(e.target.value)}
                    placeholder={t('search.namePlaceholder')}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl pl-11 pr-10 py-3 text-stone-800 placeholder:text-stone-400 outline-none focus:border-amber-400 focus:bg-white transition-all"
                    style={{ fontSize: '0.9rem' }}
                />
                {value && (
                    <button
                        type="button"
                        onClick={onClear}
                        className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-stone-200 flex items-center justify-center hover:bg-stone-300 transition-colors"
                    >
                        <X className="w-3.5 h-3.5 text-stone-600" />
                    </button>
                )}
            </form>
            <button
                onClick={onOpenFilters}
                className="lg:hidden flex items-center gap-2 border border-stone-200 bg-white text-stone-700 px-4 py-3 rounded-xl hover:border-amber-300 transition-colors relative"
                style={{ fontSize: '0.88rem' }}
            >
                <Filter className="w-4 h-4" />
                {t('filters.title')}
                {activeFilterCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-amber-700 text-white rounded-full flex items-center justify-center" style={{ fontSize: '0.65rem', fontWeight: 700 }}>
                        {activeFilterCount}
                    </span>
                )}
            </button>
        </div>
    );
}
