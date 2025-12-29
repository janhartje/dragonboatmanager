'use client';
// Force translation refresh

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import de from '../locales/de.json';
import en from '../locales/en.json';

interface Translations {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

interface LanguageContextType {
  language: string;
  changeLanguage: (lang: string) => void;
  t: <T = string>(key: string) => T;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const translations: { [key: string]: Translations } = {
  de,
  en
};

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { data: session, status } = useSession();
  const [language, setLanguage] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('language');
      // Validate saved language
      if (saved && translations[saved]) {
        return saved;
      }
      // Fallback to browser language
      if (navigator.language) {
         const browserLang = navigator.language.split('-')[0];
         if (translations[browserLang]) return browserLang;
      }
    }
    return 'de'; // Default
  });

  // Load language preference from API
  useEffect(() => {
    // Sync initial document lang
    document.documentElement.lang = language;

    const syncWithServer = async () => {
      // Only sync if authenticated
      if (status === 'authenticated' && session?.user) {
        try {
          const response = await fetch('/api/user/preferences');
          if (response.ok) {
            const data = await response.json();
            if (data.language && translations[data.language]) {
              // Server wins -> update local state and storage
              if (data.language !== language) {
                 setLanguage(data.language);
                 localStorage.setItem('language', data.language);
                 document.documentElement.lang = data.language;
              }
            }
          }
        } catch (error) {
          console.error('Failed to load language preference:', error);
        }
      }
    };

    if (status !== 'loading') {
      syncWithServer();
    }
    // We only want to run this on mount/auth-change, not when language changes locally
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, session]);

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

  const t = <T = string>(key: string): T => {
    return (translations[language][key] as unknown as T) || (key as unknown as T);
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

