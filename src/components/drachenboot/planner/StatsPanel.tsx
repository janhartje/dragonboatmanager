import React from 'react';
import { ArrowRightLeft, RefreshCw, Wand2, Camera, AlertCircle, RotateCcw } from 'lucide-react';
import { BalanceBar, TrimBar } from '../Stats';
import { Stats, Paddler } from '@/types';

interface StatsPanelProps {
  stats: Stats;
  targetTrim: number;
  setTargetTrim: (trim: number) => void;
  runAutoFill: () => void;
  isSimulating: boolean;
  activePaddlerPool: Paddler[];
  handleExportImage: () => void;
  clearBoat: () => void;
  confirmClear: boolean;
  t: (key: string) => string;
  boatSize: 'standard' | 'small';
  setBoatSize: (size: 'standard' | 'small') => void;
}

const StatsPanel: React.FC<StatsPanelProps> = ({ 
  stats, 
  targetTrim, 
  setTargetTrim, 
  runAutoFill, 
  isSimulating, 
  activePaddlerPool, 
  handleExportImage, 
  clearBoat, 
  confirmClear, 
  t,
  boatSize,
  setBoatSize
}) => {
  return (
    <div id="tour-planner-stats" className="bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-bold text-sm text-slate-700 dark:text-slate-200 uppercase tracking-wide flex items-center gap-2">
          <ArrowRightLeft size={16} /> {t('balance')}
        </h2>
        
        <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
          <button 
            onClick={() => setBoatSize('standard')}
            className={`px-2 py-1 text-xs font-bold rounded-md transition-all ${boatSize === 'standard' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}`}
          >
            {t('standardBoat')}
          </button>
          <button 
            onClick={() => setBoatSize('small')}
            className={`px-2 py-1 text-xs font-bold rounded-md transition-all ${boatSize === 'small' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}`}
          >
            {t('smallBoat')}
          </button>
        </div>
      </div>
      
      <BalanceBar left={stats.l} right={stats.r} diff={stats.diffLR} />
      <TrimBar front={stats.f} back={stats.b} diff={stats.diffFB} />

      <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
        <div className="flex justify-between text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">
          <span>{t('sternHeavy')}</span>
          <span className="text-blue-600 dark:text-blue-400">{t('target')}: {targetTrim > 0 ? '+' : ''}{targetTrim} kg</span>
          <span>{t('bowHeavy')}</span>
        </div>
        <input type="range" min="-100" max="100" step="5" value={targetTrim} onChange={(e) => setTargetTrim(parseInt(e.target.value))} className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600" />
        <div className="flex justify-between text-[10px] text-slate-400 mt-1"><span>-100kg</span><span>0</span><span>+100kg</span></div>
      </div>

      <div className="grid grid-cols-3 gap-2 mt-4">
        <button id="tour-planner-autofill" onClick={runAutoFill} disabled={isSimulating || activePaddlerPool.length === 0} className={`py-3 text-sm font-semibold rounded-lg border dark:border-slate-700 transition-all flex items-center justify-center gap-2 shadow-sm ${isSimulating ? 'bg-indigo-50 text-indigo-400 cursor-wait' : 'bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95'} ${activePaddlerPool.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`} title={t('magicAI')}>
          {isSimulating ? <RefreshCw size={16} className="animate-spin" /> : <Wand2 size={16} />}
        </button>
        <button id="tour-planner-export" onClick={handleExportImage} className="py-3 text-sm rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex items-center justify-center gap-2" title={t('exportImage')}>
          <Camera size={16} />
        </button>
        <button onClick={clearBoat} className={`py-3 text-sm rounded-lg border dark:border-slate-700 transition-all flex items-center justify-center gap-2 active:scale-95 ${confirmClear ? 'bg-red-500 text-white border-red-600 font-bold' : 'text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 border-red-200'}`}>
          {confirmClear ? <AlertCircle size={16} /> : <RotateCcw size={16} />}
        </button>
      </div>
    </div>
  );
};

export default StatsPanel;
