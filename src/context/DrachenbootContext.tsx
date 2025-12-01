'use client';

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { db, seedInitialData } from '@/utils/storage';
import { Paddler, Event, Assignments } from '@/types';

interface DrachenbootContextType {
  paddlers: Paddler[];
  events: Event[];
  assignmentsByEvent: Record<number, Assignments>;
  targetTrim: number;
  setTargetTrim: (trim: number) => void;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  isLoading: boolean;
  addPaddler: (paddler: Omit<Paddler, 'id'>) => void;
  updatePaddler: (id: number | string, data: Partial<Paddler>) => void;
  deletePaddler: (id: number | string) => void;
  createEvent: (title: string, date: string) => number;
  updateAttendance: (eid: number, pid: number | string, status: 'yes' | 'no' | 'maybe') => void;
  updateAssignments: (eid: number, newAssignments: Assignments) => void;
  addGuest: (eid: number | string, guestData: Pick<Paddler, 'name' | 'weight' | 'skills'>) => string;
  removeGuest: (eid: number | string, guestId: string) => void;
  setPaddlers: React.Dispatch<React.SetStateAction<Paddler[]>>;
  setEvents: React.Dispatch<React.SetStateAction<Event[]>>;
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
  // --- STATE ---
  const [paddlers, setPaddlers] = useState<Paddler[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [assignmentsByEvent, setAssignmentsByEvent] = useState<Record<number, Assignments>>({});
  const [targetTrim, setTargetTrim] = useState<number>(0);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // --- INITIAL LOAD ---
  useEffect(() => {
    const data = db.load();
    if (data) {
      setPaddlers(data.paddlers || []);
      setEvents(data.events || []);
      setAssignmentsByEvent(data.assignmentsByEvent || {});
      if (data.darkMode !== undefined) {
        setIsDarkMode(data.darkMode);
      } else if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        setIsDarkMode(true);
      }
      if (data.targetTrim !== undefined) setTargetTrim(data.targetTrim);
    } else {
      const initial = seedInitialData();
      setPaddlers(initial.paddlers);
      setEvents(initial.events);
      setAssignmentsByEvent(initial.assignmentsByEvent);
      // Check system preference for new users
      if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        setIsDarkMode(true);
      }
    }

    // Listen for system theme changes
    if (typeof window !== 'undefined' && window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = (e: MediaQueryListEvent) => setIsDarkMode(e.matches);
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }

    setIsLoading(false);
  }, []);

  // --- SAVE EFFECTS ---
  useEffect(() => {
    if (!isLoading) {
      db.save({ paddlers, events, assignmentsByEvent, darkMode: isDarkMode, targetTrim });
    }
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [paddlers, events, assignmentsByEvent, isDarkMode, targetTrim, isLoading]);

  // --- ACTIONS ---
  const toggleDarkMode = useCallback(() => setIsDarkMode(prev => !prev), []);

  const addPaddler = useCallback((paddler: Omit<Paddler, 'id'>) => {
    setPaddlers(prev => [...prev, { id: Date.now(), ...paddler }]);
  }, []);

  const updatePaddler = useCallback((id: number | string, data: Partial<Paddler>) => {
    setPaddlers(prev => prev.map(p => p.id === id ? { ...p, ...data } : p));
  }, []);

  const deletePaddler = useCallback((id: number | string) => {
    // Remove from assignments
    setAssignmentsByEvent(prev => {
      const next = { ...prev };
      Object.keys(next).forEach(eid => {
        const eventId = parseInt(eid);
        const map = { ...next[eventId] };
        let chg = false;
        Object.keys(map).forEach(s => { if (map[s] === id) { delete map[s]; chg = true; } });
        if (chg) next[eventId] = map;
      });
      return next;
    });
    // Remove from attendance
    setEvents(prev => prev.map(ev => {
      const att = { ...ev.attendance };
      delete att[id as string]; // attendance keys are strings
      return { ...ev, attendance: att };
    }));
    // Remove from list
    setPaddlers(prev => prev.filter(p => p.id !== id));
  }, []);

  const createEvent = useCallback((title: string, date: string) => {
    const nid = Date.now();
    const ne: Event = { id: nid, title, date, type: 'training', attendance: {}, guests: [] };
    setEvents(prev => [...prev, ne]);
    setAssignmentsByEvent(prev => ({ ...prev, [nid]: {} }));
    return nid;
  }, []);

  const updateAttendance = useCallback((eid: number, pid: number | string, status: 'yes' | 'no' | 'maybe') => {
    setEvents(prev => prev.map(ev => ev.id !== eid ? ev : { ...ev, attendance: { ...ev.attendance, [pid]: status } }));
  }, []);

  const updateAssignments = useCallback((eid: number, newAssignments: Assignments) => {
    setAssignmentsByEvent(prev => ({ ...prev, [eid]: newAssignments }));
  }, []);

  const addGuest = useCallback((eid: number | string, guestData: Pick<Paddler, 'name' | 'weight' | 'skills'>) => {
    const guestId = 'guest-' + Date.now();
    const newGuest: Paddler = { ...guestData, id: guestId, isGuest: true };
    setEvents(prev => prev.map(ev => ev.id === parseInt(eid as string) ? { ...ev, guests: [...(ev.guests || []), newGuest] } : ev));
    return guestId;
  }, []);

  const removeGuest = useCallback((eid: number | string, guestId: string) => {
    setEvents(prev => prev.map(ev => ev.id === parseInt(eid as string) ? { ...ev, guests: (ev.guests || []).filter(g => g.id !== guestId) } : ev));
    // Also remove from assignments if assigned
    setAssignmentsByEvent(prev => {
      const eventId = parseInt(eid as string);
      const currentAssignments = prev[eventId] || {};
      const seat = Object.keys(currentAssignments).find(k => currentAssignments[k] === guestId);
      if (seat) {
        const nextAssignments = { ...currentAssignments };
        delete nextAssignments[seat];
        return { ...prev, [eventId]: nextAssignments };
      }
      return prev;
    });
  }, []);


  const value = useMemo(() => ({
    paddlers,
    events,
    assignmentsByEvent,
    targetTrim,
    setTargetTrim,
    isDarkMode,
    toggleDarkMode,
    isLoading,
    addPaddler,
    updatePaddler,
    deletePaddler,
    createEvent,
    updateAttendance,
    updateAssignments,
    addGuest,
    removeGuest,
    setPaddlers, // Exposed for canister logic
    setEvents // Exposed for direct manipulation if needed
  }), [
    paddlers, events, assignmentsByEvent, targetTrim, isDarkMode, isLoading,
    toggleDarkMode, addPaddler, updatePaddler, deletePaddler, createEvent,
    updateAttendance, updateAssignments, addGuest, removeGuest
  ]);

  return (
    <DrachenbootContext.Provider value={value}>
      {children}
    </DrachenbootContext.Provider>
  );
};
