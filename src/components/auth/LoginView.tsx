'use client';

import React from 'react';
import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';
import { useDrachenboot } from '@/context/DrachenbootContext';
import DragonLogo from '@/components/ui/DragonLogo';
import Footer from '@/components/ui/Footer';
import { LoginButton } from '@/components/auth/LoginButton';
import { Github, ArrowLeft } from 'lucide-react';

const LoginView: React.FC = () => {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen font-sans text-slate-800 dark:text-slate-100 transition-colors duration-300 bg-slate-100 dark:bg-slate-950 flex flex-col">
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="mb-6">
            <Link 
              href="/" 
              className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
            >
              <ArrowLeft size={20} />
              <span className="font-medium">{t('backToHome') || 'Back to Home'}</span>
            </Link>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-8 text-center">
            <div className="mb-8">
              <div className="w-20 h-20 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <DragonLogo className="w-12 h-12" />
              </div>
              <h1 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">
                {t('welcomeBack') || 'Willkommen zurück'}
              </h1>
              <p className="text-slate-600 dark:text-slate-400">
                {t('loginSubtitle') || 'Bitte melden Sie sich an, um fortzufahren.'}
              </p>
            </div>

            <div className="space-y-3">
              <LoginButton provider="google">
                <div className="flex items-center justify-center gap-2 w-full">
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  {t('signInGoogle')}
                </div>
              </LoginButton>
              
              <LoginButton provider="github">
                <div className="flex items-center justify-center gap-2 w-full">
                  <Github size={20} />
                  {t('signInGithub')}
                </div>
              </LoginButton>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default LoginView;
