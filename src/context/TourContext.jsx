"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';

import { useLanguage } from '@/context/LanguageContext';

const TourContext = createContext();

export const useTour = () => useContext(TourContext);

export const TourProvider = ({ children }) => {
  const [driverObj, setDriverObj] = useState(null);
  const { t } = useLanguage();

  // Define tour configurations
  const tours = {
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
  };

  useEffect(() => {
    const driverInstance = driver({
      showProgress: true,
      animate: true,
      doneBtnText: t('tourDone'),
      nextBtnText: t('tourNext'),
      prevBtnText: t('tourPrev'),
      // Steps will be set dynamically
    });

    setDriverObj(driverInstance);
  }, [t]);

  const startTour = (tourName = 'welcome') => {
    if (driverObj && tours[tourName]) {
      driverObj.setConfig({
        steps: tours[tourName],
        onDestroyed: () => {
          localStorage.setItem(`${tourName}_tour_seen`, 'true');
        }
      });
      driverObj.drive();
    }
  };

  const checkAndStartTour = (tourName) => {
    const tourSeen = localStorage.getItem(`${tourName}_tour_seen`);
    if (!tourSeen && driverObj) {
      startTour(tourName);
    }
  };

  // Check on mount if we should start welcome tour
  useEffect(() => {
    if (driverObj) {
        setTimeout(() => {
             // Only auto-start welcome tour on main page, logic handled by component usage or here if we check path
             if (window.location.pathname === '/') {
                checkAndStartTour('welcome');
             }
        }, 500);
    }
  }, [driverObj]);

  return (
    <TourContext.Provider value={{ startTour, checkAndStartTour }}>
      {children}
    </TourContext.Provider>
  );
};
