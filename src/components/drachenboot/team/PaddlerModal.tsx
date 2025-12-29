import React, { useState } from 'react';
import { X, User, Mail } from 'lucide-react';
import PaddlerForm from './PaddlerForm';
import { Paddler } from '@/types';
import { FormInput } from '@/components/ui/FormInput';
import { inviteMember } from '@/app/actions/team';
import { useDrachenboot } from '@/context/DrachenbootContext';

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
  const { currentTeam, refetchPaddlers } = useDrachenboot();

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

  // If editing, only show the paddler form (no tabs)
  if (paddlerToEdit) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200 dark:border-slate-800">
          <div className="flex justify-between items-center p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
            <h3 className="font-bold text-lg text-slate-800 dark:text-slate-200">
              {t('editPaddler')}
            </h3>
            <button 
              onClick={handleClose}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
          
          <div className="p-0">
            {errorMessage && (
              <div className="mx-6 mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm">
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
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200 dark:border-slate-800">
        {/* Header with Tabs */}
        <div className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex justify-between items-center p-4 pb-0">
            <h3 className="font-bold text-lg text-slate-800 dark:text-slate-200">
              {t('addMember') || 'Add Member'}
            </h3>
            <button 
              onClick={handleClose}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
          
          {/* Tabs */}
          <div className="flex gap-1 px-4 pt-3">
            <button
              onClick={() => setActiveTab('create')}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                activeTab === 'create'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 border-t border-x border-slate-200 dark:border-slate-700'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              <User size={16} />
              {t('newPaddler') || 'New Paddler'}
            </button>
            <button
              onClick={() => setActiveTab('invite')}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                activeTab === 'invite'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 border-t border-x border-slate-200 dark:border-slate-700'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              <Mail size={16} />
              {t('inviteMember') || 'Invite'}
            </button>
          </div>
        </div>
        
        {/* Content */}
        <div className="p-0">
          {activeTab === 'create' ? (
            <>
              {errorMessage && (
                <div className="mx-6 mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm">
                  {errorMessage}
                </div>
              )}
              <PaddlerForm 
                paddlerToEdit={null}
                onSave={onSave}
                onCancel={handleClose}
                t={t}
                teamMembers={teamMembers}
                isModal={true}
              />
            </>
          ) : (
            <form onSubmit={handleInvite} className="p-6 space-y-4">
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
              
              <div className="flex flex-col-reverse sm:flex-row gap-2 pt-2 justify-end">
                <button
                  type="button"
                  onClick={handleClose}
                  className="w-full sm:w-auto bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 px-4 py-2 rounded text-sm"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  disabled={inviteLoading || !inviteEmail.trim() || inviteSuccess}
                  className={`w-full sm:w-auto h-9 px-6 py-2 rounded text-sm font-medium flex items-center justify-center gap-2 transition-all ${
                    inviteSuccess
                      ? 'bg-green-500 text-white'
                      : inviteEmail.trim() && !inviteLoading
                        ? 'bg-blue-600 hover:bg-blue-700 text-white'
                        : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed opacity-70'
                  }`}
                >
                  <Mail size={16} />
                  {inviteLoading ? (t('sending') || 'Sending...') : inviteSuccess ? (t('sent') || 'Sent!') : (t('invite') || 'Invite')}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaddlerModal;
