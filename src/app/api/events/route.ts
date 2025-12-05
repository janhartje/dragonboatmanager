import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/auth';

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const teamId = searchParams.get('teamId');

  try {
    if (teamId) {
      const membership = await prisma.paddler.findFirst({
        where: {
          teamId,
          userId: session.user.id,
        },
      });

      if (!membership) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }
    } else {
      // If no teamId, return empty or filter by user's teams
      // For now, let's return empty array if no teamId is provided, as events are usually fetched per team
      // Or we can fetch all events for all teams the user is in
      const userTeams = await prisma.paddler.findMany({
        where: { userId: session.user.id },
        select: { teamId: true },
      });
      const teamIds = userTeams.map(t => t.teamId).filter(Boolean) as string[];
      
      if (teamIds.length === 0) {
        return NextResponse.json([]);
      }
    }

    const where = teamId 
      ? { teamId } 
      : { 
          teamId: { 
            in: (await prisma.paddler.findMany({
              where: { userId: session.user.id },
              select: { teamId: true }
            })).map(p => p.teamId).filter(Boolean) as string[]
          } 
        };

    const events = await prisma.event.findMany({
      where,
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

    // Check permissions
    const teamIdsToCheck = Array.from(new Set(events.map(e => e.teamId).filter(Boolean) as string[]));
    const requesterMemberships = await prisma.paddler.findMany({
      where: {
        userId: session.user.id,
        teamId: { in: teamIdsToCheck }
      },
      select: { teamId: true, role: true }
    });
    const roleMap = new Map<string, string>();
    requesterMemberships.forEach(m => { if (m.teamId) roleMap.set(m.teamId, m.role); });

    const eventsWithGuests = events.map(event => {
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

    if (!membership) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const event = await prisma.event.create({
      data: {
        title: body.title,
        date: new Date(body.date),
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
