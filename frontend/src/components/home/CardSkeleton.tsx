// ============================================
// SipSpot — CardSkeleton (Home featured grid)
// ============================================
import { Skeleton } from '@components/ui/skeleton';

export default function CardSkeleton() {
    return (
        <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-stone-100">
            <Skeleton className="h-52 w-full rounded-none" />
            <div className="p-4 space-y-3">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
                <Skeleton className="h-3 w-full" />
            </div>
        </div>
    );
}
