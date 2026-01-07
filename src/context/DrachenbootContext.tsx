'use client';

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { useSession } from "next-auth/react";
import { Paddler, Event, Assignments } from '@/types';
import { useTeam } from './TeamContext';

interface DrachenbootContextType {
  // Data State
  paddlers: Paddler[];
  events: Event[];
  assignmentsByEvent: Record<string, Assignments>;
  targetTrim: number;
  setTargetTrim: (trim: number) => void;
  isLoading: boolean;
  isDataLoading: boolean;

  // Actions
  addPaddler: (paddler: Omit<Paddler, 'id'>) => Promise<void>;
  updatePaddler: (id: number | string, data: Partial<Paddler>) => Promise<void>;
  deletePaddler: (id: number | string) => void;
  createEvent: (title: string, date: string, type?: 'training' | 'regatta', boatSize?: 'standard' | 'small', comment?: string) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;
  updateEvent: (id: string, data: Partial<Event>) => Promise<void>;
  updateAttendance: (eid: string, pid: number | string, status: 'yes' | 'no' | 'maybe') => void;
  updateAssignments: (eid: string, newAssignments: Assignments) => void;
  addGuest: (eid: string, guestData: Pick<Paddler, 'name' | 'weight' | 'skills'>) => Promise<string>;
  removeGuest: (eid: string, guestId: string) => void;
  addCanister: (eid: string) => Promise<string>;
  removeCanister: (eid: string, canisterId: string) => Promise<void>;
  setPaddlers: React.Dispatch<React.SetStateAction<Paddler[]>>;
  setEvents: React.Dispatch<React.SetStateAction<Event[]>>;

  // Helpers
  userRole: 'CAPTAIN' | 'PADDLER' | null;
  currentPaddler: Paddler | null;
  refetchPaddlers: () => Promise<void>;
  refetchEvents: () => Promise<void>;
  importPaddlers: (data: Record<string, unknown>[]) => Promise<void>;
  importEvents: (data: Record<string, unknown>[]) => Promise<void>;
  loadMorePaddlers: () => Promise<void>;
  hasMorePaddlers: boolean;
  isMorePaddlersLoading: boolean;
}

const DrachenbootContext = createContext<DrachenbootContextType | undefined>(undefined);

export const useDrachenboot = () => {
  const context = useContext(DrachenbootContext);
  if (!context) {
    throw new Error('useDrachenboot must be used within a DrachenbootProvider');
  }
  return context;
};

