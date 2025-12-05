import React from 'react';
import { X } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

interface ImprintModalProps {
  onClose: () => void;
}

const ImprintModal: React.FC<ImprintModalProps> = ({ onClose }) => {
  const { t } = useLanguage();
  return (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
    <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
      <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">{t('imprintTitle')}</h2>
        <button onClick={onClose}><X size={20} className="text-slate-500" /></button>
      </div>
      <div className="p-6 overflow-y-auto space-y-6 text-sm text-slate-700 dark:text-slate-300">
        <section>
          <h3 className="font-bold text-slate-900 dark:text-white mb-2 text-base">{t('imprintLegal')}</h3>
          <p className="text-sm">{"Jan Hartje"}<br />{"Hamburger Allee 6"}<br />{"30161 Hannover"}</p>
        </section>
        
        <section>
          <h3 className="font-bold text-slate-900 dark:text-white mb-2 text-base">{t('imprintContact')}</h3>
          <p className="text-sm">E-Mail: info@janhartje.com</p>
        </section>

        <section>
          <h3 className="font-bold text-slate-900 dark:text-white mb-2 text-base">{t('imprintResponsible')}</h3>
          <p className="text-sm">{"Jan Hartje"}<br />{"Hamburger Allee 6"}<br />{"30161 Hannover"}</p>
        </section>

        <section>
          <h3 className="font-bold text-slate-900 dark:text-white mb-2 text-base">{t('imprintLiabilityContent')}</h3>
          <p className="text-sm">{t('imprintLiabilityContentText')}</p>
        </section>

        <section>
          <h3 className="font-bold text-slate-900 dark:text-white mb-2 text-base">{t('imprintLiabilityLinks')}</h3>
          <p className="text-sm">{t('imprintLiabilityLinksText')}</p>
        </section>

        <section>
          <h3 className="font-bold text-slate-900 dark:text-white mb-2 text-base">{t('imprintCopyright')}</h3>
          <p className="text-sm">{t('imprintCopyrightText')}</p>
        </section>

        <section className="pt-6 border-t border-slate-100 dark:border-slate-800">
          <h3 className="font-bold text-slate-900 dark:text-white mb-2 text-base">{t('disclaimerTitle')}</h3>
          <div className="space-y-4">
             <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg border border-yellow-200 dark:border-yellow-900/50">
               <p className="text-sm text-yellow-800 dark:text-yellow-200 font-medium">⚠️ {t('disclaimerSafety')}</p>
             </div>
             <p className="text-xs text-slate-500 dark:text-slate-400">{t('disclaimerWarranty')}</p>
             <div className="text-xs text-slate-400 dark:text-slate-500 pt-2 border-t border-slate-100 dark:border-slate-800/50">
               {t('techInfo')}
             </div>
          </div>
        </section>
      </div>
      <div className="p-4 border-t border-slate-100 dark:border-slate-800 text-center bg-slate-50 dark:bg-slate-800/50">
        <button onClick={onClose} className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2.5 rounded-lg font-medium transition-colors shadow-sm">{t('close')}</button>
      </div>
    </div>
  </div>
  );
};

export default ImprintModal;
