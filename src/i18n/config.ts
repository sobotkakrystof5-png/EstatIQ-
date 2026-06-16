import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

import cs from './locales/cs.json'
import en from './locales/en.json'
import de from './locales/de.json'
import sk from './locales/sk.json'
import fr from './locales/fr.json'
import es from './locales/es.json'
import ru from './locales/ru.json'
import zh from './locales/zh.json'

const resources = {
  cs: { translation: cs },
  en: { translation: en },
  de: { translation: de },
  sk: { translation: sk },
  fr: { translation: fr },
  es: { translation: es },
  ru: { translation: ru },
  zh: { translation: zh },
}

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'cs',
    supportedLngs: ['cs', 'en', 'de', 'fr', 'es', 'zh', 'sk', 'ru'],
    defaultNS: 'translation',
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'estatiq_lang',
    },
  })

export default i18n
