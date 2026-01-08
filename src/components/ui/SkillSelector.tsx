import React from 'react';
import { Drum, ShipWheel, Check } from 'lucide-react';
import { useTranslations } from 'next-intl';

export interface SkillsState {
  left: boolean;
  right: boolean;
  drum: boolean;
  steer: boolean;
  stroke?: boolean;
  steer_preferred?: boolean;
}

interface SkillSelectorProps {
  skills: SkillsState;
  onChange: (skill: keyof SkillsState) => void;
  className?: string;
}

export const SkillSelector: React.FC<SkillSelectorProps> = ({ skills, onChange, className = "" }) => {
  const t = useTranslations();

  const toggleSkill = (skill: keyof SkillsState) => {
    onChange(skill);
  };

  return (
    <div className={`flex gap-2 flex-wrap ${className}`}>
      <button
        type="button"
        onClick={() => toggleSkill('left')}
        className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition-all flex items-center gap-1.5 ${
          skills.left
            ? 'bg-red-500 border-red-600 text-white shadow-sm'
            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600'
        }`}
      >
        {skills.left && <Check size={14} strokeWidth={3} />}
        {t('left')}
      </button>
      
      <button
        type="button"
        onClick={() => toggleSkill('right')}
        className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition-all flex items-center gap-1.5 ${
          skills.right
            ? 'bg-green-500 border-green-600 text-white shadow-sm'
            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600'
        }`}
      >
        {skills.right && <Check size={14} strokeWidth={3} />}
        {t('right')}
      </button>
      
      <button
        type="button"
        onClick={() => toggleSkill('drum')}
        className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition-all flex items-center gap-1.5 ${
          skills.drum
            ? 'bg-amber-400 border-amber-500 text-amber-900 shadow-sm'
            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600'
        }`}
      >
        <Drum size={14} /> 
        {t('drum')}
      </button>
      
      <button
        type="button"
        onClick={() => toggleSkill('steer')}
        className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition-all flex items-center gap-1.5 ${
          skills.steer
            ? 'bg-purple-500 border-purple-600 text-white shadow-sm'
            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600'
        }`}
      >
        <ShipWheel size={14} /> 
        {t('steer')}
      </button>
    </div>
  );
};
