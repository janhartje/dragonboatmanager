import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import prisma from '@/lib/prisma';
import Stripe from 'stripe';

export async function POST(req: Request) {
  const body = await req.text();
  const signature = (await headers()).get('Stripe-Signature');

  if (!signature || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Missing signature or secret' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error(`Webhook signature verification failed: ${message}`);
    return NextResponse.json({ error: `Webhook Error: ${message}` }, { status: 400 });
  }

  const session = event.data.object as Stripe.Checkout.Session;
  const subscription = event.data.object as Stripe.Subscription;

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        if (!session.metadata?.teamId) {
            console.error('Webhook: Missing teamId in metadata');
            break;
        }
        
        await prisma.team.update({
          where: { id: session.metadata.teamId },
          data: {
            stripeCustomerId: session.customer as string,
            plan: 'PRO',
            subscriptionStatus: 'active',
            maxMembers: 100, // Or whatever limit PRO plan has
          },
        });
        break;
        
      case 'invoice.payment_succeeded': {
        // This fires when a subscription payment goes through (initial or renewal)
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id;
        
        if (!customerId) {
            console.error('Webhook invoice.payment_succeeded: No customer ID');
            break;
        }
        
        // Find team by customer ID (most reliable method)
        const customerTeam = await prisma.team.findFirst({
            where: { stripeCustomerId: customerId }
        });
        
        if (customerTeam) {
            await prisma.team.update({
                where: { id: customerTeam.id },
                data: {
                    plan: 'PRO',
                    subscriptionStatus: 'active',
                    maxMembers: 100,
                }
            });
        } else {
            console.error('Webhook: No team found for customer:', customerId);
        }
        break;
      }

      case 'customer.subscription.updated':
        // Handle plan changes, cancellations, etc.
        // For now, just simplistic status sync
        // We'd need to find team by stripeCustomerId, which implies uniqueness
        if (subscription.status !== 'active' && subscription.status !== 'trialing') {
             // Maybe revert to FREE if not active?
             // Need to find which team this customer belongs to
             const teams = await prisma.team.findMany({
                 where: { stripeCustomerId: subscription.customer as string }
             });
             for (const team of teams) {
                 await prisma.team.update({
                     where: { id: team.id },
                     data: {
                         subscriptionStatus: subscription.status,
                         plan: 'FREE', // Downgraded since not active/trialing
                         maxMembers: 25,
                     }
                 });
             }
        }
        break;
        
      case 'customer.subscription.deleted': {
        // Handle cancellation
        const canceledTeams = await prisma.team.findMany({
            where: { stripeCustomerId: subscription.customer as string }
        });
        for (const team of canceledTeams) {
            await prisma.team.update({
                where: { id: team.id },
                data: {
                    plan: 'FREE',
                    subscriptionStatus: 'canceled',
                    maxMembers: 25,
                }
            });
        }
        break;
      }
    }
  } catch (error) {
    console.error('Webhook handler error:', error);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
