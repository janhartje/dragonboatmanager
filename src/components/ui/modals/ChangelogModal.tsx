import React from 'react';
import { X } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

interface ChangelogModalProps {
  onClose: () => void;
}

const ChangelogModal: React.FC<ChangelogModalProps> = ({ onClose }) => {
  const { t } = useLanguage();
  return (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
    <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
      <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">{t('changelog')}</h2>
        <button onClick={onClose}><X size={20} className="text-slate-500" /></button>
      </div>
      <div className="p-6 overflow-y-auto space-y-4">
        <div>
          <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm">{t('clV160Title')}</h3>
          <ul className="list-disc list-inside text-xs text-slate-700 dark:text-slate-400 mt-1 space-y-1">
            <li>{t('clV160Item1')}</li>
            <li>{t('clV160Item2')}</li>
            <li>{t('clV160Item3')}</li>
          </ul>
        </div>
        <div>
          <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm">{t('clV150Title')}</h3>
          <ul className="list-disc list-inside text-xs text-slate-700 dark:text-slate-400 mt-1 space-y-1">
            <li>{t('clV150Item1')}</li>
            <li>{t('clV150Item2')}</li>
            <li>{t('clV150Item3')}</li>
          </ul>
        </div>
        <div>
          <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm">{t('clV140Title')}</h3>
          <ul className="list-disc list-inside text-xs text-slate-700 dark:text-slate-400 mt-1 space-y-1">
            <li>{t('clV140Item1')}</li>
            <li>{t('clV140Item2')}</li>
            <li>{t('clV140Item3')}</li>
          </ul>
        </div>
        <div>
          <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm">{t('clV130Title')}</h3>
          <ul className="list-disc list-inside text-xs text-slate-700 dark:text-slate-400 mt-1 space-y-1">
            <li>{t('clV130Item1')}</li>
            <li>{t('clV130Item2')}</li>
            <li>{t('clV130Item3')}</li>
            <li>{t('clV130Item4')}</li>
          </ul>
        </div>
        <div>
          <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm">{t('clV120Title')}</h3>
          <ul className="list-disc list-inside text-xs text-slate-700 dark:text-slate-400 mt-1 space-y-1">
            <li>{t('clV120Item1')}</li>
            <li>{t('clV120Item2')}</li>
            <li>{t('clV120Item3')}</li>
            <li>{t('clV120Item4')}</li>
            <li>{t('clV120Item5')}</li>
          </ul>
        </div>
        <div>
          <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm">{t('clV110Title')}</h3>
          <ul className="list-disc list-inside text-xs text-slate-700 dark:text-slate-400 mt-1 space-y-1">
            <li>{t('clV110Item1')}</li>
            <li>{t('clV110Item2')}</li>
            <li>{t('clV110Item3')}</li>
          </ul>
        </div>
        <div>
          <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm">{t('clV100Title')}</h3>
          <ul className="list-disc list-inside text-xs text-slate-700 dark:text-slate-400 mt-1 space-y-1">
            <li>{t('clV100Item1')}</li>
            <li>{t('clV100Item2')}</li>
            <li>{t('clV100Item3')}</li>
            <li>{t('clV100Item4')}</li>
          </ul>
        </div>
      </div>
      <div className="p-4 border-t border-slate-100 dark:border-slate-800 text-center bg-slate-50 dark:bg-slate-800/50">
        <button onClick={onClose} className="bg-slate-900 dark:bg-slate-700 text-white px-8 py-2.5 rounded-lg hover:bg-slate-800 dark:hover:bg-slate-600 font-medium transition-colors">{t('close')}</button>
      </div>
    </div>
  </div>
  );
};

export default ChangelogModal;
