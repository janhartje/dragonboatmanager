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

    const body = await request.json();
    const { teamId } = body;

    if (!teamId) {
      return NextResponse.json({ error: 'Team ID is required' }, { status: 400 });
    }

    const membership = await prisma.paddler.findFirst({
      where: {
        userId: session.user.id,
        teamId: teamId,
      },
      include: { team: true }
    });

    if (!membership || !membership.team) {
      return NextResponse.json({ error: 'Not authorized or team not found' }, { status: 403 });
    }

    const team = membership.team;

    // Only active billing user or captain (if no billing user set yet?) can setup payment
    // If billing info changes, update the billing user to current user?
    // For now, allow captains to set it up.
    if (membership.role !== 'CAPTAIN' && team.billingUserId !== session.user.id) {
         return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }
    
    let customerId = team.stripeCustomerId;

    if (!customerId) {
      // Create customer if not exists
      const customer = await stripe.customers.create({
        email: session.user.email || undefined,
        name: session.user.name || undefined,
        metadata: {
          teamId: team.id,
        },
      });
      customerId = customer.id;

      await prisma.team.update({
        where: { id: team.id },
        data: { stripeCustomerId: customerId, billingUserId: session.user.id }
      });
    }

    const setupIntent = await stripe.setupIntents.create({
      customer: customerId,
      usage: 'off_session', // Ensures only recurring-payment capable methods are shown
      automatic_payment_methods: {
        enabled: true,
      },
    });

    return NextResponse.json({ 
      clientSecret: setupIntent.client_secret 
    });

  } catch (error) {
    console.error('Setup Intent Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
