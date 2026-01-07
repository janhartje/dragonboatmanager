'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useSession } from "next-auth/react";
import { Team, Paddler } from '@/types';

// We need to know the role for the *current* team.
// Since paddlers are fetched in DrachenbootContext (Data Layer), 
// we might need a way to get role here. 
// HOWEVER, typically role is derived from the member list of the team.
// If we move fetching paddlers to Data Layer, we can't easily calculate role here 
// without fetching paddlers.
//
// OPTION: Fetch minimal member data here or just keep userRole in DrachenbootContext?
// DECISION: Keep userRole in DrachenbootContext for now as it depends on Paddler data, 
// OR simpler: fetch "my membership" for the current team here.
//
// For this refactor, I will focus on Team Management. 
// If userRole depends on paddler list, it stays in Data layer or we fetch it separately.
// Looking at original code: userRole was derived from 'paddlers.find(p => p.userId === session.user.id)'.
// So role depends on Paddlers. Thus userRole should stay in DrachenbootContext 
// OR we expose a separate "MembershipContext".
// Let's keep it simple: TeamContext handles Team Entities. DrachenbootContext handles content (Paddlers/Events) + Permissions (Role).

interface TeamContextType {
    teams: Team[];
    currentTeam: Team | null;
    createTeam: (name: string) => Promise<Team | null>;
    updateTeam: (id: string, data: Partial<Team>) => Promise<void>;
    deleteTeam: (id: string) => Promise<void>;
    switchTeam: (teamId: string) => void;
    isLoadingTeams: boolean;
    refetchTeams: () => Promise<void>;
}

const TeamContext = createContext<TeamContextType | undefined>(undefined);

export const useTeam = () => {
    const context = useContext(TeamContext);
    if (!context) {
        throw new Error('useTeam must be used within a TeamProvider');
    }
    return context;
};

export const TeamProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { data: session, status } = useSession();
    const [teams, setTeams] = useState<Team[]>([]);
    const [currentTeam, setCurrentTeam] = useState<Team | null>(null);
    const [isLoadingTeams, setIsLoadingTeams] = useState<boolean>(true);

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
                    const teamToSelect = currentTeam
                        ? data.find((t: Team) => t.id === currentTeam.id)
                        : (data.find((t: Team) => t.id === localStorage.getItem('drachenboot_team_id')) || data[0]);

                    if (teamToSelect) {
                        setCurrentTeam(prev => {
                            if (prev && prev.id === teamToSelect.id && JSON.stringify(prev) === JSON.stringify(teamToSelect)) return prev;
                            return teamToSelect;
                        });
                    }
                } else {
                    setCurrentTeam(null);
                }
            }
        } catch (e) {
            console.error('Failed to fetch teams', e);
        }
    }, [currentTeam]);

    const fetchTeamsWithPreference = async (preferredTeamId: string | null) => {
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
                    let teamToSelect = null;
                    if (urlTeamId) teamToSelect = data.find((t: Team) => t.id === urlTeamId);
                    if (!teamToSelect && preferredTeamId) teamToSelect = data.find((t: Team) => t.id === preferredTeamId);
                    if (!teamToSelect) {
                        const storedTeamId = localStorage.getItem('drachenboot_team_id');
                        teamToSelect = data.find((t: Team) => t.id === storedTeamId);
                    }
                    if (!teamToSelect) teamToSelect = data[0];

                    setCurrentTeam(prev => {
                        if (prev && prev.id === teamToSelect.id && JSON.stringify(prev) === JSON.stringify(teamToSelect)) return prev;
                        return teamToSelect;
                    });

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

    // Initial Load
    useEffect(() => {
        const init = async () => {
            if (status === 'loading') return;
            if (status === 'authenticated') {
                try {
                    const prefsResponse = await fetch('/api/user/preferences');
                    if (prefsResponse.ok) {
                        const prefs = await prefsResponse.json();
                        await fetchTeamsWithPreference(prefs.activeTeamId);
                    } else {
                        await fetchTeams();
                    }
                } catch (e) {
                    console.error('Failed to load preferences', e);
                    await fetchTeams();
                }
            } else {
                await fetchTeams();
            }
            setIsLoadingTeams(false);
        };
        init();
    }, [status]); // eslint-disable-line react-hooks/exhaustive-deps

    // Persistence when team changes
    useEffect(() => {
        if (currentTeam) {
            localStorage.setItem('drachenboot_team_id', currentTeam.id);
            if (status === 'authenticated') {
                fetch('/api/user/preferences', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ activeTeamId: currentTeam.id }),
                }).catch(e => console.error('Failed to save active team preference', e));
            }
        } else {
            // Only clear if we actually have initialized and know there are no teams
            // This avoids clearing on initial load
            if (!isLoadingTeams && teams.length === 0) {
                localStorage.removeItem('drachenboot_team_id');
            }
        }
    }, [currentTeam, status, isLoadingTeams, teams.length]);

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
                setCurrentTeam(newTeam);
                return newTeam;
            }
        } catch (e) {
            console.error('Failed to create team', e);
        }
        return null;
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
            const res = await fetch(`/api/teams/${id}`, { method: 'DELETE' });
            if (res.ok) {
                setTeams(prev => prev.filter(t => t.id !== id));
                if (currentTeam?.id === id) {
                    const remainingTeams = teams.filter(t => t.id !== id);
                    if (remainingTeams.length > 0) {
                        setCurrentTeam(remainingTeams[0]);
                    } else {
                        setCurrentTeam(null);
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
            setCurrentTeam(team);
        }
    }, [teams]);

    return (
        <TeamContext.Provider value={{
            teams,
            currentTeam,
            createTeam,
            updateTeam,
            deleteTeam,
            switchTeam,
            isLoadingTeams,
            refetchTeams: fetchTeams
        }}>
            {children}
        </TeamContext.Provider>
    );
};
