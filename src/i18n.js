import { I18n } from 'i18n-js';
import * as Localization from 'expo-localization';
import en from './locales/en.json';
import si from './locales/si.json';
import ta from './locales/ta.json';


const i18n = new I18n({
  en,
  si,
  ta,
});

// Set initial locale from device or saved settings
i18n.locale = Localization.locale;
i18n.enableFallback = true; // Fallback to English if translation missing

export default i18n;