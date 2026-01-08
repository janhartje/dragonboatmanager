'use client';

import React, { useState, useEffect, use } from 'react';
import { useSearchParams } from 'next/navigation';
import { useRouter, Link } from '@/i18n/routing';
import { useDrachenboot } from '@/context/DrachenbootContext';
import { useTeam } from '@/context/TeamContext';
import { useTheme } from '@/context/ThemeContext';
import { useTranslations } from 'next-intl';
import { ArrowLeft, Trash2, AlertTriangle, Shield, ShieldAlert, UserMinus } from 'lucide-react';
import Header from '@/components/ui/Header';
import Footer from '@/components/ui/Footer';
import DragonLogo from '@/components/ui/DragonLogo';
import TeamSettingsForm from '@/components/drachenboot/team/TeamSettingsForm';
import { InviteMemberForm } from '@/components/drachenboot/team/InviteMemberForm';
import { HelpModal, AlertModal, ConfirmModal } from '@/components/ui/Modals';
import PageTransition from '@/components/ui/PageTransition';
import TeamSwitcher from '@/components/drachenboot/TeamSwitcher';
import { UserMenu } from '@/components/auth/UserMenu';
import { BillingContent, SubscriptionData } from '@/components/stripe/BillingContent';
import { ProBadge } from '@/components/drachenboot/pro/ProBadge';
import { ApiAccessTab } from '@/components/drachenboot/team/ApiAccessTab';

const THEME_MAP = {
  amber: {
    text: 'text-amber-600 dark:text-amber-500',
    ring: 'from-amber-500 via-yellow-200 to-amber-600',
    tab: 'border-amber-600 text-amber-600 dark:border-amber-400 dark:text-amber-400 bg-amber-50/50 dark:bg-amber-900/10'
  },
  blue: {
    text: 'text-blue-600 dark:text-blue-500',
    ring: 'from-blue-500 via-cyan-200 to-blue-600',
    tab: 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-900/10'
  },
  rose: {
    text: 'text-rose-600 dark:text-rose-500',
    ring: 'from-rose-500 via-pink-200 to-rose-600',
    tab: 'border-rose-600 text-rose-600 dark:border-rose-400 dark:text-rose-400 bg-rose-50/50 dark:bg-rose-900/10'
  },
  emerald: {
    text: 'text-emerald-600 dark:text-emerald-500',
    ring: 'from-emerald-500 via-teal-200 to-emerald-600',
    tab: 'border-emerald-600 text-emerald-600 dark:border-emerald-400 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-900/10'
  },
  violet: {
    text: 'text-violet-600 dark:text-violet-500',
    ring: 'from-violet-500 via-purple-200 to-violet-600',
    tab: 'border-violet-600 text-violet-600 dark:border-violet-400 dark:text-violet-400 bg-violet-50/50 dark:bg-violet-900/10'
  },
  slate: {
    text: 'text-slate-700 dark:text-slate-300',
    ring: 'from-slate-600 via-slate-200 to-slate-700',
    tab: 'border-slate-700 text-slate-700 dark:border-slate-300 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/50'
  }
};


import { Team } from '@/types';


