// ============================================
// SipSpot — ViewToggle
// ============================================
import { Grid3X3, List } from 'lucide-react';

interface Props {
    view: 'grid' | 'list';
    onChange: (view: 'grid' | 'list') => void;
}

export default function ViewToggle({ view, onChange }: Props) {
    return (
        <div className="hidden sm:flex bg-stone-100 rounded-xl p-1">
            <button
                onClick={() => onChange('grid')}
                className={`p-2 rounded-lg transition-all ${view === 'grid' ? 'bg-white shadow-sm text-amber-700' : 'text-stone-400 hover:text-stone-600'}`}
            >
                <Grid3X3 className="w-4 h-4" />
            </button>
            <button
                onClick={() => onChange('list')}
                className={`p-2 rounded-lg transition-all ${view === 'list' ? 'bg-white shadow-sm text-amber-700' : 'text-stone-400 hover:text-stone-600'}`}
            >
                <List className="w-4 h-4" />
            </button>
        </div>
    );
}
