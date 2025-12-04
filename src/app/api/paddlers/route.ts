import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const teamId = searchParams.get('teamId');

  try {
    const where = teamId ? { teamId } : {};
    const paddlers = await prisma.paddler.findMany({
      where,
      orderBy: { name: 'asc' },
      include: {
        user: {
          select: {
            email: true,
            name: true,
            image: true,
          },
        },
      },
    });
    return NextResponse.json(paddlers);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch paddlers' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const paddler = await prisma.paddler.create({
      data: {
        name: body.name,
        weight: body.weight,
        side: body.side,
        skills: body.skills,
        isGuest: body.isGuest || false,
        teamId: body.teamId,
      },
    });
    return NextResponse.json(paddler);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create paddler' }, { status: 500 });
  }
}
