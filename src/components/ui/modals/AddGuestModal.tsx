import React from 'react';
import { UserPlus } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { Paddler } from '@/types';
import PaddlerForm from '../../drachenboot/team/PaddlerForm';

interface AddGuestModalProps {
  onClose: () => void;
  onAdd: (guest: Pick<Paddler, 'name' | 'weight' | 'skills'>) => void;
}

const AddGuestModal: React.FC<AddGuestModalProps> = ({ onClose, onAdd }) => {
  const { t } = useLanguage();

  const handleSave = (data: { name: string; weight: number; skills: string[] }) => {
    onAdd({
      name: data.name,
      weight: data.weight,
      skills: data.skills,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <UserPlus size={20} className="text-blue-500" /> {t('guestAddTitle')}
          </h3>
        </div>
        <PaddlerForm 
          paddlerToEdit={null}
          onSave={handleSave}
          onCancel={onClose}
          t={t}
          isModal={true}
          isGuest={true}
        />
      </div>
    </div>
  );
};

export default AddGuestModal;
