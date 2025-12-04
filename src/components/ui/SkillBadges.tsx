import React from 'react';
import { Drum, ShipWheel } from 'lucide-react';

interface SkillBadgesProps {
  skills?: string[];
}

const SkillBadges: React.FC<SkillBadgesProps> = ({ skills }) => {
  return (
    <div className="flex gap-1 items-center justify-center">
      {skills?.includes('left') && <span className="w-5 h-4 flex items-center justify-center rounded border text-[9px] font-bold bg-red-100 text-red-700 border-red-200 dark:bg-red-900/50 dark:text-red-300 dark:border-red-800">L</span>}
      {skills?.includes('right') && <span className="w-5 h-4 flex items-center justify-center rounded border text-[9px] font-bold bg-green-100 text-green-700 border-green-200 dark:bg-green-900/50 dark:text-green-300 dark:border-green-800">R</span>}
      {skills?.includes('drum') && <span className="w-5 h-4 flex items-center justify-center rounded border text-[9px] font-bold bg-amber-100 text-amber-700 border-amber-200 dark:bg-yellow-900/50 dark:text-yellow-300 dark:border-yellow-800"><Drum size={10} /></span>}
      {skills?.includes('steer') && <span className="w-5 h-4 flex items-center justify-center rounded border text-[9px] font-bold bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/50 dark:text-purple-300 dark:border-purple-800"><ShipWheel size={10} /></span>}
    </div>
  );
};

export default SkillBadges;
