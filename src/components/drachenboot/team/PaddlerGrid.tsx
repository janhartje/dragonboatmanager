import React, { useState } from 'react';
import { Users, Pencil, Trash2, Link as LinkIcon } from 'lucide-react';
import SkillBadges from '../../ui/SkillBadges';
import { Paddler } from '@/types';

interface PaddlerGridProps {
  paddlers: Paddler[];
  editingId: number | string | null;
  onEdit: (paddler: Paddler) => void;
  onDelete: (id: number | string) => void;
  t: (key: string) => string;
  headerAction?: React.ReactNode;
}

import { useDrachenboot } from '@/context/DrachenbootContext';
import { useSession } from 'next-auth/react';

// ... (interface)

const PaddlerGrid: React.FC<PaddlerGridProps> = ({ paddlers, editingId, onEdit, onDelete, t, headerAction }) => {
  const { userRole } = useDrachenboot();
  const { data: session } = useSession();
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | string | null>(null);

  const triggerDelete = (id: number | string) => {
    if (deleteConfirmId === id) { 
      onDelete(id); 
      setDeleteConfirmId(null); 
    } else { 
      setDeleteConfirmId(id); 
      setTimeout(() => setDeleteConfirmId(null), 3000); 
    }
  };

  return (
    <div id="tour-paddler-grid" className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 h-full">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2 text-sm uppercase tracking-wide"><Users size={16} /> {t('squad')} ({paddlers.length})</h3>
        {headerAction}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {paddlers.map((p) => {
           const canViewWeight = userRole === 'CAPTAIN' || (session?.user?.id && p.userId === session.user.id);
           return (
          <div key={p.id} className={`p-3 border rounded-xl transition-all relative group ${editingId === p.id ? 'border-orange-400 bg-orange-50 dark:bg-orange-900/20' : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-700'}`}>
            <div className="flex justify-between items-start">
              <div>
                <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                  {p.name}
                  {p.userId && (
                    <span title={`${t('linkedAccount')}${p.user?.email ? `: ${p.user.email}` : ''}`}>
                      <LinkIcon size={14} className="text-blue-500" />
                    </span>
                  )}
                </div>
                {canViewWeight && <div className="text-xs text-slate-600 dark:text-slate-400 mt-1 font-mono">{p.weight} kg</div>}
              </div>
              <SkillBadges skills={p.skills} />
            </div>
            {userRole === 'CAPTAIN' && (
            <div className="absolute bottom-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={() => onEdit(p)} className="bg-white dark:bg-slate-700 text-slate-400 hover:text-orange-500 p-1.5 rounded-lg border dark:border-slate-600 shadow-sm"><Pencil size={12} /></button>
              <button onClick={() => triggerDelete(p.id)} className={`p-1.5 rounded-lg border shadow-sm transition-colors ${deleteConfirmId === p.id ? 'bg-red-600 text-white border-red-700' : 'bg-white dark:bg-slate-700 text-slate-400 hover:text-red-500 dark:border-slate-600'}`}><Trash2 size={12} /></button>
            </div>
            )}
          </div>
        )})}
      </div>
    </div>
  );
};

export default PaddlerGrid;
