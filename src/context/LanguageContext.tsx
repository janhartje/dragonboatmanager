'use client';

import React, { createContext, useContext, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useLocale, useMessages } from 'next-intl';
import { useRouter, usePathname } from '@/i18n/routing';

interface LanguageContextType {
  language: string;
  changeLanguage: (lang: string) => void;
  t: <T = string>(key: string) => T; // Keeping the generic signature for compatibility
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { data: session, status } = useSession();
  const locale = useLocale();
  const messages = useMessages();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status !== 'loading') {
      // Sync logic disabled to avoid navigation loops. 
      // Middleware handles initial redirect.
    }
  }, [status, session, locale]);

  const changeLanguage = async (lang: string) => {
    if (lang === locale) return;
    
    // Use next-intl router to switch locale
    router.replace({pathname}, {locale: lang as "de" | "en"});

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
    
    // Also save to localStorage for client-side persistence (middleware might use cookie instead)
    if (typeof window !== 'undefined') {
        localStorage.setItem('language', lang);
    }
  };

  // Helper helper to safely access nested properties
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const getNestedValue = (obj: any, path: string): any => {
    return path.split('.').reduce((acc, part) => (acc && acc[part] !== undefined) ? acc[part] : undefined, obj);
  };

  const t = <T = string>(key: string): T => {
    try {
        // Fallback to manual lookup in messages object to support arrays/objects (legacy behavior)
        // next-intl's t() is strict about returning strings.
        const msg = getNestedValue(messages, key);
        if (msg !== undefined) return msg as T;
        return key as unknown as T;
    } catch {
        return key as unknown as T;
    }
  };

  return (
    <LanguageContext.Provider value={{ language: locale, changeLanguage, t }}>
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
