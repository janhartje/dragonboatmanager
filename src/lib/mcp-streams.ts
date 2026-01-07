
export interface McpSession {
  id: string;
  controller: ReadableStreamDefaultController;
  apiKey: string;
  createdAt: number;
  isActive: boolean;
}



// Global store for active sessions (in-memory)
const activeSessions = new Map<string, McpSession>();

// Promises waiting for a session to be established (keyed by API key)
const sessionWaiters = new Map<string, Array<(session: McpSession) => void>>();

export function createSession(id: string, controller: ReadableStreamDefaultController, apiKey: string) {
  // Clean up any existing sessions for this API key
  for (const [, session] of activeSessions.entries()) {
    if (session.apiKey === apiKey) {
      session.isActive = false;
      activeSessions.delete(session.id);
    }
  }

  const newSession: McpSession = { id, controller, apiKey, createdAt: Date.now(), isActive: true };
  activeSessions.set(id, newSession);

  // Resolve any waiters for this API key
  const waiters = sessionWaiters.get(apiKey);
  if (waiters) {
    for (const resolve of waiters) {
      resolve(newSession);
    }
    sessionWaiters.delete(apiKey);
  }
}

export function getSession(id: string) {
  const session = activeSessions.get(id);
  return session?.isActive ? session : undefined;
}

export function getSessionByApiKey(apiKey: string) {
  // Find the most recent ACTIVE session for this API key
  let latestSession: McpSession | undefined;

  for (const session of activeSessions.values()) {
    if (session.apiKey === apiKey && session.isActive) {
      if (!latestSession || session.createdAt > latestSession.createdAt) {
        latestSession = session;
      }
    }
  }

  return latestSession;
}

/**
 * Wait for a session to be established for the given API key.
 * Returns the session if it already exists, or waits up to timeoutMs for one to be created.
 */
export function waitForSession(apiKey: string, timeoutMs: number = 5000): Promise<McpSession | null> {
  // Check if session already exists
  const existing = getSessionByApiKey(apiKey);
  if (existing) {
    return Promise.resolve(existing);
  }

  // Wait for session to be created
  return new Promise((resolve) => {
    const waiters = sessionWaiters.get(apiKey) || [];
    waiters.push(resolve);
    sessionWaiters.set(apiKey, waiters);

    // Timeout after specified duration
    setTimeout(() => {
      const currentWaiters = sessionWaiters.get(apiKey);
      if (currentWaiters) {
        const index = currentWaiters.indexOf(resolve);
        if (index !== -1) {
          currentWaiters.splice(index, 1);
          if (currentWaiters.length === 0) {
            sessionWaiters.delete(apiKey);
          }
        }
      }
      // Check one more time if session was created
      const session = getSessionByApiKey(apiKey);
      resolve(session ?? null);
    }, timeoutMs);
  });
}

export function removeSession(id: string) {
  const session = activeSessions.get(id);
  if (session) {
    session.isActive = false;
  }
  activeSessions.delete(id);
}

export function sendSseEvent(controller: ReadableStreamDefaultController, event: string, data: unknown): boolean {
  try {
    const encoder = new TextEncoder();
    const dataString = typeof data === 'string' ? data : JSON.stringify(data);
    const text = `event: ${event}\ndata: ${dataString}\n\n`;
    controller.enqueue(encoder.encode(text));
    return true;
  } catch (err) {
    // Handle ResponseAborted and other stream errors gracefully
    const errorName = err instanceof Error ? err.name : 'Unknown';
    if (errorName !== 'ResponseAborted') {
      console.error('[MCP] Error sending SSE event:', err);
    }
    return false;
  }
}

