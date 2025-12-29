'use client';

import React, { useState, useEffect, use } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useDrachenboot } from '@/context/DrachenbootContext';
import { useLanguage } from '@/context/LanguageContext';
import { ArrowLeft, Trash2, AlertTriangle, Shield, ShieldAlert, UserMinus, CreditCard, Calendar, ExternalLink } from 'lucide-react';
import Header from '@/components/ui/Header';
import Footer from '@/components/ui/Footer';
import DragonLogo from '@/components/ui/DragonLogo';
import TeamSettingsForm from '@/components/drachenboot/team/TeamSettingsForm';
import { InviteMemberForm } from '@/components/drachenboot/team/InviteMemberForm';
import { HelpModal, AlertModal, ConfirmModal } from '@/components/ui/Modals';
import PageTransition from '@/components/ui/PageTransition';
import TeamSwitcher from '@/components/drachenboot/TeamSwitcher';
import { UserMenu } from '@/components/auth/UserMenu';

import { UpgradeView } from '@/components/drachenboot/pro/UpgradeView';
import { Team } from '@/types';


interface SubscriptionDetails {
  hasSubscription: boolean;
  plan: string;
  isBillingUser?: boolean;
  subscription?: {
    id: string;
    status: string;
    cancelAtPeriodEnd: boolean;
    currentPeriodEnd: number;
    currentPeriodStart: number;
    interval?: string;
    amount: number;
    currency?: string;
    priceId?: string;
    paymentMethod?: {
      brand?: string;
      last4?: string;
      expMonth?: number;
      expYear?: number;
    } | null;
  };
}

