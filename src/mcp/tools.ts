import { z } from 'zod';

// Base URL for API calls. In server context, we can use localhost or specific URL.
const getBaseUrl = () => {
    if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL;
    if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
    return 'http://localhost:3000';
};
const API_BASE_URL = getBaseUrl();

async function fetchApi(path: string, apiKey: string, options: RequestInit = {}) {
  const url = `${API_BASE_URL}${path}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'X-API-KEY': apiKey,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`API Error ${response.status}: ${errorBody}`);
  }

  return response.json();
}

/**
 * MCP Tool: List all teams the authenticated user has access to
 */
export const listTeamsTool = {
  name: 'list_teams',
  description: 'List all teams accessible with the current API key',
  inputSchema: z.object({}),
  execute: async (apiKey: string) => {
    return fetchApi('/api/teams', apiKey);
  },
};

/**
 * MCP Tool: Get team details
 */
export const getTeamTool = {
  name: 'get_team',
  description: 'Get detailed information about a specific team',
  inputSchema: z.object({
    teamId: z.string().describe('The team ID'),
  }),
  execute: async (apiKey: string, input: { teamId: string }) => {
    return fetchApi(`/api/teams/${input.teamId}`, apiKey);
  },
};

/**
 * MCP Tool: List paddlers in a team
 */
export const listPaddlersTool = {
  name: 'list_paddlers',
  description: 'List all paddlers in a team',
  inputSchema: z.object({
    teamId: z.string().describe('The team ID'),
  }),
  execute: async (apiKey: string, input: { teamId: string }) => {
    return fetchApi(`/api/paddlers?teamId=${input.teamId}`, apiKey);
  },
};


/**
 * MCP Tool: Create a new paddler
 */
export const createPaddlerTool = {
  name: 'create_paddler',
  description: 'Create a new regular paddler in a team (not a guest)',
  inputSchema: z.object({
    teamId: z.string().describe('The team ID'),
    name: z.string().describe('Paddler name'),
    weight: z.coerce.number().min(30).max(150).describe('Paddler weight in kg'),
    skills: z
      .preprocess(
        (val) => {
          if (typeof val === 'string') {
            return val.split(',').map((s) => s.trim());
          }
          return val;
        },
        z.array(z.enum(['left', 'right', 'drum', 'steer']))
      )
      .optional()
      .describe('Paddler skills/positions (array or comma-separated string)'),
  }),
  execute: async (
    apiKey: string,
    input: {
      teamId: string;
      name: string;
      weight: number;
      skills?: string[];
    }
  ) => {
    return fetchApi('/api/paddlers', apiKey, {
      method: 'POST',
      body: JSON.stringify({ ...input, isGuest: false }),
    });
  },
};

/**
 * MCP Tool: List events for a team
 */
export const listEventsTool = {
  name: 'list_events',
  description: 'List events (trainings and regattas) for a team',
  inputSchema: z.object({
    teamId: z.string().describe('The team ID'),
  }),
  execute: async (apiKey: string, input: { teamId: string }) => {
    return fetchApi(`/api/events?teamId=${input.teamId}`, apiKey);
  },
};

/**
 * MCP Tool: Add a guest to an event
 */
export const addGuestTool = {
  name: 'add_guest',
  description: 'Add a temporary guest paddler to an event',
  inputSchema: z.object({
    eventId: z.string().describe('The event ID'),
    name: z.string().describe('Guest name'),
    weight: z.coerce.number().min(30).max(150).describe('Guest weight in kg'),
    skills: z
      .preprocess(
        (val) => {
          if (typeof val === 'string') {
            return val.split(',').map((s) => s.trim());
          }
          return val;
        },
        z.array(z.enum(['left', 'right', 'drum', 'steer']))
      )
      .optional()
      .describe('Guest skills (array or comma-separated string)'),
  }),
  execute: async (
    apiKey: string,
    input: { eventId: string; name: string; weight: number; skills?: string[] }
  ) => {
    return fetchApi(`/api/events/${input.eventId}/guests`, apiKey, {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },
};

/**
 * MCP Tool: Remove a guest from an event
 */
export const removeGuestTool = {
    name: 'remove_guest',
    description: 'Remove a temporary guest paddler from an event',
    inputSchema: z.object({
        eventId: z.string().describe('The event ID'),
        guestId: z.string().describe('The guest ID to remove'),
    }),
    execute: async (
        apiKey: string,
        input: { eventId: string; guestId: string }
    ) => {
        return fetchApi(`/api/events/${input.eventId}/guests/${input.guestId}`, apiKey, {
            method: 'DELETE'
        });
    }
}

/**
 * MCP Tool: Get event assignments (boat lineup)
 */
export const getAssignmentsTool = {
  name: 'get_assignments',
  description: 'Get the boat assignments (lineup) for an event',
  inputSchema: z.object({
    eventId: z.string().describe('The event ID'),
  }),
  execute: async (apiKey: string, input: { eventId: string }) => {
    return fetchApi(`/api/events/${input.eventId}/assignments`, apiKey);
  },
};

/**
 * MCP Tool: Set attendance for a paddler at an event
 */
export const setAttendanceTool = {
  name: 'set_attendance',
  description: 'Set attendance status (yes/no/maybe) for a paddler at an event',
  inputSchema: z.object({
    eventId: z.string().describe('The event ID'),
    paddlerId: z.string().describe('The paddler ID'),
    status: z.enum(['yes', 'no', 'maybe']).describe('Attendance status'),
  }),
  execute: async (
    apiKey: string,
    input: { eventId: string; paddlerId: string; status: 'yes' | 'no' | 'maybe' }
  ) => {
    return fetchApi(`/api/events/${input.eventId}/attendance`, apiKey, {
      method: 'POST',
      body: JSON.stringify({ paddlerId: input.paddlerId, status: input.status }),
    });
  },
};

/**
 * MCP Tool: Update boat assignment (seat planning)
 */
export const updateAssignmentTool = {
  name: 'update_assignment',
  description: 'Assign a paddler to a specific seat. IMPORTANT: If moving a paddler, clear their old seat first (set paddlerId=null).',
  inputSchema: z.object({
    eventId: z.string().describe('The event ID'),
    seatId: z.string().describe('The seat identifier (e.g., "row-1-left", "drummer")'),
    paddlerId: z.string().optional().nullable().describe('Paddler ID to assign, or null to clear seat'),
    isCanister: z
      .preprocess((val) => {
        if (typeof val === 'string') return val === 'true';
        return val;
      }, z.boolean().optional())
      .describe('Set to true if this seat is a water canister (weight dummy)'),
  }),
  execute: async (
    apiKey: string,
    input: { eventId: string; seatId: string; paddlerId?: string | null; isCanister?: boolean }
  ) => {
    return fetchApi(`/api/events/${input.eventId}/assignments`, apiKey, {
      method: 'PATCH',
      body: JSON.stringify({
        seatId: input.seatId,
        paddlerId: input.paddlerId,
        isCanister: input.isCanister,
      }),
    });
  },
};

/**
 * MCP Tool: Update event details
 */
export const updateEventTool = {
  name: 'update_event',
  description: 'Update event details (title, date, comment, type)',
  inputSchema: z.object({
    eventId: z.string().describe('The event ID'),
    title: z.string().optional().describe('Event title'),
    date: z.string().optional().describe('Date string (ISO)'),
    comment: z.string().optional().describe('Comment/Description'),
    type: z.enum(['training', 'regatta']).optional().describe('Event type'),
    boatSize: z.enum(['standard', 'small']).optional().describe('Boat size'),
  }),
  execute: async (
    apiKey: string,
    input: {
      eventId: string;
      title?: string;
      date?: string;
      comment?: string;
      type?: 'training' | 'regatta';
      boatSize?: 'standard' | 'small';
    }
  ) => {
    return fetchApi(`/api/events/${input.eventId}`, apiKey, {
      method: 'PUT',
      body: JSON.stringify(input),
    });
  },
};

/**
 * MCP Tool: Create a new event
 */
export const createEventTool = {
  name: 'create_event',
  description: 'Create a new event',
  inputSchema: z.object({
    teamId: z.string().describe('The team ID'),
    title: z.string().describe('Event title'),
    date: z.string().describe('Date string (ISO)'),
    comment: z.string().optional().describe('Comment/Description'),
    type: z.enum(['training', 'regatta']).optional().describe('Event type'),
    boatSize: z.enum(['standard', 'small']).optional().describe('Boat size'),
  }),
  execute: async (
    apiKey: string,
    input: {
      teamId: string;
      title: string;
      date: string;
      comment?: string;
      type?: 'training' | 'regatta';
      boatSize?: 'standard' | 'small';
    }
  ) => {
    return fetchApi('/api/events', apiKey, {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },
};

/**
 * MCP Tool: Save seating plan (bulk assignment)
 */
export const saveSeatingPlanTool = {
  name: 'save_seating_plan',
  description: 'Save a complete seating plan (boat assignment) for an event',
  inputSchema: z.object({
    eventId: z.string().describe('The event ID'),
    assignments: z
      .preprocess(
        (val) => {
          if (typeof val === 'string') {
            try {
              return JSON.parse(val);
            } catch {
              return val;
            }
          }
          return val;
        },
        z.record(z.string(), z.string().nullable())
      )
      .describe('Map of Seat ID to Paddler ID (or null/empty to clear). Key: "seatId", Value: "paddlerId"'),
  }),
  execute: async (
    apiKey: string,
    input: { eventId: string; assignments: Record<string, string | null> }
  ) => {
    return fetchApi(`/api/events/${input.eventId}/assignments`, apiKey, {
      method: 'POST',
      body: JSON.stringify({ assignments: input.assignments }),
    });
  },
};

/**
 * MCP Tool: Delete an event
 */
export const deleteEventTool = {
  name: 'delete_event',
  description: 'Delete an event completely (including assignments and attendance)',
  inputSchema: z.object({
    eventId: z.string().describe('The event ID'),
  }),
  execute: async (apiKey: string, input: { eventId: string }) => {
    return fetchApi(`/api/events/${input.eventId}`, apiKey, {
      method: 'DELETE',
    });
  },
};

/**
 * MCP Tool: Delete attendance (reset status)
 */
export const deleteAttendanceTool = {
  name: 'delete_attendance',
  description: 'Remove attendance record for a paddler (reset to no response)',
  inputSchema: z.object({
    eventId: z.string().describe('The event ID'),
    paddlerId: z.string().describe('The paddler ID'),
  }),
  execute: async (apiKey: string, input: { eventId: string; paddlerId: string }) => {
    return fetchApi(`/api/events/${input.eventId}/attendance?paddlerId=${input.paddlerId}`, apiKey, {
      method: 'DELETE',
    });
  },
};

/**
 * MCP Tool: Delete/Clear assignment for a seat
 */
export const deleteAssignmentSeatTool = {
  name: 'delete_assignment_seat',
  description: 'Clear a seat assignment (remove paddler from seat)',
  inputSchema: z.object({
    eventId: z.string().describe('The event ID'),
    seatId: z.string().describe('The seat identifier to clear'),
  }),
  execute: async (apiKey: string, input: { eventId: string; seatId: string }) => {
    return fetchApi(`/api/events/${input.eventId}/assignments`, apiKey, {
      method: 'PATCH',
      body: JSON.stringify({
        seatId: input.seatId,
        paddlerId: null,
      }),
    });
  },
};

/**
 * MCP Tool: Add a weight canister
 */
export const addCanisterTool = {
  name: 'add_canister',
  description: 'Add a single weight canister (25kg) to an event. Use for balancing optimization, preferably at the back.',
  inputSchema: z.object({
    eventId: z.string().describe('The event ID'),
  }),
  execute: async (apiKey: string, input: { eventId: string }) => {
    return fetchApi(`/api/events/${input.eventId}/canisters`, apiKey, {
      method: 'POST',
      body: JSON.stringify({}),
    });
  },
};

/**
 * MCP Tool: Remove a weight canister
 */
export const removeCanisterTool = {
  name: 'remove_canister',
  description: 'Remove a weight canister from an event. Fails if canister is currently assigned to a seat.',
  inputSchema: z.object({
    eventId: z.string().describe('The event ID'),
    canisterId: z.string().describe('The canister ID to remove (e.g. "canister-1")'),
  }),
  execute: async (apiKey: string, input: { eventId: string; canisterId: string }) => {
    return fetchApi(`/api/events/${input.eventId}/canisters?canisterId=${input.canisterId}`, apiKey, {
      method: 'DELETE',
    });
  },
};

export const tools = [
  listTeamsTool,
  getTeamTool,
  listPaddlersTool,
  createPaddlerTool,
  listEventsTool,
  createEventTool,
  addGuestTool,
  removeGuestTool,
  getAssignmentsTool,
  setAttendanceTool,
  updateAssignmentTool,
  updateEventTool,
  saveSeatingPlanTool,
  deleteEventTool,
  deleteAttendanceTool,
  deleteAssignmentSeatTool,
  addCanisterTool,
  removeCanisterTool,
];
