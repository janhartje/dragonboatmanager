import { NextResponse } from 'next/server';
import { getSession, getSessionByApiKey, waitForSession, sendSseEvent } from '@/lib/mcp-streams';
import { tools } from '@/mcp/tools';

// Return 202 Accepted for SSE-based message handling
function accepted() {
  return new Response(null, { status: 202 });
}

export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    const apiKey = request.headers.get('x-api-key');

    // Try to find session by sessionId first, fall back to API key
    let session = sessionId ? getSession(sessionId) : null;
    
    if (!session && apiKey) {
      // Try immediate lookup first
      session = getSessionByApiKey(apiKey);
      
      if (!session) {
        // Wait for session to be established (SSE connection is happening in parallel)
        session = await waitForSession(apiKey, 3000);
      }
    }

    if (!session) {
      return NextResponse.json({ error: 'Session not found. SSE connection not established.' }, { status: 404 });
    }

    const body = await request.json();
    const { method, id, params } = body;

    // Handle basic JSON-RPC methods
    if (method === 'initialize') {
      sendSseEvent(session.controller, 'message', {
        jsonrpc: '2.0',
        id,
        result: {
          protocolVersion: '2024-11-05',
          capabilities: {
            tools: {},
          },
          serverInfo: {
            name: 'drachenboot-manager',
            version: '1.0.0',
          },
        },
      });
      return accepted();
    }

    if (method === 'notifications/initialized' || method === 'notifications/cancelled') {
      // Client notifications - just acknowledge
      return accepted();
    }

    if (method === 'tools/list') {
      sendSseEvent(session.controller, 'message', {
        jsonrpc: '2.0',
        id,
        result: {
          tools: tools.map((tool) => ({
            name: tool.name,
            description: tool.description,
            inputSchema: {
              type: 'object',
              properties: tool.inputSchema.shape
                ? Object.entries(tool.inputSchema.shape).reduce(
                    (acc, [key, value]) => {
                      acc[key] = {
                        type: 'string', 
                        description: (value as { description?: string }).description || '',
                      };
                      return acc;
                    },
                    {} as Record<string, { type: string; description: string }>
                  )
                : {},
            },
          })),
        },
      });
      return accepted();
    }

    if (method === 'prompts/list') {
      // We don't have prompts, return empty list
      sendSseEvent(session.controller, 'message', {
        jsonrpc: '2.0',
        id,
        result: {
          prompts: [],
        },
      });
      return accepted();
    }

    if (method === 'resources/list') {
      // We don't have resources, return empty list
      sendSseEvent(session.controller, 'message', {
        jsonrpc: '2.0',
        id,
        result: {
          resources: [],
        },
      });
      return accepted();
    }

    if (method === 'tools/call') {
      const { name, arguments: args } = params || {};
      const tool = tools.find((t) => t.name === name);

      if (!tool) {
        sendSseEvent(session.controller, 'message', {
          jsonrpc: '2.0',
          id,
          error: {
            code: -32601,
            message: `Unknown tool: ${name}`,
          },
        });
        return accepted();
      }

      // Execute tool asynchronously
      (async () => {
        try {
          const validatedInput = tool.inputSchema.parse(args || {});

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const result = await tool.execute(session.apiKey, validatedInput as any);

          sendSseEvent(session.controller, 'message', {
            jsonrpc: '2.0',
            id,
            result: {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(result, null, 2),
                },
              ],
            },
          });
        } catch (error) {
          sendSseEvent(session.controller, 'message', {
            jsonrpc: '2.0',
            id,
            error: {
              code: -32000,
              message: error instanceof Error ? error.message : 'Tool execution failed',
            },
          });
        }
      })();

      return accepted();
    }

    if (method === 'ping') {
      sendSseEvent(session.controller, 'message', {
        jsonrpc: '2.0',
        id,
        result: {},
      });
      return accepted();
    }

    // Default: Method not found
    sendSseEvent(session.controller, 'message', {
      jsonrpc: '2.0',
      id,
      error: {
        code: -32601,
        message: `Method not found: ${method}`,
      },
    });

    return accepted();

  } catch (error) {
    console.error('[MCP] Error processing message:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
