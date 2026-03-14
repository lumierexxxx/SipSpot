// ============================================
// SipSpot — ReviewCard (curated, Home page)
// ============================================
import { ThumbsUp } from 'lucide-react';
import { Avatar, AvatarFallback } from '@components/ui/avatar';
import StarRating from './StarRating';

export default function ReviewCard({ review }) {
    return (
        <div className="bg-white rounded-2xl p-6 border border-stone-100 shadow-sm hover:shadow-md transition-shadow flex flex-col gap-4">
            {review.image && (
                <div className="h-40 rounded-xl overflow-hidden">
                    <img src={review.image} alt={review.shop} className="w-full h-full object-cover" />
                </div>
            )}
            <div className="flex items-center justify-between">
                <div>
                    <div className="text-stone-900" style={{ fontSize: '0.9rem', fontWeight: 600 }}>{review.shop}</div>
                    <StarRating rating={review.rating} />
                </div>
                <span className="text-stone-400" style={{ fontSize: '0.75rem' }}>{review.date}</span>
            </div>
            <p className="text-stone-600" style={{ fontSize: '0.88rem', lineHeight: 1.65 }}>
                "{review.text}"
            </p>
            <div className="flex flex-wrap gap-1.5">
                {review.tags.map(tag => (
                    <span
                        key={tag}
                        className="bg-amber-50 text-amber-700 border border-amber-100 rounded-full px-2.5 py-0.5"
                        style={{ fontSize: '0.72rem' }}
                    >
                        {tag}
                    </span>
                ))}
            </div>
            <div className="flex items-center justify-between pt-3 border-t border-stone-100">
                <div className="flex items-center gap-2.5">
                    <Avatar className="w-8 h-8">
                        <AvatarFallback className={`${review.avatarColor} text-white`} style={{ fontSize: '0.72rem', fontWeight: 700 }}>
                            {review.avatar}
                        </AvatarFallback>
                    </Avatar>
                    <div className="text-stone-800" style={{ fontSize: '0.82rem', fontWeight: 600 }}>{review.author}</div>
                </div>
                <button className="flex items-center gap-1.5 text-stone-400 hover:text-amber-700 transition-colors">
                    <ThumbsUp className="w-3.5 h-3.5" />
                    <span style={{ fontSize: '0.78rem' }}>{review.helpful}</span>
                </button>
            </div>
        </div>
    );
}
