import { NextResponse } from 'next/server';
import { runAutoFillAlgorithm } from '@/utils/algorithm';
import { Paddler, Assignments } from '@/types';
import { auth } from '@/auth';

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { activePaddlerPool, assignments, lockedSeats, targetTrim, rows } = body;

    if (!activePaddlerPool || !assignments || !lockedSeats || targetTrim === undefined) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    const result = runAutoFillAlgorithm(activePaddlerPool, assignments, lockedSeats, targetTrim, rows || 10);

    return NextResponse.json({ assignments: result });
  } catch (error) {
    console.error('Auto-fill error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
