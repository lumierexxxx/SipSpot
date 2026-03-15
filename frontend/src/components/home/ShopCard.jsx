// ============================================
// SipSpot — ShopCard (Home featured grid only)
// ============================================
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Star, MapPin, Clock, Heart, Wifi, Zap } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getCafeBadge, getCafeTags, getCafeHours, getCafeImage, getCafeAmenityIcons } from '@utils/homeData';

export default function ShopCard({ cafe, index }) {
    const { t } = useTranslation('home');
    const [liked, setLiked] = useState(false);
    const badge = getCafeBadge(cafe);
    const tags = getCafeTags(cafe);
    const hours = getCafeHours(cafe);
    const image = getCafeImage(cafe, index);
    const amenityIcons = getCafeAmenityIcons(cafe);
    const priceDisplay = cafe.price ? '¥'.repeat(cafe.price) : '¥¥';
    const location = [cafe.address, cafe.city].filter(Boolean).join(', ');

    return (
        <Link
            to={`/cafes/${cafe._id}`}
            className="bg-white rounded-2xl overflow-hidden shadow-sm border border-stone-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group block"
        >
            {/* Image */}
            <div className="relative h-52 overflow-hidden">
                <img
                    src={image}
                    alt={cafe.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                <div
                    className={`absolute top-3 left-3 ${badge.color} text-white rounded-full px-3 py-1`}
                    style={{ fontSize: '0.72rem', fontWeight: 600 }}
                >
                    {t('badge.' + badge.key)}
                </div>
                <button
                    onClick={(e) => { e.preventDefault(); setLiked(!liked); }}
                    className="absolute top-3 right-3 w-8 h-8 bg-white/90 hover:bg-white rounded-full flex items-center justify-center transition-colors shadow"
                >
                    <Heart className={`w-4 h-4 transition-colors ${liked ? 'fill-rose-500 text-rose-500' : 'text-stone-400'}`} />
                </button>
                <div
                    className="absolute bottom-3 right-3 bg-white/90 text-stone-700 rounded-lg px-2 py-0.5"
                    style={{ fontSize: '0.8rem', fontWeight: 600 }}
                >
                    {priceDisplay}
                </div>
            </div>

            {/* Body */}
            <div className="p-4">
                <div className="flex items-start justify-between mb-1.5">
                    <h3 className="text-stone-900 truncate pr-2" style={{ fontSize: '1rem', fontWeight: 600 }}>
                        {cafe.name}
                    </h3>
                    <div className="flex items-center gap-1 flex-shrink-0">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        <span className="text-stone-800" style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                            {cafe.rating?.toFixed(1) || '—'}
                        </span>
                        <span className="text-stone-400" style={{ fontSize: '0.78rem' }}>
                            ({(cafe.reviewCount || 0).toLocaleString()})
                        </span>
                    </div>
                </div>
                <div className="flex items-center gap-1.5 text-stone-500 mb-3">
                    <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                    <span style={{ fontSize: '0.82rem' }} className="truncate">{location || cafe.city}</span>
                </div>
                {tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-3">
                        {tags.map(tag => (
                            <span
                                key={tag}
                                className="bg-stone-100 text-stone-600 rounded-full px-2.5 py-0.5"
                                style={{ fontSize: '0.75rem' }}
                            >
                                {tag}
                            </span>
                        ))}
                    </div>
                )}
                <div className="flex items-center justify-between pt-3 border-t border-stone-100">
                    <div className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-stone-400" />
                        <span className="text-stone-500" style={{ fontSize: '0.78rem' }}>{hours}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        {amenityIcons.includes('wifi') && <Wifi className="w-3.5 h-3.5 text-stone-400" />}
                        {amenityIcons.includes('power') && <Zap className="w-3.5 h-3.5 text-stone-400" />}
                    </div>
                </div>
            </div>
        </Link>
    );
}
