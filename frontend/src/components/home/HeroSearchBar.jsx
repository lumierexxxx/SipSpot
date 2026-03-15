// ============================================
// SipSpot — HeroSearchBar
// ============================================
import { Search, MapPin } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function HeroSearchBar({ query, location, onQueryChange, onLocationChange, onSubmit }) {
    const { t } = useTranslation('home');

    return (
        <form
            onSubmit={onSubmit}
            className="bg-white rounded-2xl p-2 flex flex-col sm:flex-row gap-2 shadow-2xl max-w-2xl mx-auto mb-10"
        >
            <div className="flex-1 flex items-center gap-3 px-4 py-2">
                <Search className="w-5 h-5 text-stone-400 flex-shrink-0" />
                <input
                    type="text"
                    placeholder={t('hero.searchName')}
                    value={query}
                    onChange={onQueryChange}
                    className="flex-1 outline-none text-stone-800 placeholder:text-stone-400 bg-transparent"
                    style={{ fontSize: '0.95rem' }}
                />
            </div>
            <div className="hidden sm:block w-px bg-stone-200 my-2" />
            <div className="flex-1 flex items-center gap-3 px-4 py-2">
                <MapPin className="w-5 h-5 text-stone-400 flex-shrink-0" />
                <input
                    type="text"
                    placeholder={t('hero.searchCity')}
                    value={location}
                    onChange={onLocationChange}
                    className="flex-1 outline-none text-stone-800 placeholder:text-stone-400 bg-transparent"
                    style={{ fontSize: '0.95rem' }}
                />
            </div>
            <button
                type="submit"
                className="bg-amber-700 hover:bg-amber-800 text-white px-7 py-3 rounded-xl transition-colors flex items-center justify-center gap-2 flex-shrink-0"
            >
                <Search className="w-4 h-4" />
                <span>{t('hero.searchButton')}</span>
            </button>
        </form>
    );
}
