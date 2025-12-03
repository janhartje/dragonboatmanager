import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const teamId = searchParams.get('teamId');

  try {
    const where = teamId ? { teamId } : {};
    const events = await prisma.event.findMany({
      where,
      include: {
        attendances: true,
        assignments: true,
      },
      orderBy: { date: 'asc' },
    });
    return NextResponse.json(events);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    const event = await prisma.event.create({
      data: {
        title: body.title,
        date: new Date(body.date),
        type: body.type || 'training',
        boatSize: body.boatSize || 'standard',
        teamId: body.teamId,
      },
    });
    return NextResponse.json(event);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to create event' }, { status: 500 });
  }
}
