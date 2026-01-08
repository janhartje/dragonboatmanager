'use client';

import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { useRouter, Link } from '@/i18n/routing';
import { ArrowLeft, Box } from 'lucide-react';
import { toPng } from 'html-to-image';
import { DndContext, DragEndEvent, DragStartEvent, DragOverlay, useSensor, useSensors, PointerSensor, TouchSensor } from '@dnd-kit/core';
import DragonLogo from '../ui/DragonLogo';

import { useDrachenboot } from '@/context/DrachenbootContext';
import { useTeam } from '@/context/TeamContext';
import { useTheme } from '@/context/ThemeContext';

import { useTranslations, useLocale } from 'next-intl';
import { AddGuestModal, HelpModal, ConfirmModal } from '../ui/Modals';
import Header from '../ui/Header';
import { UserMenu } from '@/components/auth/UserMenu';
import Footer from '../ui/Footer';
import { useTour } from '@/context/TourContext';
import { useDebounce } from '@/hooks/useDebounce';

import LoadingSkeleton from '../ui/LoadingScreens';
import PageTransition from '../ui/PageTransition';
import { THEME_MAP, ThemeKey } from '@/constants/themes';


import StatsPanel from './planner/StatsPanel';
import PaddlerPool from './planner/PaddlerPool';
import BoatVisualizer from './planner/BoatVisualizer';
import { BoatConfigItem, Paddler } from '@/types';

interface PlannerViewProps {
  eventId: string;
}

