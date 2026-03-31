// ============================================
// SipSpot — Language selector (footer)
// Custom div-based dropdown, cross-OS consistent rendering
// ============================================
import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown } from 'lucide-react';

const LANGUAGES = [
    { value: 'en', label: 'English' },
    { value: 'zh', label: '中文' },
];

export default function LangSelect() {
    const { i18n } = useTranslation();
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    const current = LANGUAGES.find(l => l.value === i18n.language) ?? LANGUAGES[0];

    const handleSelect = (lang: string): void => {
        i18n.changeLanguage(lang);
        localStorage.setItem('sipspot_lang', lang);
        setOpen(false);
    };

    useEffect(() => {
        const onClickOutside = (e: MouseEvent): void => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener('mousedown', onClickOutside);
        return () => document.removeEventListener('mousedown', onClickOutside);
    }, []);

    return (
        <div ref={ref} className="relative" style={{ fontSize: '0.8rem' }}>
            {/* Trigger */}
            <button
                onClick={() => setOpen(o => !o)}
                className="flex items-center gap-1.5 border border-stone-700 text-stone-400 hover:text-amber-400 hover:border-stone-600 rounded px-2.5 h-7 transition-colors outline-none"
                aria-haspopup="listbox"
                aria-expanded={open}
                aria-label="Select language"
            >
                <span className="leading-none">{current.label}</span>
                <ChevronDown
                    className={`w-3 h-3 flex-shrink-0 transition-transform duration-150 ${open ? 'rotate-180' : ''}`}
                />
            </button>

            {/* Dropdown */}
            {open && (
                <ul
                    role="listbox"
                    className="absolute bottom-full mb-1.5 left-0 min-w-full bg-stone-900 border border-stone-700 rounded shadow-lg overflow-hidden z-50"
                >
                    {LANGUAGES.map(({ value, label }) => (
                        <li
                            key={value}
                            role="option"
                            aria-selected={i18n.language === value}
                            onClick={() => handleSelect(value)}
                            className={`flex items-center px-3 h-7 cursor-pointer whitespace-nowrap transition-colors ${
                                i18n.language === value
                                    ? 'text-amber-400'
                                    : 'text-stone-400 hover:text-amber-400 hover:bg-stone-800'
                            }`}
                        >
                            {label}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
