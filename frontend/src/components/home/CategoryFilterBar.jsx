// ============================================
// SipSpot — CategoryFilterBar
// ============================================

export default function CategoryFilterBar({ categories, active, onChange }) {
    return (
        <div className="flex gap-2 overflow-x-auto pb-2 mb-8">
            {categories.map(cat => (
                <button
                    key={cat}
                    onClick={() => onChange(cat)}
                    className={`flex-shrink-0 px-4 py-2 rounded-full border transition-all ${
                        active === cat
                            ? 'bg-amber-700 text-white border-amber-700'
                            : 'bg-white text-stone-600 border-stone-200 hover:border-amber-300'
                    }`}
                    style={{ fontSize: '0.85rem' }}
                >
                    {cat}
                </button>
            ))}
        </div>
    );
}
