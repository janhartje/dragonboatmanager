'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import de from '../locales/de.json';
import en from '../locales/en.json';

interface Translations {
  [key: string]: string;
}

interface LanguageContextType {
  language: string;
  changeLanguage: (lang: string) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const translations: { [key: string]: Translations } = {
  de,
  en
};

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<string>('de'); // Default to German

  useEffect(() => {
    const savedLanguage = localStorage.getItem('language');
    if (savedLanguage && translations[savedLanguage]) {
      setLanguage(savedLanguage);
    } else if (typeof navigator !== 'undefined') {
      const browserLang = navigator.language.split('-')[0];
      if (translations[browserLang]) {
        setLanguage(browserLang);
      }
    }
  }, []);

  const changeLanguage = (lang: string) => {
    if (translations[lang]) {
      setLanguage(lang);
      localStorage.setItem('language', lang);
      document.documentElement.lang = lang;
    }
  };

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, changeLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
