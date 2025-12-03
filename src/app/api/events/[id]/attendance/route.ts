import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const eventId = params.id;
    const { paddlerId, status } = body;

    const attendance = await prisma.attendance.upsert({
      where: {
        eventId_paddlerId: {
          eventId,
          paddlerId: String(paddlerId),
        },
      },
      update: { status },
      create: {
        eventId,
        paddlerId: String(paddlerId),
        status,
      },
    });

    return NextResponse.json(attendance);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to update attendance' }, { status: 500 });
  }
}
