'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Link } from '@/i18n/routing';
import DragonLogo from "@/components/ui/DragonLogo";
import { useTranslations } from "next-intl";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations();

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
      <div className="text-center max-w-md mx-auto">
        <div className="mb-8 flex flex-col items-center gap-4">
          <DragonLogo className="w-16 h-16" />
          <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300">
            {t('appTitle')}
          </h1>
        </div>

        <div className="mb-8 flex justify-center">
          <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center text-red-600 dark:text-red-400">
            <AlertTriangle className="w-10 h-10" />
          </div>
        </div>

        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100 mb-4">
          {t('errorGenericTitle')}
        </h2>
        
        <p className="text-slate-600 dark:text-slate-400 mb-8 text-lg">
          {error.message || t('errorGenericMessage')}
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={reset}
            className="inline-flex items-center justify-center gap-2 bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-white text-white dark:text-slate-900 px-6 py-3 rounded-full font-bold transition-all hover:-translate-y-0.5"
          >
            <RefreshCw className="w-5 h-5" />
            <span>{t('errorTryAgain')}</span>
          </button>
          
          <Link 
            href="/" 
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all hover:-translate-y-0.5"
          >
            <Home className="w-5 h-5" />
            <span>{t('errorHome')}</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
