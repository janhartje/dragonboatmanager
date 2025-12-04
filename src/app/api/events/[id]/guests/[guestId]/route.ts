import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/auth';

export async function DELETE(
  request: Request,
  { params }: { params: { id: string; guestId: string } }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id: eventId, guestId } = params;

    // Fetch event to check team ownership
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { teamId: true }
    });

    if (!event?.teamId) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Check if user is a member of the team
    const membership = await prisma.paddler.findFirst({
      where: {
        teamId: event.teamId,
        userId: session.user.id,
      },
    });

    if (!membership) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    
    // Delete the guest paddler. 
    // Cascade delete should handle Attendance and Assignments.
    await prisma.paddler.delete({
      where: { id: guestId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to remove guest:', error);
    return NextResponse.json({ error: 'Failed to remove guest' }, { status: 500 });
  }
}
