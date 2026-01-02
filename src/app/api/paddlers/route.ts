import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthContext } from '@/lib/api-auth';

export async function GET(request: Request) {
  const authContext = await getAuthContext(request);
  if (authContext.type === 'none') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const requestedTeamId = searchParams.get('teamId');

  try {
    let paddlers;
    const roleMap = new Map<string, string>();
    let currentUserId: string | undefined;

    // API Key Case
    if (authContext.type === 'apiKey') {
        const teamId = authContext.teamId;
        // If query param provided, verify it matches
        if (requestedTeamId && requestedTeamId !== teamId) {
             return NextResponse.json({ error: 'Unauthorized - API Key does not match team' }, { status: 403 });
        }

        // Fetch all paddlers for this team
        paddlers = await prisma.paddler.findMany({
            where: { teamId },
            orderBy: { name: 'asc' },
            include: { user: { select: { email: true, name: true, image: true } } }
        });
        
        // Return full data for API Key (assumed admin/tool access)
        return NextResponse.json(paddlers);
    }

    // Session Case
    if (authContext.type === 'session' && authContext.user?.id) {
        currentUserId = authContext.user.id;
        const teamId = requestedTeamId;

        // OPTIMIZATION: Parallelize fetches
        if (teamId) {
            const [membership, fetchedPaddlers] = await Promise.all([
                prisma.paddler.findFirst({
                where: { teamId, userId: currentUserId },
                select: { role: true }
                }),
                prisma.paddler.findMany({
                where: { teamId },
                orderBy: { name: 'asc' },
                include: {
                    user: { select: { email: true, name: true, image: true } }
                }
                })
            ]);

            if (!membership) {
                return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
            }
            
            paddlers = fetchedPaddlers;
            roleMap.set(teamId, membership.role);

        } else {
            // Logic for multi-team fetch
            // 1. Get user's team IDs
            const userMemberships = await prisma.paddler.findMany({
                where: { userId: currentUserId },
                select: { teamId: true, role: true }
            });
            
            const teamIds = userMemberships.map((m: { teamId: string | null }) => m.teamId).filter(Boolean) as string[];
            
            if (teamIds.length === 0) return NextResponse.json([]);

            userMemberships.forEach((m: { teamId: string | null, role: string }) => {
                if (m.teamId) roleMap.set(m.teamId, m.role);
            });

            // 2. Fetch all paddlers in these teams
            paddlers = await prisma.paddler.findMany({
                where: { teamId: { in: teamIds } },
                orderBy: { name: 'asc' },
                include: {
                    user: { select: { email: true, name: true, image: true } }
                }
            });
        }

        // Redact weight if not CAPTAIN and not own record
        const redactedPaddlers = paddlers.map((p: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
            const requesterRole = p.teamId ? roleMap.get(p.teamId) : null;
            const isOwnRecord = p.userId === currentUserId;
            if (requesterRole !== 'CAPTAIN' && !isOwnRecord) {
                return { ...p, weight: 0 }; 
            }
            return p;
        });

        return NextResponse.json(redactedPaddlers);
    }

    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch paddlers' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const authContext = await getAuthContext(request);
  if (authContext.type === 'none') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();

    if (authContext.type === 'apiKey') {
        if (body.teamId && body.teamId !== authContext.teamId) {
             return NextResponse.json({ error: 'Unauthorized - API Key does not match team' }, { status: 403 });
        }
        // Force teamId from API Key
        body.teamId = authContext.teamId;

        // No limit check for API key? Or use same logic?
        // Let's implement limit check for robustness
        const team = await prisma.team.findUnique({ where: { id: authContext.teamId } });
        if (team && team.plan !== 'PRO' && team.maxMembers) {
             const currentCount = await prisma.paddler.count({ where: { teamId: body.teamId } });
             if (currentCount >= team.maxMembers) {
                return NextResponse.json({ error: 'Team limit reached' }, { status: 403 });
             }
        }
    } else if (authContext.type === 'session' && authContext.user?.id) {
        // Verify user is a member of the team
        const membership = await prisma.paddler.findFirst({
        where: {
            teamId: body.teamId,
            userId: authContext.user.id,
        },
        include: {
            team: true
        }
        });

        if (!membership || membership.role !== 'CAPTAIN') {
        return NextResponse.json({ error: 'Unauthorized: Only captains can add members' }, { status: 403 });
        }

        // Check team limit
        if (membership.team && membership.team.plan !== 'PRO' && membership.team.maxMembers) {
        const currentCount = await prisma.paddler.count({
            where: { teamId: body.teamId }
        });
        
        if (currentCount >= membership.team.maxMembers) {
            return NextResponse.json({ error: 'Team limit reached' }, { status: 403 });
        }
        }
    }

    const paddler = await prisma.paddler.create({
      data: {
        name: body.name,
        weight: body.weight,

        skills: body.skills,
        isGuest: body.isGuest || false,
        teamId: body.teamId,
        role: 'PADDLER', // Ensure role is set
      },
    });
    return NextResponse.json(paddler);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to create paddler' }, { status: 500 });
  }
}
