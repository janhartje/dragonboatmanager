import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRightLeft, User, Box, UserPlus, RefreshCw, Wand2, Camera, AlertCircle, RotateCcw, Target, Home, Info, Sun, Moon } from 'lucide-react';
import html2canvas from 'html2canvas';

import { useDrachenboot } from '@/context/DrachenbootContext';
import { runAutoFillAlgorithm } from '@/utils/algorithm';
import { AddGuestModal, HelpModal } from '../ui/Modals';
import { BalanceBar, TrimBar } from './Stats';
import SeatBox from './SeatBox';
import DragonLogo from '../ui/DragonLogo';
import SkillBadges from '../ui/SkillBadges';

const PlannerView = ({ eventId }) => {
  const router = useRouter();
  const { 
    events, 
    paddlers, 
    assignmentsByEvent, 
    updateAssignments, 
    targetTrim, 
    setTargetTrim, 
    addGuest,
    removeGuest,
    isDarkMode,
    toggleDarkMode,
    setPaddlers // needed for canister
  } = useDrachenboot();

  // --- LOCAL UI STATE ---
  const [activeEventId, setActiveEventId] = useState(parseInt(eventId));
  const [isSimulating, setIsSimulating] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [showGuestModal, setShowGuestModal] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [selectedPaddlerId, setSelectedPaddlerId] = useState(null);
  const [lockedSeats, setLockedSeats] = useState([]);
  const [confirmClear, setConfirmClear] = useState(false);
  
  const boatRef = useRef(null);

  // --- COMPUTED ---
  const activeEvent = useMemo(() => events.find((e) => e.id === activeEventId), [activeEventId, events]);
  const activeEventTitle = activeEvent ? activeEvent.title : 'Unbekanntes Event';

  const assignments = useMemo(() => assignmentsByEvent[activeEventId] || {}, [assignmentsByEvent, activeEventId]);

  const activePaddlerPool = useMemo(() => {
    if (!activeEvent) return [];
    const regular = paddlers.filter((p) => !p.isCanister && ['yes', 'maybe'].includes(activeEvent.attendance[p.id]));
    const canisters = paddlers.filter((p) => p.isCanister);
    const guests = activeEvent.guests || [];
    return [...regular, ...canisters, ...guests].sort((a, b) => a.name.localeCompare(b.name));
  }, [paddlers, activeEvent]);

  // --- BOAT CONFIG ---
  const rows = 10;
  const boatConfig = useMemo(() => {
    const s = [{ id: 'drummer', type: 'drummer' }];
    for (let i = 1; i <= rows; i++) { s.push({ id: `row-${i}-left`, type: 'paddler', side: 'left', row: i }); s.push({ id: `row-${i}-right`, type: 'paddler', side: 'right', row: i }); }
    s.push({ id: 'steer', type: 'steer' });
    return s;
  }, []);

  // --- STATS ---
  const stats = useMemo(() => {
    let l = 0, r = 0, t = 0, f = 0, b = 0, c = 0;
    Object.entries(assignments).forEach(([sid, pid]) => {
      const p = activePaddlerPool.find((x) => x.id === pid) || paddlers.find((x) => x.id === pid);
      if (!p) return;
      t += p.weight; c++;
      if (sid.includes('row')) {
        if (sid.includes('left')) l += p.weight; else r += p.weight;
        const rw = parseInt(sid.match(/row-(\d+)/)[1]);
        if (rw <= 5) f += p.weight; else b += p.weight;
      }
    });
    return { l, r, t, diffLR: l - r, f, b, diffFB: f - b, c };
  }, [assignments, paddlers, activePaddlerPool]);

  const cgStats = useMemo(() => {
    let totalWeight = 0, weightedSumX = 0, weightedSumY = 0;
    Object.entries(assignments).forEach(([sid, pid]) => {
      const p = activePaddlerPool.find((x) => x.id === pid) || paddlers.find((x) => x.id === pid);
      if (!p) return;
      totalWeight += p.weight;
      let xPos = 50; if (sid.includes('left')) xPos = 25; else if (sid.includes('right')) xPos = 75;
      let yPos = 50; if (sid === 'drummer') yPos = 4; else if (sid === 'steer') yPos = 96; else if (sid.includes('row')) { const r = parseInt(sid.match(/row-(\d+)/)[1]); yPos = 12 + ((r - 1) / 9) * 70; }
      weightedSumX += p.weight * xPos; weightedSumY += p.weight * yPos;
    });
    const cgX = totalWeight > 0 ? weightedSumX / totalWeight : 50;
    const cgY = totalWeight > 0 ? weightedSumY / totalWeight : 50;
    return { x: cgX, y: cgY, targetY: 50 - targetTrim * 0.1 };
  }, [assignments, paddlers, targetTrim, activePaddlerPool]);

  // --- ACTIONS ---
  const goHome = () => router.push('/');

  const handleAddCanister = () => {
    const canisterId = 'canister-' + Date.now();
    const canister = { id: canisterId, name: 'Kanister', weight: 25, skills: ['left', 'right'], isCanister: true };
    setPaddlers((prev) => [...prev, canister]);
    setSelectedPaddlerId(canisterId);
  };

  const handleAddGuest = (guestData) => {
    const guestId = addGuest(activeEventId, guestData);
    setSelectedPaddlerId(guestId);
    setShowGuestModal(false);
  };

  const handleSeatClick = (sid) => {
    if (lockedSeats.includes(sid)) return;
    if (selectedPaddlerId) {
      const nAss = { ...assignments };
      Object.keys(nAss).forEach((k) => { if (nAss[k] === selectedPaddlerId) delete nAss[k]; });
      nAss[sid] = selectedPaddlerId;
      updateAssignments(activeEventId, nAss);
      setSelectedPaddlerId(null);
    } else if (assignments[sid]) {
      setSelectedPaddlerId(assignments[sid]);
    }
  };

  const handleUnassign = (sid, e) => {
    e.stopPropagation();
    if (lockedSeats.includes(sid)) return;
    const paddlerId = assignments[sid];
    const paddler = activePaddlerPool.find((p) => p.id === paddlerId);
    
    const nAss = { ...assignments };
    delete nAss[sid];
    updateAssignments(activeEventId, nAss);
    
    if (paddler && paddler.isCanister) {
        setPaddlers((prev) => prev.filter((p) => p.id !== paddlerId));
    }
  };

  const toggleLock = (sid, e) => {
    e.stopPropagation();
    if (!assignments[sid]) return;
    setLockedSeats((prev) => prev.includes(sid) ? prev.filter((i) => i !== sid) : [...prev, sid]);
  };

  const clearBoat = () => {
    if (confirmClear) {
      const nAss = { ...assignments };
      Object.keys(nAss).forEach((s) => { if (!lockedSeats.includes(s)) delete nAss[s]; });
      updateAssignments(activeEventId, nAss);
      setConfirmClear(false);
    } else {
      setConfirmClear(true);
      setTimeout(() => setConfirmClear(false), 3000);
    }
  };

  const runAutoFill = () => {
    setIsSimulating(true);
    setTimeout(() => {
      const bestAss = runAutoFillAlgorithm(activePaddlerPool, assignments, lockedSeats, targetTrim);
      if (bestAss) updateAssignments(activeEventId, bestAss);
      setIsSimulating(false);
    }, 50);
  };

  const handleExportImage = () => {
    if (!boatRef.current) return;
    setIsExporting(true);
    setTimeout(() => {
      html2canvas(boatRef.current, { backgroundColor: null, scale: 3, useCORS: true })
        .then((canvas) => {
          const link = document.createElement('a');
          link.download = `drachenboot-${activeEventTitle.replace(/\s+/g, '-')}.png`;
          link.href = canvas.toDataURL();
          link.click();
          setIsExporting(false);
        })
        .catch((err) => { console.error('Export failed', err); setIsExporting(false); });
    }, 150);
  };

  return (
    <div className="min-h-screen font-sans text-slate-800 dark:text-slate-100 transition-colors duration-300 bg-slate-100 dark:bg-slate-950 p-2 md:p-4 pb-20">
      {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}
      {showGuestModal && <AddGuestModal onClose={() => setShowGuestModal(false)} onAdd={handleAddGuest} />}

      <div className="max-w-6xl mx-auto">
        <header className="mb-4 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-3 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 sticky top-0 z-30">
            <div>
              <div className="flex items-center gap-3">
                <button onClick={goHome} className="p-2 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-blue-600 hover:border-blue-300 transition-colors"><Home size={20} /></button>
                <div className="h-8 w-px bg-slate-200 dark:bg-slate-700"></div>
                <div>
                  <div className="flex items-center gap-2"><div className="text-blue-500"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg></div><span className="font-bold text-slate-800 dark:text-white text-sm">{activeEventTitle}</span></div>
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Planungsmodus</p>
                </div>
              </div>
            </div>
            <div className="flex gap-2 items-center">
              <div className="text-center px-2"><div className="text-[10px] text-slate-400 uppercase font-bold">Gesamt</div><div className="font-bold text-sm">{stats.t} kg</div></div>
              <div className="w-px h-8 bg-slate-100 dark:bg-slate-800"></div>
              <div className="text-center px-2"><div className="text-[10px] text-slate-400 uppercase font-bold">Besetzt</div><div className="font-bold text-sm text-blue-600 dark:text-blue-400">{stats.c} / 22</div></div>
              <div className="w-px h-8 bg-slate-100 dark:bg-slate-800 mx-2"></div>
              <button onClick={() => setShowHelp(true)} className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-blue-50 dark:hover:bg-slate-700"><Info size={18} /></button>
              <button onClick={toggleDarkMode} className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-blue-50 dark:hover:bg-slate-700">{isDarkMode ? <Sun size={18} /> : <Moon size={18} />}</button>
            </div>
          </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-4">
            {/* Stats & Tools Panel */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800">
              <h2 className="font-bold text-sm text-slate-700 dark:text-slate-200 uppercase tracking-wide mb-3 flex items-center gap-2">
                <ArrowRightLeft size={16} /> Balance & Schwerpunkt
              </h2>
              <BalanceBar left={stats.l} right={stats.r} diff={stats.diffLR} />
              <TrimBar front={stats.f} back={stats.b} diff={stats.diffFB} />

              <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                <div className="flex justify-between text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">
                  <span>Hecklastig</span>
                  <span className="text-blue-600 dark:text-blue-400">Ziel: {targetTrim > 0 ? '+' : ''}{targetTrim} kg</span>
                  <span>Buglastig</span>
                </div>
                <input type="range" min="-100" max="100" step="5" value={targetTrim} onChange={(e) => setTargetTrim(parseInt(e.target.value))} className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600" />
                <div className="flex justify-between text-[10px] text-slate-400 mt-1"><span>-100kg</span><span>0</span><span>+100kg</span></div>
              </div>

              <div className="grid grid-cols-3 gap-2 mt-4">
                <button onClick={runAutoFill} disabled={isSimulating || activePaddlerPool.length === 0} className={`py-3 text-sm font-semibold rounded-lg border dark:border-slate-700 transition-all flex items-center justify-center gap-2 shadow-sm ${isSimulating ? 'bg-indigo-50 text-indigo-400 cursor-wait' : 'bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95'} ${activePaddlerPool.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}>
                  {isSimulating ? <RefreshCw size={16} className="animate-spin" /> : <Wand2 size={16} />}
                </button>
                <button onClick={handleExportImage} className="py-3 text-sm rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex items-center justify-center gap-2" title="Bild speichern">
                  <Camera size={16} />
                </button>
                <button onClick={clearBoat} className={`py-3 text-sm rounded-lg border dark:border-slate-700 transition-all flex items-center justify-center gap-2 active:scale-95 ${confirmClear ? 'bg-red-500 text-white border-red-600 font-bold' : 'text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 border-red-200'}`}>
                  {confirmClear ? <AlertCircle size={16} /> : <RotateCcw size={16} />}
                </button>
              </div>
            </div>

            {/* Paddler Pool */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 h-[600px] flex flex-col">
              <div className="flex justify-between items-center mb-3">
                <h2 className="font-bold text-sm text-slate-700 dark:text-slate-200 uppercase tracking-wide flex items-center gap-2"><User size={16} /> Verfügbar ({activePaddlerPool.length})</h2>
                <div className="flex gap-1">
                  <button onClick={handleAddCanister} className="p-1.5 bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-500 rounded hover:bg-amber-100 border border-amber-200 dark:border-amber-800" title="Kanister +25kg"><Box size={14} /></button>
                  <button onClick={() => setShowGuestModal(true)} className="p-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded hover:bg-blue-100 border border-blue-200 dark:border-blue-800 flex items-center gap-1 text-xs font-bold" title="Gast hinzufügen"><UserPlus size={14} /> Gast+</button>
                </div>
              </div>
              {activePaddlerPool.length === 0 && <div className="text-center p-8 text-slate-400 italic text-sm border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-xl">Keine Zusagen.</div>}
              <div className="flex-1 overflow-y-auto pr-1 space-y-2">
                {activePaddlerPool.map((p) => {
                  const isAssigned = Object.values(assignments).includes(p.id);
                  const isSelected = selectedPaddlerId === p.id;
                  const st = activeEvent ? activeEvent.attendance[p.id] : null;
                  const isMaybe = st === 'maybe';
                  return (
                    <div key={p.id} onClick={() => setSelectedPaddlerId(isSelected ? null : p.id)} className={`p-3 rounded-xl border cursor-pointer transition-all flex justify-between items-center group ${isSelected ? 'bg-blue-600 border-blue-700 text-white shadow-md transform scale-[1.02]' : 'bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-600'} ${isAssigned ? 'opacity-40 grayscale' : ''} ${isMaybe ? 'border-yellow-300 bg-yellow-50 dark:bg-yellow-900/20 dark:border-yellow-700' : ''}`}>
                      <div>
                        <div className={`text-base font-bold ${isSelected ? 'text-white' : 'text-slate-800 dark:text-slate-200'}`}>
                          {p.name}
                          {isMaybe && <span className="text-xs opacity-70">(?)</span>}
                          {p.isCanister && <span className="text-xs opacity-70 ml-1">(Box)</span>}
                          {p.isGuest && <span className="text-xs opacity-70 ml-1">(Gast)</span>}
                        </div>
                        <div className={`text-sm mt-0.5 flex items-center gap-2 ${isSelected ? 'text-blue-100' : 'text-slate-500 dark:text-slate-400'}`}><span>{p.weight} kg</span></div>
                      </div>
                      {p.isCanister ? <Box size={16} className={isSelected ? 'text-white' : 'text-amber-500'} /> : <SkillBadges skills={p.skills} />}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Boat Visualization */}
          <div className="lg:col-span-2 pb-10">
            <div className="bg-blue-100/30 dark:bg-blue-900/20 p-4 md:p-8 rounded-3xl border border-blue-100 dark:border-blue-800 min-h-[800px] flex justify-center items-start overflow-y-auto relative">
              <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 10px 10px, #3b82f6 1px, transparent 0)', backgroundSize: '30px 30px' }}></div>
              <div ref={boatRef} className="relative w-[360px] flex flex-col items-center">
                <div className="z-20 mb-[-15px] relative drop-shadow-xl filter" style={{ zIndex: 30 }}>
                  <DragonLogo className="w-24 h-24 text-amber-600 dark:text-amber-500" />
                </div>
                <div className="relative bg-amber-50 dark:bg-amber-900 border-4 border-amber-800 dark:border-amber-950 shadow-xl w-full px-4 py-12 z-10" style={{ clipPath: 'polygon(50% 0%, 80% 2%, 95% 10%, 100% 45%, 100% 55%, 95% 90%, 80% 98%, 50% 100%, 20% 98%, 5% 90%, 0% 55%, 0% 45%, 5% 10%, 20% 2%)', borderRadius: '40px' }}>
                  
                  {/* CG Dot */}
                  <div className="absolute pointer-events-none z-0 transition-all duration-500 ease-out" style={{ left: `${cgStats.x}%`, top: `${cgStats.y}%`, transform: 'translate(-50%, -50%)' }}>
                    <div className="absolute w-px h-full bg-slate-300 left-1/2 top-0 -translate-x-1/2 opacity-30"></div>
                    <div className="absolute w-full h-px bg-slate-300 top-1/2 left-0 -translate-y-1/2 opacity-30"></div>
                    {!isExporting && (
                      <>
                        <div className="w-6 h-6 rounded-full bg-red-500/30 animate-ping absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"></div>
                        <div className="w-3 h-3 rounded-full bg-red-600 border-2 border-white shadow-sm absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center">
                          <Target size={10} className="text-white" />
                        </div>
                        <div className="absolute top-4 left-1/2 -translate-x-1/2 whitespace-nowrap text-[8px] font-bold uppercase text-red-500 bg-white/80 px-1 rounded shadow-sm border border-red-100">Schwerpunkt</div>
                      </>
                    )}
                  </div>

                  <div className="space-y-3 pt-6 pb-6 relative z-10">
                    {/* Drummer */}
                    <div className="flex justify-center mb-8">
                      {(() => {
                        const s = boatConfig[0];
                        const p = paddlers.find((x) => x.id === assignments[s.id]) || activeEvent?.guests?.find((g) => g.id === assignments[s.id]);
                        const isMaybe = activeEvent && activeEvent.attendance[p?.id] === 'maybe';
                        return <SeatBox seat={s} paddler={p} isMaybe={isMaybe} isLocked={lockedSeats.includes(s.id)} isSelected={selectedPaddlerId} onClick={() => handleSeatClick(s.id)} onUnassign={(e) => handleUnassign(s.id, e)} onLock={(e) => toggleLock(s.id, e)} hideWeight={isExporting} />;
                      })()}
                    </div>
                    {/* Rows */}
                    {Array.from({ length: rows }).map((_, i) => {
                      const r = i + 1;
                      const ls = `row-${r}-left`, rs = `row-${r}-right`;
                      const pl = activePaddlerPool.find((x) => x.id === assignments[ls]) || paddlers.find((x) => x.id === assignments[ls]);
                      const pr = activePaddlerPool.find((x) => x.id === assignments[rs]) || paddlers.find((x) => x.id === assignments[rs]);
                      const ml = activeEvent && activeEvent.attendance[pl?.id] === 'maybe';
                      const mr = activeEvent && activeEvent.attendance[pr?.id] === 'maybe';
                      return (
                        <div key={r} className="flex items-center justify-between gap-2 relative">
                          <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 text-amber-900/10 dark:text-amber-100/10 text-4xl font-black pointer-events-none z-0 select-none">{r}</div>
                          <SeatBox seat={{ id: ls, side: 'left' }} paddler={pl} isMaybe={ml} isLocked={lockedSeats.includes(ls)} isSelected={selectedPaddlerId} onClick={() => handleSeatClick(ls)} onUnassign={(e) => handleUnassign(ls, e)} onLock={(e) => toggleLock(ls, e)} hideWeight={isExporting} />
                          <SeatBox seat={{ id: rs, side: 'right' }} paddler={pr} isMaybe={mr} isLocked={lockedSeats.includes(rs)} isSelected={selectedPaddlerId} onClick={() => handleSeatClick(rs)} onUnassign={(e) => handleUnassign(rs, e)} onLock={(e) => toggleLock(rs, e)} hideWeight={isExporting} />
                        </div>
                      );
                    })}
                    {/* Steer */}
                    <div className="flex justify-center mt-10">
                      {(() => {
                        const s = boatConfig[boatConfig.length - 1];
                        const p = activePaddlerPool.find((x) => x.id === assignments[s.id]) || paddlers.find((x) => x.id === assignments[s.id]);
                        const isMaybe = activeEvent && activeEvent.attendance[p?.id] === 'maybe';
                        return <SeatBox seat={s} paddler={p} isMaybe={isMaybe} isLocked={lockedSeats.includes(s.id)} isSelected={selectedPaddlerId} onClick={() => handleSeatClick(s.id)} onUnassign={(e) => handleUnassign(s.id, e)} onLock={(e) => toggleLock(s.id, e)} hideWeight={isExporting} />;
                      })()}
                    </div>
                  </div>
                </div>
                <div className="text-5xl z-20 mt-[-30px] drop-shadow-lg transform -scale-y-100 filter grayscale-[0.3] relative text-amber-600 dark:text-amber-500" style={{ zIndex: 30 }}>🐉</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlannerView;
