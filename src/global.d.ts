import de from './locales/de.json';

declare global {
  type Messages = typeof de;
  interface IntlMessages extends Messages {}
}