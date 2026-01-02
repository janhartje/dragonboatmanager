import { NextResponse } from 'next/server';
import { getSession, sendSseEvent } from '@/lib/mcp-streams';
import { tools } from '@/mcp/tools';

export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 });
    }

    const session = getSession(sessionId);
    if (!session) {
      return NextResponse.json({ error: 'Session not found or expired' }, { status: 404 });
    }

    const body = await request.json();
    const { method, id, params } = body;

    console.log(`[MCP] Received message for session ${sessionId}:`, method);

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
      
      // Also send initialized notification
      // setTimeout(() => {
      //   sendSseEvent(session.controller, 'message', {
      //     jsonrpc: '2.0',
      //     method: 'notifications/initialized',
      //   });
      // }, 100);

      return NextResponse.json({ accepted: true });
    }

    if (method === 'notifications/initialized') {
      // Client ack
      return NextResponse.json({ accepted: true });
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
      return NextResponse.json({ accepted: true });
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
        return NextResponse.json({ accepted: true });
      }

      // Execute tool asynchronously
      (async () => {
        try {
          // Use apiKey from session

          const validatedInput = tool.inputSchema.parse(args || {});

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

      return NextResponse.json({ accepted: true });
    }

    if (method === 'ping') {
        sendSseEvent(session.controller, 'message', {
            jsonrpc: '2.0',
            id,
            result: {},
        });
        return NextResponse.json({ accepted: true });
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

    return NextResponse.json({ accepted: true });

  } catch (error) {
    console.error('[MCP] Error processing message:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
