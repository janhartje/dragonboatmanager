
import React from 'react';
import { X } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

interface PrivacyModalProps {
  onClose: () => void;
}

const PrivacyModal: React.FC<PrivacyModalProps> = ({ onClose }) => {
  const { t } = useLanguage();
  return (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
    <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
      <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">{t('privacyTitle')}</h2>
        <button onClick={onClose}><X size={20} className="text-slate-500" /></button>
      </div>
      <div className="p-6 overflow-y-auto space-y-6 text-sm text-slate-700 dark:text-slate-300">
        <section>
          <h3 className="font-bold text-slate-900 dark:text-white mb-2 text-base">{t('privacyIntro')}</h3>
          <p className="text-sm">{"Jan Hartje"}<br />{"Hamburger Allee 6"}<br />{"30161 Hannover"}<br />{"E-Mail: info@janhartje.com"}</p>
        </section>
        
        <section>
          <h3 className="font-bold text-slate-900 dark:text-white mb-2 text-base">{t('privacyHosting')}</h3>
          <p className="text-sm">{t('privacyHostingText')}</p>
        </section>

        <section>
          <h3 className="font-bold text-slate-900 dark:text-white mb-2 text-base">{t('privacyDatabase')}</h3>
          <p className="text-sm">{t('privacyDatabaseText')}</p>
        </section>

        <section>
          <h3 className="font-bold text-slate-900 dark:text-white mb-2 text-base">{t('privacyAuth')}</h3>
          <p className="text-sm">{t('privacyAuthText')}</p>
        </section>

        <section>
          <h3 className="font-bold text-slate-900 dark:text-white mb-2 text-base">{t('privacyEmails')}</h3>
          <p className="text-sm">{t('privacyEmailsText')}</p>
        </section>

        <section>
          <h3 className="font-bold text-slate-900 dark:text-white mb-2 text-base">{t('privacyRights')}</h3>
          <p className="text-sm">{t('privacyRightsText')}</p>
        </section>
      </div>
      <div className="p-4 border-t border-slate-100 dark:border-slate-800 text-center bg-slate-50 dark:bg-slate-800/50">
        <button onClick={onClose} className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2.5 rounded-lg font-medium transition-colors shadow-sm">{t('close')}</button>
      </div>
    </div>
  </div>
  );
};

export default PrivacyModal;
