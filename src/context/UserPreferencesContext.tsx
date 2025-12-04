'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';

interface UserPreferences {
  theme: 'light' | 'dark' | 'system' | null;
  language: 'de' | 'en' | null;
  activeTeamId: string | null;
}

interface UserPreferencesContextType {
  preferences: UserPreferences;
  isLoading: boolean;
  updatePreference: <K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) => Promise<void>;
  effectiveTheme: 'light' | 'dark';
}

const UserPreferencesContext = createContext<UserPreferencesContextType | undefined>(undefined);

export const UserPreferencesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { data: session, status } = useSession();
  const [preferences, setPreferences] = useState<UserPreferences>({
    theme: null,
    language: null,
    activeTeamId: null,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [systemTheme, setSystemTheme] = useState<'light' | 'dark'>('light');

  // Detect system theme
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      setSystemTheme(mediaQuery.matches ? 'dark' : 'light');

      const handler = (e: MediaQueryListEvent) => {
        setSystemTheme(e.matches ? 'dark' : 'light');
      };

      mediaQuery.addEventListener('change', handler);
      return () => mediaQuery.removeEventListener('change', handler);
    }
  }, []);

  // Load preferences from API when logged in
  useEffect(() => {
    const loadPreferences = async () => {
      if (status === 'authenticated' && session?.user) {
        try {
          const response = await fetch('/api/user/preferences');
          if (response.ok) {
            const data = await response.json();
            setPreferences({
              theme: data.theme || null,
              language: data.language || null,
              activeTeamId: data.activeTeamId || null,
            });
          }
        } catch (error) {
          console.error('Failed to load preferences:', error);
        }
      }
      setIsLoading(false);
    };

    if (status !== 'loading') {
      loadPreferences();
    }
  }, [session, status]);

  // Apply theme to document
  useEffect(() => {
    if (typeof document !== 'undefined') {
      const effectiveTheme = preferences.theme === 'system' || !preferences.theme 
        ? systemTheme 
        : preferences.theme;
      
      if (effectiveTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }, [preferences.theme, systemTheme]);

  // Apply language to document
  useEffect(() => {
    if (typeof document !== 'undefined' && preferences.language) {
      document.documentElement.lang = preferences.language;
    }
  }, [preferences.language]);

  const updatePreference = useCallback(async <K extends keyof UserPreferences>(
    key: K, 
    value: UserPreferences[K]
  ) => {
    // Optimistic update
    setPreferences(prev => ({ ...prev, [key]: value }));

    // Persist to API if logged in
    if (status === 'authenticated') {
      try {
        const response = await fetch('/api/user/preferences', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ [key]: value }),
        });

        if (!response.ok) {
          // Revert on error
          console.error('Failed to save preference');
        }
      } catch (error) {
        console.error('Failed to save preference:', error);
      }
    } else {
      // For non-logged-in users, store in localStorage
      localStorage.setItem(`pref_${key}`, String(value));
    }
  }, [status]);

  const effectiveTheme: 'light' | 'dark' = 
    preferences.theme === 'system' || !preferences.theme 
      ? systemTheme 
      : preferences.theme;

  return (
    <UserPreferencesContext.Provider value={{ preferences, isLoading, updatePreference, effectiveTheme }}>
      {children}
    </UserPreferencesContext.Provider>
  );
};

export const useUserPreferences = (): UserPreferencesContextType => {
  const context = useContext(UserPreferencesContext);
  if (!context) {
    throw new Error('useUserPreferences must be used within a UserPreferencesProvider');
  }
  return context;
};
