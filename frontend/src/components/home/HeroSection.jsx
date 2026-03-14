// ============================================
// SipSpot — HeroSection
// ============================================
import { ChevronDown } from 'lucide-react';

const HERO_IMAGE = 'https://images.unsplash.com/photo-1642315160505-b3dff3a3c8b9?w=1080&q=80';

export default function HeroSection({ children }) {
    return (
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
            <div className="absolute inset-0">
                <img src={HERO_IMAGE} alt="Coffee shop interior" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-b from-stone-900/70 via-stone-900/60 to-stone-900/80" />
            </div>

            <div className="relative z-10 text-center px-4 max-w-4xl mx-auto pt-20">
                <div className="inline-flex items-center gap-2 bg-amber-700/20 border border-amber-500/30 rounded-full px-4 py-1.5 mb-6">
                    <span className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
                    <span className="text-amber-300" style={{ fontSize: '0.82rem' }}>Discover your next favorite cup</span>
                </div>

                <h1
                    className="text-white mb-5"
                    style={{ fontSize: 'clamp(2.2rem, 6vw, 4rem)', fontWeight: 800, lineHeight: 1.15, letterSpacing: '-0.02em' }}
                >
                    Find the Perfect<br />
                    <span className="text-amber-400">Coffee Shop</span> Near You
                </h1>
                <p className="text-stone-300 mb-10 max-w-xl mx-auto" style={{ fontSize: '1.1rem', lineHeight: 1.6 }}>
                    Explore thousands of cafés, read real reviews, and discover hidden gems in your city and beyond.
                </p>

                {children}
            </div>

            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-stone-400 animate-bounce">
                <ChevronDown className="w-6 h-6" />
            </div>
        </section>
    );
}
