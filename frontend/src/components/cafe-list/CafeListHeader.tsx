// ============================================
// SipSpot — CafeListHeader
// ============================================
import { Plus } from 'lucide-react';

interface Props {
    myOnly: boolean;
    totalCount: number;
    isLoggedIn: boolean;
    onAddCafe: () => void;
}

export default function CafeListHeader({ myOnly, totalCount, isLoggedIn, onAddCafe }: Props) {
    return (
        <div className="bg-white border-b border-stone-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-5">
                    <div>
                        <p className="text-amber-700 mb-1" style={{ fontSize: '0.82rem', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                            Explore Cafés
                        </p>
                        <h1 className="text-stone-900" style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)', fontWeight: 700, lineHeight: 1.2, letterSpacing: '-0.01em' }}>
                            {myOnly ? 'My Cafés' : 'Discover Coffee Shops'}
                        </h1>
                        <p className="text-stone-500 mt-1" style={{ fontSize: '0.9rem' }}>
                            {myOnly
                                ? 'Manage the cafés you have added'
                                : `${totalCount.toLocaleString()} cafés waiting to be explored`}
                        </p>
                    </div>

                    {!myOnly && (
                        <div className="flex flex-col items-start sm:items-end gap-2">
                            <button
                                onClick={onAddCafe}
                                className="flex items-center gap-2.5 bg-amber-700 hover:bg-amber-800 text-white px-5 py-3 rounded-2xl transition-all shadow-sm hover:shadow-md group"
                                style={{ fontSize: '0.9rem', fontWeight: 600 }}
                            >
                                <div className="w-6 h-6 bg-white/20 rounded-lg flex items-center justify-center group-hover:bg-white/30 transition-colors">
                                    <Plus className="w-3.5 h-3.5" />
                                </div>
                                Add a Café
                            </button>
                            {!isLoggedIn && (
                                <p className="text-stone-400" style={{ fontSize: '0.72rem' }}>Sign in required to add a café</p>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
