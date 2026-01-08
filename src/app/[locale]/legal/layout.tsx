'use client';

import React from 'react';
import { Link } from '@/i18n/routing';
import { ArrowLeft } from 'lucide-react';
import { Card } from '@/components/ui/core/Card';
import DragonLogo from '@/components/ui/DragonLogo';
import Footer from '@/components/ui/Footer';
import { useLanguage } from '@/context/LanguageContext';

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950">
      {/* Header */}
      <nav className="sticky top-0 z-50 w-full backdrop-blur-xl bg-white/70 dark:bg-slate-950/70 border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-3">
              <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                <DragonLogo className="w-8 h-8" />
                <span className="font-bold text-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 hidden sm:block">
                  {t('appTitle') || 'Drachenboot Manager'}
                </span>
              </Link>
            </div>
            
            <Link 
              href="/"
              className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              {t('backToHome') || 'Zurück zur Startseite'}
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-grow container mx-auto px-4 py-8 sm:py-12 max-w-4xl relative z-10">
        <Card className="p-8 sm:p-12 prose dark:prose-invert max-w-none shadow-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          {children}
        </Card>
      </main>

      {/* Footer */}
      <Footer variant="full" />
    </div>
  );
}
