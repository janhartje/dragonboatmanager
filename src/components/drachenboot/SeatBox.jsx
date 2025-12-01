import React from 'react';
import { Drum, ShipWheel, X, Pin, Box } from 'lucide-react';
import SkillBadges from '../ui/SkillBadges';

const SeatBox = ({
  seat,
  paddler,
  isLocked,
  isSelected,
  onClick,
  onUnassign,
  onLock,
  hideWeight,
  isMaybe,
}) => {
  const side = seat.id.includes('left') ? 'left' : seat.id.includes('right') ? 'right' : null;
  let base = 'bg-white dark:bg-slate-800 border-amber-200/50 dark:border-slate-600 hover:border-blue-400 shadow-sm';
  let text = 'text-slate-800 dark:text-slate-200';

  if (paddler) {
    if (paddler.isCanister) {
      base = 'bg-amber-200 dark:bg-amber-800 border-amber-500 dark:border-amber-600 shadow-md';
      text = 'text-amber-900 dark:text-amber-100 font-bold';
    } else if (paddler.isGuest) {
      base = 'bg-blue-100 dark:bg-blue-900 border-blue-300 dark:border-blue-700 shadow-md';
      text = 'text-blue-900 dark:text-blue-100 font-bold';
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
  const active = isSelected && !paddler ? 'ring-4 ring-blue-300 border-blue-600 z-20' : '';

  return (
    <div onClick={onClick} className={`w-24 h-14 rounded-lg border-2 flex flex-col items-center justify-center cursor-pointer transition-all relative z-10 group ${base} ${active}`}>
      {paddler ? (
        <>
          <div className={`w-full px-1 text-center ${hideWeight ? 'flex h-full items-center justify-center' : ''}`}>
            <span className={`leading-tight break-words ${hideWeight ? 'text-xs font-bold' : 'text-sm block truncate'} ${text}`}>
              {paddler.name} {isMaybe && <span className="text-yellow-700 dark:text-yellow-300 font-extrabold text-xs ml-1">?</span>}
            </span>
          </div>
          {!hideWeight && (
            <div className={`text-[10px] opacity-90 ${text} flex items-center justify-center gap-1 mt-0.5 font-mono font-normal`}>
              <span>{paddler.weight}</span>
              {!paddler.isCanister && <SkillBadges skills={paddler.skills} />}
              {paddler.isCanister && <Box size={10} />}
            </div>
          )}
          <button onClick={onUnassign} className={`absolute -top-2 -right-2 bg-white dark:bg-slate-700 text-slate-400 hover:text-red-500 rounded-full p-1 shadow border dark:border-slate-600 z-20 transition-all ${isLocked || hideWeight ? 'hidden' : 'scale-0 group-hover:scale-100'}`}><X size={10} /></button>
          <button onClick={onLock} className={`absolute top-1 left-1 p-0.5 rounded z-20 ${hideWeight ? 'hidden' : ''} ${isLocked ? 'text-slate-700 dark:text-slate-300' : 'text-slate-300 hover:text-slate-500'}`}><Pin size={12} fill={isLocked ? 'currentColor' : 'none'} /></button>
        </>
      ) : seat.type === 'drummer' ? (
        <Drum size={18} className="text-slate-400 dark:text-slate-600 opacity-70" />
      ) : seat.type === 'steer' ? (
        <ShipWheel size={18} className="text-slate-400 dark:text-slate-600 opacity-70" />
      ) : (
        <span className="text-slate-400 dark:text-slate-600 text-[10px] font-bold uppercase tracking-wider opacity-70">Frei</span>
      )}
    </div>
  );
};

export default SeatBox;
