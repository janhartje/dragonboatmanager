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

  console.log(`Webhook Event: ${event.type} (${event.id})`);

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
            maxMembers: 100,
          },
        });
        console.error(`PRO-FULFILLMENT: Team ${session.metadata.teamId} upgraded via checkout.session.completed`);
        break;
        
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id;
        
        if (!customerId) {
            console.error('Webhook invoice.payment_succeeded: No customer ID');
            break;
        }
        
        // Prefer metadata from subscription if available
        let teamId = (invoice.subscription && typeof invoice.subscription !== 'string')
            ? (invoice.subscription as Stripe.Subscription).metadata?.teamId
            : null;

        if (!teamId && invoice.metadata?.teamId) {
            teamId = invoice.metadata.teamId;
        }

        const where = teamId ? { id: teamId } : { stripeCustomerId: customerId };
        
        const customerTeam = await prisma.team.findFirst({ where });
        
        if (customerTeam) {
            await prisma.team.update({
                where: { id: customerTeam.id },
                data: {
                    plan: 'PRO',
                    subscriptionStatus: 'active',
                    maxMembers: 100,
                }
            });
            console.error(`PRO-FULFILLMENT: Team ${customerTeam.id} upgraded via invoice.payment_succeeded`);
        } else {
            console.error('Webhook: No team found for customer:', customerId);
        }
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription;
        const teamId = sub.metadata?.teamId;
        const customerId = sub.customer as string;

        if (sub.status === 'active' || sub.status === 'trialing') {
            const customerTeam = teamId 
                ? await prisma.team.findUnique({ where: { id: teamId } })
                : await prisma.team.findFirst({ where: { stripeCustomerId: customerId } });

            if (customerTeam) {
                await prisma.team.update({
                    where: { id: customerTeam.id },
                    data: {
                        plan: 'PRO',
                        subscriptionStatus: sub.status,
                        maxMembers: 100,
                    }
                });
                console.error(`PRO-FULFILLMENT: Team ${customerTeam.id} updated to ${sub.status} via ${event.type}`);
            } else {
                console.error(`Webhook ${event.type}: No team found for customer ${customerId} or teamId ${teamId}`);
            }
        } else if (sub.status === 'canceled' || sub.status === 'unpaid' || sub.status === 'incomplete_expired') {
             const teams = await prisma.team.findMany({
                 where: { stripeCustomerId: customerId }
             });
             for (const team of teams) {
                 await prisma.team.update({
                     where: { id: team.id },
                     data: {
                         subscriptionStatus: sub.status,
                         plan: 'FREE',
                         maxMembers: 25,
                     }
                 });
                 console.error(`PRO-DOWNGRADE: Team ${team.id} downgraded to FREE due to status: ${sub.status}`);
             }
        }
        break;
      }
        
      case 'customer.subscription.deleted': {
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
            console.error(`PRO-DOWNGRADE: Team ${team.id} downgraded due to deletion`);
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
