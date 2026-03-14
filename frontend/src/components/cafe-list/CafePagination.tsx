// ============================================
// SipSpot — CafePagination
// ============================================
interface Props {
    currentPage: number;
    totalPages: number;
    onChange: (page: number) => void;
}

export default function CafePagination({ currentPage, totalPages, onChange }: Props) {
    if (totalPages <= 1) return null;

    return (
        <div className="mt-10 flex justify-center">
            <nav className="flex items-center gap-1">
                <button
                    onClick={() => onChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-4 py-2 rounded-xl border border-stone-200 text-stone-600 bg-white hover:border-amber-300 hover:text-amber-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    style={{ fontSize: '0.85rem' }}
                >
                    Previous
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => {
                    if (page === 1 || page === totalPages || (page >= currentPage - 2 && page <= currentPage + 2)) {
                        return (
                            <button
                                key={page}
                                onClick={() => onChange(page)}
                                className={`w-9 h-9 rounded-xl transition-colors ${page === currentPage ? 'bg-amber-700 text-white' : 'border border-stone-200 bg-white text-stone-600 hover:border-amber-300 hover:text-amber-700'}`}
                                style={{ fontSize: '0.85rem' }}
                            >
                                {page}
                            </button>
                        );
                    }
                    if (page === currentPage - 3 || page === currentPage + 3) {
                        return <span key={page} className="px-1 text-stone-400">…</span>;
                    }
                    return null;
                })}
                <button
                    onClick={() => onChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 rounded-xl border border-stone-200 text-stone-600 bg-white hover:border-amber-300 hover:text-amber-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    style={{ fontSize: '0.85rem' }}
                >
                    Next
                </button>
            </nav>
        </div>
    );
}
