import React, { useState, useRef, useEffect } from 'react';
import { useDrachenboot } from '@/context/DrachenbootContext';
import { useLanguage } from '@/context/LanguageContext';
import { ChevronDown, Plus, Users, Check, Settings, CreditCard, Sparkles } from 'lucide-react';
import { CreateTeamModal } from '../ui/modals/CreateTeamModal';
import { useSession } from 'next-auth/react';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';

const TeamSwitcher: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const { teams, currentTeam, switchTeam, createTeam, userRole } = useDrachenboot();
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCreateTeam = (name: string) => {
    createTeam(name);
    setShowCreateModal(false);
    setIsOpen(false);
  };

  if (!currentTeam && teams.length === 0) {
    if (!session) return null; // Don't show create button if not logged in

    return (
      <>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium text-sm shadow-sm"
        >
          <Plus size={16} />
          <span>{t('createTeam') || 'Create Team'}</span>
        </button>
        
        {showCreateModal && (
          <CreateTeamModal
            onClose={() => setShowCreateModal(false)}
            onCreate={handleCreateTeam}
          />
        )}
      </>
    );
  }

  return (
    <div className="relative flex-1 min-w-0 md:flex-initial" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full md:w-auto flex items-center gap-2 px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors text-slate-700 dark:text-slate-200 overflow-hidden"
      >
        <Users size={18} className="flex-shrink-0" />
        <span className="font-medium flex-1 truncate min-w-0 md:flex-initial md:max-w-[200px]">
          {currentTeam?.name || t('selectTeam') || 'Select Team'}
        </span>
        <ChevronDown size={16} className="transition-transform flex-shrink-0" />
      </button>

      {isOpen && (
        <>
          {/* Mobile Backdrop & Layout */}
          <div className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm sm:hidden" onClick={() => setIsOpen(false)} />

          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-sm z-50
            sm:absolute sm:top-auto sm:left-0 sm:translate-x-0 sm:translate-y-0 sm:mt-2 sm:w-64
            bg-white dark:bg-slate-900 rounded-xl shadow-2xl sm:shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="p-2">
              <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 px-2 py-1 uppercase tracking-wider">
                <span>{t('teams') || 'Teams'}</span>
              </div>
              <div className="max-h-60 overflow-y-auto mt-1">
                {teams.map((team) => (
                  <button
                    key={team.id}
                    onClick={() => {
                      switchTeam(team.id);
                      setIsOpen(false);

                      // If we are on a team details page, redirect to the new team
                      if (pathname.includes('/app/teams/')) {
                        const tab = searchParams.get('tab') || 'general';
                        router.push(`/app/teams/${team.id}?tab=${tab}`);
                      }
                    }}
                    className={`w-full text-left px-3 py-3 sm:py-2 rounded-lg flex items-center justify-between transition-colors ${
                      currentTeam?.id === team.id
                        ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                        : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200'
                    }`}
                  >
                    <span className="truncate text-base sm:text-sm">{team.name}</span>
                    {currentTeam?.id === team.id && <Check size={18} className="sm:w-4 sm:h-4" />}
                  </button>
                ))}
              </div>
              
              {/* Current Team Actions - ONLY FOR CAPTAIN */}
              {currentTeam && userRole === 'CAPTAIN' && (
                <>
                  <div className="h-px bg-slate-200 dark:bg-slate-700 my-2"></div>
                  <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 px-2 py-1 uppercase tracking-wider">
                    {t('teamSettings') || 'Team Settings'}
                  </div>
                  <button
                    onClick={() => {
                      router.push(`/app/teams/${currentTeam.id}?tab=general`);
                      setIsOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg flex items-center gap-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-sm"
                  >
                    <Settings size={16} />
                    {t('general') || 'Allgemein'}
                  </button>
                  <button
                    onClick={() => {
                      router.push(`/app/teams/${currentTeam.id}?tab=members`);
                      setIsOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg flex items-center gap-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-sm"
                  >
                    <Users size={16} />
                    {t('members') || 'Mitglieder'}
                  </button>
                  {currentTeam.plan === 'PRO' ? (
                    <button
                      onClick={() => {
                        router.push(`/app/teams/${currentTeam.id}?tab=subscription`);
                        setIsOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 rounded-lg flex items-center gap-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-sm"
                    >
                      <CreditCard size={16} />
                      {t('pro.subscription') || 'Abo'}
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        router.push(`/app/teams/${currentTeam.id}?tab=subscription`);
                        setIsOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 rounded-lg flex items-center gap-2 bg-gradient-to-r from-amber-100 to-orange-100 dark:from-amber-900/40 dark:to-orange-900/40 text-amber-700 dark:text-amber-400 font-bold hover:from-amber-200 hover:to-orange-200 dark:hover:from-amber-900/60 dark:hover:to-orange-900/60 transition-all text-sm mb-1 mt-1"
                    >
                      <Sparkles size={16} />
                      {t('pro.upgradeTitle') || 'Upgrade to PRO'}
                    </button>
                  )}
                </>
              )}
              
              <div className="h-px bg-slate-200 dark:bg-slate-700 my-2"></div>
              
              {session && (
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="w-full text-left px-3 py-3 sm:py-2 rounded-lg flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                >
                  <Plus size={18} className="sm:w-4 sm:h-4" />
                  <span className="text-base sm:text-sm">{t('createTeam') || 'Create Team'}</span>
                </button>
              )}
            </div>
          </div>
        </>
      )}

      {showCreateModal && (
        <CreateTeamModal
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreateTeam}
        />
      )}
    </div>
  );
};

export default TeamSwitcher;
