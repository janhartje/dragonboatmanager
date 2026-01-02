import { NextResponse } from 'next/server';
import { validateApiKey } from '@/lib/mcp-auth';
import { tools } from '@/mcp/tools';

/**
 * POST /api/mcp
 * HTTP endpoint for MCP tool execution
 * Enables MCP server to work on Vercel (serverless)
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Handle standard MCP JSON-RPC requests
    if (body.jsonrpc === '2.0') {
      const apiKey = request.headers.get('x-api-key') || body.params?.apiKey;
      
      // Basic API key validation for JSON-RPC (except for initialize which might not have it yet)
      // Note: In a real MCP setup, auth might be handled differently, but we'll enforce it here if possible.
      // However, 'initialize' often comes without headers in some clients.
      
      const { method, id, params } = body;

      if (method === 'initialize') {
        return NextResponse.json({
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
      }

      if (method === 'notifications/initialized') {
        return NextResponse.json({
          jsonrpc: '2.0',
          id,
          result: {},
        });
      }

      // For tools/list and tools/call, require authentication
      if (!apiKey || typeof apiKey !== 'string') {
        // Only return error if we strictly require it. 
        // Some discovery might happen without it? 
        // For now, let's try to validate if present, or error if missing for critical actions.
        if (method === 'tools/call') {
           return NextResponse.json({
            jsonrpc: '2.0',
            id,
            error: {
              code: -32602,
              message: 'API key is required in x-api-key header or params',
            },
          });
        }
      }

      if (method === 'tools/list') {
         return NextResponse.json({
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
                          type: 'string', // Simplified for discovery
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
      }

      if (method === 'tools/call') {
        const { name, arguments: args } = params;
        const tool = tools.find((t) => t.name === name);
        
        if (!tool) {
          return NextResponse.json({
            jsonrpc: '2.0',
            id,
            error: {
              code: -32601,
              message: `Unknown tool: ${name}`,
            },
          });
        }

        try {
          const auth = await validateApiKey(apiKey);
          if (!auth) {
             return NextResponse.json({
              jsonrpc: '2.0',
              id,
              error: {
                code: -32602,
                message: 'Invalid API key',
              },
            });
          }

          const validatedInput = tool.inputSchema.parse(args || {});
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const result = await tool.execute(apiKey, validatedInput as any);

          return NextResponse.json({
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
          return NextResponse.json({
            jsonrpc: '2.0',
            id,
            error: {
              code: -32000,
              message: error instanceof Error ? error.message : 'Tool execution failed',
            },
          });
        }
      }

      // Unknown method
      return NextResponse.json({
        jsonrpc: '2.0',
        id,
        error: {
          code: -32601,
          message: `Method not found: ${method}`,
        },
      });
    }

    const { tool: toolName, arguments: args } = body;

    // Check for API key in body (legacy) or header (x-api-key)
    const apiKey = body.apiKey || request.headers.get('x-api-key');

    if (!apiKey || typeof apiKey !== 'string') {
      return NextResponse.json(
        { error: 'API key is required' },
        { status: 401 }
      );
    }

    if (!toolName || typeof toolName !== 'string') {
      return NextResponse.json(
        { error: 'Tool name is required' },
        { status: 400 }
      );
    }

    // Validate API key
    const auth = await validateApiKey(apiKey);
    if (!auth) {
      return NextResponse.json(
        { error: 'Invalid API key' },
        { status: 401 }
      );
    }

    // Find the tool
    const tool = tools.find((t) => t.name === toolName);
    if (!tool) {
      return NextResponse.json(
        { error: `Unknown tool: ${toolName}` },
        { status: 404 }
      );
    }

    // Validate input
    const validatedInput = tool.inputSchema.parse(args || {});

    // Execute the tool
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await tool.execute(apiKey, validatedInput as any);

    return NextResponse.json({
      success: true,
      result,
    });
  } catch (error) {
    console.error('MCP tool execution error:', error);
    
    const message = error instanceof Error ? error.message : 'Tool execution failed';
    const isValidationError = error instanceof Error && error.name === 'ZodError';

    return NextResponse.json(
      {
        error: message,
        type: isValidationError ? 'validation_error' : 'execution_error',
      },
      { status: isValidationError ? 400 : 500 }
    );
  }
}

/**
 * GET /api/mcp
 * Returns list of available tools
 */
export async function GET() {
  return NextResponse.json({
    tools: tools.map((tool) => ({
      name: tool.name,
      description: tool.description,
    })),
  });
}
