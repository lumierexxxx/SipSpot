// ============================================
// SipSpot — CategoryFilterBar
// ============================================
import { Button } from '@components/ui/button';

interface CategoryFilterBarProps {
    categories: string[]
    active: string
    onChange: (category: string) => void
    getLabel: (category: string) => string
}

export default function CategoryFilterBar({ categories, active, onChange, getLabel }: CategoryFilterBarProps) {
    return (
        <div className="flex gap-2 overflow-x-auto pb-2 mb-8">
            {categories.map(cat => (
                <Button
                    key={cat}
                    variant="ghost"
                    onClick={() => onChange(cat)}
                    className={`flex-shrink-0 px-4 py-2 rounded-full border transition-all h-auto ${
                        active === cat
                            ? 'bg-amber-700 text-white border-amber-700 hover:bg-amber-700 hover:text-white'
                            : 'bg-white text-stone-600 border-stone-200 hover:border-amber-300'
                    }`}
                    style={{ fontSize: '0.85rem' }}
                >
                    {getLabel ? getLabel(cat) : cat}
                </Button>
            ))}
        </div>
    );
}
