import React, { useState } from 'react';
import { Users, Pencil, Trash2, Link as LinkIcon, AlertTriangle, Clock } from 'lucide-react';
import SkillBadges from '../../ui/SkillBadges';
import { Paddler } from '@/types';
import { Card } from '@/components/ui/core/Card';
import { IconButton } from '@/components/ui/core/IconButton';

interface PaddlerGridProps {
  paddlers: Paddler[];
  editingId: number | string | null;
  onEdit: (paddler: Paddler) => void;
  onDelete: (id: number | string) => void;
  t: (key: string) => string;
  headerAction?: React.ReactNode;
  leftAction?: React.ReactNode;
}

import { useDrachenboot } from '@/context/DrachenbootContext';
import { useTeam } from '@/context/TeamContext';
import { useSession } from 'next-auth/react';
import { THEME_MAP, ThemeKey } from '@/constants/themes';

const PaddlerGrid: React.FC<PaddlerGridProps> = ({ paddlers, editingId, onEdit, onDelete, t, headerAction, leftAction }) => {
  const { userRole } = useDrachenboot();
  const { currentTeam } = useTeam();
  const theme = currentTeam?.plan === 'PRO' ? THEME_MAP[currentTeam.primaryColor as ThemeKey] : null;
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
    <Card id="tour-paddler-grid" className="p-6 h-full border-slate-200 dark:border-slate-800 shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-4">
          <h3 className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2 text-sm uppercase tracking-wide">
            <Users size={16} />
            {t('squad')} ({paddlers.length}{currentTeam?.plan !== 'PRO' && currentTeam?.maxMembers ? ` / ${currentTeam.maxMembers}` : ''})
          </h3>
          {leftAction}
        </div>
        {headerAction}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {paddlers.map((p) => {
          const canViewWeight = userRole === 'CAPTAIN' || (session?.user?.id && p.userId === session.user.id);
          const isLinked = !!p.userId;
          const isPending = !!p.inviteEmail && !p.userId;
          const isConfirmingDelete = deleteConfirmId === p.id;
          return (
            <Card
              key={p.id}
              className={`p-3 transition-all relative group overflow-visible ${editingId === p.id
                  ? 'border-orange-400 bg-orange-50 dark:bg-orange-900/20'
                  : isConfirmingDelete && (isLinked || isPending)
                    ? 'border-red-300 bg-red-50 dark:bg-red-900/20 dark:border-red-800'
                    : isPending
                      ? 'bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800/50'
                      : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 sm:hover:bg-white sm:dark:hover:bg-slate-800 sm:hover:border-slate-300 sm:dark:hover:border-slate-700'
                }`}
            >
              <div className="flex justify-between items-start">
                <div className="min-w-0 flex-1 pr-2">
                  <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1 truncate">
                    {isPending ? (
                      <>
                        <span className="text-amber-700 dark:text-amber-400 truncate" title={p.inviteEmail}>{p.inviteEmail}</span>
                        <span title={t('pendingInvite') || 'Pending Invitation'}>
                          <Clock size={14} className="text-amber-500" />
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="truncate">{p.name}</span>
                        {p.userId && (
                          <span title={`${t('linkedAccount')}${p.user?.email ? `: ${p.user.email}` : ''}`}>
                            <LinkIcon size={14} className={theme?.text || 'text-blue-500'} />
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
                {/* Right column: Skills + Actions */}
                <div className="flex flex-col items-end gap-1 shrink-0">
                  {!isPending && <SkillBadges skills={p.skills} />}
                  {userRole === 'CAPTAIN' && !isConfirmingDelete && (
                    <div className="flex gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                      {!isPending && (
                        <IconButton
                          icon={Pencil}
                          onClick={() => onEdit(p)}
                          variant="soft"
                          size="sm"
                          iconSize={12}
                          className="bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 sm:hover:text-orange-500"
                        />
                      )}
                      <IconButton
                        icon={Trash2}
                        onClick={() => triggerDelete(p.id)}
                        variant="soft"
                        size="sm"
                        iconSize={12}
                        className="bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 sm:hover:text-red-500"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Warning for linked/pending paddler deletion */}
              {isConfirmingDelete && (isLinked || isPending) && (
                <div className="mt-2 p-2 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-start gap-2 text-xs text-red-700 dark:text-red-300">
                  <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                  <span>{isPending ? (t('deleteInvitedPaddlerWarning') || 'This will cancel the invitation!') : (t('deleteLinkedPaddlerWarning') || 'This will remove the user from the team!')}</span>
                </div>
              )}

              {/* Confirm delete buttons - shown separately when confirming */}
              {userRole === 'CAPTAIN' && isConfirmingDelete && (
                <div className="flex gap-1 mt-2 justify-end">
                  <IconButton
                    icon={Trash2}
                    onClick={() => triggerDelete(p.id)}
                    variant="default"
                    size="sm"
                    iconSize={12}
                    className="bg-red-600 text-white border-red-700 sm:hover:bg-red-700"
                  />
                </div>
              )}
            </Card>
          )
        })}
      </div>
    </Card>
  );
};

export default PaddlerGrid;
