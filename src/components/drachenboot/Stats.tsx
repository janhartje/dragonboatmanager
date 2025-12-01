import React from 'react';
import { ArrowUpFromLine, Anchor } from 'lucide-react';

interface BalanceBarProps {
  left: number;
  right: number;
  diff: number;
}

export const BalanceBar: React.FC<BalanceBarProps> = ({ left, right, diff }) => {
  const total = left + right || 1;
  const lp = (left / total) * 100;
  const col = Math.abs(diff) > 20 ? 'bg-red-500' : Math.abs(diff) > 10 ? 'bg-yellow-400' : 'bg-green-500';
  return (
    <div className="w-full mb-3">
      <div className="flex justify-between text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 mb-1">
        <span>Links</span> <span>Diff: {Math.abs(diff)}</span> <span>Rechts</span>
      </div>
      <div className="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex relative">
        <div className={`h-full transition-all duration-500 ${col}`} style={{ width: `${lp}%` }}></div>
        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-slate-300 transform -translate-x-1/2"></div>
      </div>
    </div>
  );
};

interface TrimBarProps {
  front: number;
  back: number;
  diff: number;
}

export const TrimBar: React.FC<TrimBarProps> = ({ front, back, diff }) => (
  <div className="w-full p-3 bg-blue-50/50 dark:bg-blue-900/30 rounded-lg border border-blue-100 dark:border-blue-800">
    <div className="flex justify-between text-xs text-blue-800 dark:text-blue-300 font-bold mb-1">
      <span className="flex gap-1"><ArrowUpFromLine size={12} /> Bug: {front}</span>
      <span className="flex gap-1"><Anchor size={12} /> Heck: {back}</span>
    </div>
    <div className="text-[10px] uppercase font-bold text-center pt-1 text-blue-400 flex justify-between">
      <span>{diff > 0 ? `Buglastig` : diff < 0 ? `Hecklastig` : 'Perfekt'}</span>
      <span className={diff > 0 ? 'text-red-400' : 'text-green-500'}>{diff > 0 ? '+' : ''}{diff}</span>
    </div>
  </div>
);
