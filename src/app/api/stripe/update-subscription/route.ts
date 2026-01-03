import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { updateSubscriptionStatus } from '@/services/stripe';

/**
 * POST /api/stripe/update-subscription
 * 
 * Cancel or reactivate a subscription.
 */
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { teamId, action } = await request.json();

    if (!teamId || !action) {
      return NextResponse.json({ error: 'Team ID and action are required' }, { status: 400 });
    }

    // Verify user is billing user
    const membership = await prisma.paddler.findFirst({
      where: {
        userId: session.user.id,
        teamId: teamId,
      },
      include: { team: true },
    });

    if (!membership || !membership.team) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    if (membership.team.billingUserId !== session.user.id) {
      return NextResponse.json(
        { error: 'Only the billing admin can manage the subscription' }, 
        { status: 403 }
      );
    }

    const result = await updateSubscriptionStatus(teamId, action);
    return NextResponse.json(result);

  } catch (error) {
    console.error('Subscription Update Error:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('No subscription') || error.message.includes('No active')) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
      if (error.message === 'Invalid action') {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
    }
    
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
