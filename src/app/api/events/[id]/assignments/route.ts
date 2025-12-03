import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const eventId = params.id;
    const assignments = body.assignments; // Record<seatId, paddlerId>

    // Use a transaction to replace assignments
    await prisma.$transaction(async (tx) => {
      // 1. Delete all existing assignments for this event
      await tx.assignment.deleteMany({
        where: { eventId },
      });

      // 2. Create new assignments
      // 2. Create new assignments
      const createPromises = Object.entries(assignments).map(([seatId, paddlerId]) => {
        if (!paddlerId) return null; // Skip empty assignments

        const pidStr = String(paddlerId);
        const isCanister = pidStr.startsWith('canister-');
        
        return tx.assignment.create({
          data: {
            eventId,
            seatId,
            paddlerId: isCanister ? null : pidStr,
            isCanister,
          },
        });
      }).filter((p): p is any => p !== null);

      await Promise.all(createPromises);
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to save assignments' }, { status: 500 });
  }
}
