import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/auth';
import { parseEventDateTime } from '@/utils/importUtils';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: teamId } = await params;

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        paddlers: {
          where: { teamId },
        },
      },
    });

    const isCaptain = user?.paddlers[0]?.role === 'CAPTAIN';
    
    if (!isCaptain) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { events } = body;

    if (!Array.isArray(events)) {
      return NextResponse.json({ error: 'Invalid data format' }, { status: 400 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const eventsToCreate = events.map((e: any) => {
      // Use centralized date/time parsing utility
      const eventDate = parseEventDateTime(
        e.date || e.Date,
        e.time || e.Time
      );

      return {
        title: e.title || e.Title,
        date: eventDate,
        type: e.type || e.Type || 'training',
        boatSize: e.boatSize || e.BoatSize || 'standard',
        comment: e.comment || e.Comment || null,
        teamId: teamId,
      };
    });

    const result = await prisma.event.createMany({
      data: eventsToCreate,
    });

    return NextResponse.json({ count: result.count }, { status: 201 });

  } catch (error) {
    console.error('Error importing events:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
