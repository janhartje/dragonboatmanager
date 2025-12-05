import de from '@/locales/de.json';
import en from '@/locales/en.json';

export type Language = 'de' | 'en';

const locales: Record<Language, Record<string, string>> = { de, en };

/**
 * Simple translation function for emails.
 * @param lang - The language code ('de' or 'en')
 * @param key - The translation key
 * @returns The translated string, or the key if not found
 */
export const t = (lang: Language, key: string): string => {
  return locales[lang]?.[key] ?? key;
};
