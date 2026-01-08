"use client";

import { usePathname } from '@/i18n/routing';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { driver, Driver } from 'driver.js';
import 'driver.js/dist/driver.css';


import { useTeam } from '@/context/TeamContext';

import { useTranslations } from 'next-intl';

interface TourContextType {
  startTour: (tourName?: string) => void;
  checkAndStartTour: (tourName: string) => void;
}

const TourContext = createContext<TourContextType | undefined>(undefined);

export const useTour = () => {
  const context = useContext(TourContext);
  if (!context) {
    throw new Error('useTour must be used within a TourProvider');
  }
  return context;
};

export const TourProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [driverObj, setDriverObj] = useState<Driver | null>(null);
  const t = useTranslations();
  const { currentTeam } = useTeam();

  // Define tour configurations
  const tours = React.useMemo(() => ({
    welcome: [
      {
        element: '#tour-welcome',
        popover: {
          title: t('tourWelcomeTitle'),
          description: t('tourWelcomeDesc'),
          side: "center",
          align: 'center'
        }
      },
      {
        element: '#tour-new-event',
        popover: {
          title: t('tourNewEventTitle'),
          description: t('tourNewEventDesc'),
          side: "right",
          align: 'start'
        }
      },
      {
        element: '#tour-paddler-form',
        popover: {
          title: t('tourMembersTitle'),
          description: t('tourMembersDesc'),
          side: "left",
          align: 'start'
        }
      },
      {
        element: '#tour-event-list',
        popover: {
          title: t('tourEventListTitle'),
          description: t('tourEventListDesc'),
          side: "right",
          align: 'start'
        }
      },
      {
        element: '#tour-paddler-grid',
        popover: {
          title: t('tourSquadTitle'),
          description: t('tourSquadDesc'),
          side: "top",
          align: 'start'
        }
      }
    ],
    planner: [
      {
        element: '#tour-planner-stats',
        popover: {
          title: t('tourStatsTitle'),
          description: t('tourStatsDesc'),
          side: "right",
          align: 'start'
        }
      },
      {
        element: '#tour-planner-boat-size',
        popover: {
          title: t('tourBoatSizeTitle'),
          description: t('tourBoatSizeDesc'),
          side: "right",
          align: 'start'
        }
      },
      {
        element: '#tour-planner-pool',
        popover: {
          title: t('tourPoolTitle'),
          description: t('tourPoolDesc'),
          side: "right",
          align: 'start'
        }
      },
      {
        element: '#tour-planner-canister',
        popover: {
          title: t('tourCanisterTitle'),
          description: t('tourCanisterDesc'),
          side: "bottom",
          align: 'end'
        }
      },
      {
        element: '#tour-planner-guest',
        popover: {
          title: t('tourGuestTitle'),
          description: t('tourGuestDesc'),
          side: "bottom",
          align: 'end'
        }
      },
      {
        element: '#tour-planner-boat',
        popover: {
          title: t('tourBoatTitle'),
          description: t('tourBoatDesc'),
          side: "left",
          align: 'start'
        }
      },
      {
        element: '#tour-planner-autofill',
        popover: {
          title: t('tourMagicAITitle'),
          description: t('tourMagicAIDesc'),
          side: "top",
          align: 'center'
        }
      },
      {
        element: '#tour-planner-export',
        popover: {
          title: t('tourExportTitle'),
          description: t('tourExportDesc'),
          side: "top",
          align: 'center'
        }
      }
    ]
  }), [t]);

  useEffect(() => {
    const driverInstance = driver({
      showProgress: true,
      animate: true,
      doneBtnText: t('tourDone'),
      nextBtnText: t('tourNext'),
      prevBtnText: t('tourPrev'),
      // Steps will be set dynamically
    });

    // We use a small timeout to ensure DOM is ready and avoid synchronous state update in effect
    const timer = setTimeout(() => {
      setDriverObj(driverInstance);
    }, 0);

    return () => clearTimeout(timer);
  }, [t]);

  // Fetch seen tours from backend on mount
  const [seenTours, setSeenTours] = useState<string[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const fetchPreferences = async () => {
      try {
        const res = await fetch('/api/user/preferences');
        if (res.ok) {
          const data = await res.json();
          setSeenTours(data.toursSeen || []);
        }
      } catch (e) {
        console.error('Failed to fetch user preferences', e);
      } finally {
        setIsLoaded(true);
      }
    };
    fetchPreferences();
  }, []);

  const markTourAsSeen = React.useCallback(async (tourName: string) => {
    // Optimistic update
    setSeenTours(prev => [...prev, tourName]);
    localStorage.setItem(`${tourName}_tour_seen`, 'true');

    try {
      await fetch('/api/user/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toursSeen: [...seenTours, tourName] }),
      });
    } catch (e) {
      console.error('Failed to save tour preference', e);
    }
  }, [seenTours]);

  const startTour = React.useCallback((tourName = 'welcome') => {
    if (driverObj && tours[tourName as keyof typeof tours]) {
      driverObj.setConfig({
        showProgress: true,
        animate: true,
        doneBtnText: t('tourDone'),
        nextBtnText: t('tourNext'),
        prevBtnText: t('tourPrev'),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        steps: tours[tourName as keyof typeof tours] as any[],
        onDestroyed: () => {
          markTourAsSeen(tourName);
        }
      });
      driverObj.drive();
    }
  }, [driverObj, tours, t, markTourAsSeen]);

  const checkAndStartTour = React.useCallback((tourName: string) => {
    if (!isLoaded) return; // Wait for API

    // Check both local storage (legacy/fallback) and API state
    const localSeen = localStorage.getItem(`${tourName}_tour_seen`);
    const apiSeen = seenTours.includes(tourName);

    if (!localSeen && !apiSeen && driverObj) {
      startTour(tourName);
    }
  }, [driverObj, startTour, seenTours, isLoaded]);

  // Check on mount if we should start welcome tour
  const pathname = usePathname();

  useEffect(() => {
    if (driverObj && currentTeam && isLoaded) {
      const timer = setTimeout(() => {
        if (pathname === '/app') {
          checkAndStartTour('welcome');
        }
      }, 1000); // Increased timeout slightly to ensure UI is settled
      return () => clearTimeout(timer);
    }
  }, [driverObj, checkAndStartTour, currentTeam, isLoaded, pathname]);

  return (
    <TourContext.Provider value={{ startTour, checkAndStartTour }}>
      {children}
    </TourContext.Provider>
  );
};
