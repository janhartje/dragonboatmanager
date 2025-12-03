import { Paddler, Event, Assignments } from '../types';

interface AppData {
  paddlers: Paddler[];
  events: Event[];
  assignmentsByEvent: Record<number, Assignments>;
  darkMode?: boolean;
  targetTrim?: number;
}

export const db = {
  KEY: 'drachenboot_pwa_data_v4',
  load: (): AppData | null => {
    if (typeof window === 'undefined') return null;
    try {
      const data = localStorage.getItem('drachenboot_pwa_data_v4');
      if (data) return JSON.parse(data);
    } catch (e) {
      console.error('Ladefehler', e);
    }
    return null;
  },
  save: (data: AppData): void => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem('drachenboot_pwa_data_v4', JSON.stringify(data));
    } catch (e) {
      console.error('Speicherfehler', e);
    }
  },
};

export const seedInitialData = (): AppData => {
  const initialPaddlers: Paddler[] = [
    { id: 1, name: 'Alex', weight: 85, skills: ['left', 'right'] },
    { id: 2, name: 'Anna', weight: 55, skills: ['drum', 'left', 'right'] },
    { id: 3, name: 'Christopher', weight: 82, skills: ['left'] },
    { id: 4, name: 'David', weight: 95, skills: ['left', 'right', 'steer'] },
    { id: 5, name: 'Jana', weight: 54, skills: ['left'] },
    { id: 6, name: 'Julia', weight: 58, skills: ['drum', 'right'] },
    { id: 7, name: 'Lisa', weight: 62, skills: ['left'] },
    { id: 8, name: 'Maria', weight: 63, skills: ['right'] },
    { id: 9, name: 'Michael', weight: 92, skills: ['right'] },
    { id: 10, name: 'Nina', weight: 60, skills: ['right'] },
    { id: 11, name: 'Robert', weight: 89, skills: ['left'] },
    { id: 12, name: 'Sarah', weight: 65, skills: ['left'] },
    { id: 13, name: 'Sophie', weight: 59, skills: ['right'] },
    { id: 14, name: 'Stefan', weight: 98, skills: ['right', 'steer'] },
    { id: 15, name: 'Thomas', weight: 88, skills: ['right'] },
    { id: 16, name: 'Maximilian', weight: 78, skills: ['left'] },
  ];
  const initEventId = 1733000000000; // Fixed ID for stability
  return {
    paddlers: initialPaddlers,
    events: [
      {
        id: initEventId,
        title: 'Erstes Training',
        date: new Date().toISOString().split('T')[0],
        type: 'training',
        attendance: initialPaddlers.reduce(
          (acc, p) => ({ ...acc, [p.id]: 'yes' as const }),
          {} as Record<string, 'yes' | 'no' | 'maybe'>
        ),
      },
    ],
    assignmentsByEvent: { [initEventId]: {} },
  };
};
