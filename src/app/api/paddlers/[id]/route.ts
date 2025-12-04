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
    // Fetch paddler to check team ownership
    const existingPaddler = await prisma.paddler.findUnique({
      where: { id: params.id },
      select: { teamId: true }
    });

    if (!existingPaddler?.teamId) {
      return NextResponse.json({ error: 'Paddler not found' }, { status: 404 });
    }

    // Check if user is a member of the team
    const membership = await prisma.paddler.findFirst({
      where: {
        teamId: existingPaddler.teamId,
        userId: session.user.id,
      },
    });

    if (!membership) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const paddler = await prisma.paddler.update({
      where: { id: params.id },
      data: {
        name: body.name,
        weight: body.weight,
        side: body.side,
        skills: body.skills,
        isGuest: body.isGuest,
        role: body.role,
      },
    });

    // If the paddler is linked to a user, sync changes to the user profile and other paddler entries
    if (paddler.userId) {
      // Update User profile
      await prisma.user.update({
        where: { id: paddler.userId },
        data: {
          name: paddler.name,
          weight: paddler.weight,
        },
      });

      // Update other Paddler records for this user
      await prisma.paddler.updateMany({
        where: { 
          userId: paddler.userId,
          id: { not: paddler.id } 
        },
        data: {
          name: paddler.name,
          weight: paddler.weight,
        },
      });
    }
    return NextResponse.json(paddler);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update paddler' }, { status: 500 });
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
    // Fetch paddler to check team ownership
    const existingPaddler = await prisma.paddler.findUnique({
      where: { id: params.id },
      select: { teamId: true }
    });

    if (!existingPaddler?.teamId) {
      return NextResponse.json({ error: 'Paddler not found' }, { status: 404 });
    }

    // Check if user is a member of the team
    const membership = await prisma.paddler.findFirst({
      where: {
        teamId: existingPaddler.teamId,
        userId: session.user.id,
      },
    });

    if (!membership) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await prisma.paddler.delete({
      where: { id: params.id },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete paddler' }, { status: 500 });
  }
}
