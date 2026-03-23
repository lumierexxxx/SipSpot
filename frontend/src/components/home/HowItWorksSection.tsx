// ============================================
// SipSpot — HowItWorksSection
// ============================================
import { useTranslation } from 'react-i18next';
import { HOW_IT_WORKS_STEPS } from '@utils/homeData';

export default function HowItWorksSection() {
    const { t } = useTranslation('home');

    return (
        <section className="py-20 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-14">
                    <p className="text-amber-700 mb-2" style={{ fontSize: '0.85rem', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                        Simple as Your Morning Brew
                    </p>
                    <h2 className="text-stone-900" style={{ fontSize: 'clamp(1.5rem, 3vw, 2.2rem)', fontWeight: 700, lineHeight: 1.2 }}>
                        {t('howItWorks.heading')}
                    </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {HOW_IT_WORKS_STEPS.map((step, i) => (
                        <div key={step.step} className="relative">
                            {i < HOW_IT_WORKS_STEPS.length - 1 && (
                                <div
                                    className="hidden lg:block absolute top-10 h-px bg-stone-200 z-0"
                                    style={{ width: 'calc(100% - 5rem)', left: 'calc(50% + 3rem)' }}
                                />
                            )}
                            <div className="relative z-10 flex flex-col items-center text-center">
                                <div className={`w-16 h-16 rounded-2xl border ${step.color} ${step.border} flex items-center justify-center mb-4 shadow-sm`}>
                                    {step.icon}
                                </div>
                                <span className="text-stone-300 mb-2" style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.1em' }}>
                                    STEP {step.step}
                                </span>
                                <h3 className="text-stone-900 mb-2" style={{ fontSize: '1rem', fontWeight: 600 }}>{t(('howItWorks.steps.' + i + '.title') as any)}</h3>
                                <p className="text-stone-500" style={{ fontSize: '0.88rem', lineHeight: 1.6 }}>{t(('howItWorks.steps.' + i + '.description') as any)}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
