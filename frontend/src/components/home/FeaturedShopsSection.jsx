// ============================================
// SipSpot — FeaturedShopsSection
// ============================================
import { Link } from 'react-router-dom';
import { Coffee } from 'lucide-react';
import { CATEGORIES } from '@utils/homeData';
import CategoryFilterBar from './CategoryFilterBar';
import ShopCard from './ShopCard';
import CardSkeleton from './CardSkeleton';

export default function FeaturedShopsSection({ cafes, loading, activeCategory, onCategoryChange }) {
    return (
        <section className="py-20 bg-stone-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
                    <div>
                        <p className="text-amber-700 mb-2" style={{ fontSize: '0.85rem', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                            Handpicked for You
                        </p>
                        <h2 className="text-stone-900" style={{ fontSize: 'clamp(1.5rem, 3vw, 2.2rem)', fontWeight: 700, lineHeight: 1.2 }}>
                            Featured Coffee Shops
                        </h2>
                    </div>
                    <Link
                        to="/cafes"
                        className="text-amber-700 hover:text-amber-800 flex items-center gap-1 flex-shrink-0"
                        style={{ fontSize: '0.9rem', fontWeight: 500 }}
                    >
                        View all shops →
                    </Link>
                </div>

                <CategoryFilterBar
                    categories={CATEGORIES}
                    active={activeCategory}
                    onChange={onCategoryChange}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {loading
                        ? Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)
                        : cafes.length > 0
                            ? cafes.slice(0, 6).map((cafe, i) => (
                                <ShopCard key={cafe._id} cafe={cafe} index={i} />
                            ))
                            : (
                                <div className="col-span-3 text-center py-16 text-stone-400">
                                    <Coffee className="w-12 h-12 mx-auto mb-3 opacity-30" />
                                    <p style={{ fontSize: '0.95rem' }}>No cafés found in this category yet.</p>
                                    <button
                                        onClick={() => onCategoryChange('All')}
                                        className="mt-3 text-amber-700 hover:underline"
                                        style={{ fontSize: '0.85rem' }}
                                    >
                                        View all cafés
                                    </button>
                                </div>
                            )
                    }
                </div>
            </div>
        </section>
    );
}
