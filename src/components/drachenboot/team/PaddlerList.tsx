import React, { useState, useEffect } from 'react';
import { Users, Pencil, Trash2, Link as LinkIcon, AlertTriangle, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import SkillBadges from '../../ui/SkillBadges';
import { Paddler } from '@/types';
import { Card } from '@/components/ui/core/Card';
import { IconButton } from '@/components/ui/core/IconButton';
import { useDrachenboot } from '@/context/DrachenbootContext';
import { useTeam } from '@/context/TeamContext';
import { useSession } from 'next-auth/react';
import { THEME_MAP, ThemeKey } from '@/constants/themes';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { getAvatarUrl, getInitials, onAvatarRefresh } from '@/lib/avatar-utils';

interface PaddlerListProps {
  paddlers: Paddler[];
  editingId: number | string | null;
  onEdit: (paddler: Paddler) => void;
  onDelete: (id: number | string) => void;
  t: (key: string) => string;
  headerAction?: React.ReactNode;
  leftAction?: React.ReactNode;
}

const PaddlerList: React.FC<PaddlerListProps> = ({ paddlers, editingId, onEdit, onDelete, t, headerAction, leftAction }) => {
  const { userRole } = useDrachenboot();
  const { currentTeam } = useTeam();
  const theme = currentTeam?.plan === 'PRO' ? THEME_MAP[currentTeam.primaryColor as ThemeKey] : null;
  const { data: session } = useSession();
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [avatarCacheBuster, setAvatarCacheBuster] = useState(() => Date.now());
  const itemsPerPage = 15;

  const totalPages = Math.ceil(paddlers.length / itemsPerPage);
  // Reset clean page if filtered list is smaller
  if (currentPage > totalPages && totalPages > 0) {
    setCurrentPage(totalPages);
  }

  const paginatedPaddlers = paddlers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Listen for avatar refresh events to update cache buster
  useEffect(() => {
    return onAvatarRefresh(() => {
      setAvatarCacheBuster(Date.now());
    });
  }, []);

  // Cleanup timer on unmount or change
  React.useEffect(() => {
    let timer: NodeJS.Timeout;
    if (deleteConfirmId) {
      timer = setTimeout(() => {
        setDeleteConfirmId(null);
      }, 5000);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [deleteConfirmId]);

  const triggerDelete = (id: number | string) => {
    if (deleteConfirmId === id) {
      onDelete(id);
      setDeleteConfirmId(null);
    } else {
      setDeleteConfirmId(id);
    }
  };

  return (
    <>
      <Card id="tour-paddler-list" className="p-6 border-slate-200 dark:border-slate-800 shadow-sm">
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

        <div className="overflow-hidden bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
            <thead className="bg-slate-50 dark:bg-slate-800/50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t('name')}</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t('weight')}</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t('skills')}</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t('actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {paginatedPaddlers.map((p) => {
                const canViewWeight = userRole === 'CAPTAIN' || (session?.user?.id && p.userId === session.user.id);
                const isLinked = !!p.userId;
                const isPending = !!p.inviteEmail && !p.userId;
                const isConfirmingDelete = deleteConfirmId === p.id;

                return (
                  <tr
                    key={p.id}
                    className={`group transition-colors ${editingId === p.id
                      ? 'bg-orange-50 dark:bg-orange-900/10'
                      : isConfirmingDelete
                        ? 'bg-red-50 dark:bg-red-900/10'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/30'
                      }`}
                  >
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-8 h-8 border border-slate-200 dark:border-slate-700">
                          {p.user?.id && (
                            <AvatarImage
                              src={getAvatarUrl(p.user.id, p.user.image, avatarCacheBuster) || ''}
                              alt={p.name}
                            />
                          )}
                          <AvatarFallback className="bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-xs">
                            {getInitials(p.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="font-medium text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                          {p.name}
                          {isLinked && <LinkIcon size={14} className={theme?.text || 'text-blue-500'} />}
                          {isPending && <Clock size={14} className="text-amber-500" />}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="text-slate-600 dark:text-slate-400 font-mono text-sm px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded">
                        {isPending ? '-' : canViewWeight ? `${p.weight} kg` : '?'}
                      </span>
                    </td>
                    <td className="px-4 py-3 min-w-[200px]">
                      {!isPending && <div className="flex flex-wrap gap-1"><SkillBadges skills={p.skills} /></div>}
                      {isPending && <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium italic">{t('pending') || 'Pending'}</span>}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right">
                      {userRole === 'CAPTAIN' && (
                        <div className="flex items-center justify-end gap-2">
                          {isConfirmingDelete && (
                            <div className="flex items-center gap-1.5 px-2 py-1 bg-red-100 dark:bg-red-900/30 rounded text-red-700 dark:text-red-400 text-[10px] font-medium mr-2">
                              <AlertTriangle size={12} />
                              <span>Confirm?</span>
                            </div>
                          )}

                          {!isPending && (
                            <IconButton
                              icon={Pencil}
                              onClick={() => onEdit(p)}
                              variant="ghost"
                              size="sm"
                              className="text-slate-400 hover:text-blue-500"
                            />
                          )}
                          <IconButton
                            icon={Trash2}
                            onClick={() => triggerDelete(p.id)}
                            variant={isConfirmingDelete ? 'default' : 'ghost'}
                            size="sm"
                            className={isConfirmingDelete ? 'bg-red-600 text-white' : 'text-slate-400 hover:text-red-500'}
                          />
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {totalPages > 1 && (
        <div className="flex justify-between items-center mt-4 px-2">
          <div className="text-sm text-slate-500 dark:text-slate-400">
            {t('page')} {currentPage} {t('of')} {totalPages}
          </div>
          <div className="flex gap-2">
            <IconButton
              icon={ChevronLeft}
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              variant="outline"
              size="sm"
              className="bg-white dark:bg-slate-800"
            />
            <IconButton
              icon={ChevronRight}
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              variant="outline"
              size="sm"
              className="bg-white dark:bg-slate-800"
            />
          </div>
        </div>
      )}
    </>
  );
};

export default PaddlerList;
