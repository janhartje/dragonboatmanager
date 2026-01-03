import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { createOrResumeSubscription } from '@/services/stripe';

/**
 * POST /api/stripe/create-subscription
 * 
 * Creates or resumes a subscription for a team.
 * Uses the centralized StripeService for all logic.
 */
export async function POST(request: Request) {
  try {
    // 1. Authenticate
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Parse request
    const body = await request.json();
    const { teamId, interval = 'year', promotionCode, paymentMethodId } = body;

    if (!teamId) {
      return NextResponse.json({ error: 'Team ID is required' }, { status: 400 });
    }

    // 3. Verify user is captain of the team
    const membership = await prisma.paddler.findFirst({
      where: {
        userId: session.user.id,
        teamId: teamId,
        role: 'CAPTAIN',
      },
    });

    if (!membership) {
      return NextResponse.json(
        { error: 'Not authorized - only team captains can manage subscriptions' }, 
        { status: 403 }
      );
    }

    // 4. Call service
    const result = await createOrResumeSubscription(
      teamId,
      session.user.id,
      session.user.email ?? null,
      interval as 'month' | 'year',
      promotionCode,
      paymentMethodId // Pass the payment method ID if present
    );

    // 5. Return response
    return NextResponse.json({
      subscriptionId: result.subscriptionId,
      clientSecret: result.clientSecret,
      price: result.price,
    });

  } catch (error) {
    console.error('Stripe Subscription Error:', error);
    
    // Handle known errors
    if (error instanceof Error) {
      if (error.message === 'Invalid promotion code') {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
      if (error.message.includes('No price found')) {
        return NextResponse.json({ error: error.message }, { status: 404 });
      }
      if (error.message.includes('not configured')) {
        return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
      }
    }
    
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
