// ============================================
// SipSpot — ExploreByVibeSection
// ============================================
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { VIBES } from '@utils/homeData';

export default function ExploreByVibeSection() {
    const navigate = useNavigate();
    const { t } = useTranslation('home');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const td = t as (key: string) => string;

    return (
        <section className="py-20 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-12">
                    <p className="text-amber-700 mb-2" style={{ fontSize: '0.85rem', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                        Find Your Perfect Match
                    </p>
                    <h2 className="text-stone-900" style={{ fontSize: 'clamp(1.5rem, 3vw, 2.2rem)', fontWeight: 700, lineHeight: 1.2 }}>
                        {t('vibes.heading')}
                    </h2>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                    {VIBES.map((vibe, i) => (
                        <button
                            key={vibe.emoji}
                            onClick={() => navigate(`/cafes?${vibe.filter}`)}
                            className={`relative bg-gradient-to-br ${vibe.gradient} rounded-2xl p-5 text-left hover:scale-105 transition-transform duration-200 group overflow-hidden`}
                        >
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors rounded-2xl" />
                            <div className="relative z-10">
                                <div className="mb-3" style={{ fontSize: '2rem' }}>{vibe.emoji}</div>
                                <div className="text-white mb-0.5" style={{ fontSize: '1rem', fontWeight: 700 }}>{td('vibes.items.' + i + '.name')}</div>
                                <div className="text-white/60" style={{ fontSize: '0.78rem' }}>{td('vibes.items.' + i + '.count')}</div>
                            </div>
                        </button>
                    ))}
                </div>
            </div>
        </section>
    );
}
