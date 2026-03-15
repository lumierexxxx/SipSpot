// ============================================
// SipSpot — HeroStats
// ============================================
import { useTranslation } from 'react-i18next';

export default function HeroStats() {
    const { t } = useTranslation('home');
    const STATS = [
        { value: '2,400+', label: t('stats.0.label') },
        { value: '18K+', label: t('stats.1.label') },
        { value: '50+', label: t('stats.2.label') },
    ];

    return (
        <div className="flex flex-wrap justify-center gap-12 mb-16">
            {STATS.map(stat => (
                <div key={stat.value} className="text-center">
                    <div className="text-white" style={{ fontSize: '1.8rem', fontWeight: 700 }}>{stat.value}</div>
                    <div className="text-stone-400" style={{ fontSize: '0.85rem' }}>{stat.label}</div>
                </div>
            ))}
        </div>
    );
}
