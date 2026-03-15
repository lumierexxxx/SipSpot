// ============================================
// SipSpot — i18next initialisation
// Inline-bundled resources, sipspot_lang localStorage
// ============================================
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import enCommon from './locales/en/common.json';
import enHome from './locales/en/home.json';
import enCafeList from './locales/en/cafeList.json';
import zhCommon from './locales/zh/common.json';
import zhHome from './locales/zh/home.json';
import zhCafeList from './locales/zh/cafeList.json';

i18n.use(initReactI18next).init({
    resources: {
        en: { common: enCommon, home: enHome, cafeList: enCafeList },
        zh: { common: zhCommon, home: zhHome, cafeList: zhCafeList },
    },
    lng: localStorage.getItem('sipspot_lang') || 'en',
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
});

export default i18n;
