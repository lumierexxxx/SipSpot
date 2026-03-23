// ============================================
// SipSpot Frontend - CafeCard Component
// ============================================

import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
    Star, MapPin, Clock, Heart, Wifi, Zap,
    Dog, TreePine, VolumeX, Snowflake, Laptop,
    Users, Briefcase, Ban, Car, Accessibility,
    type LucideIcon,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@contexts/AuthContext';
import { toggleFavorite } from '@services/usersAPI';
import type { ICafe } from '@/types/cafe';

// ── Maps ─────────────────────────────────────────────────────────────────────

const AMENITY_MAP: Record<string, { label: string; icon: LucideIcon }> = {
    'WiFi':                         { label: 'WiFi',             icon: Wifi },
    '电源插座':                      { label: 'Power Outlets',    icon: Zap },
    '安静环境':                      { label: 'Quiet Space',      icon: VolumeX },
    '户外座位':                      { label: 'Outdoor Seating',  icon: TreePine },
    '宠物友好':                      { label: 'Dog Friendly',     icon: Dog },
    '禁烟':                          { label: 'Non-Smoking',      icon: Ban },
    '空调':                          { label: 'Air Conditioning', icon: Snowflake },
    '提供停车位':                    { label: 'Parking',          icon: Car },
    '无障碍通行（轮椅可进入）':      { label: 'Accessible',       icon: Accessibility },
    '适合使用笔记本电脑':            { label: 'Laptop Friendly',  icon: Laptop },
    '适合团体聚会':                  { label: 'Group Gatherings', icon: Users },
    '适合工作 / 办公':               { label: 'Work-Friendly',    icon: Briefcase },
};

const SPECIALTY_MAP: Record<string, string> = {
    '意式浓缩 Espresso':      'Espresso',
    '手冲咖啡 Pour Over':     'Pour Over',
    '冷萃咖啡 Cold Brew':     'Cold Brew',
    '氮气咖啡 Nitro Coffee':  'Nitro Coffee',
    '虹吸咖啡 Siphon Coffee': 'Siphon Coffee',
    '摩卡壶 Moka Pot':        'Moka Pot',
    '法压壶 French Press':    'French Press',
    '澳白 Flat White':        'Flat White',
    '精品单品 Single Origin':  'Single Origin',
    '综合拼配 House Blend':   'House Blend',
};

const DAY_NAMES = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1642315160505-b3dff3a3c8b9?w=600&q=80';

// ── Helpers ───────────────────────────────────────────────────────────────────

function getCafeBadge(cafe: ICafe): { key: string; color: string } | null {
    if (!cafe.createdAt) return null;
    const ageMs = Date.now() - new Date(cafe.createdAt).getTime();
    if (ageMs < 60 * 24 * 60 * 60 * 1000) return { key: 'newOpening',    color: 'bg-sky-600' };
    if ((cafe.rating ?? 0) >= 4.8)         return { key: 'editorsChoice', color: 'bg-violet-600' };
    if (cafe.isVerified)                   return { key: 'verified',       color: 'bg-emerald-600' };
    if ((cafe.rating ?? 0) >= 4.5)         return { key: 'topPick',        color: 'bg-amber-700' };
    return null;
}

function getCafeTags(cafe: ICafe): string[] {
    const tags: string[] = [];
    if (cafe.specialty) {
        const en = SPECIALTY_MAP[cafe.specialty];
        if (en) tags.push(en);
    }
    (cafe.amenities ?? []).forEach(a => {
        const mapped = AMENITY_MAP[a];
        if (mapped) tags.push(mapped.label);
    });
    return tags.slice(0, 3);
}

function getTodayHours(cafe: ICafe): string | null {
    const today = DAY_NAMES[new Date().getDay()];
    const entry = cafe.openingHours?.find(h => h.day === today);
    return entry ? `${entry.open} – ${entry.close}` : null;
}

function formatDistance(km: number | null | undefined): string {
    if (km == null) return '';
    return km < 1 ? `${Math.round(km * 1000)}m` : `${km.toFixed(1)}km`;
}

function resolveImage(cafe: ICafe): string {
    const first = cafe.images?.[0];
    if (!first) return FALLBACK_IMAGE;
    if (typeof first === 'string') return first;
    return first.cardImage ?? first.url ?? FALLBACK_IMAGE;
}

// ── Sub-components ────────────────────────────────────────────────────────────

