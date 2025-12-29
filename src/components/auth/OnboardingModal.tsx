import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { Paddler } from '@/types';
import { Save, Info } from 'lucide-react';
import { FormInput } from '@/components/ui/FormInput';
import { WeightInput } from '@/components/ui/WeightInput';
import { SkillSelector, SkillsState } from '@/components/ui/SkillSelector';

interface OnboardingModalProps {
  onClose: () => void;
  paddler: Paddler;
  onSave: (data: Partial<Paddler>) => Promise<void>;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({ onClose, paddler, onSave }) => {
  const { t } = useLanguage();
  const [name, setName] = useState('');
  const [weight, setWeight] = useState('');
  const [skills, setSkills] = useState<SkillsState>({ left: false, right: false, drum: false, steer: false });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setName(paddler.name || '');
    setWeight(paddler.weight ? paddler.weight.toString() : '');
    const sObj = { left: false, right: false, drum: false, steer: false };
    if (paddler.skills) paddler.skills.forEach((s) => {
      if (s in sObj) sObj[s as keyof typeof sObj] = true;
    });
    setSkills(sObj);
  }, [paddler]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSaving(true);
    
    try {
      const weightNum = parseFloat(weight);
      if (!name.trim()) throw new Error(t('nameRequired') || 'Name is required');
      if (isNaN(weightNum) || weightNum <= 0) throw new Error(t('weightRequired') || 'Valid weight is required');
      
      const skillsArray = (Object.keys(skills) as Array<keyof typeof skills>).filter(k => skills[k]);
      
      await onSave({
        name: name,
        weight: weightNum,
        skills: skillsArray
      });
      onClose();
    } catch (e: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
      console.error(e);
      setError(e.message || 'Error saving profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSkillChange = (skill: keyof SkillsState) => {
    setSkills(prev => ({ ...prev, [skill]: !prev[skill] }));
  };
  
  const isFormValid = name.trim() !== '' && weight.trim() !== '' && parseFloat(weight) > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800">
        
        {/* Header with Dragon Pattern */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('/dragon-pattern.svg')] bg-repeat" />
          <h2 className="text-2xl font-bold relative z-10 mb-2">{t('onboardingTitle')}</h2>
          <p className="text-blue-100 text-sm relative z-10">{t('onboardingBody')}</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg text-sm mb-4">
              {error}
            </div>
          )}

          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 mb-1 block">
                {t('name')}
              </label>
              <FormInput
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t('name')}
              />
            </div>
            <div className="w-full md:w-32">
              <label className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 mb-1 block">
                {t('weight')}
              </label>
               <WeightInput
                value={weight}
                onChange={setWeight}
              />
            </div>
          </div>
          
           {/* Detailed explanations */}
           <div className="flex gap-3 text-xs text-slate-600 dark:text-slate-400 bg-blue-50 dark:bg-blue-900/10 p-4 rounded-xl border border-blue-100 dark:border-blue-900/30 items-start">
              <Info className="shrink-0 text-blue-500 mt-0.5" size={16} />
              <div className="space-y-2">
                <p>{t('weightReason')}</p>
                <p>{t('skillsReason')}</p>
              </div>
           </div>

          <div>
            <label className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 mb-2 block">
              {t('skills')}
            </label>
            <SkillSelector 
              skills={skills} 
              onChange={handleSkillChange} 
            />
          </div>

          <button
            type="submit"
            disabled={isSaving || !isFormValid}
            className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-blue-500/20 transition-all transform active:scale-[0.98] flex items-center justify-center gap-2"
          >
            {isSaving ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                 <Save size={18} />
                 {t('completeProfile')}
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
