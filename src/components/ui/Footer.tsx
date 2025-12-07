'use client';

import React, { useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { useDrachenboot } from '@/context/DrachenbootContext';
import { ImprintModal, ChangelogModal, PrivacyModal } from './Modals';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { useSession } from 'next-auth/react';

interface FooterProps {
  variant?: 'compact' | 'full';
}

const Footer: React.FC<FooterProps> = ({ variant = 'full' }) => {
  const { data: session } = useSession();
  const { t } = useLanguage();
  const [showImprint, setShowImprint] = useState<boolean>(false);
  const [showPrivacy, setShowPrivacy] = useState<boolean>(false);
  const [showChangelog, setShowChangelog] = useState<boolean>(false);
  const { canInstall, promptInstall } = usePWAInstall();


  if (variant === 'compact') {
    return (
      <>
        <footer className="py-12 border-t border-slate-200 dark:border-slate-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="text-slate-500 dark:text-slate-400 text-sm">
              © {new Date().getFullYear()} {t('appTitle')}. {t('madeWithLove')}
            </div>
            <div className="flex flex-wrap justify-center gap-3 sm:gap-4 text-sm items-center">
              <button onClick={() => setShowImprint(true)} className="text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors">
                {t('imprint')}
              </button>
              <span className="text-slate-300 dark:text-slate-600">•</span>
              <button onClick={() => setShowPrivacy(true)} className="text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors">
                {t('privacy')}
              </button>
              <span className="text-slate-300 dark:text-slate-600">•</span>
              <button onClick={() => setShowChangelog(true)} className="text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors">
                {t('changelog')}
              </button>
              <span className="text-slate-300 dark:text-slate-600">•</span>
              <a href="/docs" className="text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors">
                API Docs
              </a>
              {session?.user?.isAdmin && (
                <>
                  <span className="text-slate-300 dark:text-slate-600">•</span>
                  <a href="/admin/dashboard" className="text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300 transition-colors">
                    Admin
                  </a>
                </>
              )}
            </div>
          </div>
        </footer>

        {showImprint && <ImprintModal onClose={() => setShowImprint(false)} />}
        {showPrivacy && <PrivacyModal onClose={() => setShowPrivacy(false)} />}
        {showChangelog && <ChangelogModal onClose={() => setShowChangelog(false)} />}
      </>
    );
  }

  return (
    <>
      <footer className="mt-12 text-center text-xs text-slate-500 dark:text-slate-400 pb-8">
        <div className="flex flex-wrap justify-center gap-3 sm:gap-4 mb-2 items-center">
          <button onClick={() => setShowImprint(true)} className="hover:text-slate-800 dark:hover:text-slate-200 transition-colors">{t('imprint')}</button>
          <span>•</span>
          <button onClick={() => setShowPrivacy(true)} className="hover:text-slate-800 dark:hover:text-slate-200 transition-colors">{t('privacy')}</button>
          <span>•</span>
          <button onClick={() => setShowChangelog(true)} className="hover:text-slate-800 dark:hover:text-slate-200 transition-colors">{t('changelog')}</button>
          <span>•</span>
          <a href="/docs" className="hover:text-slate-800 dark:hover:text-slate-200 transition-colors">API Docs</a>
          {session?.user?.isAdmin && (
            <>
              <span>•</span>
              <a href="/admin/dashboard" className="hover:text-slate-800 dark:hover:text-slate-200 transition-colors text-purple-600 dark:text-purple-400">
                Admin
              </a>
            </>
          )}
          {canInstall && (
            <>
              <span>•</span>
              <button onClick={promptInstall} className="hover:text-slate-800 dark:hover:text-slate-200 transition-colors font-medium text-blue-600 dark:text-blue-400">
                {t('installPWA')}
              </button>
            </>
          )}
        </div>
        <p>&copy; {new Date().getFullYear()} {t('appTitle')}. {t('madeWithLove')}</p>
      </footer>

      {showImprint && <ImprintModal onClose={() => setShowImprint(false)} />}
      {showPrivacy && <PrivacyModal onClose={() => setShowPrivacy(false)} />}
      {showChangelog && <ChangelogModal onClose={() => setShowChangelog(false)} />}
    </>
  );
};

export default Footer;
