'use client';

import React from 'react';
import { Link, usePathname } from '@/i18n/routing';
import { Info, X, PlayCircle, ExternalLink, Sparkles } from 'lucide-react';
import { useTour } from '@/context/TourContext';
import { useTranslations } from 'next-intl';

interface HelpModalProps {
  onClose: () => void;
}

const HelpModal: React.FC<HelpModalProps> = ({ onClose }) => {
  const t = useTranslations();
  const { startTour } = useTour();
  const pathname = usePathname();
  
  const handleStartTour = () => {
    onClose();
    if (pathname === '/') {
      startTour('welcome');
    } else if (pathname?.includes('/planner')) {
      startTour('planner');
    }
  };

  const renderContent = () => {
    if (pathname?.includes('/planner')) {
      return (
        <div className="space-y-6">
          <section>
            <h3 className="font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
              <span className="bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 p-1 rounded">🚣</span> {t('helpBoatManning')}
            </h3>
            <ul className="list-disc list-inside space-y-1 text-slate-600 dark:text-slate-400 ml-1">
              <li>{t('helpBoatManning1')}</li>
              <li>{t('helpBoatManning2')}</li>
              <li>{t('helpBoatManningSwap')}</li>
              <li>{t('helpBoatManning3')}</li>
              <li>{t('helpBoatManning4')}</li>
            </ul>
          </section>

          <section>
            <h3 className="font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
              <span className="bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 p-1 rounded">📏</span> {t('helpBoatSize')}
            </h3>
            <p className="text-slate-600 dark:text-slate-400 ml-1 text-sm">{t('helpBoatSizeDesc')}</p>
          </section>

          <section>
            <h3 className="font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
              <span className="bg-cyan-100 dark:bg-cyan-900 text-cyan-600 dark:text-cyan-300 p-1 rounded">🧮</span> {t('helpCalculation')}
            </h3>
            <p className="text-slate-600 dark:text-slate-400 ml-1 text-sm mb-2">{t('helpCalculationDesc')}</p>
            <ul className="list-disc list-inside space-y-1 text-slate-600 dark:text-slate-400 ml-1">
              <li>{t('helpCalculation1')}</li>
              <li>{t('helpCalculation2')}</li>
              <li>{t('helpCalculation3')}</li>
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

    if (pathname?.includes('/app/teams/')) {
      return (
        <div className="space-y-6">
          <section>
            <h3 className="font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
              <span className="bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 p-1 rounded">⚙️</span> {t('helpTeamEditGeneral')}
            </h3>
            <p className="text-slate-600 dark:text-slate-400 ml-1 text-sm mb-2">{t('helpTeamEditGeneralDesc')}</p>
            <ul className="list-disc list-inside space-y-1 text-slate-600 dark:text-slate-400 ml-1">
              <li>{t('helpTeamEditGeneral1')}</li>
              <li>{t('helpTeamEditGeneral2')}</li>
              <li>{t('helpTeamEditGeneral3')}</li>
            </ul>
          </section>

          <section>
            <h3 className="font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
              <span className="bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 p-1 rounded">👥</span> {t('helpTeamEditMembers')}
            </h3>
            <p className="text-slate-600 dark:text-slate-400 ml-1 text-sm mb-2">{t('helpTeamEditMembersDesc')}</p>
            <ul className="list-disc list-inside space-y-1 text-slate-600 dark:text-slate-400 ml-1">
              <li>{t('helpTeamEditMembers1')}</li>
              <li>{t('helpTeamEditMembers2')}</li>
              <li>{t('helpTeamEditMembers3')}</li>
            </ul>
          </section>

          <section>
            <h3 className="font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
              <span className="bg-sky-100 dark:bg-sky-900 text-sky-600 dark:text-sky-300 p-1 rounded">📤</span> {t('helpImportTitle')}
            </h3>
            <p className="text-slate-600 dark:text-slate-400 ml-1 text-sm mb-2">{t('helpImportDesc')}</p>
            <ul className="list-disc list-inside space-y-1 text-slate-600 dark:text-slate-400 ml-1">
              <li>{t('helpImport1')}</li>
              <li>{t('helpImport2')}</li>
              <li>{t('helpImport3')}</li>
            </ul>
          </section>
          
          <section className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/30 rounded-xl p-4">
            <h3 className="font-bold text-amber-700 dark:text-amber-400 mb-2 flex items-center gap-2">
              <Sparkles size={16} /> {t('pro.helpProFeatures')}
            </h3>
            <ul className="list-disc list-inside space-y-1 text-amber-800/80 dark:text-amber-300/80 text-sm ml-1">
              <li>{t('pro.helpProFeature1')}</li>
              <li>{t('pro.helpProFeature2')}</li>
              <li>{t('pro.helpProFeature3')}</li>
              <li>{t('pro.helpProFeature4')}</li>
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

  const getContextTitle = () => {
    if (pathname?.includes('/planner')) return ` - ${t('helpContextPlanner')}`;
    if (pathname?.includes('/app/teams/')) return ` - ${t('editTeam')}`;
    if (pathname === '/') return ` - ${t('helpContextHome')}`;
    return '';
  };

  return (
  <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
    <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
      <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
        <h2 className="text-lg font-bold flex items-center gap-2 text-slate-900 dark:text-white">
          <Info size={20} className="text-blue-500" /> 
          {t('helpTitle')}{getContextTitle()}
        </h2>
        <button onClick={onClose}><X size={20} className="text-slate-500" /></button>
      </div>
      
      <div className="p-6 overflow-y-auto text-sm scrollbar-thin">
        {renderContent()}
        
        {pathname?.includes('/planner') && (
          <section className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800">
            <h3 className="font-bold text-slate-900 dark:text-white mb-1">🛠 {t('helpTools')}</h3>
            <p className="text-slate-600 dark:text-slate-400 mb-4">{t('helpToolsDesc')}</p>
          </section>
        )}

        {(pathname === '/' || pathname?.includes('/planner')) && (
          <section className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800">
            <h3 className="font-bold text-slate-900 dark:text-white mb-3">🎓 {t('helpInteractiveTour')}</h3>
            <button 
              onClick={handleStartTour} 
              className="w-full flex items-center justify-center gap-2 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 text-blue-700 dark:text-blue-300 py-3 rounded-xl transition-colors font-medium border border-blue-100 dark:border-blue-800"
            >
              <PlayCircle size={18} /> {t('helpStartTour')}
            </button>
          </section>
        )}
        
        <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 text-center">
            <Link href="/help" className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:underline font-medium" onClick={onClose}>
                <ExternalLink size={16} /> {t('visitHelpCenter')}
            </Link>
        </div>
      </div>

      <div className="p-4 border-t border-slate-100 dark:border-slate-800 text-center bg-slate-50 dark:bg-slate-800/50">
        <button onClick={onClose} className="bg-slate-900 dark:bg-slate-700 text-white px-8 py-2.5 rounded-lg hover:bg-slate-800 dark:hover:bg-slate-600 font-medium transition-colors">{t('helpUnderstood')}</button>
      </div>
    </div>
  </div>
  );
};

export default HelpModal;