const PlannerView: React.FC<PlannerViewProps> = ({ eventId }) => {
  const router = useRouter();
  const t = useTranslations();
  const locale = useLocale();
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
    setPaddlers, // needed for canister
    isLoading,
    isDataLoading,
    userRole,
    refetchPaddlers,
    refetchEvents
  } = useDrachenboot();

  const { currentTeam } = useTeam();
  const { isDarkMode, toggleDarkMode } = useTheme();

  const isReadOnly = userRole === 'PADDLER';


  useEffect(() => {
    // Ensure we have the latest data when entering planner
    refetchPaddlers();
    refetchEvents();
  }, [refetchPaddlers, refetchEvents]);

  useEffect(() => {
    // Only start tour if data is loaded
    let timer: NodeJS.Timeout;
    if (!isDataLoading && !isLoading) {
      timer = setTimeout(() => {
        checkAndStartTour('planner');
      }, 500);
    }
    return () => clearTimeout(timer);
  }, [isDataLoading, isLoading, checkAndStartTour]);


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


  const activeEvent = useMemo(() => events.find((e) => e.id === activeEventId) || null, [activeEventId, events]);
  const activeEventTitle = activeEvent ? activeEvent.title : t('unknownEvent');
  const eventDate = activeEvent?.date ? new Date(activeEvent.date).toLocaleDateString(locale === 'de' ? 'de-DE' : 'en-US', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '';
  const eventTime = activeEvent?.date ? new Date(activeEvent.date).toLocaleTimeString(locale === 'de' ? 'de-DE' : 'en-US', { hour: '2-digit', minute: '2-digit' }) : '';
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

  // Refs for stable callbacks
  const assignmentsRef = useRef(assignments);
  const lockedSeatsRef = useRef(lockedSeats);
  const selectedPaddlerIdRef = useRef(selectedPaddlerId);
  const activePaddlerPoolRef = useRef(activePaddlerPool);

  useEffect(() => {
    assignmentsRef.current = assignments;
    lockedSeatsRef.current = lockedSeats;
    selectedPaddlerIdRef.current = selectedPaddlerId;
    activePaddlerPoolRef.current = activePaddlerPool;
  }, [assignments, lockedSeats, selectedPaddlerId, activePaddlerPool]);


  const rows = boatSize === 'small' ? 5 : 10;
  const boatConfig = useMemo(() => {
    const s: BoatConfigItem[] = [{ id: 'drummer', type: 'drummer' }];
    for (let i = 1; i <= rows; i++) { s.push({ id: `row-${i}-left`, type: 'paddler', side: 'left', row: i }); s.push({ id: `row-${i}-right`, type: 'paddler', side: 'right', row: i }); }
    s.push({ id: 'steer', type: 'steer' });
    return s;
  }, [rows]);


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
  }, [debouncedAssignments, rows, debouncedTargetTrim, activeEventId]);


  const goHome = () => router.push('/app');

  const handleAddCanister = useCallback(async () => {
    if (isReadOnly) return;
    try {
      const canisterId = await addCanister(activeEventId);
      if (canisterId) setSelectedPaddlerId(canisterId);
    } catch (error) {
      console.error('Failed to add canister', error);
    }
  }, [isReadOnly, addCanister, activeEventId]);

  const handleRemoveCanister = useCallback(async (canisterId: string) => {
    if (isReadOnly) return;
    try {
      await removeCanister(activeEventId, canisterId);
    } catch (error) {
      console.error('Failed to remove canister', error);
      alert(t('errorRemovingCanister') || 'Fehler beim Entfernen des Kanisters');
    }
  }, [isReadOnly, removeCanister, activeEventId, t]);

  const handleAddGuest = useCallback(async (guestData: Pick<Paddler, 'name' | 'weight' | 'skills'>) => {
    if (isReadOnly) return;
    try {
      const guestId = await addGuest(activeEventId, guestData);
      if (guestId) setSelectedPaddlerId(guestId);
      setShowGuestModal(false);
    } catch (error) {
      console.error('Failed to add guest', error);
    }
  }, [isReadOnly, addGuest, activeEventId]);

  const handleRemoveGuest = useCallback(async (guestId: string) => {
    if (isReadOnly) return;
    try {
      await removeGuest(activeEventId, guestId);
    } catch (error) {
      console.error('Failed to remove guest', error);
    }
  }, [isReadOnly, removeGuest, activeEventId]);

  const handleUpdateBoatSize = useCallback(async (size: 'standard' | 'small') => {
    if (isReadOnly) return;
    if (size === boatSize) return;

    try {
      // Check if boat has assignments
      if (Object.keys(assignments).length > 0) {
        setPendingBoatSize(size);
        setShowBoatSizeConfirm(true);
      } else {
        await updateEvent(activeEventId, { boatSize: size });
      }
    } catch (error) {
      console.error('Failed to update boat size', error);
      alert(t('errorUpdateBoatSize') || 'Fehler beim Aktualisieren der Bootsgröße');
    }
  }, [isReadOnly, boatSize, assignments, updateEvent, activeEventId, t]);

  const confirmBoatSizeChange = () => {
    if (pendingBoatSize) {
      updateEvent(activeEventId, { boatSize: pendingBoatSize });
      // Clear assignments as layout changes
      updateAssignments(activeEventId, {});
      setShowBoatSizeConfirm(false);
      setPendingBoatSize(null);
    }
  };

  const handleSeatClick = useCallback((sid: string) => {
    if (isReadOnly) return;
    const currentLockedSeats = lockedSeatsRef.current;
    if (currentLockedSeats.includes(sid)) return;

    const currentSelectedPaddlerId = selectedPaddlerIdRef.current;
    const currentAssignments = assignmentsRef.current;

    if (currentSelectedPaddlerId) {
      // Check if selectedPaddlerId is actually a paddler currently in a seat (for swapping)
      const sourceSeatId = Object.keys(currentAssignments).find(key => currentAssignments[key] === currentSelectedPaddlerId);

      const nAss = { ...currentAssignments };

      if (sourceSeatId) {
        // SWAP LOGIC
        const targetPaddlerId = currentAssignments[sid];

        if (targetPaddlerId) {
          // Target is occupied -> Swap
          // Remove both from their original spots first to be clean
          delete nAss[sourceSeatId];
          delete nAss[sid];

          nAss[sourceSeatId] = targetPaddlerId;
          nAss[sid] = currentSelectedPaddlerId;
        } else {
          // Target is empty -> Move
          delete nAss[sourceSeatId];
          nAss[sid] = currentSelectedPaddlerId;
        }
      } else {
        // Standard assignment from pool
        // Ensure paddler is not already in another seat
        Object.keys(nAss).forEach((k) => {
          if (nAss[k] === currentSelectedPaddlerId) delete nAss[k];
        });
        nAss[sid] = currentSelectedPaddlerId;
      }

      updateAssignments(assignmentKey, nAss);
      setSelectedPaddlerId(null);
    } else if (currentAssignments[sid]) {
      setSelectedPaddlerId(currentAssignments[sid]);
    }
  }, [isReadOnly, updateAssignments, assignmentKey]);

  const handleUnassign = useCallback((sid: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (isReadOnly) return;
    const currentLockedSeats = lockedSeatsRef.current;
    if (currentLockedSeats.includes(sid)) return;
    
    const currentAssignments = assignmentsRef.current;
    const paddlerId = currentAssignments[sid];
    const paddler = activePaddlerPoolRef.current.find((p) => p.id === paddlerId);

    const nAss = { ...currentAssignments };
    delete nAss[sid];
    updateAssignments(assignmentKey, nAss);

    if (paddler && paddler.isCanister) {
      setPaddlers((prev) => prev.filter((p) => p.id !== paddlerId));
    }
  }, [isReadOnly, updateAssignments, assignmentKey, setPaddlers]);

  const toggleLock = useCallback((sid: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (isReadOnly) return;
    const currentAssignments = assignmentsRef.current;
    if (!currentAssignments[sid]) return;
    setLockedSeats((prev) => prev.includes(sid) ? prev.filter((i) => i !== sid) : [...prev, sid]);
  }, [isReadOnly]);

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
        toPng(boatRef.current, {
          cacheBust: true,
          pixelRatio: 2,
          backgroundColor: '#ffffff',
          style: {
            backgroundColor: '#ffffff',
          }
        })
          .then((dataUrl) => {
            const link = document.createElement('a');
            const safeTitle = (activeEventTitle || 'plan').replace(/[^a-z0-9\u00C0-\u00FF]+/gi, '-').toLowerCase().replace(/(^-|-$)/g, '');
            const datePrefix = activeEvent?.date ? new Date(activeEvent.date).toISOString().split('T')[0] : '';
            link.download = `drachenboot-${datePrefix ? datePrefix + '-' : ''}${safeTitle || 'export'}.png`;
            link.href = dataUrl;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            setIsExporting(false);
          })
          .catch((err) => {
            console.error('Export failed', err);
            setIsExporting(false);
          });
      } else {
        setIsExporting(false);
      }
    }, 500);
  };


  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } })
  );

  const [activeDragData, setActiveDragData] = useState<{ id: string; name: string; weight: number; isGuest?: boolean; isCanister?: boolean; source?: string; seatId?: string } | null>(null);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveDragData(event.active.data.current as unknown as typeof activeDragData);
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
        // Ensure paddler is not already in another seat
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
            primaryColor={currentTeam?.primaryColor}
          />

          <div className="max-w-6xl mx-auto">
            <Header
              title={
                <div className="flex items-center gap-2">
                  <div className={currentTeam?.plan === 'PRO' ? THEME_MAP[currentTeam.primaryColor as ThemeKey]?.text || 'text-blue-500' : 'text-blue-500'}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                  </div>
                  <span className="font-bold text-slate-800 dark:text-white text-sm">
                    {activeEventTitle}
                    {eventDate && (
                      <span className="font-normal text-slate-500 dark:text-slate-400 text-xs ml-2">
                        ({eventDate} • {eventTime})
                      </span>
                    )}
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
                <button onClick={goHome} className={`p-2 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 transition-colors ${currentTeam?.plan === 'PRO' ? (THEME_MAP[currentTeam.primaryColor as ThemeKey]?.buttonGhost || 'hover:text-blue-600 hover:border-blue-300') : 'hover:text-blue-600 hover:border-blue-300'}`}>
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

              <div className="text-center px-2"><div className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold">{t('assigned')}</div><div className={`font-bold text-sm ${currentTeam?.plan === 'PRO' ? THEME_MAP[currentTeam.primaryColor as ThemeKey]?.text || 'text-blue-600 dark:text-blue-400' : 'text-blue-600 dark:text-blue-400'}`}>{stats.c} / 22</div></div>
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
                  primaryColor={currentTeam?.primaryColor}
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
                  primaryColor={currentTeam?.primaryColor}
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
                primaryColor={currentTeam?.primaryColor}
                showProRing={currentTeam?.showProRing}
                icon={currentTeam?.icon}
                showWatermark={currentTeam?.showWatermark}
              />
            </div>
            <Footer />
          </div>
        </div>
      </PageTransition>
      <DragOverlay dropAnimation={null}>
        {activeDragData ? (
          <div className={`bg-white dark:bg-slate-800 rounded-lg shadow-2xl border-2 w-28 h-16 flex flex-col items-center justify-center opacity-90 cursor-grabbing scale-105 touch-none relative z-50 ${currentTeam?.plan === 'PRO' ? (THEME_MAP[currentTeam.primaryColor as ThemeKey]?.ringBorder.replace('group-hover:', '') || 'border-blue-500') : 'border-blue-500'}`}>
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
