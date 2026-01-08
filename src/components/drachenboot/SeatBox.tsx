import React from 'react';
import { Drum, ShipWheel, X, Pin, Box } from 'lucide-react';
import { useDraggable, useDroppable } from '@dnd-kit/core';

import SkillBadges from '../ui/SkillBadges';
import { BoatConfigItem, Paddler } from '@/types';
import { useTranslations } from 'next-intl';

interface SeatBoxProps {
  seat: BoatConfigItem;
  paddler?: Paddler;
  isLocked?: boolean;
  isSelected?: boolean;
  onClick?: () => void;
  onUnassign?: (e: React.MouseEvent) => void;
  onLock?: (e: React.MouseEvent) => void;
  hideWeight?: boolean;
  isMaybe?: boolean;
  isReadOnly?: boolean;
}

const SeatBox: React.FC<SeatBoxProps> = ({
  seat,
  paddler,
  isLocked,
  isSelected,
  onClick,
  onUnassign,
  onLock,
  hideWeight,
  isMaybe,
  isReadOnly,
}) => {
  const t = useTranslations();
  const side = seat.id.includes('left') ? 'left' : seat.id.includes('right') ? 'right' : null;
  
  // Droppable: The Seat itself
  const { setNodeRef: setDroppableRef, isOver } = useDroppable({
    id: `seat-${seat.id}`,
    data: { type: 'seat', id: seat.id },
  });

  // Draggable: The Paddler inside (if exists)
  const { 
    attributes, 
    listeners, 
    setNodeRef: setDraggableRef, 
    isDragging 
  } = useDraggable({
    id: `seat-paddler-${seat.id}`,
    data: { 
      type: 'paddler', 
      id: paddler?.id, 
      source: 'seat', 
      seatId: seat.id,
      weight: paddler?.weight,
      name: paddler?.name,
      isGuest: paddler?.isGuest,
      isCanister: paddler?.isCanister
    },
    disabled: !paddler || isLocked || isReadOnly,
  });

  const dragStyle = {
    // transform: CSS.Translate.toString(transform), // Removing transform to use DragOverlay
    opacity: isDragging ? 0.3 : undefined,
    zIndex: isDragging ? 50 : undefined,
    touchAction: 'none'
  };

  let base = 'bg-white dark:bg-slate-800 border-amber-200/50 dark:border-slate-600 hover:border-blue-400 shadow-sm';
  let text = 'text-slate-800 dark:text-slate-200';

  if (paddler) {
    if (paddler.isCanister) {
      base = 'bg-amber-200 dark:bg-amber-800 border-amber-500 dark:border-amber-600 shadow-md';
      text = 'text-amber-900 dark:text-amber-100 font-bold';
    } else {
      let ok = false;
      if (paddler.skills) {
        if (seat.type === 'drummer' && paddler.skills.includes('drum')) ok = true;
        else if (seat.type === 'steer' && paddler.skills.includes('steer')) ok = true;
        else if (side && paddler.skills.includes(side)) ok = true;
      }
      if (ok) {
        base = 'bg-green-200 dark:bg-green-800 border-green-700 dark:border-green-600 shadow-md';
        text = 'text-green-900 dark:text-green-100 font-bold';
      } else {
        base = 'bg-red-200 dark:bg-red-900 border-red-600 dark:border-red-700 shadow-md';
        text = 'text-red-900 dark:text-red-100 font-bold';
      }
    }

    if (isMaybe) base += ' ring-4 ring-yellow-400 border-yellow-500';
    if (isLocked) base += ' ring-2 ring-slate-500 border-slate-600';
  }
  
  if (isOver && !isDragging) {
    base += ' ring-4 ring-green-400 border-green-500 scale-105 z-40';
  }
  
  const active = isSelected ? 'ring-4 ring-blue-500 dark:ring-blue-400 border-blue-600 dark:border-blue-300 z-30 scale-105 shadow-xl' : '';

  return (
    <div 
      ref={setDroppableRef} 
      onClick={onClick} 
      className={`w-28 h-16 rounded-lg border-2 flex flex-col items-center justify-center cursor-pointer transition-all relative z-10 group ${base} ${active}`}
    >
      {paddler ? (
        <div 
          ref={setDraggableRef} 
          {...listeners} 
          {...attributes} 
          style={dragStyle}
          className="w-full h-full flex flex-col items-center justify-center cursor-grab active:cursor-grabbing"
        >
          <div className={`w-full px-1 text-center ${hideWeight ? 'flex h-full items-center justify-center' : ''}`}>
            <span className={`leading-tight break-words ${hideWeight ? 'text-xs font-bold' : 'text-sm block truncate'} ${text}`}>
              {paddler.name}{paddler.isGuest && <span className="text-[10px] opacity-80 ml-1 font-normal">{t('guestSuffix')}</span>} {isMaybe && <span className="text-yellow-700 dark:text-yellow-300 font-extrabold text-xs ml-1">?</span>}
            </span>
          </div>
          {!hideWeight && (
            <div className={`text-[10px] opacity-90 ${text} flex flex-wrap items-center justify-center gap-0.5 mt-0.5 px-0.5 font-mono font-normal`}>
              {paddler.weight > 0 && <span>{paddler.weight} kg</span>}
              {!paddler.isCanister && <SkillBadges skills={paddler.skills} />}
              {paddler.isCanister && <Box size={10} />}
            </div>
          )}
          
          {/* Action buttons need stopPropagation to not trigger drag */}
          <button 
            onPointerDown={(e) => e.stopPropagation()}
            onClick={onUnassign} 
            className={`absolute -top-1 -right-1 bg-white dark:bg-slate-700 text-slate-400 hover:text-red-500 rounded-full p-0.5 shadow border dark:border-slate-600 z-20 transition-all ${isLocked || hideWeight || isReadOnly ? 'hidden' : 'scale-0 group-hover:scale-100'}`}
          >
            <X size={10} />
          </button>
          <button 
            onPointerDown={(e) => e.stopPropagation()}
            onClick={onLock} 
            className={`absolute top-0.5 left-0.5 p-0.5 rounded z-20 ${hideWeight || isReadOnly ? 'hidden' : ''} ${isLocked ? 'text-slate-700 dark:text-slate-300' : 'text-slate-300 hover:text-slate-500'}`}
          >
            <Pin size={12} fill={isLocked ? 'currentColor' : 'none'} />
          </button>
        </div>
      ) : (
        <>
          {seat.type === 'drummer' ? (
            <Drum size={18} className="text-slate-400 dark:text-slate-600 opacity-70" />
          ) : seat.type === 'steer' ? (
            <ShipWheel size={18} className="text-slate-400 dark:text-slate-600 opacity-70" />
          ) : (
            <span className="text-slate-400 dark:text-slate-600 text-[10px] font-bold uppercase tracking-wider opacity-70">Frei</span>
          )}
        </>
      )}
    </div>
  );
};

export default SeatBox;
