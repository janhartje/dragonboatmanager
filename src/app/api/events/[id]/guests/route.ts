import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const eventId = params.id;
    const body = await request.json(); // { name, weight, skills }
    
    // Transaction: Create Paddler (Guest) -> Create Attendance
    const result = await prisma.$transaction(async (tx) => {
      const guest = await tx.paddler.create({
        data: {
          name: body.name,
          weight: body.weight,
          skills: body.skills,
          isGuest: true,
        },
      });

      await tx.attendance.create({
        data: {
          eventId,
          paddlerId: guest.id,
          status: 'yes',
        },
      });

      return guest;
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Failed to add guest:', error);
    return NextResponse.json({ error: 'Failed to add guest' }, { status: 500 });
  }
}
