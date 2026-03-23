// Typed t() — TypeScript will catch missing/misspelled i18n keys
import { resources, defaultNS } from '../i18n'

declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: typeof defaultNS
    resources: typeof resources['en']
  }
}
