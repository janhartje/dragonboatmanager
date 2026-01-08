import React from 'react';
import { X } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface AVVModalProps {
  onClose: () => void;
}

const AVVModal: React.FC<AVVModalProps> = ({ onClose }) => {
  const t = useTranslations();
  return (
  <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
    <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
      <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">{t('legal.avv.title')}</h2>
        <button onClick={onClose}><X size={20} className="text-slate-500" /></button>
      </div>
      <div className="p-6 overflow-y-auto text-sm text-slate-700 dark:text-slate-300 scrollbar-thin">
      <div className="space-y-6">
        <section>
          <h3 className="text-lg font-semibold mb-2">{t('legal.avv.note')}</h3>
          <p className="text-sm">
            {t('legal.avv.note_text')}
          </p>
        </section>

        <section>
          <h3 className="text-lg font-semibold mb-2">{t('legal.avv.subject')}</h3>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            {t('legal.avv.subject_text')}
          </p>
        </section>

        <section>
          <h3 className="text-lg font-semibold mb-2">{t('legal.avv.conclusion')}</h3>
          <p className="text-sm italic">
            {t('legal.avv.conclusion_text')}
          </p>
        </section>

        <section>
          <h3 className="text-lg font-semibold mb-2">{t('legal.avv.tom')}</h3>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            {t('legal.avv.tom_text')}
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

export default AVVModal;
