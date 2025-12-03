import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const eventId = params.id;
    const event = await prisma.event.update({
      where: { id: eventId },
      data: {
        title: body.title,
        date: body.date ? new Date(body.date) : undefined,
        type: body.type,
        boatSize: body.boatSize,
        canisterCount: body.canisterCount,
      },
    });
    return NextResponse.json(event);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update event' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const eventId = params.id;

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
