'use client';
// Force translation refresh

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import de from '../locales/de.json';
import en from '../locales/en.json';

interface Translations {
  [key: string]: any;
}

interface LanguageContextType {
  language: string;
  changeLanguage: (lang: string) => void;
  t: (key: string) => any;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const translations: { [key: string]: Translations } = {
  de,
  en
};

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { data: session, status } = useSession();
  const [language, setLanguage] = useState<string>('de'); // Default to German
  const [initialized, setInitialized] = useState(false);

  // Load language preference
  useEffect(() => {
    const loadLanguage = async () => {
      // 1. Try to load from API if logged in
      if (status === 'authenticated' && session?.user) {
        try {
          const response = await fetch('/api/user/preferences');
          if (response.ok) {
            const data = await response.json();
            if (data.language && translations[data.language]) {
              setLanguage(data.language);
              document.documentElement.lang = data.language;
              setInitialized(true);
              return;
            }
          }
        } catch (error) {
          console.error('Failed to load language preference:', error);
        }
      }

      // 2. Try localStorage
      const savedLanguage = localStorage.getItem('language');
      if (savedLanguage && translations[savedLanguage]) {
        setLanguage(savedLanguage);
        document.documentElement.lang = savedLanguage;
        setInitialized(true);
        return;
      }

      // 3. Fall back to browser language
      if (typeof navigator !== 'undefined') {
        const browserLang = navigator.language.split('-')[0];
        if (translations[browserLang]) {
          setLanguage(browserLang);
          document.documentElement.lang = browserLang;
        }
      }
      setInitialized(true);
    };

    if (status !== 'loading') {
      loadLanguage();
    }
  }, [session, status]);

  const changeLanguage = async (lang: string) => {
    if (translations[lang]) {
      setLanguage(lang);
      localStorage.setItem('language', lang);
      document.documentElement.lang = lang;

      // Persist to API if logged in
      if (status === 'authenticated') {
        try {
          await fetch('/api/user/preferences', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ language: lang }),
          });
        } catch (error) {
          console.error('Failed to save language preference:', error);
        }
      }
    }
  };

  const t = (key: string): any => {
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

