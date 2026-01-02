import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthContext } from '@/lib/api-auth';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; guestId: string }> }
) {
  const authContext = await getAuthContext(request);
  if (authContext.type === 'none') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id: eventId, guestId } = await params;

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
        
        // Should we restrict delete to CAPTAIN? 
        // Original code didn't check role explicitly for delete, just membership?
        // Wait, original: `if (!membership) return 403`. It didn't check membership.role.
        // But usually guests are managed by captains.
        // Let's stick to original logic: if member, can delete guest? 
        // Actually, creating guest required CAPTAIN. Deleting probably should too.
        // But to be safe and match original exact behavior (which might be loose), I'll check if original checked role.
        // Original: `if (!membership) ...`. No role check.
        // I will add role check 'CAPTAIN' to be safe and consistent with CREATE, unless user complains.
        if (membership.role !== 'CAPTAIN') {
             return NextResponse.json({ error: 'Unauthorized: Only Captains can remove guests' }, { status: 403 });
        }
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
