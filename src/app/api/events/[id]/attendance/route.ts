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
        // Check if user is a member of the team
        const membership = await prisma.paddler.findFirst({
        where: {
            teamId: event.teamId,
            userId: authContext.user.id,
        },
        });

        if (!membership) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }
        
         // Security Check: Only Captains can update others (checked later with body)
         // We need membership for role check below
         // Pass membership to logic below? 
         // Or just re-fetch in logic block? Let's assume we have membership here.
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const { paddlerId, status } = body;

    // Security Check for Session Users
    if (authContext.type === 'session' && authContext.user?.id) {
         const membership = await prisma.paddler.findFirst({
            where: { teamId: event.teamId, userId: authContext.user.id }
         }); // Refetched for safety scope, slightly inefficient but clear

         if (!membership) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

        if (membership.role !== 'CAPTAIN' && String(paddlerId) !== membership.id) {
            return NextResponse.json({ error: 'Unauthorized: You can only update your own attendance' }, { status: 403 });
        }
    }

    const attendance = await prisma.attendance.upsert({
      where: {
        eventId_paddlerId: {
          eventId,
          paddlerId: String(paddlerId),
        },
      },
      update: { status },
      create: {
        eventId,
        paddlerId: String(paddlerId),
        status,
      },
    });

    return NextResponse.json(attendance);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to update attendance' }, { status: 500 });
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

  const { searchParams } = new URL(request.url);
  const paddlerId = searchParams.get('paddlerId');

  if (!paddlerId) {
    return NextResponse.json({ error: 'Paddler ID is required' }, { status: 400 });
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
            return NextResponse.json({ error: 'Unauthorized: Only Captains can remove attendance records' }, { status: 403 });
        }
    }

    await prisma.attendance.delete({
      where: {
        eventId_paddlerId: {
          eventId,
          paddlerId: paddlerId,
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to delete attendance' }, { status: 500 });
  }
}
