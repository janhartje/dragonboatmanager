import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthContext } from '@/lib/api-auth';
import { auth } from '@/auth'; // Keep for legacy PUT/DELETE for now, or refactor all

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const auth = await getAuthContext(request);

  if (auth.type === 'none') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Authorization check
  if (auth.type === 'apiKey' && auth.teamId !== id) {
     return NextResponse.json({ error: 'Unauthorized - API Key does not match team' }, { status: 403 });
  }

  if (auth.type === 'session' && auth.user?.id) {
    // Check if user is member
    const membership = await prisma.paddler.findFirst({
        where: { teamId: id, userId: auth.user.id }
    });
    if (!membership) {
         return NextResponse.json({ error: 'Unauthorized - Not a member' }, { status: 403 });
    }
  }

  try {
    const team = await prisma.team.findUnique({
      where: { id },
      include: {
        paddlers: {
          select: {
            id: true,
            name: true,
            weight: true,
            skills: true,
            role: true,
            isGuest: true,
          },
        },
        events: {
          select: {
            id: true,
            title: true,
            date: true,
            type: true,
            boatSize: true,
          },
          orderBy: { date: 'desc' },
          take: 10,
        },
      },
    });

    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    return NextResponse.json(team);
  } catch (error) {
    console.error('Error fetching team:', error);
    return NextResponse.json({ error: 'Failed to fetch team' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Check if user is a member of the team
    const membership = await prisma.paddler.findFirst({
      where: {
        teamId: id,
        userId: session.user.id,
        role: 'CAPTAIN',
      },
    });

    if (!membership) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const { name, website, icon, instagram, facebook, twitter, email, primaryColor, showProRing, showProBadge, showWatermark } = body;

    // Check payload size (approximate)
    const payloadSize = JSON.stringify(body).length;
    if (payloadSize > 5 * 1024 * 1024) { // 5MB limit
      return NextResponse.json({ error: 'Payload too large (max 5MB)' }, { status: 413 });
    }

    const team = await prisma.team.update({
      where: { id },
      data: { name, website, icon, instagram, facebook, twitter, email, primaryColor, showProRing, showProBadge, showWatermark },
    });
    return NextResponse.json(team);
  } catch (error) {
    console.error('Error updating team:', error);
    return NextResponse.json({ 
      error: 'Failed to update team',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Check if user is a member of the team (ideally CAPTAIN role)
    const membership = await prisma.paddler.findFirst({
      where: {
        teamId: id,
        userId: session.user.id,
        role: 'CAPTAIN', // Only captains can delete teams
      },
    });

    if (!membership) {
      return NextResponse.json({ error: 'Unauthorized - Only team captains can delete teams' }, { status: 403 });
    }

    // Manually delete related records first to ensure cascade works
    // Delete assignments first (they depend on paddlers and events)
    await prisma.assignment.deleteMany({
      where: {
        event: {
          teamId: id
        }
      }
    });

    // Delete attendances
    await prisma.attendance.deleteMany({
      where: {
        event: {
          teamId: id
        }
      }
    });

    // Delete events
    await prisma.event.deleteMany({
      where: { teamId: id }
    });

    // Delete paddlers
    await prisma.paddler.deleteMany({
      where: { teamId: id }
    });

    // Finally delete the team
    await prisma.team.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting team:', error);
    return NextResponse.json({ 
      error: 'Failed to delete team', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}
