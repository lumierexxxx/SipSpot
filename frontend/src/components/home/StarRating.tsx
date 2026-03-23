// ============================================
// SipSpot — StarRating
// ============================================
import { Star } from 'lucide-react';

interface StarRatingProps {
    rating: number
}

export default function StarRating({ rating }: StarRatingProps) {
    return (
        <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map(i => (
                <Star
                    key={i}
                    className={`w-3.5 h-3.5 ${i <= rating ? 'fill-amber-400 text-amber-400' : 'text-stone-200'}`}
                />
            ))}
        </div>
    );
}
