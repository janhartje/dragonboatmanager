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
      },
    });
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
