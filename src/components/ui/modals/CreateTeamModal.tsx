import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Modal } from '@/components/ui/core/Modal';
import { FormInput } from '@/components/ui/FormInput';

interface CreateTeamModalProps {
  onClose: () => void;
  onCreate: (name: string) => void;
}

export const CreateTeamModal: React.FC<CreateTeamModalProps> = ({ onClose, onCreate }) => {
  const t = useTranslations();
  const [name, setName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onCreate(name);
    }
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={t('createTeam') || 'Create Team'}
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-800 rounded-lg transition-colors hover:text-slate-700 dark:hover:text-slate-200"
          >
            {t('cancel')}
          </button>
          <button
            type="submit"
            form="create-team-form"
            disabled={!name.trim()}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {t('create') || 'Create'}
          </button>
        </>
      }
    >
      <form id="create-team-form" onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
            {t('teamName') || 'Team Name'}
          </label>
          <FormInput
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Drachenboot A"
            autoFocus
          />
        </div>
      </form>
    </Modal>
  );
};
