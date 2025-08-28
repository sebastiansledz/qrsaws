import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import pl from '../i18n/pl.json';
import en from '../i18n/en.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    debug: import.meta.env.DEV,
    fallbackLng: 'en',
    lng: 'pl',
    
    interpolation: {
      escapeValue: false,
    },
    
    resources: {
      pl: {
        translation: pl,
      },
      en: {
        translation: en,
      },
    },
    
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
    },
  });

export default i18n;