import { NextResponse } from 'next/server';
import { validateApiKey, checkMcpAccess } from '@/lib/mcp-auth';
import { tools } from '@/mcp/tools';
import { createSession, removeSession } from '@/lib/mcp-streams';
import { randomUUID } from 'crypto';

/**
 * POST /api/mcp
 * Stateless HTTP endpoint for direct tool execution (Legacy/Direct)
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const apiKey = request.headers.get('x-api-key') || body.apiKey; // Check header first

    if (!apiKey || typeof apiKey !== 'string') {
      return NextResponse.json({ error: 'API key is required' }, { status: 401 });
    }

    const auth = await validateApiKey(apiKey);
    if (!auth) {
      return NextResponse.json({ error: 'Invalid API key' }, { status: 401 });
    }

    // Direct JSON-RPC or simplified format
    const isJsonRpc = body.jsonrpc === '2.0';
    const toolName = isJsonRpc ? body.params?.name : body.tool;
    const args = isJsonRpc ? body.params?.arguments : body.arguments;

    if (!toolName) {
       return NextResponse.json({ error: 'Tool name required' }, { status: 400 });
    }

    const tool = tools.find((t) => t.name === toolName);
    if (!tool) {
      return NextResponse.json({ error: `Unknown tool: ${toolName}` }, { status: 404 });
    }

    // Execute

    const validatedInput = tool.inputSchema.parse(args || {});

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await tool.execute(apiKey, validatedInput as any);

    if (isJsonRpc) {
       return NextResponse.json({
        jsonrpc: '2.0',
        id: body.id,
        result: {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }]
        }
      });
    }

    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error('MCP execution error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}

/**
 * GET /api/mcp
 * Establishes an SSE stream for MCP (Model Context Protocol)
 */
export async function GET(request: Request) {
  const apiKey = request.headers.get('x-api-key');

  if (!apiKey) {
    return new Response('Missing x-api-key header', { status: 401 });
  }

  const auth = await validateApiKey(apiKey);
  if (!auth) {
    return new Response('Invalid API key', { status: 401 });
  }

  const hasAccess = await checkMcpAccess(auth.teamId);
  if (!hasAccess) {
    return new Response('Team does not have MCP access (PRO required)', { status: 403 });
  }

  const sessionId = randomUUID();
  const encoder = new TextEncoder();
  
  // Create a readable stream that we control
  const stream = new ReadableStream({
    start(controller) {
      // Register the session immediately when stream starts
      createSession(sessionId, controller, apiKey);
      
      // Send the 'endpoint' event to tell client where to POST messages
      const origin = new URL(request.url).origin;
      const endpoint = `${origin}/api/mcp/messages?sessionId=${sessionId}`;
      const initEvent = `event: endpoint\ndata: ${endpoint}\n\n`;
      controller.enqueue(encoder.encode(initEvent));
    },
    cancel() {
      removeSession(sessionId);
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
