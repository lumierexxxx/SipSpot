// ============================================
// SipSpot — NewsletterSection
// ============================================
import { Mail, CheckCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function NewsletterSection({ email, submitted, onChange, onSubmit }) {
    const { t } = useTranslation('home');

    return (
        <section className="py-20 bg-amber-700">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <Mail className="w-7 h-7 text-white" />
                </div>
                <h2 className="text-white mb-3" style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)', fontWeight: 700, lineHeight: 1.2 }}>
                    {t('newsletter.heading')}
                </h2>
                <p className="text-amber-100 mb-8 max-w-lg mx-auto" style={{ fontSize: '1rem', lineHeight: 1.6 }}>
                    {t('newsletter.body')}
                </p>

                {submitted ? (
                    <div className="flex items-center justify-center gap-3 bg-white/20 text-white rounded-2xl px-6 py-4 max-w-sm mx-auto">
                        <CheckCircle className="w-5 h-5" />
                        <span style={{ fontSize: '0.95rem', fontWeight: 500 }}>{t('newsletter.success')}</span>
                    </div>
                ) : (
                    <form onSubmit={onSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                        <input
                            type="email"
                            value={email}
                            onChange={onChange}
                            placeholder={t('newsletter.placeholder')}
                            className="flex-1 bg-white rounded-xl px-5 py-3 text-stone-800 placeholder:text-stone-400 outline-none border-2 border-transparent focus:border-amber-300"
                            style={{ fontSize: '0.95rem' }}
                            required
                        />
                        <button
                            type="submit"
                            className="bg-stone-900 hover:bg-stone-800 text-white rounded-xl px-6 py-3 transition-colors flex-shrink-0"
                            style={{ fontSize: '0.9rem', fontWeight: 600 }}
                        >
                            {t('newsletter.button')}
                        </button>
                    </form>
                )}

                <p className="text-amber-200 mt-4" style={{ fontSize: '0.78rem' }}>
                    No spam, ever. Unsubscribe anytime.
                </p>
            </div>
        </section>
    );
}
