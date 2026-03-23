// ============================================
// SipSpot — AISearchBar
// ============================================
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Input } from '@components/ui/input';
import { Button } from '@components/ui/button';

export default function AISearchBar() {
    const [aiQuery, setAiQuery] = useState<string>('');
    const navigate = useNavigate();
    const { t } = useTranslation('home');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const td = t as (key: string) => string;
    const AI_TAG_KEYS = ['specialtyCoffee', 'quietStudySpot', 'dogFriendly', 'outdoorSeating', 'coldBrew'];

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (aiQuery.trim()) navigate(`/ai-search?query=${encodeURIComponent(aiQuery.trim())}`);
    };

    return (
        <>
            <form onSubmit={handleSubmit} className="max-w-2xl mx-auto mb-4">
                <div className="flex items-center gap-3 bg-white/10 hover:bg-white/15 border border-white/25 rounded-2xl px-5 py-3.5 transition-colors group">
                    <Sparkles className="w-5 h-5 text-amber-300 flex-shrink-0" />
                    <Input
                        type="text"
                        placeholder={t('aiSearch.placeholder')}
                        value={aiQuery}
                        onChange={(e) => setAiQuery(e.target.value)}
                        className="flex-1 outline-none bg-transparent text-white placeholder:text-white/50 border-none shadow-none focus-visible:ring-0 h-auto p-0"
                        style={{ fontSize: '0.9rem' }}
                    />
                    <Button
                        type="submit"
                        variant="ghost"
                        className="flex-shrink-0 bg-amber-400/20 hover:bg-amber-400/30 border border-amber-400/40 text-amber-300 rounded-xl px-4 py-1.5 h-auto"
                        style={{ fontSize: '0.82rem', fontWeight: 600 }}
                    >
                        {t('aiSearch.button')}
                    </Button>
                </div>
            </form>

            {/* Popular tag pills */}
            <div className="flex flex-wrap items-center gap-2 mb-16">
                <span className="text-stone-400" style={{ fontSize: '0.85rem' }}>Popular:</span>
                {AI_TAG_KEYS.map(key => {
                    const label = td(`aiSearch.tags.${key}`);
                    return (
                        <button
                            key={key}
                            onClick={() => navigate(`/ai-search?query=${encodeURIComponent(label)}`)}
                            className="bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-full px-3 py-1 transition-colors"
                            style={{ fontSize: '0.82rem' }}
                        >
                            {label}
                        </button>
                    );
                })}
            </div>
        </>
    );
}
