import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { name, website, icon, instagram, facebook, twitter, email } = await request.json();
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
  try {
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
