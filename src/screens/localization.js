import * as Localization from 'expo-localization';
import i18n from 'i18n-js';

// Define your translations
const translations = {
  en: {
    welcome: "Welcome",
    companyName: "Company Name",
    address: "Address",
    phoneNumber: "Phone Number",
    currency: "Currency",
    language: "Language"
  },
  si: {
    welcome: "ආයුබෝවන්",
    companyName: "සමාගමේ නාමය",
    address: "ලිපිනය",
    phoneNumber: "දුරකථන අංකය",
    currency: "මුදල්",
    language: "භාෂාව"
  },
  ta: {
    welcome: "வணக்கம்",
    companyName: "நிறுவனத்தின் பெயர்",
    address: "முகவரி",
    phoneNumber: "தொலைபேசி எண்",
    currency: "நாணயம்",
    language: "மொழி"
  }
};

// Configure i18n
i18n.fallbacks = true; // Use English as fallback
i18n.translations = translations;

// Set initial language from device settings
i18n.locale = Localization.locale.startsWith("si") ? "si" : Localization.locale.startsWith("ta") ? "ta" : "en";

export default i18n;
