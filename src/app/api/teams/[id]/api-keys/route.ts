import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/auth';
import { generateApiKey, checkMcpAccess } from '@/lib/mcp-auth';

/**
 * GET /api/teams/[id]/api-keys
 * List all API keys for a team (without exposing the key values)
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: teamId } = await params;

    // Check if user is captain of this team
    const paddler = await prisma.paddler.findFirst({
      where: {
        teamId,
        userId: session.user.id,
        role: 'CAPTAIN',
      },
    });

    if (!paddler) {
      return NextResponse.json(
        { error: 'Only team captains can view API keys' },
        { status: 403 }
      );
    }

    // Check if team has MCP access (PRO only)
    const hasMcpAccess = await checkMcpAccess(teamId);
    if (!hasMcpAccess) {
      return NextResponse.json(
        { error: 'MCP access requires PRO subscription' },
        { status: 403 }
      );
    }

    // Fetch API keys (without exposing the actual key values)
    const apiKeys = await prisma.apiKey.findMany({
      where: { teamId },
      select: {
        id: true,
        name: true,
        lastUsed: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(apiKeys);
  } catch (error) {
    console.error('Failed to fetch API keys:', error);
    return NextResponse.json(
      { error: 'Failed to fetch API keys' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/teams/[id]/api-keys
 * Create a new API key for a team
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: teamId } = await params;
    const { name } = await request.json();

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'API key name is required' },
        { status: 400 }
      );
    }

    // Check if user is captain of this team
    const paddler = await prisma.paddler.findFirst({
      where: {
        teamId,
        userId: session.user.id,
        role: 'CAPTAIN',
      },
    });

    if (!paddler) {
      return NextResponse.json(
        { error: 'Only team captains can create API keys' },
        { status: 403 }
      );
    }

    // Check if team has MCP access (PRO only)
    const hasMcpAccess = await checkMcpAccess(teamId);
    if (!hasMcpAccess) {
      return NextResponse.json(
        { error: 'MCP access requires PRO subscription' },
        { status: 403 }
      );
    }

    // Generate and store the API key
    const key = generateApiKey();
    const apiKey = await prisma.apiKey.create({
      data: {
        key,
        name: name.trim(),
        teamId,
      },
    });

    // Return the full key ONLY on creation
    // This is the only time the user will see the actual key value
    return NextResponse.json({
      id: apiKey.id,
      name: apiKey.name,
      key: apiKey.key, // Only returned on creation!
      createdAt: apiKey.createdAt,
    });
  } catch (error) {
    console.error('Failed to create API key:', error);
    return NextResponse.json(
      { error: 'Failed to create API key' },
      { status: 500 }
    );
  }
}
