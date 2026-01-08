'use client';

import { Link } from '@/i18n/routing';
import { Home } from "lucide-react";
import DragonLogo from "@/components/ui/DragonLogo";

export default function NotFound() {
  // Static translations for the error page to ensure robustness during build/errors
  const translations = {
    de: {
      appTitle: 'Drachenboot Manager',
      title: 'Seite nicht gefunden',
      message: 'Die gesuchte Seite existiert leider nicht oder wurde verschoben.',
      back: 'Zurück zur Startseite'
    },
    en: {
      appTitle: 'Dragon Boat Manager',
      title: 'Page Not Found',
      message: "The page you are looking for doesn't exist or has been moved.",
      back: 'Back to Home'
    }
  };

  // Default to German, could be enhanced with client-side detection if needed
  const t = translations.de;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
      <div className="text-center max-w-md mx-auto">
        <div className="mb-8 flex flex-col items-center gap-4">
          <DragonLogo className="w-16 h-16" />
          <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300">
            {t.appTitle}
          </h1>
        </div>

        <div className="mb-8 flex justify-center">
          <div className="relative">
            <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full animate-pulse-slow" />
            <h1 className="relative text-9xl font-black text-slate-200 dark:text-slate-800 tracking-tighter select-none">
              404
            </h1>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
                Ooops!
              </span>
            </div>
          </div>
        </div>

        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100 mb-4">
          {t.title}
        </h2>
        
        <p className="text-slate-600 dark:text-slate-400 mb-8 text-lg">
          {t.message}
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link 
            href="/" 
            className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-full font-bold transition-all shadow-lg shadow-blue-600/20 hover:shadow-blue-600/40 hover:-translate-y-0.5"
          >
            <Home className="w-5 h-5" />
            <span>{t.back}</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
