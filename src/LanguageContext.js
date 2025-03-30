import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n from './i18n';

export const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState('en');

  // Load saved language on app start
  useEffect(() => {
    const loadLanguage = async () => {
      const savedLang = await AsyncStorage.getItem('language');
      if (savedLang) {
        setLanguage(savedLang);
        i18n.locale = savedLang;
      }
    };
    loadLanguage();
  }, []);

  // Update language and save to storage
  const updateLanguage = async (newLang) => {
    setLanguage(newLang);
    i18n.locale = newLang;
    await AsyncStorage.setItem('language', newLang);
  };

  return (
    <LanguageContext.Provider value={{ language, updateLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};