"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { driver, Driver } from 'driver.js';
import 'driver.js/dist/driver.css';

import { useLanguage } from '@/context/LanguageContext';

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
  const { t } = useLanguage();

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
          localStorage.setItem(`${tourName}_tour_seen`, 'true');
        }
      });
      driverObj.drive();
    }
  }, [driverObj, tours, t]);

  const checkAndStartTour = React.useCallback((tourName: string) => {
    const tourSeen = localStorage.getItem(`${tourName}_tour_seen`);
    if (!tourSeen && driverObj) {
      startTour(tourName);
    }
  }, [driverObj, startTour]);

  // Check on mount if we should start welcome tour
  useEffect(() => {
    if (driverObj) {
        // Use a ref or simple condition to prevent double invocation in strict mode if needed, 
        // but driver.js prevents double drive usually.
        const timer = setTimeout(() => {
             // Only auto-start welcome tour on main page, logic handled by component usage or here if we check path
             if (window.location.pathname === '/') {
                checkAndStartTour('welcome');
             }
        }, 500);
        return () => clearTimeout(timer);
    }
  }, [driverObj, checkAndStartTour]);

  return (
    <TourContext.Provider value={{ startTour, checkAndStartTour }}>
      {children}
    </TourContext.Provider>
  );
};
