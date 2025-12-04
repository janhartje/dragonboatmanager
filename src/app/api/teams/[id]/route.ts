import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/auth';

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Check if user is a member of the team
    const membership = await prisma.paddler.findFirst({
      where: {
        teamId: params.id,
        userId: session.user.id,
      },
    });

    if (!membership) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const { name, website, icon, instagram, facebook, twitter, email } = body;

    // Check payload size (approximate)
    const payloadSize = JSON.stringify(body).length;
    if (payloadSize > 5 * 1024 * 1024) { // 5MB limit
      return NextResponse.json({ error: 'Payload too large (max 5MB)' }, { status: 413 });
    }

    const team = await prisma.team.update({
      where: { id: params.id },
      data: { name, website, icon, instagram, facebook, twitter, email },
    });
    return NextResponse.json(team);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update team' }, { status: 500 });
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
    // Check if user is a member of the team (ideally CAPTAIN role)
    const membership = await prisma.paddler.findFirst({
      where: {
        teamId: params.id,
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
          teamId: params.id
        }
      }
    });

    // Delete attendances
    await prisma.attendance.deleteMany({
      where: {
        event: {
          teamId: params.id
        }
      }
    });

    // Delete events
    await prisma.event.deleteMany({
      where: { teamId: params.id }
    });

    // Delete paddlers
    await prisma.paddler.deleteMany({
      where: { teamId: params.id }
    });

    // Finally delete the team
    await prisma.team.delete({
      where: { id: params.id },
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
