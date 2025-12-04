import React from 'react';
import { Team } from '@/types';
import { X } from 'lucide-react';
import TeamSettingsForm from './TeamSettingsForm';

interface TeamSettingsModalProps {
  team: Team;
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<Team>) => Promise<void>;
  t: (key: string) => string;
}

const TeamSettingsModal: React.FC<TeamSettingsModalProps> = ({ team, isOpen, onClose, onSave, t }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto border border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800 sticky top-0 bg-white dark:bg-slate-900 z-10">
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
            {t('teamSettings') || 'Team Einstellungen'}
          </h2>
          <button 
            onClick={onClose}
            className="p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-4">
          <TeamSettingsForm 
            initialData={team} 
            onSave={async (data) => {
              await onSave(data);
              onClose();
            }}
            onCancel={onClose}
            t={t}
          />
        </div>
      </div>
    </div>
  );
};

export default TeamSettingsModal;
