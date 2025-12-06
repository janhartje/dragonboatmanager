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
      return NextResponse.json({ error: 'Unauthorized: Only captains can modify assignments' }, { status: 403 });
    }

    const body = await request.json();
    const assignments = body.assignments; // Record<seatId, paddlerId>

    // Use a transaction to replace assignments
    await prisma.$transaction(async (tx) => {
      // 1. Delete all existing assignments for this event
      await tx.assignment.deleteMany({
        where: { eventId },
      });

      // 2. Create new assignments
      // 2. Create new assignments
      const createPromises = Object.entries(assignments).map(([seatId, paddlerId]) => {
        if (!paddlerId) return null; // Skip empty assignments

        const pidStr = String(paddlerId);
        const isCanister = pidStr.startsWith('canister-');
        
        return tx.assignment.create({
          data: {
            eventId,
            seatId,
            paddlerId: isCanister ? null : pidStr,
            isCanister,
          },
        });
      }).filter((p): p is any => p !== null);

      await Promise.all(createPromises);
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to save assignments' }, { status: 500 });
  }
}
