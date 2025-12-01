'use client';

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { db, seedInitialData } from '@/utils/storage';

const DrachenbootContext = createContext();

export const useDrachenboot = () => {
  const context = useContext(DrachenbootContext);
  if (!context) {
    throw new Error('useDrachenboot must be used within a DrachenbootProvider');
  }
  return context;
};

export const DrachenbootProvider = ({ children }) => {
  // --- STATE ---
  const [paddlers, setPaddlers] = useState([]);
  const [events, setEvents] = useState([]);
  const [assignmentsByEvent, setAssignmentsByEvent] = useState({});
  const [targetTrim, setTargetTrim] = useState(0);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // --- INITIAL LOAD ---
  useEffect(() => {
    const data = db.load();
    if (data) {
      setPaddlers(data.paddlers || []);
      setEvents(data.events || []);
      setAssignmentsByEvent(data.assignmentsByEvent || {});
      if (data.darkMode !== undefined) setIsDarkMode(data.darkMode);
      if (data.targetTrim !== undefined) setTargetTrim(data.targetTrim);
    } else {
      const initial = seedInitialData();
      setPaddlers(initial.paddlers);
      setEvents(initial.events);
      setAssignmentsByEvent(initial.assignmentsByEvent);
    }
    setIsLoading(false);

    if (!data && typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setIsDarkMode(true);
    }
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

  const addPaddler = useCallback((paddler) => {
    setPaddlers(prev => [...prev, { id: Date.now(), ...paddler }]);
  }, []);

  const updatePaddler = useCallback((id, data) => {
    setPaddlers(prev => prev.map(p => p.id === id ? { ...p, ...data } : p));
  }, []);

  const deletePaddler = useCallback((id) => {
    // Remove from assignments
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
    // Remove from attendance
    setEvents(prev => prev.map(ev => {
      const att = { ...ev.attendance };
      delete att[id];
      return { ...ev, attendance: att };
    }));
    // Remove from list
    setPaddlers(prev => prev.filter(p => p.id !== id));
  }, []);

  const createEvent = useCallback((title, date) => {
    const nid = Date.now();
    const ne = { id: nid, title, date, type: 'training', attendance: {}, guests: [] };
    setEvents(prev => [...prev, ne]);
    setAssignmentsByEvent(prev => ({ ...prev, [nid]: {} }));
    return nid;
  }, []);

  const updateAttendance = useCallback((eid, pid, status) => {
    setEvents(prev => prev.map(ev => ev.id !== eid ? ev : { ...ev, attendance: { ...ev.attendance, [pid]: status } }));
  }, []);

  const updateAssignments = useCallback((eid, newAssignments) => {
    setAssignmentsByEvent(prev => ({ ...prev, [eid]: newAssignments }));
  }, []);

  const addGuest = useCallback((eid, guestData) => {
    const guestId = 'guest-' + Date.now();
    const newGuest = { ...guestData, id: guestId, isGuest: true };
    setEvents(prev => prev.map(ev => ev.id === parseInt(eid) ? { ...ev, guests: [...(ev.guests || []), newGuest] } : ev));
    return guestId;
  }, []);

  const removeGuest = useCallback((eid, guestId) => {
     setEvents(prev => prev.map(ev => ev.id === parseInt(eid) ? { ...ev, guests: (ev.guests || []).filter(g => g.id !== guestId) } : ev));
     // Also remove from assignments if assigned
     setAssignmentsByEvent(prev => {
         const currentAssignments = prev[eid] || {};
         const seat = Object.keys(currentAssignments).find(k => currentAssignments[k] === guestId);
         if (seat) {
             const nextAssignments = { ...currentAssignments };
             delete nextAssignments[seat];
             return { ...prev, [eid]: nextAssignments };
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
