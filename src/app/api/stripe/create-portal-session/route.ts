
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

    // Verify user is member of the team (Captain or Paddler)
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
    
    if (!team.stripeCustomerId) {
        return NextResponse.json({ error: 'No subscription found for this team' }, { status: 400 });
    }

    // Create Portal Session
    // Return URL should be the team page
    const returnUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/app/teams/${teamId}`;

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: team.stripeCustomerId,
      return_url: returnUrl,
    });

    return NextResponse.json({ url: portalSession.url });

  } catch (error) {
    console.error('Stripe Portal Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
