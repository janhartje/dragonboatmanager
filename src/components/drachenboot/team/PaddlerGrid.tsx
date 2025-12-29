import React, { useState } from 'react';
import { Users, Pencil, Trash2, Link as LinkIcon, AlertTriangle, Clock } from 'lucide-react';
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
      setTimeout(() => setDeleteConfirmId(null), 5000); 
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
           const isLinked = !!p.userId;
           const isPending = !!p.inviteEmail && !p.userId;
           const isConfirmingDelete = deleteConfirmId === p.id;
           return (
          <div key={p.id} className={`p-3 border rounded-xl transition-all relative group ${
            editingId === p.id 
              ? 'border-orange-400 bg-orange-50 dark:bg-orange-900/20' 
              : isConfirmingDelete && (isLinked || isPending) 
                ? 'border-red-300 bg-red-50 dark:bg-red-900/20 dark:border-red-800' 
                : isPending
                  ? 'bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800/50'
                  : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-700'
          }`}>
            <div className="flex justify-between items-start">
              <div>
                <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                  {isPending ? (
                    <>
                      <span className="text-amber-700 dark:text-amber-400">{p.inviteEmail}</span>
                      <span title={t('pendingInvite') || 'Pending Invitation'}>
                        <Clock size={14} className="text-amber-500" />
                      </span>
                    </>
                  ) : (
                    <>
                      {p.name}
                      {p.userId && (
                        <span title={`${t('linkedAccount')}${p.user?.email ? `: ${p.user.email}` : ''}`}>
                          <LinkIcon size={14} className="text-blue-500" />
                        </span>
                      )}
                    </>
                  )}
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-400 mt-1 font-mono h-4">
                  {isPending ? (
                    <span className="text-amber-600 dark:text-amber-400">{t('pendingRegistration') || 'Pending registration'}</span>
                  ) : canViewWeight ? `${p.weight} kg` : '\u00A0'}
                </div>
              </div>
              {!isPending && <SkillBadges skills={p.skills} />}
            </div>
            
            {/* Warning for linked/pending paddler deletion */}
            {isConfirmingDelete && (isLinked || isPending) && (
              <div className="mt-2 p-2 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-start gap-2 text-xs text-red-700 dark:text-red-300">
                <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                <span>{isPending ? (t('deleteInvitedPaddlerWarning') || 'This will cancel the invitation!') : (t('deleteLinkedPaddlerWarning') || 'This will remove the user from the team!')}</span>
              </div>
            )}
            
            {userRole === 'CAPTAIN' && (
            <div className={`flex gap-1 transition-opacity ${
              isConfirmingDelete 
                ? 'relative mt-2 justify-end opacity-100' 
                : 'absolute bottom-2 right-2 opacity-0 group-hover:opacity-100'
            }`}>
              {!isPending && <button onClick={() => onEdit(p)} className="bg-white dark:bg-slate-700 text-slate-400 hover:text-orange-500 p-1.5 rounded-lg border dark:border-slate-600 shadow-sm"><Pencil size={12} /></button>}
              <button onClick={() => triggerDelete(p.id)} className={`p-1.5 rounded-lg border shadow-sm transition-colors ${isConfirmingDelete ? 'bg-red-600 text-white border-red-700' : 'bg-white dark:bg-slate-700 text-slate-400 hover:text-red-500 dark:border-slate-600'}`}><Trash2 size={12} /></button>
            </div>
            )}
          </div>
        )})}
      </div>
    </div>
  );
};

export default PaddlerGrid;
