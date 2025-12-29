import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { teamId, action } = await request.json();

    // Verify user is member of the team
    const membership = await prisma.paddler.findFirst({
      where: {
        userId: session.user.id,
        teamId: teamId,
      },
      include: { team: true }
    });

    if (!membership || !membership.team) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    const team = membership.team;
    
    // Only the billing user can manage the subscription
    if (team.billingUserId !== session.user.id) {
      return NextResponse.json({ error: 'Only the billing admin can manage the subscription' }, { status: 403 });
    }
    
    if (!team.stripeCustomerId) {
      return NextResponse.json({ error: 'No subscription found' }, { status: 400 });
    }

    // Get active subscription
    const subscriptions = await stripe.subscriptions.list({
      customer: team.stripeCustomerId,
      status: 'active',
      limit: 1
    });

    if (subscriptions.data.length === 0) {
      return NextResponse.json({ error: 'No active subscription found' }, { status: 400 });
    }

    const sub = subscriptions.data[0];

    if (action === 'cancel') {
      // Cancel at period end (not immediately)
      await stripe.subscriptions.update(sub.id, {
        cancel_at_period_end: true
      });
      return NextResponse.json({ success: true, message: 'Subscription will be canceled at period end' });
    }

    if (action === 'reactivate') {
      // Remove cancellation
      await stripe.subscriptions.update(sub.id, {
        cancel_at_period_end: false
      });
      return NextResponse.json({ success: true, message: 'Subscription reactivated' });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error) {
    console.error('Subscription Update Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
