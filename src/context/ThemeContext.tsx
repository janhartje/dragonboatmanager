'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useSession } from "next-auth/react";

interface ThemeContextType {
    isDarkMode: boolean;
    toggleDarkMode: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { status } = useSession();
    const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
        if (typeof window !== 'undefined') {
            const stored = localStorage.getItem('drachenboot_theme');
            if (stored === 'dark') return true;
            if (stored === 'light') return false;
            if (window.matchMedia('(prefers-color-scheme: dark)').matches) return true;
        }
        return false;
    });

    // Sync with user preferences from API
    useEffect(() => {
        const syncTheme = async () => {
            if (status === 'authenticated') {
                try {
                    const prefsResponse = await fetch('/api/user/preferences');
                    if (prefsResponse.ok) {
                        const prefs = await prefsResponse.json();
                        // Server wins
                        if (prefs.theme === 'dark' && !isDarkMode) {
                            setIsDarkMode(true);
                            localStorage.setItem('drachenboot_theme', 'dark');
                        } else if (prefs.theme === 'light' && isDarkMode) {
                            setIsDarkMode(false);
                            localStorage.setItem('drachenboot_theme', 'light');
                        }
                    }
                } catch (e) {
                    console.error('Failed to load theme preference', e);
                }
            }
        };
        syncTheme();
    }, [status]); // eslint-disable-line react-hooks/exhaustive-deps

    // Apply class to document
    useEffect(() => {
        if (isDarkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
        localStorage.setItem('drachenboot_theme', isDarkMode ? 'dark' : 'light');
    }, [isDarkMode]);

    // Listen for system changes (if no override)
    useEffect(() => {
        if (typeof window !== 'undefined' && window.matchMedia) {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            const handleChange = (e: MediaQueryListEvent) => {
                if (!localStorage.getItem('drachenboot_theme')) {
                    setIsDarkMode(e.matches);
                }
            };
            mediaQuery.addEventListener('change', handleChange);
            return () => mediaQuery.removeEventListener('change', handleChange);
        }
    }, []);

    const toggleDarkMode = useCallback(async () => {
        const newDarkMode = !isDarkMode;
        setIsDarkMode(newDarkMode);

        if (status === 'authenticated') {
            try {
                await fetch('/api/user/preferences', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ theme: newDarkMode ? 'dark' : 'light' }),
                });
            } catch (e) {
                console.error('Failed to save theme preference', e);
            }
        }
    }, [isDarkMode, status]);

    return (
        <ThemeContext.Provider value={{ isDarkMode, toggleDarkMode }}>
            {children}
        </ThemeContext.Provider>
    );
};
