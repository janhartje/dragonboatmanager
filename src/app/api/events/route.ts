import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
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
    const roleMap = new Map<string, string>();
    let whereClause: Prisma.EventWhereInput = {};

    // API Key Case
    if (authContext.type === 'apiKey') {
        const teamId = authContext.teamId;
         if (requestedTeamId && requestedTeamId !== teamId) {
             return NextResponse.json({ error: 'Unauthorized - API Key does not match team' }, { status: 403 });
        }
        whereClause = { teamId };
        roleMap.set(teamId, 'CAPTAIN'); // Treat API Key as Captain for visibility
    } 
    // Session Case
    else if (authContext.type === 'session' && authContext.user?.id) {
        // Optimization: Fetch all user memberships in one go.
        const userMemberships = await prisma.paddler.findMany({
        where: { userId: authContext.user.id },
        select: { teamId: true, role: true },
        });

        const userTeamIds: string[] = [];

        userMemberships.forEach(m => {
        if (m.teamId) {
            roleMap.set(m.teamId, m.role);
            userTeamIds.push(m.teamId);
        }
        });

        if (userTeamIds.length === 0) {
        return NextResponse.json([]);
        }

        if (requestedTeamId) {
        if (!userTeamIds.includes(requestedTeamId)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }
        whereClause = { teamId: requestedTeamId };
        } else {
        whereClause = { teamId: { in: userTeamIds } };
        }
    }

    const events = await prisma.event.findMany({
      where: whereClause,
      include: {
        attendances: {
          include: {
            paddler: true
          }
        },
        assignments: true,
      },
      orderBy: { date: 'asc' },
    });

    const eventsWithGuests = events.map(event => {
      // Use the pre-fetched role map to check for CAPTAIN status
      const isCaptain = event.teamId && roleMap.get(event.teamId) === 'CAPTAIN';
      
      const guests = event.attendances
        .filter(a => a.paddler && a.paddler.isGuest)
        .map(a => {
          const p = a.paddler;
          if (!isCaptain) {
            return { ...p, weight: 0 };
          }
          return p;
        });
      
      return {
        ...event,
        guests
      };
    });

    return NextResponse.json(eventsWithGuests);
  } catch (error) {
    console.error('Error fetching events:', error);
    return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const authContext = await getAuthContext(request);
  if (authContext.type === 'none') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    
    // API Key Case
    if (authContext.type === 'apiKey') {
        if (body.teamId && body.teamId !== authContext.teamId) {
             return NextResponse.json({ error: 'Unauthorized - API Key does not match team' }, { status: 403 });
        }
        body.teamId = authContext.teamId;
    }
    // Session Case
    else if (authContext.type === 'session' && authContext.user?.id) {
        // Verify user is a member of the team
        const membership = await prisma.paddler.findFirst({
        where: {
            teamId: body.teamId,
            userId: authContext.user.id,
        },
        });

        if (!membership || membership.role !== 'CAPTAIN') {
        return NextResponse.json({ error: 'Unauthorized: Only captains can create events' }, { status: 403 });
        }
    }

    const event = await prisma.event.create({
      data: {
        title: body.title,
        date: new Date(body.date),
        comment: body.comment,
        type: body.type || 'training',
        boatSize: body.boatSize || 'standard',
        teamId: body.teamId,
      },
    });
    return NextResponse.json(event);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to create event' }, { status: 500 });
  }
}
