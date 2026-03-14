// ============================================
// SipSpot — AISearchBar
// ============================================
import { useNavigate } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import { POPULAR_AI_TAGS } from '@utils/homeData';

export default function AISearchBar({ value, onChange, onSubmit }) {
    const navigate = useNavigate();

    return (
        <>
            <form onSubmit={onSubmit} className="max-w-2xl mx-auto mb-4">
                <div className="flex items-center gap-3 bg-white/10 hover:bg-white/15 border border-white/25 rounded-2xl px-5 py-3.5 transition-colors group">
                    <Sparkles className="w-5 h-5 text-amber-300 flex-shrink-0" />
                    <input
                        type="text"
                        placeholder="Don't know where to go? Try AI search — describe your vibe or mood..."
                        value={value}
                        onChange={onChange}
                        className="flex-1 outline-none bg-transparent text-white placeholder:text-white/50"
                        style={{ fontSize: '0.9rem' }}
                    />
                    <button
                        type="submit"
                        className="flex-shrink-0 bg-amber-400/20 hover:bg-amber-400/30 border border-amber-400/40 text-amber-300 rounded-xl px-4 py-1.5 transition-colors"
                        style={{ fontSize: '0.82rem', fontWeight: 600 }}
                    >
                        Ask AI
                    </button>
                </div>
            </form>

            {/* Popular tag pills */}
            <div className="flex flex-wrap items-center gap-2 mb-16">
                <span className="text-stone-400" style={{ fontSize: '0.85rem' }}>Popular:</span>
                {POPULAR_AI_TAGS.map(tag => (
                    <button
                        key={tag}
                        onClick={() => navigate(`/ai-search?query=${encodeURIComponent(tag)}`)}
                        className="bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-full px-3 py-1 transition-colors"
                        style={{ fontSize: '0.82rem' }}
                    >
                        {tag}
                    </button>
                ))}
            </div>
        </>
    );
}
