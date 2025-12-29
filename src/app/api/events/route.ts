import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/auth';

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const requestedTeamId = searchParams.get('teamId');

  try {
    // Optimization: Fetch all user memberships in one go.
    // This serves two purposes:
    // 1. Validates access to the requested team API (or determines which teams to fetch for)
    // 2. Provides the roles needed to determine if the user is a CAPTAIN (for guest visibility)
    const userMemberships = await prisma.paddler.findMany({
      where: { userId: session.user.id },
      select: { teamId: true, role: true },
    });

    const roleMap = new Map<string, string>();
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

    let whereClause: any = {};

    if (requestedTeamId) {
      if (!userTeamIds.includes(requestedTeamId)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }
      whereClause = { teamId: requestedTeamId };
    } else {
      whereClause = { teamId: { in: userTeamIds } };
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
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    
    // Verify user is a member of the team
    const membership = await prisma.paddler.findFirst({
      where: {
        teamId: body.teamId,
        userId: session.user.id,
      },
    });

    if (!membership || membership.role !== 'CAPTAIN') {
      return NextResponse.json({ error: 'Unauthorized: Only captains can create events' }, { status: 403 });
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