export const DrachenbootProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { data: session } = useSession();
  const { currentTeam, isLoadingTeams } = useTeam();

  const [paddlers, setPaddlers] = useState<Paddler[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [assignmentsByEvent, setAssignmentsByEvent] = useState<Record<string, Assignments>>({});
  const [targetTrim, setTargetTrim] = useState<number>(0);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isDataLoading, setIsDataLoading] = useState<boolean>(true);

  // Pagination State
  const PADDLER_PAGE_SIZE = 50;
  const [hasMorePaddlers, setHasMorePaddlers] = useState<boolean>(true);
  const [isMorePaddlersLoading, setIsMorePaddlersLoading] = useState<boolean>(false);


  const _fetchPaddlersCore = useCallback(async (skip = 0, reset = true) => {
    if (!currentTeam) return;

    try {
      if (!reset) setIsMorePaddlersLoading(true);

      const take = PADDLER_PAGE_SIZE;
      const res = await fetch(`/api/paddlers?teamId=${currentTeam.id}&skip=${skip}&take=${take}`);

      if (res.ok) {
        const data = await res.json();

        if (data.length < take) {
          setHasMorePaddlers(false);
        } else {
          setHasMorePaddlers(true);
        }

        if (reset) {
          setPaddlers(data);
        } else {
          setPaddlers(prev => {
            const existingIds = new Set(prev.map(p => p.id));
            const uniqueNew = data.filter((p: Paddler) => !existingIds.has(p.id));
            return [...prev, ...uniqueNew];
          });
        }
      }
    } catch (e) {
      console.error('Failed to fetch paddlers', e);
    } finally {
      if (!reset) setIsMorePaddlersLoading(false);
    }
  }, [currentTeam]);

  // Stable callback for resetting/refreshing list (used in useEffect)
  const fetchPaddlers = useCallback(async (reset = true) => {
    // Legacy support: if reset is true (default), fetch from 0.
    // Ideally this function should just be resetPaddlers() but keeping signature for now.
    if (reset) {
      return _fetchPaddlersCore(0, true);
    } else {
      // Fallback for calls that might pass false, though unstable
      // This path shouldn't be used by useEffect
      return _fetchPaddlersCore(paddlers.length, false);
    }
  }, [_fetchPaddlersCore, paddlers.length]);

  // Truly stable for usage in useEffect where we only care about reset
  const refreshPaddlers = useCallback(() => {
    return _fetchPaddlersCore(0, true);
  }, [_fetchPaddlersCore]);

  const loadMorePaddlers = useCallback(() => {
    if (!hasMorePaddlers) return Promise.resolve();
    return _fetchPaddlersCore(paddlers.length, false);
  }, [_fetchPaddlersCore, hasMorePaddlers, paddlers.length]);



  const fetchEvents = useCallback(async () => {
    if (!currentTeam) return;
    try {
      const now = new Date();
      const pastLimit = new Date();
      pastLimit.setDate(now.getDate() - 30);
      const fromIso = pastLimit.toISOString();

      const res = await fetch(`/api/events?teamId=${currentTeam.id}&from=${fromIso}`);
      if (res.ok) {
        const data = await res.json();
        const loadedEvents: Event[] = [];
        const loadedAssignments: Record<string, Assignments> = {};

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        data.forEach((apiEvent: any) => {
          const attendance: Record<string, 'yes' | 'no' | 'maybe'> = {};
          if (apiEvent.attendances) {
            apiEvent.attendances.forEach((att: { paddlerId: string; status: 'yes' | 'no' | 'maybe' }) => {
              attendance[att.paddlerId] = att.status;
            });
          }

          const assignments: Assignments = {};
          let canisterCounter = 1;

          if (apiEvent.assignments) {
            apiEvent.assignments.forEach((a: { isCanister: boolean; seatId: string; paddlerId?: string }) => {
              if (a.isCanister) {
                assignments[a.seatId] = `canister-${canisterCounter}`;
                canisterCounter++;
              } else if (a.paddlerId) {
                assignments[a.seatId] = a.paddlerId;
              }
            });
          }
          loadedAssignments[apiEvent.id] = assignments;

          loadedEvents.push({
            id: apiEvent.id,
            title: apiEvent.title,
            date: new Date(apiEvent.date).toISOString(),
            type: apiEvent.type,
            boatSize: apiEvent.boatSize || 'standard',
            canisterCount: apiEvent.canisterCount || 0,
            comment: apiEvent.comment,
            attendance,
            guests: apiEvent.guests || [],
          });
        });

        setEvents(loadedEvents);
        setAssignmentsByEvent(loadedAssignments);
      }
    } catch (e) {
      console.error('Failed to fetch events', e);
    }
  }, [currentTeam]);

  // Sync data when currentTeam changes
  useEffect(() => {
    let isMounted = true;

    if (currentTeam) {
      setIsDataLoading(true);
      Promise.all([refreshPaddlers(), fetchEvents()]).finally(() => {
        if (isMounted) {
          setIsDataLoading(false);
          setIsLoading(false);
        }
      });
    } else {
      setPaddlers([]);
      setEvents([]);
      if (isMounted) {
        if (!isLoadingTeams) {
          setIsDataLoading(false);
          setIsLoading(false);
        }
      }
    }

    return () => {
      isMounted = false;
    };
  }, [currentTeam, isLoadingTeams, refreshPaddlers, fetchEvents]); // React to TeamContext changes

  // Load local trim preference
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedTrim = localStorage.getItem('drachenboot_target_trim');
      if (storedTrim) setTargetTrim(parseFloat(storedTrim));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('drachenboot_target_trim', targetTrim.toString());
  }, [targetTrim]);


  const addPaddler = useCallback(async (paddler: Omit<Paddler, 'id'>) => {
    if (!currentTeam) return;
    try {
      const res = await fetch('/api/paddlers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...paddler, teamId: currentTeam.id }),
      });
      if (res.ok) {
        const newPaddler = await res.json();
        setPaddlers(prev => [...prev, newPaddler]);
      } else {
        const err = await res.json();
        throw new Error(err.error || 'Failed to add paddler');
      }
    } catch (e) {
      if (e instanceof Error && e.message !== 'Team limit reached') {
        console.error('Failed to add paddler', e);
      }
      throw e;
    }
  }, [currentTeam]);

  const updatePaddler = useCallback(async (id: number | string, data: Partial<Paddler>) => {
    try {
      const res = await fetch(`/api/paddlers/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        setPaddlers(prev => prev.map(p => p.id === id ? { ...p, ...data } : p));
      } else {
        const err = await res.json();
        throw new Error(err.error || 'Failed to update paddler');
      }
    } catch (e) {
      console.error('Failed to update paddler', e);
      throw e;
    }
  }, []);

  const deletePaddler = useCallback(async (id: number | string) => {
    try {
      const res = await fetch(`/api/paddlers/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setAssignmentsByEvent(prev => {
          const next = { ...prev };
          Object.keys(next).forEach(eid => {
            const map = { ...next[eid] };
            let chg = false;
            Object.keys(map).forEach(s => { if (map[s] === id) { delete map[s]; chg = true; } });
            if (chg) next[eid] = map;
          });
          return next;
        });
        setEvents(prev => prev.map(ev => {
          const att = { ...ev.attendance };
          delete att[id as string];
          return { ...ev, attendance: att };
        }));
        setPaddlers(prev => prev.filter(p => p.id !== id));
      }
    } catch (e) {
      console.error('Failed to delete paddler', e);
    }
  }, []);

  const createEvent = useCallback(async (title: string, date: string, type: 'training' | 'regatta' = 'training', boatSize: 'standard' | 'small' = 'standard', comment?: string) => {
    if (!currentTeam) return '';
    try {
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, date, type, boatSize, comment, teamId: currentTeam.id }),
      });
      if (res.ok) {
        const createdEvent = await res.json();
        const newEvent = {
          ...createdEvent,
          date: createdEvent.date,
          attendance: {},
          guests: [],
          canisterCount: 0
        };

        setEvents(prev => [...prev, newEvent]);
        setAssignmentsByEvent(prev => ({ ...prev, [createdEvent.id]: {} }));
        return createdEvent.id;
      }
    } catch (e) {
      console.error('Failed to create event', e);
    }
    return '';
  }, [currentTeam]);

  const deleteEvent = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/events/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setEvents((prev) => prev.filter((e) => e.id !== id));
        setAssignmentsByEvent(prev => {
          const next = { ...prev };
          delete next[id];
          return next;
        });
      }
    } catch (e) { console.error(e); }
  }, []);

  const updateEvent = useCallback(async (id: string, data: Partial<Event>) => {
    setEvents(prev => prev.map(e => e.id === id ? { ...e, ...data } : e));
    try {
      await fetch(`/api/events/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
    } catch (e) {
      console.error('Failed to update event', e);
    }
  }, []);

  const updateAttendance = useCallback(async (eid: string, pid: number | string, status: 'yes' | 'no' | 'maybe') => {
    setEvents(prev => prev.map(ev => ev.id !== eid ? ev : { ...ev, attendance: { ...ev.attendance, [pid]: status } }));
    try {
      await fetch(`/api/events/${eid}/attendance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paddlerId: pid, status }),
      });
    } catch (e) {
      console.error('Failed to update attendance', e);
    }
  }, []);

  const updateAssignments = useCallback(async (eid: string, newAssignments: Assignments) => {
    setAssignmentsByEvent(prev => ({ ...prev, [eid]: newAssignments }));
    try {
      await fetch(`/api/events/${eid}/assignments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignments: newAssignments }),
      });
    } catch (e) {
      console.error('Failed to update assignments', e);
    }
  }, []);

  const addGuest = useCallback(async (eid: string, guestData: Pick<Paddler, 'name' | 'weight' | 'skills'>) => {
    try {
      const res = await fetch(`/api/events/${eid}/guests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(guestData),
      });

      if (res.ok) {
        const newGuest = await res.json();
        setPaddlers(prev => [...prev, newGuest]);
        setEvents(prev => prev.map(ev => {
          if (ev.id === eid) {
            return {
              ...ev,
              guests: [...(ev.guests || []), newGuest],
              attendance: { ...ev.attendance, [newGuest.id]: 'yes' }
            };
          }
          return ev;
        }));
        return newGuest.id;
      }
    } catch (e) { console.error(e); }
    return '';
  }, []);

  const removeGuest = useCallback(async (eid: string, guestId: string) => {
    setEvents(prev => prev.map(ev => {
      if (ev.id === eid) {
        const newGuests = (ev.guests || []).filter(g => g.id !== guestId);
        const newAttendance = { ...ev.attendance };
        delete newAttendance[guestId];
        return { ...ev, guests: newGuests, attendance: newAttendance };
      }
      return ev;
    }));

    setPaddlers(prev => prev.filter(p => p.id !== guestId));

    try {
      await fetch(`/api/events/${eid}/guests/${guestId}`, { method: 'DELETE' });
    } catch (e) { console.error(e); }
  }, []);

  const addCanister = useCallback(async (eid: string) => {
    try {
      const res = await fetch(`/api/events/${eid}/canisters`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (res.ok) {
        const data = await res.json();
        const newCount = data.canisterCount;
        setEvents(prev => prev.map(ev => ev.id === eid ? { ...ev, canisterCount: newCount } : ev));
        return data.newCanisterId;
      }
    } catch (e) { console.error(e); }
    return '';
  }, []);

  const removeCanister = useCallback(async (eid: string, canisterId: string) => {
    try {
      const res = await fetch(`/api/events/${eid}/canisters?canisterId=${canisterId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setEvents(prev => prev.map(ev => {
          if (ev.id === eid) {
            return { ...ev, canisterCount: (ev.canisterCount || 0) - 1 };
          }
          return ev;
        }));
      }
    } catch (e) { console.error(e); }
  }, []);


  const value = useMemo(() => {
    let role: 'CAPTAIN' | 'PADDLER' | null = 'PADDLER';
    let myPaddler = null;
    if (session?.user?.id && paddlers.length) {
      myPaddler = paddlers.find(p => p.userId === session.user.id) || null;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      role = (myPaddler as any)?.role || 'PADDLER';
    }

    return {
      paddlers,
      events,
      assignmentsByEvent,
      targetTrim,
      setTargetTrim,
      isLoading,
      isDataLoading,
      addPaddler,
      updatePaddler,
      deletePaddler,
      createEvent,
      deleteEvent,
      updateEvent,
      updateAttendance,
      updateAssignments,
      addGuest,
      removeGuest,
      addCanister,
      removeCanister,
      setPaddlers,
      setEvents,
      userRole: role,
      currentPaddler: myPaddler,
      refetchPaddlers: fetchPaddlers,
      refetchEvents: fetchEvents,
      importPaddlers: async (data: Record<string, unknown>[]) => {
        if (!currentTeam) return;
        try {
          const res = await fetch(`/api/teams/${currentTeam.id}/import/paddlers`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ paddlers: data }),
          });
          if (!res.ok) throw new Error('Import failed');
          await fetchPaddlers(true);
        } catch (e) {
          console.error(e);
          throw e;
        }
      },
      importEvents: async (data: Record<string, unknown>[]) => {
        // Not fully implemented in original context either
        console.warn("Import events not implemented in context", data);
      },
      loadMorePaddlers,
      hasMorePaddlers,
      isMorePaddlersLoading
    };
  }, [
    paddlers,
    events,
    assignmentsByEvent,
    targetTrim,
    isLoading,
    isDataLoading,
    session,
    currentTeam,
    addPaddler,
    updatePaddler,
    deletePaddler,
    createEvent,
    deleteEvent,
    updateEvent,
    updateAttendance,
    updateAssignments,
    addGuest,
    removeGuest,
    addCanister,
    removeCanister,
    fetchPaddlers,
    fetchEvents,
    loadMorePaddlers,
    hasMorePaddlers,
    isMorePaddlersLoading
  ]);

  return (
    <DrachenbootContext.Provider value={value}>
      {children}
    </DrachenbootContext.Provider>
  );
};
