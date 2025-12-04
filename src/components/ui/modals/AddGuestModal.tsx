import React, { useState } from 'react';
import { UserPlus } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { useAlert } from '@/context/AlertContext';
import { Paddler } from '@/types';

import { FormInput } from '@/components/ui/FormInput';

interface AddGuestModalProps {
  onClose: () => void;
  onAdd: (guest: Pick<Paddler, 'name' | 'weight' | 'skills'>) => void;
}

const AddGuestModal: React.FC<AddGuestModalProps> = ({ onClose, onAdd }) => {
  const { t } = useLanguage();
  const { showAlert } = useAlert();
  const [name, setName] = useState<string>('');
  const [weight, setWeight] = useState<string>('');
  const [skills, setSkills] = useState({ left: false, right: false, drum: false, steer: false });

  const toggleSkill = (s: keyof typeof skills) => setSkills((prev) => ({ ...prev, [s]: !prev[s] }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !weight) return;
    const skillsArr = (Object.keys(skills) as Array<keyof typeof skills>).filter((k) => skills[k]);
    if (skillsArr.length === 0) {
      showAlert(t('pleaseChooseRole'), 'warning');
      return;
    }
    onAdd({ name, weight: parseFloat(weight), skills: skillsArr });
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
        <div className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">{t('name')}</label>
            <FormInput 
              autoFocus 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              placeholder={t('guestName')} 
            />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">{t('weightKg')}</label>
            <FormInput 
              type="number" 
              value={weight} 
              onChange={(e) => setWeight(e.target.value)} 
              placeholder="0" 
            />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase mb-2 block">{t('skills')}</label>
            <div className="flex gap-2 flex-wrap">
              {['left', 'right', 'drum', 'steer'].map(skill => (
                <button
                  key={skill}
                  type="button"
                  onClick={() => toggleSkill(skill as keyof typeof skills)}
                  className={`px-3 py-1.5 rounded border text-sm capitalize ${skills[skill as keyof typeof skills] ? 'bg-blue-500 text-white border-blue-600' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500'}`}
                >
                  {skill === 'steer' ? t('steer') : skill === 'drum' ? t('drum') : t(skill)}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2 border rounded text-slate-500 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800">{t('cancel')}</button>
            <button type="submit" className="flex-1 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium">{t('add')}</button>
          </div>
        </form>
        </div>
      </div>
    </div>
  );
};

export default AddGuestModal;
