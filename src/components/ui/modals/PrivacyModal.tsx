
import React from 'react';
import { X } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface PrivacyModalProps {
  onClose: () => void;
}

const PrivacyModal: React.FC<PrivacyModalProps> = ({ onClose }) => {
  const t = useTranslations();
  return (
  <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
    <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
      <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">{t('legal.privacy.title')}</h2>
        <button onClick={onClose}><X size={20} className="text-slate-500" /></button>
      </div>
      <div className="p-6 overflow-y-auto space-y-6 text-sm text-slate-700 dark:text-slate-300 scrollbar-thin">
        <div className="space-y-6">
          <section>
            <h3 className="text-lg font-semibold mb-2">{t('legal.privacy.intro')}</h3>
            <p className="text-sm">
              {t('legal.privacy.intro_text')}
            </p>
          </section>

          <section>
            <h3 className="text-lg font-semibold mb-2">{t('legal.privacy.responsible')}</h3>
            <p className="text-sm italic">
              {t('legal.imprint.name')}<br />
              {t('legal.imprint.address')}
            </p>
          </section>

          <section>
            <h3 className="text-lg font-semibold mb-2">{t('legal.privacy.hosting')}</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              {t('legal.privacy.hosting_text')}
            </p>
          </section>

          <section>
            <h3 className="text-lg font-semibold mb-2">{t('legal.privacy.database')}</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              {t('legal.privacy.database_text')}
            </p>
          </section>

          <section>
            <h3 className="text-lg font-semibold mb-2">{t('legal.privacy.auth')}</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              {t('legal.privacy.auth_text')}
            </p>
          </section>

          <section>
            <h3 className="text-lg font-semibold mb-2">{t('legal.privacy.emails')}</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              {t('legal.privacy.emails_text')}
            </p>
          </section>

          <section>
            <h3 className="text-lg font-semibold mb-2">{t('legal.privacy.payments')}</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              {t('legal.privacy.payments_text')}
            </p>
          </section>

          <section>
            <h3 className="text-lg font-semibold mb-2">{t('legal.privacy.analytics')}</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              {t('legal.privacy.analytics_text')}
            </p>
          </section>

          <section>
            <h3 className="text-lg font-semibold mb-2">{t('legal.privacy.rights')}</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              {t('legal.privacy.rights_text')}
            </p>
          </section>
        </div>
      </div>
      <div className="p-4 border-t border-slate-100 dark:border-slate-800 text-center bg-slate-50 dark:bg-slate-800/50">
        <button onClick={onClose} className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2.5 rounded-lg font-medium transition-colors shadow-sm">{t('close')}</button>
      </div>
    </div>
  </div>
  );
};

export default PrivacyModal;
