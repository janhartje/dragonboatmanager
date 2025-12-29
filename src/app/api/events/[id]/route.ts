import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/auth';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) {
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

    // Check if user is a member of the team
    const membership = await prisma.paddler.findFirst({
      where: {
        teamId: existingEvent.teamId,
        userId: session.user.id,
      },
    });

    if (!membership || membership.role !== 'CAPTAIN') {
      return NextResponse.json({ error: 'Unauthorized: Only captains can update events' }, { status: 403 });
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
  const session = await auth();
  if (!session?.user?.id) {
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

    // Check if user is a member of the team
    const membership = await prisma.paddler.findFirst({
      where: {
        teamId: existingEvent.teamId,
        userId: session.user.id,
      },
    });

    if (!membership || membership.role !== 'CAPTAIN') {
      return NextResponse.json({ error: 'Unauthorized: Only captains can delete events' }, { status: 403 });
    }

    // Use transaction to delete guests and then the event
    await prisma.$transaction(async (tx) => {
      // 1. Find all guests for this event
      // Guests are paddlers with isGuest=true AND an attendance for this event
      // However, guests are created specifically for an event.
      // We can find them by looking at Attendance where eventId matches and paddler.isGuest is true.
      
      const guestAttendances = await tx.attendance.findMany({
        where: { 
          eventId,
          paddler: { isGuest: true }
        },
        include: { paddler: true }
      });

      const guestIds = guestAttendances.map(a => a.paddlerId);

      // 2. Delete the event first? No, foreign key constraints might block if we don't delete children first.
      // But Attendance has onDelete: Cascade usually.
      // The issue is the Paddler record itself.
      
      // If we delete the event, the Attendance records are deleted (Cascade).
      // But the Paddler records (Guests) remain.
      
      // So we must delete the Guest Paddlers.
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
