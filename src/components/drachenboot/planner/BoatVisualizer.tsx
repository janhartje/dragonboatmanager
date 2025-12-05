import React from 'react';
import { Target } from 'lucide-react';
import DragonLogo from '../../ui/DragonLogo';
import SeatBox from '../SeatBox';
import { BoatConfigItem, Paddler, Assignments, Event, CGStats } from '@/types';

interface BoatVisualizerProps {
  boatConfig: BoatConfigItem[];
  paddlers: Paddler[];
  assignments: Assignments;
  activeEvent: Event | null;
  activePaddlerPool: Paddler[];
  lockedSeats: string[];
  selectedPaddlerId: number | string | null;
  cgStats: CGStats;
  isExporting: boolean;
  handleSeatClick: (seatId: string) => void;
  handleUnassign: (seatId: string, e: React.MouseEvent) => void;
  toggleLock: (seatId: string, e: React.MouseEvent) => void;
  rows: number;
}

const BoatVisualizer = React.forwardRef<HTMLDivElement, BoatVisualizerProps>(({ 
  boatConfig, 
  paddlers, 
  assignments, 
  activeEvent, 
  activePaddlerPool,
  lockedSeats, 
  selectedPaddlerId, 
  cgStats, 
  isExporting, 
  handleSeatClick, 
  handleUnassign, 
  toggleLock,
  rows
}, ref) => {

  return (
    <div id="tour-planner-boat" className="lg:col-span-2 h-full flex flex-col">
      <div className="bg-blue-100/30 dark:bg-blue-900/20 p-4 md:p-8 rounded-3xl border border-blue-100 dark:border-blue-800 flex justify-center items-start overflow-y-auto relative flex-1 min-h-[600px]">
        <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 10px 10px, #3b82f6 1px, transparent 0)', backgroundSize: '30px 30px' }}></div>
        <div ref={ref} className="relative w-[360px] flex flex-col items-center">
          <div className="z-20 mb-[-15px] relative drop-shadow-xl filter" style={{ zIndex: 30 }}>
            <DragonLogo className="w-24 h-24 text-amber-600 dark:text-amber-500" />
          </div>
          <div className="relative bg-amber-50 dark:bg-amber-900 border-4 border-amber-800 dark:border-amber-950 shadow-xl w-full px-4 py-12 z-10" style={{ clipPath: 'polygon(50% 0%, 80% 2%, 95% 10%, 100% 45%, 100% 55%, 95% 90%, 80% 98%, 50% 100%, 20% 98%, 5% 90%, 0% 55%, 0% 45%, 5% 10%, 20% 2%)', borderRadius: '40px' }}>
            
            {/* CG Dot */}
            {!isExporting && (
              <div className="absolute pointer-events-none z-0 transition-all duration-500 ease-out" style={{ left: `${cgStats.x}%`, top: `${cgStats.y}%`, transform: 'translate(-50%, -50%)' }}>
                <div className="absolute w-px h-full bg-slate-300 left-1/2 top-0 -translate-x-1/2 opacity-30"></div>
                <div className="absolute w-full h-px bg-slate-300 top-1/2 left-0 -translate-y-1/2 opacity-30"></div>
                <div className="w-6 h-6 rounded-full bg-red-500/30 animate-ping absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"></div>
                <div className="w-3 h-3 rounded-full bg-red-600 border-2 border-white shadow-sm absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center">
                  <Target size={10} className="text-white" />
                </div>
                <div className="absolute top-4 left-1/2 -translate-x-1/2 whitespace-nowrap text-[8px] font-bold uppercase text-red-500 bg-white/80 px-1 rounded shadow-sm border border-red-100">Schwerpunkt</div>
              </div>
            )}

            <div className="space-y-3 pt-6 pb-6 relative z-10">
              {/* Drummer */}
              <div className="flex justify-center mb-8">
                {(() => {
                  const s = boatConfig[0];
                  const p = paddlers.find((x) => x.id === assignments[s.id]) || activeEvent?.guests?.find((g) => g.id === assignments[s.id]);
                  const isMaybe = activeEvent ? activeEvent.attendance[p?.id as string] === 'maybe' : false;
                  return <SeatBox seat={s} paddler={p} isMaybe={isMaybe} isLocked={lockedSeats.includes(s.id)} isSelected={selectedPaddlerId === assignments[s.id]} onClick={() => handleSeatClick(s.id)} onUnassign={(e) => handleUnassign(s.id, e)} onLock={(e) => toggleLock(s.id, e)} hideWeight={isExporting} />;
                })()}
              </div>
              {/* Rows */}
              {Array.from({ length: rows }).map((_, i) => {
                const r = i + 1;
                const ls = `row-${r}-left`, rs = `row-${r}-right`;
                const pl = activePaddlerPool.find((x) => x.id === assignments[ls]) || paddlers.find((x) => x.id === assignments[ls]);
                const pr = activePaddlerPool.find((x) => x.id === assignments[rs]) || paddlers.find((x) => x.id === assignments[rs]);
                const ml = activeEvent ? activeEvent.attendance[pl?.id as string] === 'maybe' : false;
                const mr = activeEvent ? activeEvent.attendance[pr?.id as string] === 'maybe' : false;
                return (
                  <div key={r} className="flex items-center justify-between gap-2 relative">
                    <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 text-amber-900/10 dark:text-amber-100/10 text-4xl font-black pointer-events-none z-0 select-none">{r}</div>
                    <SeatBox seat={{ id: ls, side: 'left', type: 'paddler', row: r }} paddler={pl} isMaybe={ml} isLocked={lockedSeats.includes(ls)} isSelected={selectedPaddlerId === assignments[ls]} onClick={() => handleSeatClick(ls)} onUnassign={(e) => handleUnassign(ls, e)} onLock={(e) => toggleLock(ls, e)} hideWeight={isExporting} />
                    <SeatBox seat={{ id: rs, side: 'right', type: 'paddler', row: r }} paddler={pr} isMaybe={mr} isLocked={lockedSeats.includes(rs)} isSelected={selectedPaddlerId === assignments[rs]} onClick={() => handleSeatClick(rs)} onUnassign={(e) => handleUnassign(rs, e)} onLock={(e) => toggleLock(rs, e)} hideWeight={isExporting} />
                  </div>
                );
              })}
              {/* Steer */}
              <div className="flex justify-center mt-10">
                {(() => {
                  const s = boatConfig[boatConfig.length - 1];
                  const p = activePaddlerPool.find((x) => x.id === assignments[s.id]) || paddlers.find((x) => x.id === assignments[s.id]);
                  const isMaybe = activeEvent ? activeEvent.attendance[p?.id as string] === 'maybe' : false;
                  return <SeatBox seat={s} paddler={p} isMaybe={isMaybe} isLocked={lockedSeats.includes(s.id)} isSelected={selectedPaddlerId === assignments[s.id]} onClick={() => handleSeatClick(s.id)} onUnassign={(e) => handleUnassign(s.id, e)} onLock={(e) => toggleLock(s.id, e)} hideWeight={isExporting} />;
                })()}
              </div>
            </div>
          </div>
          <div className="text-5xl z-20 mt-[-30px] drop-shadow-lg transform -scale-y-100 filter grayscale-[0.3] relative text-amber-600 dark:text-amber-500" style={{ zIndex: 30 }}>🐉</div>
        </div>
      </div>
    </div>
  );
});

BoatVisualizer.displayName = 'BoatVisualizer';

export default BoatVisualizer;
