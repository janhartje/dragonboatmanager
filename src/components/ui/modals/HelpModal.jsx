import React from 'react';
import { usePathname } from 'next/navigation';
import { Info, X, PlayCircle } from 'lucide-react';
import { useTour } from '@/context/TourContext';
import { useLanguage } from '@/context/LanguageContext';

const HelpModal = ({ onClose }) => {
  const { t } = useLanguage();
  const { startTour } = useTour();
  const pathname = usePathname();
  
  const handleStartTour = () => {
    onClose();
    if (pathname === '/') {
      startTour('welcome');
    } else if (pathname === '/planner') {
      startTour('planner');
    }
  };

  const renderContent = () => {
    if (pathname === '/planner') {
      return (
        <div className="space-y-6">
          <section>
            <h3 className="font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
              <span className="bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 p-1 rounded">🚣</span> {t('helpBoatManning')}
            </h3>
            <ul className="list-disc list-inside space-y-1 text-slate-600 dark:text-slate-400 ml-1">
              <li>{t('helpBoatManning1')}</li>
              <li>{t('helpBoatManning2')}</li>
              <li>{t('helpBoatManning3')}</li>
              <li>{t('helpBoatManning4')}</li>
            </ul>
          </section>

          <section>
            <h3 className="font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
              <span className="bg-amber-100 dark:bg-amber-900 text-amber-600 dark:text-amber-300 p-1 rounded">📦</span> {t('helpSpecialItems')}
            </h3>
            <ul className="list-disc list-inside space-y-1 text-slate-600 dark:text-slate-400 ml-1">
              <li><span className="font-bold">{t('canister')}:</span> {t('helpSpecialItems1')}</li>
              <li><span className="font-bold">{t('guest')}:</span> {t('helpSpecialItems2')}</li>
            </ul>
          </section>

          <section>
            <h3 className="font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
              <span className="bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-300 p-1 rounded">🛠</span> {t('helpToolsStats')}
            </h3>
            <ul className="list-disc list-inside space-y-1 text-slate-600 dark:text-slate-400 ml-1">
              <li><span className="font-bold">Magic KI:</span> {t('helpToolsStats1')}</li>
              <li><span className="font-bold">Trimm:</span> {t('helpToolsStats2')}</li>
              <li><span className="font-bold">Export:</span> {t('helpToolsStats3')}</li>
            </ul>
          </section>
        </div>
      );
    }

    // Default: Home / Team View
    return (
      <div className="space-y-6">
        <section>
          <h3 className="font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
            <span className="bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-300 p-1 rounded">📅</span> {t('helpManageEvents')}
          </h3>
          <ul className="list-disc list-inside space-y-1 text-slate-600 dark:text-slate-400 ml-1">
            <li>{t('helpManageEvents1')}</li>
            <li>{t('helpManageEvents2')}</li>
            <li>{t('helpManageEvents3')}</li>
          </ul>
        </section>

        <section>
          <h3 className="font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
            <span className="bg-orange-100 dark:bg-orange-900 text-orange-600 dark:text-orange-300 p-1 rounded">👥</span> {t('helpMembers')}
          </h3>
          <ul className="list-disc list-inside space-y-1 text-slate-600 dark:text-slate-400 ml-1">
            <li>{t('helpMembers1')}</li>
            <li>{t('helpMembers2')}</li>
            <li>{t('helpMembers3')}</li>
          </ul>
        </section>
      </div>
    );
  };

  return (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
    <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
      <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
        <h2 className="text-lg font-bold flex items-center gap-2 text-slate-900 dark:text-white"><Info size={20} className="text-blue-500" /> {t('helpTitle')}</h2>
        <button onClick={onClose}><X size={20} className="text-slate-500" /></button>
      </div>
      
      <div className="p-6 overflow-y-auto text-sm">
        {renderContent()}
        
        <section className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800">
          <h3 className="font-bold text-slate-900 dark:text-white mb-1">🛠 {t('helpTools')}</h3>
          <p className="text-slate-600 dark:text-slate-400 mb-4">{t('helpToolsDesc')}</p>
          <h3 className="font-bold text-slate-900 dark:text-white mb-3">🎓 {t('helpInteractiveTour')}</h3>
          <button 
            onClick={handleStartTour} 
            className="w-full flex items-center justify-center gap-2 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 text-blue-700 dark:text-blue-300 py-3 rounded-xl transition-colors font-medium border border-blue-100 dark:border-blue-800"
          >
            <PlayCircle size={18} /> {t('helpStartTour')}
          </button>
        </section>
      </div>

      <div className="p-4 border-t border-slate-100 dark:border-slate-800 text-center bg-slate-50 dark:bg-slate-800/50">
        <button onClick={onClose} className="bg-slate-900 dark:bg-slate-700 text-white px-8 py-2.5 rounded-lg hover:bg-slate-800 dark:hover:bg-slate-600 font-medium transition-colors">{t('helpUnderstood')}</button>
      </div>
    </div>
  </div>
  );
};

export default HelpModal;
