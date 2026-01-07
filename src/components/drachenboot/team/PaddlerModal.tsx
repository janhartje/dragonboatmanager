import React, { useState } from 'react';
import { User, Mail, AlertTriangle } from 'lucide-react';
import PaddlerForm from './PaddlerForm';
import { THEME_MAP, ThemeKey } from '@/constants/themes';
import { Paddler } from '@/types';
import { FormInput } from '@/components/ui/FormInput';
import { inviteMember } from '@/app/actions/team';
import { useDrachenboot } from '@/context/DrachenbootContext';
import { useTeam } from '@/context/TeamContext';
import { Modal } from '@/components/ui/core/Modal';
import { SegmentedControl } from '@/components/ui/core/SegmentedControl';

interface PaddlerModalProps {
  isOpen: boolean;
  onClose: () => void;
  paddlerToEdit: Paddler | null;
  onSave: (data: any) => void; // eslint-disable-line @typescript-eslint/no-explicit-any
  t: (key: string) => string;
  teamMembers?: any[]; // eslint-disable-line @typescript-eslint/no-explicit-any
  errorMessage?: string | null;
}

const PaddlerModal: React.FC<PaddlerModalProps> = ({ isOpen, onClose, paddlerToEdit, onSave, t, teamMembers, errorMessage }) => {
  const [activeTab, setActiveTab] = useState<'create' | 'invite'>('create');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteSuccess, setInviteSuccess] = useState(false);
  const { refetchPaddlers, paddlers } = useDrachenboot();
  const { currentTeam } = useTeam();
  const theme = currentTeam?.plan === 'PRO' ? THEME_MAP[currentTeam.primaryColor as ThemeKey] : null;

  if (!isOpen) return null;

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim() || !currentTeam) return;

    setInviteLoading(true);
    setInviteError(null);

    try {
      await inviteMember(currentTeam.id, inviteEmail.trim());
      await refetchPaddlers();
      setInviteSuccess(true);
      setInviteEmail('');
      setTimeout(() => {
        setInviteSuccess(false);
        onClose();
      }, 1500);
    } catch (e: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
      if (e.message === 'USER_ALREADY_MEMBER') {
        setInviteError(t('userAlreadyMember') || 'User is already a team member');
      } else if (e.message === 'EMAIL_ALREADY_INVITED') {
        setInviteError(t('emailAlreadyInvited') || 'This email has already been invited');
      } else if (e.message === 'TEAM_LIMIT_REACHED') {
        setInviteError(t('teamLimitReached') || 'Team limit reached');
      } else {
        setInviteError(e.message || t('inviteError') || 'Failed to send invitation');
      }
    } finally {
      setInviteLoading(false);
    }
  };

  const handleClose = () => {
    setInviteEmail('');
    setInviteError(null);
    setInviteSuccess(false);
    setActiveTab('create');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={paddlerToEdit ? t('editPaddler') : t('addMember') || 'Add Member'}
      size="md"
      footer={activeTab === 'invite' && !paddlerToEdit ? (
        <>
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 text-sm font-medium text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-800 rounded-lg transition-colors hover:text-slate-700 dark:hover:text-slate-200"
          >
            {t('cancel')}
          </button>
          <button
            type="submit"
            form="invite-form"
            disabled={inviteLoading || !inviteEmail.trim() || inviteSuccess || (currentTeam?.plan !== 'PRO' && !!currentTeam?.maxMembers && paddlers?.length >= currentTeam.maxMembers)}
            className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-all ${inviteSuccess
                ? 'bg-green-500 text-white'
                : inviteEmail.trim() && !inviteLoading
                  ? `${theme?.button || 'bg-blue-600 hover:bg-blue-700'} text-white`
                  : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed opacity-70'
              }`}
          >
            <Mail size={16} />
            {inviteLoading ? (t('sending') || 'Sending...') : inviteSuccess ? (t('sent') || 'Sent!') : (t('invite') || 'Invite')}
          </button>
        </>
      ) : null}
    >
      <div className="space-y-4">
        {/* Limit Warning */}
        {!paddlerToEdit && currentTeam?.plan !== 'PRO' && currentTeam?.maxMembers && paddlers?.length >= currentTeam.maxMembers && (
          <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg text-sm flex items-start gap-3">
            <div className="text-amber-500 mt-0.5">
              <AlertTriangle size={18} />
            </div>
            <div className="flex-1">
              <p className="font-medium text-amber-800 dark:text-amber-400">
                {t('teamLimitReached') || 'Team limit reached'}
              </p>
              <p className="text-amber-700 dark:text-amber-500 mt-1 text-xs leading-relaxed">
                {(t('teamLimitReachedDesc') || 'Limit of {max} members reached.').replace('{max}', currentTeam.maxMembers.toString())}
              </p>
            </div>
          </div>
        )}

        {/* Tabs for Add/Invite */}
        {!paddlerToEdit && (
          <SegmentedControl
            options={[
              { label: t('newPaddler') || 'New Paddler', value: 'create', icon: <User size={16} /> },
              { label: t('inviteMember') || 'Invite', value: 'invite', icon: <Mail size={16} /> }
            ]}
            value={activeTab}
            onChange={(val) => setActiveTab(val as 'create' | 'invite')}
            isFullWidth
          />
        )}

        {/* Content */}
        {activeTab === 'create' || paddlerToEdit ? (
          <div>
            {errorMessage && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm">
                {errorMessage}
              </div>
            )}
            <PaddlerForm
              paddlerToEdit={paddlerToEdit}
              onSave={onSave}
              onCancel={handleClose}
              t={t}
              teamMembers={teamMembers}
              isModal={true}
              disabled={!paddlerToEdit && !!(currentTeam?.plan !== 'PRO' && currentTeam?.maxMembers && paddlers?.length >= currentTeam.maxMembers)}
            />
          </div>
        ) : (
          <form id="invite-form" onSubmit={handleInvite} className="space-y-4">
            <div>
              <label className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 mb-1 block">
                {t('email') || 'Email'}
              </label>
              <FormInput
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder={t('emailPlaceholder') || 'email@example.com'}
                disabled={inviteLoading || inviteSuccess}
                autoFocus
              />
            </div>

            <p className="text-sm text-slate-500 dark:text-slate-400">
              {t('inviteDescription') || 'The person will be added to the team. If they don\'t have an account yet, they can sign up and will automatically be part of the team.'}
            </p>

            {inviteError && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm">
                {inviteError}
              </div>
            )}

            {inviteSuccess && (
              <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-green-600 dark:text-green-400 text-sm">
                {t('inviteSuccess') || 'Invitation sent successfully!'}
              </div>
            )}
          </form>
        )}
      </div>
    </Modal>
  );
};

export default PaddlerModal;
