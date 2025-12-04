import React from 'react';
import { X } from 'lucide-react';
import PaddlerForm from './PaddlerForm';
import { Paddler } from '@/types';

interface PaddlerModalProps {
  isOpen: boolean;
  onClose: () => void;
  paddlerToEdit: Paddler | null;
  onSave: (data: any) => void;
  t: (key: string) => string;
  teamMembers?: any[]; // Users available for linking
  errorMessage?: string | null;
}

const PaddlerModal: React.FC<PaddlerModalProps> = ({ isOpen, onClose, paddlerToEdit, onSave, t, teamMembers, errorMessage }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200 dark:border-slate-800">
        <div className="flex justify-between items-center p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <h3 className="font-bold text-lg text-slate-800 dark:text-slate-200">
            {paddlerToEdit ? t('editPaddler') : t('newPaddler')}
          </h3>
          <button 
            onClick={onClose}
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
            onSave={(data) => {
              onSave(data);
              // onClose(); // Don't close immediately, let parent handle success/failure
            }}
            onCancel={onClose}
            t={t}
            teamMembers={teamMembers}
            isModal={true}
          />
        </div>
      </div>
    </div>
  );
};

export default PaddlerModal;
