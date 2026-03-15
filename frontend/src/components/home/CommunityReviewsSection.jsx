// ============================================
// SipSpot — CommunityReviewsSection
// ============================================
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import ReviewCard from './ReviewCard';

export default function CommunityReviewsSection({ reviews }) {
    const { t } = useTranslation('home');

    return (
        <section className="py-20 bg-stone-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-12 gap-4">
                    <div>
                        <p className="text-amber-700 mb-2" style={{ fontSize: '0.85rem', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                            From the Community
                        </p>
                        <h2 className="text-stone-900" style={{ fontSize: 'clamp(1.5rem, 3vw, 2.2rem)', fontWeight: 700, lineHeight: 1.2 }}>
                            {t('reviews.heading')}
                        </h2>
                    </div>
                    <Link to="/cafes" className="text-amber-700 hover:text-amber-800 flex-shrink-0" style={{ fontSize: '0.9rem', fontWeight: 500 }}>
                        Browse cafés →
                    </Link>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {reviews.map((review, i) => (
                        <ReviewCard key={review.id} review={review} index={i} />
                    ))}
                </div>
            </div>
        </section>
    );
}
