import React, { useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';

interface CreateTeamModalProps {
  onClose: () => void;
  onCreate: (name: string) => void;
}

export const CreateTeamModal: React.FC<CreateTeamModalProps> = ({ onClose, onCreate }) => {
  const { t } = useLanguage();
  const [name, setName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onCreate(name);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 dark:border-slate-800">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-4">
            {t('createTeam') || 'Create Team'}
          </h2>
          
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                {t('teamName') || 'Team Name'}
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="e.g. Drachenboot A"
                autoFocus
              />
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                {t('cancel')}
              </button>
              <button
                type="submit"
                disabled={!name.trim()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t('create') || 'Create'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
