import React from 'react';
import { Drum, ShipWheel } from 'lucide-react';

const SkillBadges = ({ skills }) => {
  return (
    <div className="flex gap-1 items-center justify-center">
      {skills?.includes('left') && <span className="w-5 h-4 flex items-center justify-center rounded border text-[9px] font-bold bg-red-50 text-red-600 border-red-100 dark:bg-red-900/50 dark:text-red-300 dark:border-red-800">L</span>}
      {skills?.includes('right') && <span className="w-5 h-4 flex items-center justify-center rounded border text-[9px] font-bold bg-green-50 text-green-600 border-green-100 dark:bg-green-900/50 dark:text-green-300 dark:border-green-800">R</span>}
      {skills?.includes('drum') && <span className="w-5 h-4 flex items-center justify-center rounded border text-[9px] font-bold bg-yellow-50 text-yellow-600 border-yellow-100 dark:bg-yellow-900/50 dark:text-yellow-300 dark:border-yellow-800"><Drum size={10} /></span>}
      {skills?.includes('steer') && <span className="w-5 h-4 flex items-center justify-center rounded border text-[9px] font-bold bg-purple-50 text-purple-600 border-purple-100 dark:bg-purple-900/50 dark:text-purple-300 dark:border-purple-800"><ShipWheel size={10} /></span>}
    </div>
  );
};

export default SkillBadges;
