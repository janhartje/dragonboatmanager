import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
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
  try {
    await prisma.paddler.delete({
      where: { id: params.id },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete paddler' }, { status: 500 });
  }
}
