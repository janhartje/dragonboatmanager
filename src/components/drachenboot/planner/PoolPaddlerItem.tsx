import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { Box, X, User } from 'lucide-react';
import SkillBadges from '../../ui/SkillBadges';
import { Paddler } from '@/types';

interface PoolPaddlerItemProps {
  paddler: Paddler;
  isAssigned: boolean;
  isSelected: boolean;
  isMaybe: boolean;
  isConfirming: boolean;
  onClick: () => void;
  triggerDelete: (id: string, type: 'canister' | 'guest') => void;
  t: (key: string) => string;
  isReadOnly?: boolean;
}

const PoolPaddlerItem: React.FC<PoolPaddlerItemProps> = ({
  paddler,
  isAssigned,
  isSelected,
  isMaybe,
  isConfirming,
  onClick,
  triggerDelete,
  t,
  isReadOnly
}) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `pool-paddler-${paddler.id}`,
    data: {
      type: 'paddler',
      id: paddler.id,
      source: 'pool',
      weight: paddler.weight,
      name: paddler.name,
      isGuest: paddler.isGuest,
      isCanister: paddler.isCanister
    },
    disabled: isAssigned || isReadOnly // Cannot drag if already assigned from pool (though typically removed from list if assigned? No, checks isAssigned class)
  });

  const style = {
    // transform: CSS.Translate.toString(transform), // Removing transform to use DragOverlay interaction
    opacity: isDragging ? 0.3 : undefined, // Ghost effect
    touchAction: 'none',
  };

  // Match SeatBox styles
  let base = 'bg-white dark:bg-slate-800 border-amber-200/50 dark:border-slate-600 hover:border-blue-400 shadow-sm';
  let text = 'text-slate-800 dark:text-slate-200';

  if (paddler.isCanister) {
    base = 'bg-amber-200 dark:bg-amber-800 border-amber-500 dark:border-amber-600 shadow-md';
    text = 'text-amber-900 dark:text-amber-100 font-bold';
  } else {
    // For pool items, we don't know "seat preference" match until dragged, so keep neutral or maybe indicate side pref?
    // Let's keep it simple neutral but with skill badges.
    // Actually, SeatBox logic for 'skilled' (green/red) depends on seat type. Here we just show the paddler.
    // So distinct style is fine.
  }

  if (isMaybe) base += ' ring-2 ring-yellow-400 border-yellow-500';
  const active = isSelected ? 'ring-2 ring-blue-500 dark:ring-blue-400 border-blue-600 dark:border-blue-300 z-30 scale-105 shadow-xl' : '';
  const assignedStyle = isAssigned ? 'opacity-40 grayscale' : '';

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      {...attributes}
      onClick={isReadOnly ? undefined : onClick}
      className={`w-28 h-16 rounded-lg border-2 flex flex-col items-center justify-center cursor-grab active:cursor-grabbing transition-all relative group touch-none
        ${base} ${active} ${assignedStyle}
        ${isDragging ? 'opacity-0' : ''} 
      `} 
      // Note: opacity-0 on isDragging if using overlay, but here we used 0.3 logic in style. Overriding style with className? style takes precedence.
      // Keeping style logic.
    >
      <div className="w-full px-1 text-center">
        <span className={`text-sm block truncate w-full leading-tight font-bold ${text}`}>
          {paddler.name}{paddler.isGuest && <span className="text-[10px] opacity-80 ml-1 font-normal">{t('guestSuffix')}</span>} {isMaybe && <span className="text-yellow-700 dark:text-yellow-300 font-extrabold text-xs">?</span>}
        </span>
      </div>
      
      <div className={`text-[10px] opacity-90 ${text} flex flex-wrap items-center justify-center gap-0.5 mt-0.5 px-0.5 font-mono font-normal`}>
        {paddler.weight > 0 && <span>{paddler.weight} kg</span>}
        {!paddler.isCanister && <SkillBadges skills={paddler.skills} />}
        {paddler.isCanister && <Box size={10} />}
      </div>

       {/* Delete Action - Top Right corner, visible on group hover or if confirming */}
       {/* Only for canister/guest */}
       {/* Only for canister/guest */}
       {(paddler.isCanister || paddler.isGuest) && !isAssigned && !isReadOnly && (
         <button
            onPointerDown={(e) => e.stopPropagation()} 
            onClick={(e) => { e.stopPropagation(); triggerDelete(String(paddler.id), paddler.isCanister ? 'canister' : 'guest'); }}
            className={`absolute -top-1 -right-1 bg-white dark:bg-slate-700 text-slate-400 hover:text-red-500 rounded-full p-0.5 shadow border dark:border-slate-600 z-20 transition-all ${isConfirming ? 'bg-red-600 text-white hover:bg-red-700 scale-110' : 'scale-0 group-hover:scale-100'}`}
         >
           <X size={10} />
         </button>
       )}
    </div>
  );
};

export default PoolPaddlerItem;
