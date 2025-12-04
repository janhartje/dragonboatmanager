import React, { useState, useEffect } from 'react';
import { User, Pencil, Drum, ShipWheel, Save, Plus, Link as LinkIcon, Unlink } from 'lucide-react';
import { Paddler } from '@/types';

import { FormInput } from '@/components/ui/FormInput';

interface PaddlerFormProps {
  paddlerToEdit: Paddler | null;
  onSave: (paddler: any) => void;
  onCancel: () => void;
  t: (key: string) => string;
  teamMembers?: any[];
  isModal?: boolean;
}

const PaddlerForm: React.FC<PaddlerFormProps> = ({ paddlerToEdit, onSave, onCancel, t, teamMembers = [], isModal = false }) => {
  const [name, setName] = useState<string>('');
  const [weight, setWeight] = useState<string>('');
  const [skills, setSkills] = useState({ left: false, right: false, drum: false, steer: false });
  const [userId, setUserId] = useState<string>('');

  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (paddlerToEdit) {
      setName(paddlerToEdit.name);
      setWeight(paddlerToEdit.weight.toString());
      const sObj = { left: false, right: false, drum: false, steer: false };
      if (paddlerToEdit.skills) paddlerToEdit.skills.forEach((s) => {
        if (s in sObj) sObj[s as keyof typeof sObj] = true;
      });
      setSkills(sObj);
      setUserId(paddlerToEdit.userId || '');
    } else {
      resetForm();
    }
  }, [paddlerToEdit]);

  const resetForm = () => {
    setName('');
    setWeight('');
    setSkills({ left: false, right: false, drum: false, steer: false });
    setUserId('');
    setTouched(false);
  };

  const toggleSkill = (skill: keyof typeof skills) => {
    setSkills((prev) => ({ ...prev, [skill]: !prev[skill] }));
  };

  const isFormValid = name.trim() !== '' && weight.trim() !== '';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    
    if (!isFormValid) return;

    const skillsArray = (Object.keys(skills) as Array<keyof typeof skills>).filter((k) => skills[k]);
    
    onSave({ 
      name, 
      weight: parseFloat(weight), 
      skills: skillsArray,
      userId: userId || null
    });
    if (!paddlerToEdit) resetForm();
  };

  const containerClasses = isModal 
    ? "p-6" 
    : `p-6 rounded-xl shadow-sm border transition-all h-full ${paddlerToEdit ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800 ring-1 ring-orange-200 dark:ring-orange-900' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'}`;

  return (
    <div id="tour-paddler-form" className={containerClasses}>
      {!isModal && (
        <h3 className={`font-bold mb-4 flex items-center gap-2 text-sm uppercase tracking-wide ${paddlerToEdit ? 'text-orange-800 dark:text-orange-200' : 'text-slate-700 dark:text-slate-200'}`}>
          {paddlerToEdit ? <Pencil size={16} /> : <User size={16} />} {paddlerToEdit ? t('editPaddler') : t('newMember')}
        </h3>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <label className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 mb-1 block">{t('name')}</label>
            <FormInput
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              placeholder={t('name')}
              error={touched && !name.trim()}
            />
          </div>
          <div className="w-full md:w-32">
            <label className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 mb-1 block">{t('weight')}</label>
            <FormInput
              type="number" 
              value={weight} 
              onChange={(e) => setWeight(e.target.value)} 
              placeholder="kg"
              error={touched && !weight.trim()}
            />
          </div>
        </div>
        
        {/* Account Linking */}
        <div>
           <label className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 mb-1 block flex items-center gap-1">
             <LinkIcon size={12} /> {t('linkedAccount') || 'Linked Account'}
           </label>
           <select 
             value={userId} 
             onChange={(e) => setUserId(e.target.value)}
             className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-sm outline-none dark:text-white"
           >
             <option value="">{t('noAccount') || 'No Account Linked'}</option>
             {teamMembers.map((member) => (
               <option key={member.userId} value={member.userId}>
                 {member.name} ({member.email})
               </option>
             ))}
           </select>
        </div>

        <div>
          <label className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 mb-2 block">{t('skills')}</label>
          <div className="flex gap-2 flex-wrap">
            <button type="button" onClick={() => toggleSkill('left')} className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition-all ${skills.left ? 'bg-red-500 border-red-600 text-white' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400'}`}>{t('left')}</button>
            <button type="button" onClick={() => toggleSkill('right')} className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition-all ${skills.right ? 'bg-green-500 border-green-600 text-white' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400'}`}>{t('right')}</button>
            <button type="button" onClick={() => toggleSkill('drum')} className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition-all flex items-center gap-1 ${skills.drum ? 'bg-yellow-400 border-yellow-500 text-yellow-900' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400'}`}><Drum size={12} /> {t('drum')}</button>
            <button type="button" onClick={() => toggleSkill('steer')} className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition-all flex items-center gap-1 ${skills.steer ? 'bg-purple-500 border-purple-600 text-white' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400'}`}><ShipWheel size={12} /> {t('steer')}</button>
          </div>
        </div>
        <div className="flex gap-2 pt-2 justify-end">
          {(!isModal && paddlerToEdit) && <button type="button" onClick={onCancel} className="bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 px-4 py-2 rounded text-sm">{t('cancel')}</button>}
          {isModal && <button type="button" onClick={onCancel} className="bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 px-4 py-2 rounded text-sm">{t('cancel')}</button>}
          <button 
            type="submit" 
            className={`h-9 px-6 py-2 rounded text-sm font-medium flex items-center gap-2 transition-all
              ${isFormValid 
                ? (paddlerToEdit ? 'bg-orange-500 hover:bg-orange-600 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white') 
                : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed opacity-70'
              }`}
          >
            {paddlerToEdit ? <Save size={16} /> : <Plus size={16} />} {paddlerToEdit ? t('save') : t('add')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PaddlerForm;
