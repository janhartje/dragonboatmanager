import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import html2canvas from 'html2canvas';
import DragonLogo from '../ui/DragonLogo';

import { useDrachenboot } from '@/context/DrachenbootContext';
// import { runAutoFillAlgorithm } from '@/utils/algorithm'; // Moved to API
import { useLanguage } from '@/context/LanguageContext';
import { AddGuestModal, HelpModal, ConfirmModal } from '../ui/Modals';
import Header from '../ui/Header';
import Footer from '../ui/Footer';
import { useTour } from '@/context/TourContext';

// Sub-components
import StatsPanel from './planner/StatsPanel';
import PaddlerPool from './planner/PaddlerPool';
import BoatVisualizer from './planner/BoatVisualizer';
import { Assignments, BoatConfigItem, Paddler } from '@/types';

interface PlannerViewProps {
  eventId: string;
}

const PlannerView: React.FC<PlannerViewProps> = ({ eventId }) => {
  const router = useRouter();
  const { t } = useLanguage();
  const { checkAndStartTour } = useTour();

  useEffect(() => {
    // Small delay to ensure elements are rendered
    setTimeout(() => {
      checkAndStartTour('planner');
    }, 500);
  }, []);

  const { 
    events, 
    paddlers, 
    assignmentsByEvent, 
    updateAssignments, 
    targetTrim, 
    setTargetTrim, 
    addGuest,
    removeGuest,
    addCanister,
    removeCanister,
    updateEvent,
    isDarkMode,
    toggleDarkMode,
    setPaddlers, // needed for canister
    currentTeam
  } = useDrachenboot();

  // --- LOCAL UI STATE ---
  const [activeEventId, setActiveEventId] = useState<string>(eventId);

  useEffect(() => {
    setActiveEventId(eventId);
  }, [eventId]);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [showGuestModal, setShowGuestModal] = useState<boolean>(false);
  const [showHelp, setShowHelp] = useState<boolean>(false);
  const [selectedPaddlerId, setSelectedPaddlerId] = useState<number | string | null>(null);
  const [lockedSeats, setLockedSeats] = useState<string[]>([]);
  const [confirmClear, setConfirmClear] = useState<boolean>(false);
  const [showBoatSizeConfirm, setShowBoatSizeConfirm] = useState<boolean>(false);
  const [pendingBoatSize, setPendingBoatSize] = useState<'standard' | 'small' | null>(null);
  
  const boatRef = useRef<HTMLDivElement>(null);

  // --- COMPUTED ---
  const activeEvent = useMemo(() => events.find((e) => e.id === activeEventId) || null, [activeEventId, events]);
  const activeEventTitle = activeEvent ? activeEvent.title : t('unknownEvent');
  const boatSize = activeEvent?.boatSize || 'standard';

  // Assignments are always keyed by the event ID
  const assignmentKey = activeEventId;
  const assignments = useMemo(() => assignmentsByEvent[assignmentKey] || {}, [assignmentsByEvent, assignmentKey]);

  const activePaddlerPool = useMemo(() => {
    if (!activeEvent) return [];
    const regular = paddlers.filter((p) => !p.isCanister && ['yes', 'maybe'].includes(activeEvent.attendance[p.id]));
    
    // Generate canister objects based on count
    const canisters: Paddler[] = [];
    const count = activeEvent.canisterCount || 0;
    for (let i = 1; i <= count; i++) {
      canisters.push({
        id: `canister-${i}`,
        name: t('canister'),
        weight: 25,
        skills: ['left', 'right'],
        isCanister: true
      });
    }

    // Guests are now in regular paddlers list with isGuest=true and attendance=yes
    // But if we still have guests in activeEvent.guests (legacy or duplicate), we should filter them out if they are already in regular
    const guests = activeEvent.guests || [];
    const uniqueGuests = guests.filter(g => !regular.find(r => r.id === g.id));
    
    return [...regular, ...canisters, ...uniqueGuests].sort((a, b) => a.name.localeCompare(b.name));
  }, [paddlers, activeEvent, t]);

  // --- BOAT CONFIG ---
  const rows = boatSize === 'small' ? 5 : 10;
  const boatConfig = useMemo(() => {
    const s: BoatConfigItem[] = [{ id: 'drummer', type: 'drummer' }];
    for (let i = 1; i <= rows; i++) { s.push({ id: `row-${i}-left`, type: 'paddler', side: 'left', row: i }); s.push({ id: `row-${i}-right`, type: 'paddler', side: 'right', row: i }); }
    s.push({ id: 'steer', type: 'steer' });
    return s;
  }, [rows]);

  // --- STATS ---
  const stats = useMemo(() => {
    let l = 0, r = 0, t = 0, f = 0, b = 0, c = 0;
    const mid = (rows + 1) / 2;
    Object.entries(assignments).forEach(([sid, pid]) => {
      // Filter out assignments that are not in the current boat config
      if (sid.includes('row')) {
        const match = sid.match(/row-(\d+)/);
        if (match && parseInt(match[1]) > rows) return;
      }

      const p = activePaddlerPool.find((x) => x.id === pid) || paddlers.find((x) => x.id === pid);
      if (!p) return;
      t += p.weight; c++;
      if (sid === 'drummer') {
        f += p.weight;
      } else if (sid === 'steer') {
        b += p.weight;
      } else if (sid.includes('row')) {
        if (sid.includes('left')) l += p.weight; else r += p.weight;
        const match = sid.match(/row-(\d+)/);
        // Adjust front/back calculation based on rows
        if (match) {
          const rowNum = parseInt(match[1]);
          if (rowNum < mid) f += p.weight;
          else if (rowNum > mid) b += p.weight;
        }
      }
    });
    return { l, r, t, diffLR: l - r, f, b, diffFB: f - b, c };
  }, [assignments, paddlers, activePaddlerPool, rows]);

  const cgStats = useMemo(() => {
    let totalWeight = 0, weightedSumX = 0, weightedSumY = 0;
    Object.entries(assignments).forEach(([sid, pid]) => {
      // Filter out assignments that are not in the current boat config
      if (sid.includes('row')) {
        const match = sid.match(/row-(\d+)/);
        if (match && parseInt(match[1]) > rows) return;
      }

      const p = activePaddlerPool.find((x) => x.id === pid) || paddlers.find((x) => x.id === pid);
      if (!p) return;
      totalWeight += p.weight;
      let xPos = 50; if (sid.includes('left')) xPos = 25; else if (sid.includes('right')) xPos = 75;
      
      // Dynamic Y position calculation based on rows
      // Precise calculation based on CSS:
      // Container Padding: 48px (py-12) + 24px (pt-6) = 72px top offset
      // Drummer: 56px (h-14) + 32px (mb-8) = 88px
      // Row Start (Top of Row 1): 72 + 88 = 160px
      // Row Height: 56px (h-14) + 12px (space-y-3) = 68px stride
      // Row 1 Center: 160 + 28 = 188px
      // Bottom Offset: 40px (mt-10) + 56px (Steer) + 24px (pb-6) + 48px (py-12) = 168px
      // Total Height = 160 + (rows * 68 - 12) + 168 = 316 + rows * 68
      
      const totalHeight = 316 + rows * 68;
      const row1Center = 188;
      const rowLastCenter = 188 + (rows - 1) * 68;
      
      const yStart = (row1Center / totalHeight) * 100;
      const yEnd = (rowLastCenter / totalHeight) * 100;
      
      let yPos = 50; 
      if (sid === 'drummer') yPos = (100 / totalHeight) * 100; // Approx center of drummer
      else if (sid === 'steer') yPos = ((totalHeight - 100) / totalHeight) * 100; // Approx center of steer
      else if (sid.includes('row')) { 
        const match = sid.match(/row-(\d+)/); 
        if (match) { 
          const r = parseInt(match[1]); 
          // Linear interpolation between first and last row
          if (rows > 1) {
            const rowStep = (yEnd - yStart) / (rows - 1); 
            yPos = yStart + (r - 1) * rowStep;
          } else {
            yPos = yStart;
          }
        } 
      }
      weightedSumX += p.weight * xPos; weightedSumY += p.weight * yPos;
    });
    const cgX = totalWeight > 0 ? weightedSumX / totalWeight : 50;
    const cgY = totalWeight > 0 ? weightedSumY / totalWeight : 50;
    return { x: cgX, y: cgY, targetY: 50 - targetTrim * 0.1 };
  }, [assignments, paddlers, targetTrim, activePaddlerPool, rows]);

  // --- ACTIONS ---
  const goHome = () => router.push('/app');

  const handleAddCanister = async () => {
    const canisterId = await addCanister(activeEventId);
    if (canisterId) setSelectedPaddlerId(canisterId);
  };

  const handleRemoveCanister = async (canisterId: string) => {
    await removeCanister(activeEventId, canisterId);
  };

  const handleAddGuest = async (guestData: Pick<Paddler, 'name' | 'weight' | 'skills'>) => {
    const guestId = await addGuest(activeEventId, guestData);
    if (guestId) setSelectedPaddlerId(guestId);
    setShowGuestModal(false);
  };

  const handleRemoveGuest = async (guestId: string) => {
    await removeGuest(activeEventId, guestId);
  };

  const handleUpdateBoatSize = (size: 'standard' | 'small') => {
    if (size === boatSize) return;

    // Check if boat has assignments
    if (Object.keys(assignments).length > 0) {
      setPendingBoatSize(size);
      setShowBoatSizeConfirm(true);
    } else {
      updateEvent(activeEventId, { boatSize: size });
    }
  };

  const confirmBoatSizeChange = () => {
    if (pendingBoatSize) {
      updateEvent(activeEventId, { boatSize: pendingBoatSize });
      // Clear assignments as layout changes
      updateAssignments(activeEventId, {});
      setShowBoatSizeConfirm(false);
      setPendingBoatSize(null);
    }
  };

  const handleSeatClick = (sid: string) => {
    if (lockedSeats.includes(sid)) return;
    
    if (selectedPaddlerId) {
      // Check if selectedPaddlerId is actually a paddler currently in a seat (for swapping)
      const sourceSeatId = Object.keys(assignments).find(key => assignments[key] === selectedPaddlerId);
      
      const nAss = { ...assignments };
      
      if (sourceSeatId) {
        // SWAP LOGIC
        const targetPaddlerId = assignments[sid];
        
        if (targetPaddlerId) {
          // Target is occupied -> Swap
          nAss[sourceSeatId] = targetPaddlerId;
          nAss[sid] = selectedPaddlerId;
        } else {
          // Target is empty -> Move (standard behavior)
          delete nAss[sourceSeatId];
          nAss[sid] = selectedPaddlerId;
        }
      } else {
        // Standard assignment from pool
        // Remove paddler from any other seat if they were somehow assigned (though sourceSeatId check covers most)
        Object.keys(nAss).forEach((k) => { if (nAss[k] === selectedPaddlerId) delete nAss[k]; });
        nAss[sid] = selectedPaddlerId;
      }
      
      updateAssignments(assignmentKey, nAss);
      setSelectedPaddlerId(null);
    } else if (assignments[sid]) {
      setSelectedPaddlerId(assignments[sid]);
    }
  };

  const handleUnassign = (sid: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (lockedSeats.includes(sid)) return;
    const paddlerId = assignments[sid];
    const paddler = activePaddlerPool.find((p) => p.id === paddlerId);
    
    const nAss = { ...assignments };
    delete nAss[sid];
    updateAssignments(assignmentKey, nAss);
    
    if (paddler && paddler.isCanister) {
        setPaddlers((prev) => prev.filter((p) => p.id !== paddlerId));
    }
  };

  const toggleLock = (sid: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!assignments[sid]) return;
    setLockedSeats((prev) => prev.includes(sid) ? prev.filter((i) => i !== sid) : [...prev, sid]);
  };

  const clearBoat = () => {
    if (confirmClear) {
      const nAss = { ...assignments };
      Object.keys(nAss).forEach((s) => { if (!lockedSeats.includes(s)) delete nAss[s]; });
      updateAssignments(assignmentKey, nAss);
      setConfirmClear(false);
    } else {
      setConfirmClear(true);
      setTimeout(() => setConfirmClear(false), 3000);
    }
  };

  const runAutoFill = async () => {
    setIsSimulating(true);
    try {
      const response = await fetch('/api/autofill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          activePaddlerPool,
          assignments,
          lockedSeats,
          targetTrim,
          rows
        }),
      });

      if (!response.ok) throw new Error('Auto-fill failed');

      const data = await response.json();
      if (data.assignments) {
        updateAssignments(assignmentKey, data.assignments);
      }
    } catch (error) {
      console.error('Auto-fill error:', error);
      // Optional: Show error toast/alert
    } finally {
      setIsSimulating(false);
    }
  };

  const handleExportImage = () => {
    if (!boatRef.current) return;
    setIsExporting(true);
    setTimeout(() => {
      if (boatRef.current) {
        html2canvas(boatRef.current, { backgroundColor: null, scale: 3, useCORS: true })
          .then((canvas) => {
            const link = document.createElement('a');
            link.download = `drachenboot-${activeEventTitle.replace(/\s+/g, '-')}.png`;
            link.href = canvas.toDataURL();
            link.click();
            setIsExporting(false);
          })
          .catch((err) => { console.error('Export failed', err); setIsExporting(false); });
      }
    }, 150);
  };

  return (
    <div className="min-h-screen font-sans text-slate-800 dark:text-slate-100 transition-colors duration-300 bg-slate-100 dark:bg-slate-950 p-2 md:p-4 pb-20">
      {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}
      {showGuestModal && <AddGuestModal onClose={() => setShowGuestModal(false)} onAdd={handleAddGuest} />}
      <ConfirmModal 
        isOpen={showBoatSizeConfirm}
        title={t('changeBoatSize')}
        message={t('changeBoatSizeConfirm')}
        onConfirm={confirmBoatSizeChange}
        onCancel={() => { setShowBoatSizeConfirm(false); setPendingBoatSize(null); }}
        confirmLabel={t('changeAndClear')}
      />

      <div className="max-w-6xl mx-auto">
        <Header
          title={
            <div className="flex items-center gap-2">
              <div className="text-blue-500">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
              </div>
              <span className="font-bold text-slate-800 dark:text-white text-sm">{activeEventTitle}</span>
            </div>
          }
          subtitle={t('plannerMode')}
          logo={
            <Link href="/" className="cursor-pointer hover:opacity-80 transition-opacity">
              {currentTeam?.icon ? (
                <div className="w-10 h-10 rounded-full overflow-hidden border border-slate-200 dark:border-slate-700">
                  <img 
                    src={currentTeam.icon} 
                    alt={currentTeam.name} 
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <DragonLogo className="w-10 h-10" />
              )}
            </Link>
          }
          leftAction={
            <button onClick={goHome} className="p-2 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-blue-600 hover:border-blue-300 transition-colors">
              <ArrowLeft size={20} />
            </button>
          }
          showHelp={true}
          onHelp={() => setShowHelp(true)}
          showThemeToggle={true}
          isDarkMode={isDarkMode}
          toggleDarkMode={toggleDarkMode}
        >
          <div className="text-center px-2"><div className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold">{t('total')}</div><div className="font-bold text-sm">{stats.t} kg</div></div>
          <div className="w-px h-8 bg-slate-100 dark:bg-slate-800"></div>
          <div className="text-center px-2"><div className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold">{t('assigned')}</div><div className="font-bold text-sm text-blue-600 dark:text-blue-400">{stats.c} / 22</div></div>
        </Header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 flex flex-col gap-4 lg:h-0 lg:min-h-full">
            {/* Stats & Tools Panel */}
            <StatsPanel 
              stats={stats} 
              targetTrim={targetTrim} 
              setTargetTrim={setTargetTrim} 
              runAutoFill={runAutoFill} 
              isSimulating={isSimulating} 
              activePaddlerPool={activePaddlerPool} 
              handleExportImage={handleExportImage} 
              clearBoat={clearBoat} 
              confirmClear={confirmClear} 
              t={t} 
              boatSize={boatSize}
              setBoatSize={handleUpdateBoatSize}
            />

            {/* Paddler Pool */}
            <PaddlerPool 
              activePaddlerPool={activePaddlerPool} 
              assignments={assignments} 
              selectedPaddlerId={selectedPaddlerId} 
              setSelectedPaddlerId={setSelectedPaddlerId} 
              activeEvent={activeEvent} 
              handleAddCanister={handleAddCanister} 
              onRemoveCanister={handleRemoveCanister}
              onRemoveGuest={handleRemoveGuest}
              setShowGuestModal={setShowGuestModal} 
              t={t} 
            />
          </div>

          {/* Boat Visualization */}
          <BoatVisualizer 
            ref={boatRef}
            boatConfig={boatConfig} 
            paddlers={paddlers} 
            assignments={assignments} 
            activeEvent={activeEvent} 
            activePaddlerPool={activePaddlerPool}
            lockedSeats={lockedSeats} 
            selectedPaddlerId={selectedPaddlerId} 
            cgStats={cgStats} 
            isExporting={isExporting} 
            handleSeatClick={handleSeatClick} 
            handleUnassign={handleUnassign} 
            toggleLock={toggleLock} 
            rows={rows}
          />
        </div>
        <Footer />
      </div>
    </div>
  );
};

export default PlannerView;
