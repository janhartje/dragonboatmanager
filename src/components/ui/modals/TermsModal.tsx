import React from 'react';
import { X } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface TermsModalProps {
  onClose: () => void;
}

const TermsModal: React.FC<TermsModalProps> = ({ onClose }) => {
  const t = useTranslations();
  return (
  <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
    <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
      <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">{t('legal.tos.title')}</h2>
        <button onClick={onClose}><X size={20} className="text-slate-500" /></button>
      </div>
      <div className="p-6 overflow-y-auto space-y-6 text-sm text-slate-700 dark:text-slate-300 scrollbar-thin">
        <section>
          <p className="text-sm font-medium">{t('appTitle')} - {t('legal.tos.title')}</p>
        </section>
        <div className="space-y-6">
        <section>
          <h3 className="text-lg font-semibold mb-2">{t('legal.tos.scope')}</h3>
          <p className="text-sm">
            {t('legal.tos.scope_text')}
          </p>
        </section>

        <section>
          <h3 className="text-lg font-semibold mb-2">{t('legal.tos.subject')}</h3>
          <p className="text-sm">
            {t('legal.tos.subject_text')}
          </p>
        </section>

        <section>
          <h3 className="text-lg font-semibold mb-2">{t('legal.tos.conclusion')}</h3>
          <p className="text-sm">
            {t('legal.tos.conclusion_text')}
          </p>
        </section>

        <section>
          <h3 className="text-lg font-semibold mb-2">{t('legal.tos.withdrawal')}</h3>
          <div className="space-y-2">
            <h4 className="font-medium text-sm">{t('legal.tos.withdrawal_policy')}</h4>
            <p className="text-xs text-slate-600 dark:text-slate-400 italic bg-slate-50 dark:bg-slate-900/50 p-3 rounded">
              {t('legal.tos.withdrawal_text')}
            </p>
            <h4 className="font-medium text-sm pt-2">{t('legal.tos.withdrawal_expiry')}</h4>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              {t('legal.tos.withdrawal_expiry_text')}
            </p>
          </div>
        </section>

        <section>
          <h3 className="text-lg font-semibold mb-2">{t('legal.tos.prices')}</h3>
          <p className="text-sm">
            {t('legal.tos.prices_text')}
          </p>
        </section>

        <section>
          <h3 className="text-lg font-semibold mb-2">{t('legal.tos.term')}</h3>
          <div className="space-y-1">
            <p className="text-sm">{t('legal.tos.term_text1')}</p>
            <p className="text-sm">{t('legal.tos.term_text2')}</p>
          </div>
        </section>

        <section>
          <h3 className="text-lg font-semibold mb-2">{t('legal.tos.liability')}</h3>
          <div className="space-y-1">
            <p className="text-xs text-slate-600 dark:text-slate-400">{t('legal.tos.liability_text1')}</p>
            <p className="text-xs text-slate-600 dark:text-slate-400">{t('legal.tos.liability_text2')}</p>
          </div>
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

export default TermsModal;
