// ============================================
// SipSpot — CafeGridSkeleton
// ============================================

interface Props {
    count?: number;
}

export default function CafeGridSkeleton({ count = 6 }: Props) {
    void count;
    return (
        <div className="flex items-center justify-center py-20">
            <div className="text-center">
                <div className="inline-block w-10 h-10 border-2 border-stone-200 border-t-amber-600 rounded-full animate-spin mb-4" />
                <p className="text-stone-500" style={{ fontSize: '0.9rem' }}>Loading cafés...</p>
            </div>
        </div>
    );
}
