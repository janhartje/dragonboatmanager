import React from 'react';
import { User, Box, UserPlus } from 'lucide-react';
import SkillBadges from '../../ui/SkillBadges';
import { Paddler, Assignments, Event } from '@/types';

interface PaddlerPoolProps {
  activePaddlerPool: Paddler[];
  assignments: Assignments;
  selectedPaddlerId: number | string | null;
  setSelectedPaddlerId: (id: number | string | null) => void;
  activeEvent: Event | null;
  handleAddCanister: () => void;
  setShowGuestModal: (show: boolean) => void;
  t: (key: string) => string;
}

const PaddlerPool: React.FC<PaddlerPoolProps> = ({ 
  activePaddlerPool, 
  assignments, 
  selectedPaddlerId, 
  setSelectedPaddlerId, 
  activeEvent, 
  handleAddCanister, 
  setShowGuestModal, 
  t 
}) => {
  return (
    <div id="tour-planner-pool" className="bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 flex-1 flex flex-col min-h-[400px]">
      <div className="flex justify-between items-center mb-3">
        <h2 className="font-bold text-sm text-slate-700 dark:text-slate-200 uppercase tracking-wide flex items-center gap-2"><User size={16} /> {t('available')} ({activePaddlerPool.length})</h2>
        <div className="flex gap-1">
          <button id="tour-planner-canister" onClick={handleAddCanister} className="p-1.5 bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-500 rounded hover:bg-amber-100 border border-amber-200 dark:border-amber-800" title={`${t('canister')} +25kg`}><Box size={14} /></button>
          <button id="tour-planner-guest" onClick={() => setShowGuestModal(true)} className="p-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded hover:bg-blue-100 border border-blue-200 dark:border-blue-800 flex items-center gap-1 text-xs font-bold" title={t('guest')}><UserPlus size={14} /> {t('guestAdd')}</button>
        </div>
      </div>
      {activePaddlerPool.length === 0 && <div className="text-center p-8 text-slate-500 dark:text-slate-400 italic text-sm border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-xl">{t('noPromises')}</div>}
      <div className="flex-1 overflow-y-auto pr-1 space-y-2">
        {activePaddlerPool.map((p) => {
          const isAssigned = Object.values(assignments).includes(p.id);
          const isSelected = selectedPaddlerId === p.id;
          const st = activeEvent ? activeEvent.attendance[p.id] : null;
          const isMaybe = st === 'maybe';
          return (
            <div key={p.id} onClick={() => setSelectedPaddlerId(isSelected ? null : p.id)} className={`p-3 rounded-xl border cursor-pointer transition-all flex justify-between items-center group ${isSelected ? 'bg-blue-600 border-blue-700 text-white shadow-md transform scale-[1.02]' : 'bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-600'} ${isAssigned ? 'opacity-40 grayscale' : ''} ${isMaybe ? 'border-yellow-300 bg-yellow-50 dark:bg-yellow-900/20 dark:border-yellow-700' : ''}`}>
              <div>
                <div className={`text-base font-bold ${isSelected ? 'text-white' : 'text-slate-800 dark:text-slate-200'}`}>
                  {p.name}
                  {isMaybe && <span className="text-xs opacity-70">(?)</span>}
                  {p.isCanister && <span className="text-xs opacity-70 ml-1">({t('canister')})</span>}
                  {p.isGuest && <span className="text-xs opacity-70 ml-1">({t('guest')})</span>}
                </div>
                <div className={`text-sm mt-0.5 flex items-center gap-2 ${isSelected ? 'text-blue-100' : 'text-slate-600 dark:text-slate-400'}`}><span>{p.weight} kg</span></div>
              </div>
              {p.isCanister ? <Box size={16} className={isSelected ? 'text-white' : 'text-amber-500'} /> : <SkillBadges skills={p.skills} />}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PaddlerPool;
