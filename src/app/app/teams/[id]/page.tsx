'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useDrachenboot } from '@/context/DrachenbootContext';
import { useLanguage } from '@/context/LanguageContext';
import { ArrowLeft, Trash2, AlertTriangle, Shield, ShieldAlert, UserMinus } from 'lucide-react';
import Header from '@/components/ui/Header';
import Footer from '@/components/ui/Footer';
import DragonLogo from '@/components/ui/DragonLogo';
import TeamSettingsForm from '@/components/drachenboot/team/TeamSettingsForm';
import { InviteMemberForm } from '@/components/drachenboot/team/InviteMemberForm';
import { HelpModal, AlertModal, ConfirmModal } from '@/components/ui/Modals';
import PageTransition from '@/components/ui/PageTransition';

export default function TeamDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { teams, updateTeam, deleteTeam, isDarkMode, toggleDarkMode, paddlers, updatePaddler, deletePaddler, refetchPaddlers } = useDrachenboot();
  const { t } = useLanguage();
  
  const [isLoading, setIsLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [activeTab, setActiveTab] = useState<'general' | 'members'>('general');
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const [memberToRemove, setMemberToRemove] = useState<any>(null);

  const team = teams.find(t => t.id === params.id);

  // Filter for actual users (members) of this team, including pending invites
  const members = paddlers.filter(p => p.teamId === params.id && (p.userId || p.inviteEmail));

  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    if (teams.length > 0) {
      if (team) {
        setIsLoading(false);
      } else {
        // Team not found, redirect
        router.push('/app/teams');
      }
    }
  }, [teams, team, router, params.id]);

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

  if (isLoading || !team) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-slate-950">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
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
              onClick={() => router.push('/app/teams')} 
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
        />

        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col min-h-[600px]">
          <div className="flex border-b border-slate-200 dark:border-slate-800">
            <button
              onClick={() => setActiveTab('general')}
              className={`flex-1 py-4 text-sm font-medium transition-colors border-b-2 ${
                activeTab === 'general'
                  ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-900/10'
                  : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/50'
              }`}
            >
              {t('general') || 'General'}
            </button>
            <button
              onClick={() => setActiveTab('members')}
              className={`flex-1 py-4 text-sm font-medium transition-colors border-b-2 ${
                activeTab === 'members'
                  ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-900/10'
                  : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/50'
              }`}
            >
              {t('members') || 'Members'}
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
            ) : (
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
            )}
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
