import React from 'react';
import { X } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface ImprintModalProps {
  onClose: () => void;
}

const ImprintModal: React.FC<ImprintModalProps> = ({ onClose }) => {
  const t = useTranslations();
  return (
  <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
    <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
      <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">{t('legal.imprint.title')}</h2>
        <button onClick={onClose}><X size={20} className="text-slate-500" /></button>
      </div>
      <div className="p-6 overflow-y-auto space-y-6 text-sm text-slate-700 dark:text-slate-300">
      <div className="space-y-6">
        <section>
          <h3 className="text-lg font-semibold mb-2">{t('legal.imprint.legal')}</h3>
          <p className="text-sm">
            {t('legal.imprint.name')}<br />
            {t('legal.imprint.address')}
          </p>
        </section>

        <section>
          <h3 className="text-lg font-semibold mb-2">{t('legal.imprint.contact')}</h3>
          <p className="text-sm">
            {t('legal.imprint.email')}
          </p>
        </section>

        <section>
          <h3 className="text-lg font-semibold mb-2">{t('legal.imprint.responsible')}</h3>
          <p className="text-sm italic">
            {t('legal.imprint.name')}
          </p>
        </section>

        <section>
          <h3 className="text-lg font-semibold mb-2">{t('legal.imprint.liability_content')}</h3>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            {t('legal.imprint.liability_content_text')}
          </p>
        </section>

        <section>
          <h3 className="text-lg font-semibold mb-2">{t('legal.imprint.liability_links')}</h3>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            {t('legal.imprint.liability_links_text')}
          </p>
        </section>

        <section>
          <h3 className="text-lg font-semibold mb-2">{t('legal.imprint.copyright')}</h3>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            {t('legal.imprint.copyright_text')}
          </p>
        </section>

        <section className="pt-4 border-t border-slate-200 dark:border-slate-800">
          <p className="text-sm font-medium">
            {t('legal.imprint.ustId')}
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

export default ImprintModal;
