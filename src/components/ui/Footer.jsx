import React, { useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { ImprintModal, ChangelogModal } from './Modals';

const Footer = () => {
  const { t } = useLanguage();
  const [showImprint, setShowImprint] = useState(false);
  const [showChangelog, setShowChangelog] = useState(false);

  return (
    <>
      <footer className="mt-12 text-center text-xs text-slate-500 dark:text-slate-400 pb-8">
        <div className="flex justify-center gap-4 mb-2">
          <button onClick={() => setShowImprint(true)} className="hover:text-slate-800 dark:hover:text-slate-200 transition-colors">{t('imprint')}</button>
          <span>•</span>
          <button onClick={() => setShowChangelog(true)} className="hover:text-slate-800 dark:hover:text-slate-200 transition-colors">{t('changelog')}</button>
        </div>
        <p>&copy; {new Date().getFullYear()} {t('appTitle')}. {t('madeWithLove')}</p>
      </footer>

      {showImprint && <ImprintModal onClose={() => setShowImprint(false)} />}
      {showChangelog && <ChangelogModal onClose={() => setShowChangelog(false)} />}
    </>
  );
};

export default Footer;
