// ============================================
// SipSpot — EmptyState (CafeListPage)
// ============================================
import { useTranslation } from 'react-i18next';
import { Coffee, X } from 'lucide-react';

interface Props {
    myOnly: boolean;
    hasError: boolean;
    errorMessage?: string | null;
    onRetry: () => void;
    onClear: () => void;
    onAddCafe: () => void;
}

export default function EmptyState({ myOnly, hasError, errorMessage, onRetry, onClear, onAddCafe }: Props) {
    const { t } = useTranslation('cafeList');
    if (hasError) {
        return (
            <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-12 text-center">
                <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <X className="w-7 h-7 text-rose-400" />
                </div>
                <h3 className="text-stone-800 mb-2" style={{ fontSize: '1rem', fontWeight: 600 }}>{t('empty.errorHeading')}</h3>
                <p className="text-stone-500 mb-5" style={{ fontSize: '0.88rem' }}>{errorMessage}</p>
                <button onClick={onRetry} className="bg-amber-700 text-white px-5 py-2.5 rounded-full hover:bg-amber-800 transition-colors" style={{ fontSize: '0.88rem' }}>
                    {t('empty.errorRetry')}
                </button>
            </div>
        );
    }

    return (
        <div className="text-center py-20">
            <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Coffee className="w-7 h-7 text-stone-300" />
            </div>
            <h3 className="text-stone-600 mb-2" style={{ fontSize: '1rem', fontWeight: 600 }}>
                {myOnly ? 'No cafés added yet' : t('empty.heading')}
            </h3>
            <p className="text-stone-400 mb-5" style={{ fontSize: '0.88rem' }}>
                {myOnly ? 'Start by adding your first café!' : t('empty.body')}
            </p>
            {myOnly ? (
                <button onClick={onAddCafe} className="bg-amber-700 text-white px-5 py-2.5 rounded-full hover:bg-amber-800 transition-colors" style={{ fontSize: '0.88rem' }}>
                    Add a Café
                </button>
            ) : (
                <button onClick={onClear} className="bg-amber-700 text-white px-5 py-2.5 rounded-full hover:bg-amber-800 transition-colors" style={{ fontSize: '0.88rem' }}>
                    {t('empty.retry')}
                </button>
            )}
        </div>
    );
}
