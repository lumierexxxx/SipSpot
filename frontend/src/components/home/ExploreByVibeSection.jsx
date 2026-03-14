// ============================================
// SipSpot — ExploreByVibeSection
// ============================================
import { useNavigate } from 'react-router-dom';
import { VIBES } from '@utils/homeData';

export default function ExploreByVibeSection() {
    const navigate = useNavigate();

    return (
        <section className="py-20 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-12">
                    <p className="text-amber-700 mb-2" style={{ fontSize: '0.85rem', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                        Find Your Perfect Match
                    </p>
                    <h2 className="text-stone-900" style={{ fontSize: 'clamp(1.5rem, 3vw, 2.2rem)', fontWeight: 700, lineHeight: 1.2 }}>
                        Explore by Vibe
                    </h2>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                    {VIBES.map(vibe => (
                        <button
                            key={vibe.name}
                            onClick={() => navigate(`/cafes?${vibe.filter}`)}
                            className={`relative bg-gradient-to-br ${vibe.gradient} rounded-2xl p-5 text-left hover:scale-105 transition-transform duration-200 group overflow-hidden`}
                        >
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors rounded-2xl" />
                            <div className="relative z-10">
                                <div className="mb-3" style={{ fontSize: '2rem' }}>{vibe.emoji}</div>
                                <div className="text-white mb-0.5" style={{ fontSize: '1rem', fontWeight: 700 }}>{vibe.name}</div>
                                <div className="text-white/60" style={{ fontSize: '0.78rem' }}>{vibe.count}</div>
                            </div>
                        </button>
                    ))}
                </div>
            </div>
        </section>
    );
}
