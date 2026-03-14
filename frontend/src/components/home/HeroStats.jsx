// ============================================
// SipSpot — HeroStats
// ============================================
const STATS = [
    { value: '2,400+', label: 'Coffee Shops' },
    { value: '18K+', label: 'Reviews' },
    { value: '50+', label: 'Cities' },
];

export default function HeroStats() {
    return (
        <div className="flex flex-wrap justify-center gap-12 mb-16">
            {STATS.map(stat => (
                <div key={stat.label} className="text-center">
                    <div className="text-white" style={{ fontSize: '1.8rem', fontWeight: 700 }}>{stat.value}</div>
                    <div className="text-stone-400" style={{ fontSize: '0.85rem' }}>{stat.label}</div>
                </div>
            ))}
        </div>
    );
}
