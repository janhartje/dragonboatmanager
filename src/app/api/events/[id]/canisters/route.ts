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
            return NextResponse.json({ error: 'Unauthorized: Only captains can manage canisters' }, { status: 403 });
        }
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
            return NextResponse.json({ error: 'Unauthorized: Only captains can manage canisters' }, { status: 403 });
        }
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
