export interface Team {
  id: string;
  name: string;
}

export interface Paddler {
  id: number | string;
  name: string;
  weight: number;
  side?: 'left' | 'right' | 'both'; // 'both' is sometimes used for drummers/steers or flexible paddlers
  skills: string[]; // e.g., 'left', 'right', 'drum', 'steer'
  isGuest?: boolean;
  isCanister?: boolean;
  teamId?: string;
}

export interface Event {
  id: string;
  title: string;
  date: string; // ISO date string YYYY-MM-DD
  type: 'training' | 'regatta';
  boatSize: 'standard' | 'small';
  canisterCount: number;
  attendance: Record<string, 'yes' | 'no' | 'maybe'>; // map paddlerId -> status
  guests?: Paddler[];
  teamId?: string;
}

export interface Assignments {
  [seatId: string]: number | string; // seatId -> paddlerId
}

export interface BoatConfigItem {
  id: string;
  type: 'drummer' | 'paddler' | 'steer';
  side?: 'left' | 'right';
  row?: number;
}

export interface Stats {
  l: number; // left weight
  r: number; // right weight
  t: number; // total weight
  diffLR: number;
  f: number; // front weight
  b: number; // back weight
  diffFB: number;
  c: number; // count of assigned paddlers
}

export interface CGStats {
  x: number;
  y: number;
  targetY: number;
}
