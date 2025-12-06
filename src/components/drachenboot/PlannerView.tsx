import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, User, Box } from 'lucide-react';
import { toPng } from 'html-to-image';
import { DndContext, DragEndEvent, DragStartEvent, DragOverlay, useSensor, useSensors, PointerSensor, TouchSensor } from '@dnd-kit/core';
import DragonLogo from '../ui/DragonLogo';

import { useDrachenboot } from '@/context/DrachenbootContext';
// import { runAutoFillAlgorithm } from '@/utils/algorithm'; // Moved to API
import { useLanguage } from '@/context/LanguageContext';
import { AddGuestModal, HelpModal, ConfirmModal } from '../ui/Modals';
import Header from '../ui/Header';
import { UserMenu } from '@/components/auth/UserMenu';
import Footer from '../ui/Footer';
import { useTour } from '@/context/TourContext';
import { useDebounce } from '@/hooks/useDebounce';

import LoadingSkeleton from '../ui/LoadingScreens';
import PageTransition from '../ui/PageTransition';

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
    currentTeam,
    isLoading,
    isDataLoading,
    userRole,
    refetchPaddlers,
    refetchEvents
  } = useDrachenboot();

  const isReadOnly = userRole === 'PADDLER';

  // --- REFRESH DATA ON MOUNT ---
  useEffect(() => {
    // Ensure we have the latest data when entering planner
    refetchPaddlers();
    refetchEvents();
  }, []);

  useEffect(() => {
    // Only start tour if data is loaded
    if (!isDataLoading && !isLoading) {
      setTimeout(() => {
        checkAndStartTour('planner');
      }, 500);
    }
  }, [isDataLoading, isLoading]);

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
  const eventDate = activeEvent?.date ? new Date(activeEvent.date).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '';
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

  // --- STATS (Server Side Calculation) ---
  const [stats, setStats] = useState({ l: 0, r: 0, t: 0, diffLR: 0, f: 0, b: 0, diffFB: 0, c: 0 });
  const [cgStats, setCgStats] = useState({ x: 50, y: 50, targetY: 50 });
  const [isCalculating, setIsCalculating] = useState(false);

  // Debounce inputs to avoid flooding API
  const debouncedAssignments = useDebounce(assignments, 300);
  const debouncedTargetTrim = useDebounce(targetTrim, 300);

  useEffect(() => {
    const fetchStats = async () => {
      setIsCalculating(true);
      try {
        const response = await fetch('/api/stats', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            eventId: activeEventId,
            assignments: debouncedAssignments,
            targetTrim: debouncedTargetTrim
          }),
        });
        
        if (response.ok) {
          const data = await response.json();
          setStats(data.stats);
          setCgStats(data.cgStats);
        }
      } catch (error) {
        console.error('Failed to fetch stats', error);
      } finally {
        setIsCalculating(false);
      }
    };

    fetchStats();
  }, [debouncedAssignments, rows, debouncedTargetTrim]);

  // --- ACTIONS ---
  const goHome = () => router.push('/app');

  const handleAddCanister = async () => {
    if (isReadOnly) return;
    const canisterId = await addCanister(activeEventId);
    if (canisterId) setSelectedPaddlerId(canisterId);
  };

  const handleRemoveCanister = async (canisterId: string) => {
    if (isReadOnly) return;
    await removeCanister(activeEventId, canisterId);
  };

  const handleAddGuest = async (guestData: Pick<Paddler, 'name' | 'weight' | 'skills'>) => {
    if (isReadOnly) return;
    const guestId = await addGuest(activeEventId, guestData);
    if (guestId) setSelectedPaddlerId(guestId);
    setShowGuestModal(false);
  };

  const handleRemoveGuest = async (guestId: string) => {
    if (isReadOnly) return;
    await removeGuest(activeEventId, guestId);
  };

  const handleUpdateBoatSize = (size: 'standard' | 'small') => {
    if (isReadOnly) return;
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
    if (isReadOnly) return;
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
          // Remove both from their original spots first to be clean
          delete nAss[sourceSeatId];
          delete nAss[sid]; 
          
          nAss[sourceSeatId] = targetPaddlerId;
          nAss[sid] = selectedPaddlerId;
        } else {
          // Target is empty -> Move
          delete nAss[sourceSeatId];
          nAss[sid] = selectedPaddlerId;
        }
      } else {
        // Standard assignment from pool
        // CRITICAL FIX: Ensure paddler is not already in another seat (Ghost Fix)
        Object.keys(nAss).forEach((k) => { 
            if (nAss[k] === selectedPaddlerId) delete nAss[k]; 
        });
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
    if (isReadOnly) return;
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
    if (isReadOnly) return;
    if (!assignments[sid]) return;
    setLockedSeats((prev) => prev.includes(sid) ? prev.filter((i) => i !== sid) : [...prev, sid]);
  };

  const clearBoat = () => {
    if (isReadOnly) return;
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
    if (isReadOnly) return;
    setIsSimulating(true);
    try {
      const response = await fetch('/api/autofill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: activeEventId,
          assignments,
          lockedSeats,
          targetTrim
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
        console.log('Starting export capture...');
        // Using html-to-image for better support of modern CSS (oklch etc.)
        toPng(boatRef.current, { 
            cacheBust: true, 
            pixelRatio: 2,
            backgroundColor: 'transparent' // Explicitly transparent or null
        })
          .then((dataUrl) => {
            console.log('Canvas captured, generating link...');
            try {
                const link = document.createElement('a');
                const safeTitle = (activeEventTitle || 'plan').replace(/[^a-z0-9\u00C0-\u00FF]+/gi, '-').toLowerCase().replace(/(^-|-$)/g, '');
                const datePrefix = activeEvent?.date ? new Date(activeEvent.date).toISOString().split('T')[0] : '';
                link.download = `drachenboot-${datePrefix ? datePrefix + '-' : ''}${safeTitle || 'export'}.png`;
                link.href = dataUrl;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                console.log('Download click triggered');
            } catch (innerErr) {
                console.error('Link generation failed', innerErr);
            }
            setIsExporting(false);
          })
          .catch((err) => { 
              console.error('Export failed', err); 
              setIsExporting(false); 
          });
      } else {
        console.error('boatRef is null');
        setIsExporting(false);
      }
    }, 150);
  };

  // --- DnD ---
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } })
  );

  const [activeDragData, setActiveDragData] = useState<any>(null);

  const handleDragStart = (event: DragStartEvent) => {
      setActiveDragData(event.active.data.current);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveDragData(null); // Clear overlay
    if (isReadOnly) return;
    const { active, over } = event;
    if (!over) return;

    const activeData = active.data.current;
    const overData = over.data.current;

    if (!activeData || !overData) return;

    if (overData.type === 'seat') {
         const targetSeatId = overData.id;
         if (lockedSeats.includes(targetSeatId)) return;

         const nAss = { ...assignments };
         const paddlerId = activeData.id;
         
         if (activeData.source === 'seat') {
             const sourceSeatId = activeData.seatId;
             const targetPaddlerId = nAss[targetSeatId];
             
             if (targetPaddlerId) {
                  // Swap
                  delete nAss[sourceSeatId];
                  delete nAss[targetSeatId];

                  nAss[sourceSeatId] = targetPaddlerId;
                  nAss[targetSeatId] = paddlerId;
             } else {
                  // Move
                  delete nAss[sourceSeatId];
                  nAss[targetSeatId] = paddlerId;
             }
         } else {
             // From Pool
             // CRITICAL FIX: Ensure paddler is not already in another seat
             Object.keys(nAss).forEach(k => { if (nAss[k] === paddlerId) delete nAss[k]; });
             nAss[targetSeatId] = paddlerId;
         }
         updateAssignments(assignmentKey, nAss);
    }
  };

  if (isLoading || isDataLoading) {
    return <LoadingSkeleton />;
  }

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
    <PageTransition>
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
              <span className="font-bold text-slate-800 dark:text-white text-sm">
                {activeEventTitle}
                {eventDate && <span className="font-normal text-slate-500 dark:text-slate-400 text-xs ml-2">({eventDate})</span>}
              </span>
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
          <div className="w-px h-8 bg-slate-100 dark:bg-slate-800"></div>
          <UserMenu />
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
              isLoading={isCalculating}
              isReadOnly={isReadOnly}
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
              isReadOnly={isReadOnly}
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
             isReadOnly={isReadOnly}
          />
        </div>
        <Footer />
      </div>
    </div>
    </PageTransition>
    <DragOverlay dropAnimation={null}>
      {activeDragData ? (
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-2xl border-2 border-blue-500 w-28 h-16 flex flex-col items-center justify-center opacity-90 cursor-grabbing scale-105 touch-none relative z-50">
           <div className="font-bold text-sm text-slate-800 dark:text-slate-200 truncate w-full text-center px-1">
             {activeDragData.name}
             {activeDragData.isGuest && <span className="text-[10px] opacity-80 ml-1 font-normal">{t('guestSuffix')}</span>}
           </div>
           <div className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
             {activeDragData.weight > 0 && <span>{activeDragData.weight} kg</span>}
             {activeDragData.isCanister && <Box size={10} />}
           </div>
        </div>
      ) : null}
    </DragOverlay>
    </DndContext>
  );
};

export default PlannerView;
