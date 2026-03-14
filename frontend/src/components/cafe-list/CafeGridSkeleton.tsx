// ============================================
// SipSpot — CafeGridSkeleton
// ============================================
import { Skeleton } from '@components/ui/skeleton';

interface Props {
    count?: number;
}

export default function CafeGridSkeleton({ count = 6 }: Props) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
            {Array.from({ length: count }).map((_, i) => (
                <div key={i} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-stone-100">
                    <Skeleton className="h-48 w-full rounded-none" />
                    <div className="p-4 space-y-3">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                        <Skeleton className="h-3 w-full" />
                    </div>
                </div>
            ))}
        </div>
    );
}
