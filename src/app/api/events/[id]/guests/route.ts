import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/auth';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const eventId = params.id;

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

    if (!membership || membership.role !== 'CAPTAIN') {
      return NextResponse.json({ error: 'Unauthorized: Only captains can manage guests' }, { status: 403 });
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