function AmenityIcon({ amenity }: { amenity: string }) {
    const mapped = AMENITY_MAP[amenity];
    if (!mapped) return null;
    const Icon = mapped.icon;
    return <Icon className="w-3.5 h-3.5 text-stone-400" />;
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface CafeCardProps {
    cafe: ICafe;
    view?: 'grid' | 'list';
    onFavoriteToggle?: (id: string, state: boolean) => void;
    showDistance?: boolean;
    distance?: number | null;
    className?: string;
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function CafeCard({
    cafe,
    view = 'grid',
    onFavoriteToggle,
    showDistance = false,
    distance = null,
    className = '',
}: CafeCardProps) {
    const { t } = useTranslation('cafeList');
    const { t: tHome } = useTranslation('home');
    const tdHome = tHome as (key: string) => string;
    const { isLoggedIn, user } = useAuth();
    const [isFavorited, setIsFavorited] = useState(user?.favorites?.includes(cafe._id) ?? false);
    const [favoriteLoading, setFavoriteLoading] = useState(false);

    const cafeId = cafe._id ?? '';
    const image = resolveImage(cafe);
    const priceDisplay = cafe.price ? '$'.repeat(cafe.price) : '$$';
    const location = [cafe.address, cafe.city].filter(Boolean).join(', ') || cafe.city || '';
    const badge = getCafeBadge(cafe);
    const tags = getCafeTags(cafe);
    const hours = getTodayHours(cafe);

    const handleFavoriteClick = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!isLoggedIn) {
            window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname);
            return;
        }
        try {
            setFavoriteLoading(true);
            const newState: boolean = await toggleFavorite(cafeId, isFavorited);
            setIsFavorited(newState);
            onFavoriteToggle?.(cafeId, newState);
        } catch (error) {
            console.error('Failed to toggle favorite:', error);
        } finally {
            setFavoriteLoading(false);
        }
    };

    // ── List view ─────────────────────────────────────────────────────────────

    if (view === 'list') {
        return (
            <Link
                to={`/cafes/${cafeId}`}
                className={`bg-white rounded-2xl border border-stone-100 shadow-sm hover:shadow-md transition-all duration-200 flex gap-0 overflow-hidden group ${className}`}
            >
                <div className="w-48 flex-shrink-0 relative overflow-hidden">
                    <img
                        src={image}
                        alt={cafe.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        onError={e => { (e.target as HTMLImageElement).src = FALLBACK_IMAGE; }}
                    />
                    {badge && (
                        <div className={`absolute top-3 left-3 ${badge.color} text-white rounded-full px-2.5 py-0.5`} style={{ fontSize: '0.68rem', fontWeight: 600 }}>
                            {tdHome('badge.' + badge.key)}
                        </div>
                    )}
                    {showDistance && distance != null && (
                        <div className="absolute bottom-3 left-3 bg-white/90 rounded-full px-2.5 py-0.5 shadow">
                            <span className="text-stone-700" style={{ fontSize: '0.72rem', fontWeight: 500 }}>📍 {formatDistance(distance)}</span>
                        </div>
                    )}
                </div>

                <div className="flex-1 p-5 flex flex-col justify-between min-w-0">
                    <div>
                        <div className="flex items-start justify-between mb-1">
                            <h3 className="text-stone-900 truncate pr-2" style={{ fontSize: '1rem', fontWeight: 600 }}>{cafe.name}</h3>
                            <div className="flex items-center gap-3 ml-3 flex-shrink-0">
                                <div className="flex items-center gap-1">
                                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                                    <span className="text-stone-800" style={{ fontSize: '0.85rem', fontWeight: 600 }}>{cafe.rating?.toFixed(1) ?? '—'}</span>
                                    <span className="text-stone-400" style={{ fontSize: '0.78rem' }}>({(cafe.reviewCount ?? 0).toLocaleString()})</span>
                                </div>
                                <button
                                    onClick={handleFavoriteClick}
                                    disabled={favoriteLoading}
                                    className="disabled:opacity-50"
                                    title={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
                                >
                                    <Heart className={`w-4 h-4 transition-colors ${isFavorited ? 'fill-rose-500 text-rose-500' : 'text-stone-300 hover:text-rose-400'}`} />
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center gap-1.5 text-stone-400 mb-2">
                            <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                            <span className="truncate" style={{ fontSize: '0.82rem' }}>{location}</span>
                            <span className="text-stone-300 flex-shrink-0">·</span>
                            <span className="text-stone-600 flex-shrink-0" style={{ fontSize: '0.82rem', fontWeight: 500 }}>{priceDisplay}</span>
                        </div>

                        {cafe.description && (
                            <p className="text-stone-500 mb-3 line-clamp-2" style={{ fontSize: '0.85rem', lineHeight: 1.55 }}>{cafe.description}</p>
                        )}

                        {tags.length > 0 && (
                            <div className="flex flex-wrap gap-1.5">
                                {tags.map(tag => (
                                    <span key={tag} className="bg-stone-100 text-stone-600 rounded-full px-2.5 py-0.5" style={{ fontSize: '0.72rem' }}>{tag}</span>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="flex items-center justify-between pt-3 mt-3 border-t border-stone-100">
                        <div className="flex items-center gap-1.5 text-stone-400">
                            <Clock className="w-3.5 h-3.5" />
                            <span style={{ fontSize: '0.78rem' }}>{hours ?? t('card.openDaily')}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            {(cafe.amenities ?? []).slice(0, 3).map(a => <AmenityIcon key={a} amenity={a} />)}
                        </div>
                    </div>
                </div>
            </Link>
        );
    }

    // ── Grid view ─────────────────────────────────────────────────────────────

    return (
        <Link
            to={`/cafes/${cafeId}`}
            className={`bg-white rounded-2xl overflow-hidden shadow-sm border border-stone-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group ${className}`}
        >
            <div className="relative h-48 overflow-hidden">
                <img
                    src={image}
                    alt={cafe.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={e => { (e.target as HTMLImageElement).src = FALLBACK_IMAGE; }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />

                {badge && (
                    <div className={`absolute top-3 left-3 ${badge.color} text-white rounded-full px-3 py-1`} style={{ fontSize: '0.68rem', fontWeight: 600 }}>
                        {tdHome('badge.' + badge.key)}
                    </div>
                )}

                <button
                    onClick={handleFavoriteClick}
                    disabled={favoriteLoading}
                    className="absolute top-3 right-3 w-8 h-8 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow transition-colors disabled:opacity-50"
                    title={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
                >
                    <Heart className={`w-4 h-4 transition-colors ${isFavorited ? 'fill-rose-500 text-rose-500' : 'text-stone-400'}`} />
                </button>

                <div className="absolute bottom-3 right-3 bg-white/90 text-stone-700 rounded-lg px-2 py-0.5" style={{ fontSize: '0.78rem', fontWeight: 600 }}>
                    {priceDisplay}
                </div>

                {showDistance && distance != null && (
                    <div className="absolute bottom-3 left-3 bg-white/90 rounded-full px-2.5 py-0.5 shadow">
                        <span className="text-stone-700" style={{ fontSize: '0.72rem', fontWeight: 500 }}>📍 {formatDistance(distance)}</span>
                    </div>
                )}
            </div>

            <div className="p-4">
                <div className="flex items-start justify-between mb-1">
                    <h3 className="text-stone-900 truncate pr-2" style={{ fontSize: '0.95rem', fontWeight: 600 }}>{cafe.name}</h3>
                    <div className="flex items-center gap-1 flex-shrink-0">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        <span className="text-stone-800" style={{ fontSize: '0.82rem', fontWeight: 600 }}>{cafe.rating?.toFixed(1) ?? '—'}</span>
                        <span className="text-stone-400" style={{ fontSize: '0.72rem' }}>({(cafe.reviewCount ?? 0).toLocaleString()})</span>
                    </div>
                </div>

                <div className="flex items-center gap-1.5 text-stone-400 mb-3">
                    <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="truncate" style={{ fontSize: '0.78rem' }}>{location}</span>
                </div>

                {tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                        {tags.map(tag => (
                            <span key={tag} className="bg-stone-100 text-stone-600 rounded-full px-2 py-0.5" style={{ fontSize: '0.7rem' }}>{tag}</span>
                        ))}
                    </div>
                )}

                <div className="flex items-center justify-between pt-3 border-t border-stone-100">
                    <div className="flex items-center gap-1.5 text-stone-400">
                        <Clock className="w-3.5 h-3.5" />
                        <span style={{ fontSize: '0.75rem' }}>{hours ?? t('card.openDaily')}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        {(cafe.amenities ?? []).slice(0, 3).map(a => <AmenityIcon key={a} amenity={a} />)}
                    </div>
                </div>
            </div>
        </Link>
    );
}
