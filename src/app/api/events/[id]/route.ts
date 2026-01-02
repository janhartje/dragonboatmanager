import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthContext } from '@/lib/api-auth';

export async function PUT(
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
    const existingEvent = await prisma.event.findUnique({
      where: { id: eventId },
      select: { teamId: true }
    });

    if (!existingEvent?.teamId) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Authorization
    if (authContext.type === 'apiKey') {
         if (existingEvent.teamId !== authContext.teamId) {
             return NextResponse.json({ error: 'Unauthorized - API Key does not match team' }, { status: 403 });
         }
    } else if (authContext.type === 'session' && authContext.user?.id) {
        // Check if user is a member of the team
        const membership = await prisma.paddler.findFirst({
        where: {
            teamId: existingEvent.teamId,
            userId: authContext.user.id,
        },
        });

        if (!membership || membership.role !== 'CAPTAIN') {
        return NextResponse.json({ error: 'Unauthorized: Only captains can update events' }, { status: 403 });
        }
    }

    const body = await request.json();
    const event = await prisma.event.update({
      where: { id: eventId },
      data: {
        title: body.title,
        date: body.date ? new Date(body.date) : undefined,
        comment: body.comment,
        type: body.type,
        boatSize: body.boatSize,
        canisterCount: body.canisterCount,
      },
    });
    return NextResponse.json(event);
  } catch {
    return NextResponse.json({ error: 'Failed to update event' }, { status: 500 });
  }
}

export async function DELETE(
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
    const existingEvent = await prisma.event.findUnique({
      where: { id: eventId },
      select: { teamId: true }
    });

    if (!existingEvent?.teamId) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Authorization
    if (authContext.type === 'apiKey') {
         if (existingEvent.teamId !== authContext.teamId) {
             return NextResponse.json({ error: 'Unauthorized - API Key does not match team' }, { status: 403 });
         }
    } else if (authContext.type === 'session' && authContext.user?.id) {
        // Check if user is a member of the team
        const membership = await prisma.paddler.findFirst({
        where: {
            teamId: existingEvent.teamId,
            userId: authContext.user.id,
        },
        });

        if (!membership || membership.role !== 'CAPTAIN') {
        return NextResponse.json({ error: 'Unauthorized: Only captains can delete events' }, { status: 403 });
        }
    }

    // Use transaction to delete guests and then the event
    await prisma.$transaction(async (tx) => {
      // 1. Find all guests for this event
      const guestAttendances = await tx.attendance.findMany({
        where: { 
          eventId,
          paddler: { isGuest: true }
        },
        include: { paddler: true }
      });

      const guestIds = guestAttendances.map(a => a.paddlerId);

      // 2. Delete the Guest Paddlers.
      if (guestIds.length > 0) {
        await tx.paddler.deleteMany({
          where: { id: { in: guestIds } }
        });
      }

      // 3. Delete the event
      await tx.event.delete({
        where: { id: eventId },
      });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete event:', error);
    return NextResponse.json({ error: 'Failed to delete event' }, { status: 500 });
  }
}