function SubscriptionTab({ team, t }: { team: Team; t: (key: string) => string }) {
  const teamId = team.id;
  const [loading, setLoading] = useState(true);
  const [subData, setSubData] = useState<SubscriptionDetails | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  // Move fetchSubscription callback to useCallback or inside useEffect to avoid missing dependency warning
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

  const handleAction = async (action: 'cancel' | 'reactivate') => {
    setActionLoading(true);
    try {
      await fetch('/api/stripe/update-subscription', {
        method: 'POST',
        body: JSON.stringify({ teamId, action })
      });
      // We need to re-fetch here effectively.
      // Since it's inside useEffect, we can trigger a re-fetch by invalidating query or just calling logic again?
      // Simple way: duplicate the fetch logic or extract it?
      // Since we moved it inside useEffect, let's just reload the page or use a simple hack for now?
      // Better: let's reload the window for simplicity or just properly extract fetchSubscription.
      window.location.reload(); 
    } catch (e) {
      console.error('Action failed:', e);
    }
    setActionLoading(false);
    setShowCancelConfirm(false);
  };

  const openPortal = async () => {
    const res = await fetch('/api/stripe/create-portal-session', {
      method: 'POST',
      body: JSON.stringify({ teamId })
    });
    const data = await res.json();
    if (data.url) window.location.href = data.url;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }



  if (!subData?.hasSubscription || !subData.subscription) {
    return <UpgradeView team={team} />;
  }

  const sub = subData.subscription;
  const nextBilling = new Date(sub.currentPeriodEnd * 1000).toLocaleDateString();
  const amount = (sub.amount / 100).toFixed(2);
  const interval = sub.interval === 'year' ? t('pro.perYear') : t('pro.perMonth');

  return (
    <div className="space-y-6">
      {/* Status Card */}
      <div className={`p-6 rounded-lg border ${
        sub.cancelAtPeriodEnd 
          ? 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800'
          : 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800'
      }`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              sub.cancelAtPeriodEnd 
                ? 'bg-amber-100 dark:bg-amber-900/30'
                : 'bg-green-100 dark:bg-green-900/30'
            }`}>
              <CreditCard className={sub.cancelAtPeriodEnd ? 'text-amber-600' : 'text-green-600'} size={20} />
            </div>
            <div>
              <h3 className="font-bold text-lg text-slate-800 dark:text-slate-200">PRO</h3>
              <p className={`text-sm ${sub.cancelAtPeriodEnd ? 'text-amber-600' : 'text-green-600'}`}>
                {sub.cancelAtPeriodEnd ? t('pro.canceledAtPeriodEnd') : 'Aktiv'}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-slate-800 dark:text-slate-200">€{amount}<span className="text-sm font-normal text-slate-500">{interval}</span></p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
          <Calendar size={16} />
          <span>{t('pro.nextBillingDate')}: <strong>{nextBilling}</strong></span>
        </div>
      </div>

      {/* Payment Method */}
      {sub.paymentMethod && (
        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
          <h4 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">{t('pro.paymentMethod')}</h4>
          <div className="flex items-center gap-3">
            <div className="w-10 h-6 bg-slate-200 dark:bg-slate-700 rounded flex items-center justify-center text-xs font-bold uppercase">
              {sub.paymentMethod.brand}
            </div>
            <span className="text-slate-700 dark:text-slate-300">•••• {sub.paymentMethod.last4}</span>
            <span className="text-slate-500 text-sm">exp {sub.paymentMethod.expMonth}/{sub.paymentMethod.expYear}</span>
          </div>
        </div>
      )}

      {/* Action Buttons - Only for billing user */}
      {subData.isBillingUser ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            onClick={() => openPortal()}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-slate-700 dark:text-slate-300 font-medium"
          >
            <CreditCard size={18} />
            {t('pro.updatePaymentMethod')}
          </button>
          <button
            onClick={() => openPortal()}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-slate-700 dark:text-slate-300 font-medium"
          >
            <ExternalLink size={18} />
            {t('pro.viewInvoices')}
          </button>
        </div>
      ) : (
        <div className="p-4 bg-slate-100 dark:bg-slate-800/50 rounded-lg text-center text-slate-500 dark:text-slate-400 text-sm">
          {t('pro.managedByOther') || 'Das Abo wird von einem anderen Teammitglied verwaltet.'}
        </div>
      )}

      {/* Cancel/Reactivate - Only for billing user */}
      {subData.isBillingUser && (
        <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
          {sub.cancelAtPeriodEnd ? (
            <button
              onClick={() => handleAction('reactivate')}
              disabled={actionLoading}
              className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              {actionLoading ? '...' : t('pro.reactivateSubscription')}
            </button>
          ) : (
            <button
              onClick={() => setShowCancelConfirm(true)}
              className="w-full py-3 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 font-medium rounded-lg transition-colors border border-red-200 dark:border-red-900/30"
            >
              {t('pro.cancelSubscription')}
            </button>
          )}
        </div>
      )}

      {/* Cancel Confirmation */}
      <ConfirmModal
        isOpen={showCancelConfirm}
        title={t('pro.cancelSubscription')}
        message={`${t('pro.confirmCancel')} ${t('pro.cancelInfo')}`}
        confirmLabel={t('pro.cancelSubscription')}
        isDestructive={true}
        onCancel={() => setShowCancelConfirm(false)}
        onConfirm={() => handleAction('cancel')}
      />
    </div>
  );
}

export default function TeamDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { teams, updateTeam, deleteTeam, isDarkMode, toggleDarkMode, paddlers, updatePaddler, deletePaddler, refetchPaddlers, userRole, isDataLoading } = useDrachenboot();
  const { t } = useLanguage();
  

  const [deleteConfirm, setDeleteConfirm] = useState(false);
  
  // Refactor: activeTab is fully controlled by URL
  // We use a helper to get safe tab value
  const getTabFromUrl = () => {
      const tab = searchParams.get('tab');
      return (tab === 'general' || tab === 'members' || tab === 'subscription') ? tab : 'general';
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

  if (isDataLoading || !team) {
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
              <DragonLogo className="w-10 h-10" />
            </Link>
          }
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

        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col min-h-[600px]">
          <div className="flex border-b border-slate-200 dark:border-slate-800">
            <button
              onClick={() => {
                router.push(`/app/teams/${id}?tab=general`);
              }}
              className={`flex-1 py-4 text-sm font-medium transition-colors border-b-2 ${
                activeTab === 'general'
                  ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-900/10'
                  : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/50'
              }`}
            >
              {t('general') || 'General'}
            </button>
            <button
              onClick={() => {
                router.push(`/app/teams/${id}?tab=members`);
              }}
              className={`flex-1 py-4 text-sm font-medium transition-colors border-b-2 ${
                activeTab === 'members'
                  ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-900/10'
                  : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/50'
              }`}
            >
              {t('members') || 'Members'}
            </button>
            <button
              onClick={() => {
                router.push(`/app/teams/${id}?tab=subscription`);
              }}
              className={`flex-1 py-4 text-sm font-medium transition-colors border-b-2 ${
                activeTab === 'subscription'
                  ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-900/10'
                  : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/50'
              }`}
            >
              {t('pro.subscription') || 'Subscription'}
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
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors font-medium text-sm border shadow-sm ${
                              member.role === 'CAPTAIN'
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
              <SubscriptionTab team={team} t={t} />
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
