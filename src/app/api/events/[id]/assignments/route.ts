import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthContext } from '@/lib/api-auth';
 // Keep for legacy if needed

// Helper to verify access
async function verifyAccess(req: Request, teamId: string) {
    const authContext = await getAuthContext(req);
    if (authContext.type === 'none') throw new Error('Unauthorized');

    if (authContext.type === 'apiKey') {
        if (authContext.teamId !== teamId) throw new Error('Unauthorized');
        return true; // API Key is admin/captain level
    }

    if (authContext.type === 'session' && authContext.user?.id) {
        const membership = await prisma.paddler.findFirst({
            where: { teamId, userId: authContext.user.id }
        });
        if (!membership) throw new Error('Unauthorized');
        return membership.role === 'CAPTAIN'; // Only captains can manage assignments
    }
    throw new Error('Unauthorized');
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
     const event = await prisma.event.findUnique({ where: { id }, select: { teamId: true } });
     if (!event) return NextResponse.json({ error: 'Event not found' }, { status: 404 });
     
     // basic read access check - technically anyone in team can read assignments?
     // getAuthContext check
     const authContext = await getAuthContext(request);
     if (authContext.type === 'none') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
     
     if (authContext.type === 'apiKey') {
         if (authContext.teamId !== event.teamId) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
     } else if (authContext.type === 'session' && authContext.user?.id) {
         const membership = await prisma.paddler.findFirst({
             where: { teamId: event.teamId, userId: authContext.user.id }
         });
         if (!membership) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
     }

     const assignments = await prisma.assignment.findMany({
         where: { eventId: id },
         include: {
             paddler: {
                 select: { id: true, name: true, weight: true, skills: true }
             }
         },
         orderBy: { seatId: 'asc' }
     });
     return NextResponse.json(assignments);

  } catch (error) {
      console.error('Failed to fetch assignments:', error);
      return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const body = await request.json();
    const event = await prisma.event.findUnique({ where: { id }, select: { teamId: true } });
    if (!event || !event.teamId) return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    
    // Verify Captain Access
    await verifyAccess(request, event.teamId);

    const { seatId, paddlerId, isCanister } = body;
    
    // Handle specific canister logic (LLM might send "canister-N" string as paddlerId)
    const pidStr = paddlerId ? String(paddlerId) : null;
    const isVirtualCanister = pidStr?.startsWith('canister-');
    
    // If it's a virtual canister ID, treat as canister=true, paddlerId=null
    // Or if isCanister=true is passed explicitly
    const finalIsCanister = isVirtualCanister || isCanister || false;
    const finalPaddlerId = (isVirtualCanister || finalIsCanister) ? null : paddlerId;

    const assignment = await prisma.assignment.upsert({
      where: {
        eventId_seatId: {
          eventId: id,
          seatId: seatId,
        },
      },
      create: {
        eventId: id,
        seatId: seatId,
        paddlerId: finalPaddlerId || null,
        isCanister: finalIsCanister,
      },
      update: {
        paddlerId: finalPaddlerId || null,
        isCanister: finalIsCanister,
      },
    });

    return NextResponse.json(assignment);
  } catch (error) {
      console.error(error);
      return NextResponse.json({ error: 'Unauthorized or Failed' }, { status: 403 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const eventId = id;
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { teamId: true }
    });

    if (!event?.teamId) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Captain check
    await verifyAccess(request, event.teamId);

    const body = await request.json();
    const assignments = body.assignments; // Record<seatId, paddlerId>

    // Use a transaction to replace assignments
    await prisma.$transaction(async (tx) => {
      // 1. Delete all existing assignments for this event
      await tx.assignment.deleteMany({
        where: { eventId },
      });

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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      }).filter((p): p is any => p !== null);

      await Promise.all(createPromises);
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Failed to create assignment:', err);
    return NextResponse.json({ error: 'Failed to save assignments' }, { status: 500 });
  }
}
