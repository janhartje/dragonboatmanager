export interface Team {
  id: string;
  name: string;
  website?: string;
  icon?: string;
  instagram?: string;
  facebook?: string;
  twitter?: string;
  email?: string;
  plan?: string;
  maxMembers?: number;
}

export interface Paddler {
  id: number | string;
  name: string;
  weight: number;
  skills: string[]; // e.g., 'left', 'right', 'drum', 'steer'
  isGuest?: boolean;
  isCanister?: boolean;
  teamId?: string;
  userId?: string;
  inviteEmail?: string; // Email for invited but not-yet-registered users
  role?: 'CAPTAIN' | 'PADDLER';
  priority?: number; // 1=Fixed, 2=Maybe, 3=Guest, 4=Canister
  user?: {
    email?: string | null;
    name?: string | null;
    image?: string | null;
  };
}

export interface Event {
  id: string;
  title: string;
  date: string; // ISO date string YYYY-MM-DDTHH:mm:ss
  comment?: string;
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
