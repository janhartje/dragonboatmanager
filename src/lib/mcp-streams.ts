

export interface McpSession {
  id: string;
  controller: ReadableStreamDefaultController;
  apiKey: string;
}

// Global store for active sessions (in-memory)
// Note: This only works for a single-instance deployment (like local npm run start)
// For serverless/clustered environments, this would need an external store (Redis, etc.)
const activeSessions = new Map<string, McpSession>();

export function createSession(id: string, controller: ReadableStreamDefaultController, apiKey: string) {
  activeSessions.set(id, { id, controller, apiKey });
  console.log(`[MCP] Session created: ${id}`);
}

export function getSession(id: string) {
  return activeSessions.get(id);
}

export function removeSession(id: string) {
  activeSessions.delete(id);
  console.log(`[MCP] Session removed: ${id}`);
}

export function sendSseEvent(controller: ReadableStreamDefaultController, event: string, data: unknown) {
  try {
    const encoder = new TextEncoder();
    const dataString = typeof data === 'string' ? data : JSON.stringify(data);
    const text = `event: ${event}\ndata: ${dataString}\n\n`;
    controller.enqueue(encoder.encode(text));
  } catch (err) {
    console.error('[MCP] Error sending SSE event:', err);
  }
}
