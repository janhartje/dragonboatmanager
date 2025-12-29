import React from 'react';
import { User, Box, UserPlus } from 'lucide-react';

import { Paddler, Assignments, Event } from '@/types';
import PoolPaddlerItem from './PoolPaddlerItem';

interface PaddlerPoolProps {
  activePaddlerPool: Paddler[];
  assignments: Assignments;
  selectedPaddlerId: number | string | null;
  setSelectedPaddlerId: (id: number | string | null) => void;
  activeEvent: Event | null;
  handleAddCanister: () => void;
  onRemoveCanister: (id: string) => void;
  onRemoveGuest: (id: string) => void;
  setShowGuestModal: (show: boolean) => void;
  t: (key: string) => string;
  isReadOnly?: boolean;
}

const PaddlerPool: React.FC<PaddlerPoolProps> = ({ 
  activePaddlerPool, 
  assignments, 
  selectedPaddlerId, 
  setSelectedPaddlerId, 
  activeEvent, 
  handleAddCanister, 
  onRemoveCanister,
  onRemoveGuest,
  setShowGuestModal, 
  t,
  isReadOnly 
}) => {
  const [deleteConfirmId, setDeleteConfirmId] = React.useState<string | null>(null);

  const triggerDelete = (id: string, type: 'canister' | 'guest') => {
    if (deleteConfirmId === id) {
      if (type === 'canister') onRemoveCanister(id);
      else onRemoveGuest(id);
      setDeleteConfirmId(null);
    } else {
      setDeleteConfirmId(id);
      setTimeout(() => setDeleteConfirmId(null), 3000);
    }
  };

  return (
    <div id="tour-planner-pool" className="bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 flex-1 flex flex-col min-h-[400px]">
      <div className="flex justify-between items-center mb-3">
        <h2 className="font-bold text-sm text-slate-700 dark:text-slate-200 uppercase tracking-wide flex items-center gap-2"><User size={16} /> {t('available')} ({activePaddlerPool.length})</h2>
        {!isReadOnly && (
        <div className="flex gap-1">
          <button id="tour-planner-canister" onClick={handleAddCanister} className="p-1.5 bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-500 rounded hover:bg-amber-100 border border-amber-200 dark:border-amber-800" title={`${t('canister')} +25kg`}><Box size={14} /></button>
          <button id="tour-planner-guest" onClick={() => setShowGuestModal(true)} className="p-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded hover:bg-blue-100 border border-blue-200 dark:border-blue-800 flex items-center gap-1 text-xs font-bold" title={t('guest')}><UserPlus size={14} /> {t('guestAdd')}</button>
        </div>
        )}
      </div>
      {activePaddlerPool.length === 0 && <div className="text-center p-8 text-slate-500 dark:text-slate-400 italic text-sm border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-xl">{t('noPromises')}</div>}
      <div className="flex-1 overflow-y-auto p-2 scrollbar-thin">
        <div className="flex flex-wrap gap-2 justify-center content-start pb-4">
        {activePaddlerPool.map((p) => {
          const isAssigned = Object.values(assignments).includes(p.id);
          const isSelected = selectedPaddlerId === p.id;
          const st = activeEvent ? activeEvent.attendance[p.id] : null;
          const isMaybe = st === 'maybe';
          const isConfirming = deleteConfirmId === String(p.id);

          return (
            <PoolPaddlerItem
              key={p.id}
              paddler={p}
              isAssigned={isAssigned}
              isSelected={isSelected}
              isMaybe={isMaybe}
              isConfirming={isConfirming}
              onClick={() => setSelectedPaddlerId(isSelected ? null : p.id)}
              triggerDelete={triggerDelete}
              t={t}
              isReadOnly={isReadOnly}
            />
          );
        })}
        </div>
      </div>
    </div>
  );
};

export default PaddlerPool;
