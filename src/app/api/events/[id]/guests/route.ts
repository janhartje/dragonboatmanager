import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthContext } from '@/lib/api-auth';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const authContext = await getAuthContext(request);
  if (authContext.type === 'none') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const eventId = id;

    // Fetch event to check team ownership
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { teamId: true }
    });

    if (!event?.teamId) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Authorization
    if (authContext.type === 'apiKey') {
         if (event.teamId !== authContext.teamId) {
             return NextResponse.json({ error: 'Unauthorized - API Key does not match team' }, { status: 403 });
         }
    } else if (authContext.type === 'session' && authContext.user?.id) {
        const membership = await prisma.paddler.findFirst({
        where: {
            teamId: event.teamId,
            userId: authContext.user.id,
        },
        });

        if (!membership || membership.role !== 'CAPTAIN') {
        return NextResponse.json({ error: 'Unauthorized: Only captains can manage guests' }, { status: 403 });
        }
    }

    const body = await request.json(); // { name, weight, skills }
    
    // Transaction: Create Paddler (Guest) -> Create Attendance
    const result = await prisma.$transaction(async (tx) => {
      const guest = await tx.paddler.create({
        data: {
          name: body.name,
          weight: body.weight,
          skills: body.skills,
          isGuest: true,
          teamId: event.teamId, // Explicitly set teamId from event
        },
      });

      await tx.attendance.create({
        data: {
          eventId,
          paddlerId: guest.id,
          status: 'yes',
        },
      });

      return guest;
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Failed to add guest:', error);
    return NextResponse.json({ error: 'Failed to add guest' }, { status: 500 });
  }
}
