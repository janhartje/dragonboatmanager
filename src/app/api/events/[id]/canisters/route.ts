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

    if (!membership) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    
    // Transaction to safely increment
    const result = await prisma.$transaction(async (tx) => {
      const event = await tx.event.findUnique({ where: { id: eventId } });
      if (!event) throw new Error('Event not found');

      const newCount = (event.canisterCount || 0) + 1;

      const updatedEvent = await tx.event.update({
        where: { id: eventId },
        data: { canisterCount: newCount },
      });
      
      return updatedEvent;
    });

    return NextResponse.json({ 
      canisterCount: result.canisterCount,
      newCanisterId: `canister-${result.canisterCount}`
    });
  } catch (error) {
    console.error('Failed to add canister:', error);
    return NextResponse.json({ error: 'Failed to add canister' }, { status: 500 });
  }
}

export async function DELETE(
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

    if (!membership) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const canisterId = searchParams.get('canisterId'); // e.g. "canister-2"

    if (!canisterId) {
      return NextResponse.json({ error: 'Canister ID required' }, { status: 400 });
    }

    await prisma.$transaction(async (tx) => {
      const event = await tx.event.findUnique({ where: { id: eventId } });
      if (!event || !event.canisterCount || event.canisterCount <= 0) {
        throw new Error('No canisters to remove');
      }

      const currentCount = event.canisterCount;
      
      const assignmentCount = await tx.assignment.count({
        where: { eventId, isCanister: true }
      });
      
      if (assignmentCount >= currentCount) {
        throw new Error('Cannot delete assigned canister. Unassign first.');
      }

      await tx.event.update({
        where: { id: eventId },
        data: { canisterCount: currentCount - 1 },
      });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to remove canister:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed' }, { status: 500 });
  }
}
