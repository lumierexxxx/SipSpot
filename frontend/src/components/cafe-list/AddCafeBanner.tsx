// ============================================
// SipSpot — AddCafeBanner
// ============================================
import { useTranslation } from 'react-i18next';
import { Coffee, Plus } from 'lucide-react';

interface Props {
    onAddCafe: () => void;
}

export default function AddCafeBanner({ onAddCafe }: Props) {
    const { t } = useTranslation('cafeList');
    return (
        <div className="mt-10 bg-gradient-to-r from-amber-700 to-amber-600 rounded-3xl p-7 flex flex-col sm:flex-row items-center justify-between gap-5">
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center flex-shrink-0">
                    <Coffee className="w-6 h-6 text-white" />
                </div>
                <div>
                    <h3 className="text-white" style={{ fontSize: '1rem', fontWeight: 700 }}>{t('banner.heading')}</h3>
                    <p className="text-amber-100" style={{ fontSize: '0.85rem' }}>{t('banner.body')}</p>
                </div>
            </div>
            <button
                onClick={onAddCafe}
                className="bg-white hover:bg-amber-50 text-amber-700 px-6 py-3 rounded-2xl transition-colors flex items-center gap-2 flex-shrink-0"
                style={{ fontSize: '0.9rem', fontWeight: 600 }}
            >
                <Plus className="w-4 h-4" />
                {t('banner.button')}
            </button>
        </div>
    );
}
