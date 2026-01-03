'use client';

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { useSession } from "next-auth/react";
import { Paddler, Event, Assignments, Team } from '@/types';

interface DrachenbootContextType {
  teams: Team[];
  currentTeam: Team | null;
  createTeam: (name: string) => Promise<void>;
  updateTeam: (id: string, data: Partial<Team>) => Promise<void>;
  deleteTeam: (id: string) => Promise<void>;
  switchTeam: (teamId: string) => void;
  paddlers: Paddler[];
  events: Event[];
  assignmentsByEvent: Record<string, Assignments>;
  targetTrim: number;
  setTargetTrim: (trim: number) => void;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  isLoading: boolean;
  isDataLoading: boolean;
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
  userRole: 'CAPTAIN' | 'PADDLER' | null;
  currentPaddler: Paddler | null;
  refetchPaddlers: () => Promise<void>;
  refetchEvents: () => Promise<void>;
  refetchTeams: () => Promise<void>;
  importPaddlers: (data: Record<string, unknown>[]) => Promise<void>;
  importEvents: (data: Record<string, unknown>[]) => Promise<void>;
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
  const { data: session, status } = useSession();

  const [teams, setTeams] = useState<Team[]>([]);
  const [currentTeam, setCurrentTeam] = useState<Team | null>(null);
  const [paddlers, setPaddlers] = useState<Paddler[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [assignmentsByEvent, setAssignmentsByEvent] = useState<Record<string, Assignments>>({});
  const [targetTrim, setTargetTrim] = useState<number>(0);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('drachenboot_theme');
        if (stored === 'dark') return true;
        if (stored === 'light') return false;
        if (window.matchMedia('(prefers-color-scheme: dark)').matches) return true;
    }
    return false;
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isDataLoading, setIsDataLoading] = useState<boolean>(true);


  const fetchTeams = useCallback(async () => {
    try {
      const res = await fetch('/api/teams', { cache: 'no-store' });
      if (res.status === 401) {
        setTeams([]);
        setCurrentTeam(null);
        return;
      }
      if (res.ok) {
        const data = await res.json();
        setTeams(data);
        
        if (data.length > 0) {
          // If we already have a currentTeam, find it in the new data to refresh it (e.g. for PRO status)
          // If not, pick from localStorage or the first team
          const teamToSelect = currentTeam 
            ? data.find((t: Team) => t.id === currentTeam.id) 
            : (data.find((t: Team) => t.id === localStorage.getItem('drachenboot_team_id')) || data[0]);

          if (teamToSelect) {
            setCurrentTeam(prev => {
              // Only update if data actually changed to avoid unnecessary re-renders
              if (prev && prev.id === teamToSelect.id && JSON.stringify(prev) === JSON.stringify(teamToSelect)) return prev;
              return teamToSelect;
            });
          }
        }
      }
    } catch (e) {
      console.error('Failed to fetch teams', e);
    }
  }, [currentTeam]);

  const fetchPaddlers = useCallback(async () => {
    if (!currentTeam) return;
    try {
      const res = await fetch(`/api/paddlers?teamId=${currentTeam.id}`);
      if (res.ok) {
        const data = await res.json();
        setPaddlers(data);
      }
    } catch (e) {
      console.error('Failed to fetch paddlers', e);
    }
  }, [currentTeam]);

  const fetchEvents = useCallback(async () => {
    if (!currentTeam) return;
    try {
      const res = await fetch(`/api/events?teamId=${currentTeam.id}`);
      if (res.ok) {
        const data = await res.json();
        // Transform API data to App state
        const loadedEvents: Event[] = [];
        const loadedAssignments: Record<string, Assignments> = {};

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        data.forEach((apiEvent: { attendances: { paddlerId: string; status: 'yes' | 'no' | 'maybe' }[]; assignments: { isCanister: boolean; seatId: string; paddlerId?: string }[]; id: string; title: string; date: string; type: 'training' | 'regatta'; boatSize?: 'standard' | 'small'; canisterCount?: number; comment?: string; guests?: any[] }) => {
          // Transform attendance array to object
          const attendance: Record<string, 'yes' | 'no' | 'maybe'> = {};
          if (apiEvent.attendances) {
            apiEvent.attendances.forEach((att: { paddlerId: string; status: 'yes' | 'no' | 'maybe' }) => {
              attendance[att.paddlerId] = att.status;
            });
          }

          // Transform assignments array to object
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
            date: new Date(apiEvent.date).toISOString(), // Keep full ISO string including time
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


  useEffect(() => {
    const init = async () => {
      if (status === 'loading') return;
      if (status === 'authenticated') {
        // Load user preferences from API
        try {
          const prefsResponse = await fetch('/api/user/preferences');
          if (prefsResponse.ok) {
            const prefs = await prefsResponse.json();
            
            // Sync Theme: Server wins
            if (prefs.theme === 'dark' && !isDarkMode) {
                setIsDarkMode(true);
                localStorage.setItem('drachenboot_theme', 'dark');
            } else if (prefs.theme === 'light' && isDarkMode) {
                setIsDarkMode(false);
                localStorage.setItem('drachenboot_theme', 'light');
            }
            
            // Fetch teams and apply activeTeamId preference
            await fetchTeamsWithPreference(prefs.activeTeamId);
          } else {
            await fetchTeams();
          }
        } catch (e) {
          console.error('Failed to load preferences', e);
          await fetchTeams();
        }
      } else {
         // Not authenticated, just fetch teams
         await fetchTeams();
      }
      
      // Load local preferences as fallback for trim (non-critical)
      if (typeof window !== 'undefined') {
        const storedTrim = localStorage.getItem('drachenboot_target_trim');
        if (storedTrim) setTargetTrim(parseFloat(storedTrim));
      }
      
      setIsLoading(false);
    };
    init();

    // Listen for system theme changes
    if (typeof window !== 'undefined' && window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = (e: MediaQueryListEvent) => {
        if (!localStorage.getItem('drachenboot_theme')) {
          setIsDarkMode(e.matches);
        }
      };
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [status]); // eslint-disable-line react-hooks/exhaustive-deps
  
  const fetchTeamsWithPreference = async (preferredTeamId: string | null) => {
    // Check for teamId in URL search params
    let urlTeamId: string | null = null;
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      urlTeamId = params.get('teamId');
    }

    try {
      const res = await fetch('/api/teams', { cache: 'no-store' });
      if (res.status === 401) {
        setTeams([]);
        setCurrentTeam(null);
        return;
      }
      if (res.ok) {
        const data = await res.json();
        setTeams(data);
        if (data.length > 0) {
          // Priority: URL param > API preference > localStorage > first team
          let teamToSelect = null;
          
          if (urlTeamId) {
             teamToSelect = data.find((t: Team) => t.id === urlTeamId);
          }

          if (!teamToSelect && preferredTeamId) {
            teamToSelect = data.find((t: Team) => t.id === preferredTeamId);
          }
          if (!teamToSelect) {
            const storedTeamId = localStorage.getItem('drachenboot_team_id');
            teamToSelect = data.find((t: Team) => t.id === storedTeamId);
          }
          if (!teamToSelect) {
            teamToSelect = data[0];
          }
          setIsDataLoading(true);
          setCurrentTeam(prev => {
             if (prev && prev.id === teamToSelect.id && JSON.stringify(prev) === JSON.stringify(teamToSelect)) return prev;
             return teamToSelect;
          });
          
          // Clean up URL if we used it
          if (urlTeamId && typeof window !== 'undefined') {
             const newUrl = window.location.pathname;
             window.history.replaceState({}, '', newUrl);
          }
        }
      }
    } catch (e) {
      console.error('Failed to fetch teams', e);
    }
  };


  useEffect(() => {
    let isMounted = true;

    if (currentTeam) {
        setIsDataLoading(true);
        localStorage.setItem('drachenboot_team_id', currentTeam.id);
        
        // Save to API if authenticated
        if (status === 'authenticated') {
          fetch('/api/user/preferences', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ activeTeamId: currentTeam.id }),
          }).catch(e => console.error('Failed to save active team preference', e));
        }
        
        Promise.all([fetchPaddlers(), fetchEvents()]).finally(() => {
          if (isMounted) {
            setIsDataLoading(false);
            // Initial load is also done when data is loaded
            setIsLoading(false); 
          }
        });
    } else {
        setPaddlers([]);
        setEvents([]);
        if (isMounted) {
          setIsDataLoading(false);
        }
    }

    return () => {
      isMounted = false;
    };
  }, [currentTeam, fetchPaddlers, fetchEvents, status]);


  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    // Save locally always
    localStorage.setItem('drachenboot_theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);


  useEffect(() => {
    localStorage.setItem('drachenboot_target_trim', targetTrim.toString());
  }, [targetTrim]);


  const toggleDarkMode = useCallback(async () => {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);
    
    // Save to API if authenticated
    if (status === 'authenticated') {
      try {
        await fetch('/api/user/preferences', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ theme: newDarkMode ? 'dark' : 'light' }),
        });
      } catch (e) {
        console.error('Failed to save theme preference', e);
      }
    }
  }, [isDarkMode, status]);

  const createTeam = useCallback(async (name: string) => {
    try {
      const res = await fetch('/api/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      if (res.ok) {
        const newTeam = await res.json();
        setTeams(prev => [...prev, newTeam]);
        // Automatically switch to new team
        setIsDataLoading(true);
        setCurrentTeam(newTeam);
        localStorage.setItem('drachenboot_team', newTeam.id);
      }
    } catch (e) {
      console.error('Failed to create team', e);
    }
  }, []);

  const updateTeam = useCallback(async (id: string, data: Partial<Team>) => {
    try {
      const res = await fetch(`/api/teams/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        const updatedTeam = await res.json();
        setTeams(prev => prev.map(t => t.id === id ? updatedTeam : t));
        if (currentTeam?.id === id) {
          setCurrentTeam(updatedTeam);
        }
      }
    } catch (e) {
      console.error('Failed to update team', e);
    }
  }, [currentTeam]);

  const deleteTeam = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/teams/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setTeams(prev => prev.filter(t => t.id !== id));
        if (currentTeam?.id === id) {
          // We can't access 'teams' state reliably here if it's stale from closure, 
          // but we can use functional update if we needed logic, but here we need 'teams' to find next.
          // Since we use 'teams' in dependency, it's fine.
          const remainingTeams = teams.filter(t => t.id !== id);
          if (remainingTeams.length > 0) {
            setIsDataLoading(true);
            setCurrentTeam(remainingTeams[0]);
            localStorage.setItem('drachenboot_team', remainingTeams[0].id);
          } else {
            setCurrentTeam(null);
            localStorage.removeItem('drachenboot_team');
          }
        }
      }
    } catch (e) {
      console.error('Failed to delete team', e);
    }
  }, [teams, currentTeam]);

  const switchTeam = useCallback((teamId: string) => {
    const team = teams.find(t => t.id === teamId);
    if (team) {
      setIsDataLoading(true);
      setCurrentTeam(team);
    }
  }, [teams]);

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
      // Don't log expected validation errors
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
        // Remove from local state
        setAssignmentsByEvent(prev => {
          const next = { ...prev };
          Object.keys(next).forEach(eid => {
            const eventId = eid; // string key
            const map = { ...next[eventId] };
            let chg = false;
            Object.keys(map).forEach(s => { if (map[s] === id) { delete map[s]; chg = true; } });
            if (chg) next[eventId] = map;
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
        // Ensure date is string for local state if API returns Date object or string
        // API returns Prisma object where date is Date object (serialized to string)
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
      // Revert?
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
        
        // Update Local State
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
    } catch(e) { console.error(e); }
    return '';
  }, []);

  const removeGuest = useCallback(async (eid: string, guestId: string) => {
    // Remove from local state immediately (optimistic)
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
    } catch(e) { console.error(e); }
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
    } catch(e) { console.error(e); }
    return '';
  }, []);

  const removeCanister = useCallback(async (eid: string, canisterId: string) => {
    try {
      const res = await fetch(`/api/events/${eid}/canisters?canisterId=${canisterId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        // Update local state
        setEvents(prev => prev.map(ev => {
          if (ev.id === eid) {
            return { ...ev, canisterCount: (ev.canisterCount || 0) - 1 };
          }
          return ev;
        }));
      } else {
        const err = await res.json();
        console.error('Canister removal failed:', err.error || 'Unknown error');
      }
    } catch(e) { console.error(e); }
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
      teams,
      currentTeam,
      createTeam,
      updateTeam,
      deleteTeam,
      switchTeam,
      paddlers,
      events,
      assignmentsByEvent,
      targetTrim,
      setTargetTrim,
      isDarkMode,
      toggleDarkMode,
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
      refetchTeams: fetchTeams,
      importPaddlers: async (data: Record<string, unknown>[]) => {
        if (!currentTeam) return;
        try {
          const res = await fetch(`/api/teams/${currentTeam.id}/import/paddlers`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ paddlers: data }),
          });
          if (!res.ok) throw new Error('Import failed');
          await fetchPaddlers();
        } catch (e) {
          console.error(e);
          throw e;
        }
      },
      importEvents: async (data: Record<string, unknown>[]) => {
        if (!currentTeam) return;
        try {
          const res = await fetch(`/api/teams/${currentTeam.id}/import/events`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ events: data }),
          });
          if (!res.ok) throw new Error('Import failed');
          await fetchEvents();
        } catch (e) {
          console.error(e);
          throw e;
        }
      }
    };
  }, [
    teams, currentTeam, createTeam, switchTeam,
    paddlers, events, assignmentsByEvent, targetTrim, isDarkMode, isLoading, isDataLoading,
    toggleDarkMode, addPaddler, updatePaddler, deletePaddler, createEvent, deleteEvent, updateEvent,
    updateAttendance, updateAssignments, addGuest, removeGuest, addCanister, removeCanister,
    session, updateTeam, fetchPaddlers, fetchEvents, deleteTeam, fetchTeams
  ]);

  return (
    <DrachenbootContext.Provider value={value}>
      {children}
    </DrachenbootContext.Provider>
  );
};
