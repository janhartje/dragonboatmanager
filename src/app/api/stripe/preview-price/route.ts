import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getSubscriptionPreview } from '@/services/stripe';

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { teamId, interval = 'year', promotionCode } = body;

    if (!teamId) {
        return NextResponse.json({ error: 'Team ID is required' }, { status: 400 });
    }

    const preview = await getSubscriptionPreview(
        teamId,
        interval as 'month' | 'year',
        promotionCode
    );

    return NextResponse.json(preview);

  } catch (error) {
    console.error('Preview Price Error:', error);
    if (error instanceof Error && error.message === 'Invalid promotion code') {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
