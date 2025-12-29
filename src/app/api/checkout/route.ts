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

    const { teamId } = await request.json();

    if (!teamId) {
      return NextResponse.json({ error: 'Team ID is required' }, { status: 400 });
    }

    // Verify user is owner/captain of the team
    const membership = await prisma.paddler.findFirst({
      where: {
        userId: session.user.id,
        teamId: teamId,
        role: 'CAPTAIN',
      },
      include: { team: true }
    });

    if (!membership || !membership.team) {
      return NextResponse.json({ error: 'Not authorized or team not found' }, { status: 403 });
    }
    
    // Check if Stripe configuration is present
    if (!process.env.STRIPE_PRO_PRICE_ID) {
        console.error("STRIPE_PRO_PRICE_ID is missing in env");
        return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    // Create Checkout Session
    const checkoutSession = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: process.env.STRIPE_PRO_PRICE_ID,
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/app/teams/${teamId}?success=true`,
      cancel_url: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/app/teams/${teamId}?canceled=true`,
      customer_email: session.user.email || undefined,
      metadata: {
        teamId: teamId,
        userId: session.user.id,
      },
    });

    if (!checkoutSession.url) {
      return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 });
    }

    return NextResponse.json({ url: checkoutSession.url });

  } catch (error) {
    console.error('Stripe Checkout Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
