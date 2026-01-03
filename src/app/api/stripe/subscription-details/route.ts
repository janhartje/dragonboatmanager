import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { getSubscriptionDetails } from '@/services/stripe';

/**
 * GET /api/stripe/subscription-details
 * 
 * Get subscription details for a team.
 * Uses the centralized StripeService for logic.
 */
export async function GET(request: Request) {
  try {
    // 1. Authenticate
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Parse request
    const { searchParams } = new URL(request.url);
    const teamId = searchParams.get('teamId');

    if (!teamId) {
      return NextResponse.json({ error: 'Team ID is required' }, { status: 400 });
    }

    // 3. Verify user is member of the team
    const membership = await prisma.paddler.findFirst({
      where: {
        userId: session.user.id,
        teamId: teamId,
      },
    });

    if (!membership) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    // 4. Call service
    const result = await getSubscriptionDetails(teamId, session.user.id);

    // 5. Return response
    return NextResponse.json(result);

  } catch (error) {
    console.error('Subscription Details Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
