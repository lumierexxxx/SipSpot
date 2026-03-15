// ============================================
// SipSpot — Language selector (footer)
// ============================================
import { useTranslation } from 'react-i18next';

const LANGUAGES = [
    { value: 'en', label: 'English' },
    { value: 'zh', label: '中文' },
];

export default function LangSelect() {
    const { i18n } = useTranslation();

    const handleChange = (e) => {
        const lang = e.target.value;
        i18n.changeLanguage(lang);
        localStorage.setItem('sipspot_lang', lang);
    };

    return (
        <select
            value={i18n.language}
            onChange={handleChange}
            className="bg-transparent border border-stone-700 text-stone-400 hover:text-amber-400 focus:text-amber-400 focus:border-amber-600 rounded px-2 py-1 cursor-pointer outline-none transition-colors"
            style={{ fontSize: '0.8rem' }}
            aria-label="Select language"
        >
            {LANGUAGES.map(({ value, label }) => (
                <option key={value} value={value} className="bg-stone-900 text-stone-300">
                    {label}
                </option>
            ))}
        </select>
    );
}