// Re-defined SubscriptionTab to use native BillingContent
function SubscriptionTab({ team }: { team: Team }) {
  const teamId = team.id;
  const [loading, setLoading] = useState(true);
  const [subData, setSubData] = useState<SubscriptionData | null>(null);

  useEffect(() => {
    const fetchSubscription = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/stripe/subscription-details?teamId=${teamId}`);
        const data = await res.json();
        setSubData(data);
      } catch (e) {
        console.error('Failed to fetch subscription:', e);
      }
      setLoading(false);
    };

    fetchSubscription();
  }, [teamId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // We now let BillingContent handle the "No Subscription" state (it will show UpgradeView)
  return <BillingContent team={team} subscription={subData} />;
}


export default function TeamDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { teams, updateTeam, deleteTeam, refetchTeams, isLoadingTeams } = useTeam();
  const { isDarkMode, toggleDarkMode } = useTheme();
  const { paddlers, updatePaddler, deletePaddler, refetchPaddlers, userRole, isDataLoading } = useDrachenboot();
  const t = useTranslations();


  const [deleteConfirm, setDeleteConfirm] = useState(false);

  // Refactor: activeTab is fully controlled by URL
  // We use a helper to get safe tab value
  const getTabFromUrl = () => {
    const tab = searchParams.get('tab');
    return (tab === 'general' || tab === 'members' || tab === 'subscription' || tab === 'api') ? tab : 'general';
  };
  const activeTab = getTabFromUrl();

  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const [memberToRemove, setMemberToRemove] = useState<{ id: string | number; name: string } | null>(null);

  const team = teams.find(t => t.id === id);

  // Filter for actual users (members) of this team, including pending invites
  const members = paddlers.filter(p => p.teamId === id && (p.userId || p.inviteEmail));

  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    if (teams.length > 0 && !team && !isDataLoading) {
      // Team not found, redirect
      router.push('/app/teams');
    }
  }, [teams, team, router, isDataLoading]);

  // Refetch teams if we just upgraded
  useEffect(() => {
    if (searchParams.get('upgrade_success') === 'true') {
      refetchTeams();
    }
  }, [searchParams, refetchTeams]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleSave = async (data: any) => {
    if (team) {
      await updateTeam(team.id, data);
    }
  };

  const handleDelete = async () => {
    if (team) {
      await deleteTeam(team.id);
      router.push('/app/teams');
    }
  };

  const handleRoleChange = async (paddlerId: string | number, newRole: 'CAPTAIN' | 'PADDLER') => {
    // Prevent removing the last captain
    if (newRole === 'PADDLER') {
      const captains = members.filter(m => m.role === 'CAPTAIN');
      if (captains.length <= 1 && captains[0].id === paddlerId) {
        setAlertMessage(t('cannotRemoveLastCaptain') || 'Cannot remove the last captain');
        return;
      }
    }
    updatePaddler(paddlerId, { role: newRole });
  };

  const confirmRemoveMember = async () => {
    if (memberToRemove) {
      await deletePaddler(memberToRemove.id);
      await refetchPaddlers();
      setMemberToRemove(null);
    }
  };

  if (isLoadingTeams || isDataLoading || !team) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-slate-950">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Permission Check
  if (userRole !== 'CAPTAIN') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-slate-950 p-4">
        <div className="text-center max-w-md w-full p-8 bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800">
          <ShieldAlert size={48} className="mx-auto text-red-500 mb-4" />
          <h1 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-2">
            {t('accessDenied') || 'Access Denied'}
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            {t('onlyCaptainsCanEditTeam') || 'Only team captains can edit team settings and manage members.'}
          </p>
          <Link
            href="/app"
            className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            {t('backToDashboard') || 'Back to Dashboard'}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <PageTransition>
      <div className="min-h-screen font-sans text-slate-800 dark:text-slate-100 transition-colors duration-300 bg-slate-100 dark:bg-slate-950 p-2 md:p-4 pb-20">
        <div className="max-w-6xl mx-auto">
          <Header
            title={t('editTeam') || 'Edit Team'}
            logo={
              <Link href="/" className="cursor-pointer hover:opacity-80 transition-opacity">
                <div className="relative group">
                  {team?.plan === 'PRO' && team?.showProRing !== false && (
                    <div className={`absolute -inset-[3px] bg-gradient-to-tr ${THEME_MAP[team.primaryColor as keyof typeof THEME_MAP]?.ring || THEME_MAP.amber.ring} rounded-full animate-shine opacity-90 shadow-[0_0_12px_rgba(251,191,36,0.2)] dark:shadow-[0_0_15px_rgba(251,191,36,0.1)]`}></div>
                  )}
                  <div className={`relative rounded-full ${team?.plan === 'PRO' && team?.showProRing !== false ? 'p-[2px] bg-white dark:bg-slate-900 shadow-inner' : ''}`}>
                    {team?.icon ? (
                      <img src={team.icon} alt="Team Icon" className="w-10 h-10 rounded-full object-cover" />
                    ) : (
                      <DragonLogo className={`w-10 h-10 ${team?.plan === 'PRO' ? (THEME_MAP[team.primaryColor as keyof typeof THEME_MAP]?.text || THEME_MAP.amber.text) : ''}`} />
                    )}
                  </div>
                </div>
              </Link>
            }
            badge={team?.plan === 'PRO' && <ProBadge color={team.primaryColor} />}
            leftAction={
              <button
                onClick={() => router.push('/app')}
                className="p-2 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-blue-600 hover:border-blue-300 transition-colors"
              >
                <ArrowLeft size={20} />
              </button>
            }
            showThemeToggle={true}
            isDarkMode={isDarkMode}
            toggleDarkMode={toggleDarkMode}
            showHelp={true}
            onHelp={() => setShowHelp(true)}
          >
            <TeamSwitcher />
            <div className="w-px h-8 bg-slate-100 dark:bg-slate-800 mx-2"></div>
            <UserMenu />
          </Header>

          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800/40 overflow-hidden flex flex-col min-h-[600px]">
            <div className="flex border-b border-slate-200 dark:border-slate-800/40">
              <button
                onClick={() => {
                  router.push(`/app/teams/${id}?tab=general`);
                }}
                className={`flex-1 py-4 text-sm font-medium transition-colors border-b-2 ${activeTab === 'general'
                    ? (THEME_MAP[team.primaryColor as keyof typeof THEME_MAP]?.tab || 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-900/10')
                    : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}
              >
                {t('general') || 'General'}
              </button>
              <button
                onClick={() => {
                  router.push(`/app/teams/${id}?tab=members`);
                }}
                className={`flex-1 py-4 text-sm font-medium transition-colors border-b-2 ${activeTab === 'members'
                    ? (THEME_MAP[team.primaryColor as keyof typeof THEME_MAP]?.tab || 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-900/10')
                    : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}
              >
                {t('members') || 'Members'}
              </button>
              <button
                onClick={() => {
                  router.push(`/app/teams/${id}?tab=subscription`);
                }}
                className={`flex-1 py-4 text-sm font-medium transition-colors border-b-2 ${activeTab === 'subscription'
                    ? (THEME_MAP[team.primaryColor as keyof typeof THEME_MAP]?.tab || 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-900/10')
                    : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}
              >
                {t('pro.subscription') || 'Subscription'}
              </button>
              <button
                onClick={() => {
                  router.push(`/app/teams/${id}?tab=api`);
                }}
                className={`flex-1 py-4 text-sm font-medium transition-colors border-b-2 ${activeTab === 'api'
                    ? (THEME_MAP[team.primaryColor as keyof typeof THEME_MAP]?.tab || 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-900/10')
                    : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}
              >
                API Access
              </button>
            </div>

            <div className="p-6">
              {activeTab === 'general' ? (
                <div className="space-y-8">
                  <div>
                    <h3 className="text-lg font-medium text-slate-800 dark:text-slate-200 mb-4">
                      {t('generalSettings') || 'General Settings'}
                    </h3>
                    <TeamSettingsForm
                      initialData={team}
                      onSave={handleSave}
                      t={t}
                    />
                  </div>

                  <div className="pt-6 border-t border-slate-200 dark:border-slate-800">
                    <h3 className="text-lg font-medium text-slate-800 dark:text-slate-200 mb-2">
                      {t('dangerZone') || 'Danger Zone'}
                    </h3>
                    <div className="bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 rounded-lg p-4">
                      <div className="flex items-start gap-3 mb-4">
                        <AlertTriangle size={20} className="text-red-500 shrink-0 mt-0.5" />
                        <div>
                          <h4 className="font-medium text-red-800 dark:text-red-400">
                            {t('deleteTeam') || 'Delete Team'}
                          </h4>
                          <p className="text-sm text-red-600 dark:text-red-300/80 mt-1">
                            {t('deleteTeamWarning') || 'Deleting a team will permanently remove all its paddlers and events. This action cannot be undone.'}
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => setDeleteConfirm(true)}
                        className="px-4 py-2 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg font-medium transition-colors flex items-center gap-2"
                      >
                        <Trash2 size={18} />
                        <span>{t('deleteTeam') || 'Delete Team'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              ) : activeTab === 'members' ? (
                <div className="space-y-8">
                  <div>
                    <h3 className="text-lg font-medium text-slate-800 dark:text-slate-200 mb-4">
                      {t('inviteMembers') || 'Invite Members'}
                    </h3>
                    <InviteMemberForm teamId={team.id} onSuccess={refetchPaddlers} />
                  </div>

                  <div className="pt-6 border-t border-slate-200 dark:border-slate-800">
                    <h3 className="text-lg font-medium text-slate-800 dark:text-slate-200 mb-4">
                      {t('teamMembers') || 'Team Members'}
                    </h3>
                    <div className="space-y-3">
                      {members.map(member => (
                        <div key={member.id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-800">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-sm overflow-hidden">
                              {member.user?.image ? (
                                <img src={member.user.image} alt={member.name} className="w-full h-full object-cover" />
                              ) : (
                                member.name.charAt(0).toUpperCase()
                              )}
                            </div>
                            <div>
                              <p className="font-medium text-slate-900 dark:text-slate-100">{member.name}</p>
                              <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-2">
                                {member.role === 'CAPTAIN' ? (t('captain') || 'Captain') : (t('paddler') || 'Paddler')}
                                {!member.userId && member.inviteEmail && (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                                    {t('pending')}
                                  </span>
                                )}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleRoleChange(member.id, member.role === 'CAPTAIN' ? 'PADDLER' : 'CAPTAIN')}
                              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors font-medium text-sm border shadow-sm ${member.role === 'CAPTAIN'
                                  ? 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-700'
                                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-700'
                                }`}
                              title={member.role === 'CAPTAIN' ? (t('demoteToPaddler') || 'Demote to Paddler') : (t('promoteToCaptain') || 'Promote to Captain')}
                            >
                              {member.role === 'CAPTAIN' ? (
                                <>
                                  <ShieldAlert size={16} className="text-amber-500" />
                                  <span className="hidden sm:inline">{t('demote') || 'Demote'}</span>
                                </>
                              ) : (
                                <>
                                  <Shield size={16} className="text-blue-500" />
                                  <span className="hidden sm:inline">{t('promote') || 'Promote'}</span>
                                </>
                              )}
                            </button>

                            <button
                              onClick={() => setMemberToRemove(member)}
                              className="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors font-medium text-sm border shadow-sm bg-white border-red-200 text-red-600 hover:bg-red-50 dark:bg-slate-800 dark:border-red-900/30 dark:text-red-400 dark:hover:bg-red-900/20"
                              title={t('removeMember')}
                            >
                              <UserMinus size={16} />
                              <span className="hidden sm:inline">{t('removeMember')}</span>
                            </button>
                          </div>
                        </div>
                      ))}

                      {members.length === 0 && (
                        <div className="text-center py-8 bg-slate-50 dark:bg-slate-800/30 rounded-lg border border-dashed border-slate-200 dark:border-slate-800">
                          <p className="text-slate-500 dark:text-slate-400">
                            {t('noMembersFound') || 'No members found.'}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : activeTab === 'subscription' ? (
                <SubscriptionTab team={team} />
              ) : activeTab === 'api' ? (
                <ApiAccessTab teamId={team.id} isPro={team.plan === 'PRO'} />
              ) : null}
            </div>
          </div>

          <Footer />

          {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}

          <AlertModal
            isOpen={!!alertMessage}
            message={alertMessage || ''}
            onClose={() => setAlertMessage(null)}
            type="warning"
          />

          <ConfirmModal
            isOpen={!!memberToRemove}
            title={t('confirmRemoveMemberTitle')}
            message={t('confirmRemoveMemberBody')}
            confirmLabel={t('confirmRemoveMemberButton')}
            isDestructive={true}
            onCancel={() => setMemberToRemove(null)}
            onConfirm={confirmRemoveMember}
          />

          <ConfirmModal
            isOpen={deleteConfirm}
            title={t('deleteTeam')}
            message={t('deleteTeamWarning')}
            confirmLabel={t('confirmDelete')}
            isDestructive={true}
            onCancel={() => setDeleteConfirm(false)}
            onConfirm={handleDelete}
          />
        </div>
      </div>
    </PageTransition>
  );
}
