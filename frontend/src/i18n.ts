// ============================================
// SipSpot — i18next initialisation
// Inline-bundled resources, sipspot_lang localStorage
// ============================================
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

import enCommon from './locales/en/common.json'
import enHome from './locales/en/home.json'
import enCafeList from './locales/en/cafeList.json'
import enAmenities from './locales/en/amenities.json'
import enSpecialties from './locales/en/specialties.json'
import enDays from './locales/en/days.json'
import zhCommon from './locales/zh/common.json'
import zhHome from './locales/zh/home.json'
import zhCafeList from './locales/zh/cafeList.json'
import zhAmenities from './locales/zh/amenities.json'
import zhSpecialties from './locales/zh/specialties.json'
import zhDays from './locales/zh/days.json'

export const defaultNS = 'common' as const

export const resources = {
  en: { common: enCommon, home: enHome, cafeList: enCafeList, amenities: enAmenities, specialties: enSpecialties, days: enDays },
  zh: { common: zhCommon, home: zhHome, cafeList: zhCafeList, amenities: zhAmenities, specialties: zhSpecialties, days: zhDays },
} as const

i18n.use(initReactI18next).init({
  resources,
  lng: localStorage.getItem('sipspot_lang') ?? 'zh',   // SipSpot targets Chinese market
  fallbackLng: 'zh',
  defaultNS,
  interpolation: { escapeValue: false },
}).catch(console.error)

export default i18n
