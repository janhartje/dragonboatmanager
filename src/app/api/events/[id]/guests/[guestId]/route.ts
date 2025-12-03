import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function DELETE(
  request: Request,
  { params }: { params: { id: string; guestId: string } }
) {
  try {
    const { guestId } = params;
    
    // Delete the guest paddler. 
    // Cascade delete should handle Attendance and Assignments.
    await prisma.paddler.delete({
      where: { id: guestId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to remove guest:', error);
    return NextResponse.json({ error: 'Failed to remove guest' }, { status: 500 });
  }
}
