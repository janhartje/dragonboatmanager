import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import Stripe from 'stripe';

// Unused type removed

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const teamId = searchParams.get('teamId');

    if (!teamId) {
      return NextResponse.json({ error: 'Team ID is required' }, { status: 400 });
    }

    // Verify user is member of the team
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
    
    // Helper to fix DB if inconsistent
    const syncDbStatus = async (status: string, plan: string, customerId?: string) => {
        if (team.subscriptionStatus !== status || team.plan !== plan) {
            console.log(`SELF-HEALING: Syncing Team ${team.id} status to ${status} (Plan: ${plan})`);
            await prisma.team.update({
                where: { id: team.id },
                data: { 
                    subscriptionStatus: status,
                    plan: plan,
                    stripeCustomerId: customerId || team.stripeCustomerId
                }
            });
        }
    };

    // No subscription if no customerId
    if (!team.stripeCustomerId) {
      return NextResponse.json({ 
        hasSubscription: false,
        plan: team.plan || 'FREE',
        isBillingUser: team.billingUserId === session.user.id,
        isCustomer: false
      });
    }

    // Get active subscriptions for this customer
    const subscriptions = await stripe.subscriptions.list({
      customer: team.stripeCustomerId,
      status: 'all', // Get all to see history
      limit: 10,
      expand: ['data.default_payment_method', 'data.latest_invoice']
    });

    if (subscriptions.data.length === 0) {
      // If Stripe has no subs but DB thinks it's PRO, revert to FREE
      if (team.plan === 'PRO') {
          await syncDbStatus('canceled', 'FREE');
      }
      return NextResponse.json({ 
        hasSubscription: false,
        plan: 'FREE',
        isBillingUser: team.billingUserId === session.user.id,
        isCustomer: true
      });
    }

    // Filter for active/trialing first, fallback to first in list
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let sub = (subscriptions.data.find(s => ['active', 'trialing', 'past_due'].includes(s.status)) || (subscriptions.data[0] as any));
    
    // RE-RETRIEVE TO BE ABSOLUTELY SURE
    try {
        sub = await stripe.subscriptions.retrieve(sub.id, {
            expand: ['default_payment_method', 'latest_invoice']
        });
    } catch (e) {
        console.error('Failed to re-retrieve sub:', sub.id, e);
    }
    
    // LOGGING TO STAND OUT
    console.error('--- STRIPE DEBUG START ---');
    console.error(`Team: ${team.id} | Sub: ${sub.id} | Status: ${sub.status}`);
    console.error(`ALL KEYS: ${Object.keys(sub).join(', ')}`);
    console.error(`Values Check: cp_end=${sub.current_period_end} | cp_start=${sub.current_period_start} | cancel_at=${sub.cancel_at}`);
    console.error('--- STRIPE DEBUG END ---');
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const item = sub.items?.data[0] as any;
    const priceId = item?.price?.id;
    const price = item?.price;
    
    // STRIPE BREAKING CHANGE: In newer API versions, periods move to items
    const currentPeriodEnd = item?.current_period_end || sub.current_period_end || item?.currentPeriodEnd || sub.currentPeriodEnd || 0;
    const currentPeriodStart = item?.current_period_start || sub.current_period_start || item?.currentPeriodStart || sub.currentPeriodStart || 0;
    
    // LOGGING TO STAND OUT
    console.error('--- STRIPE DEBUG START ---');
    console.error(`Team: ${team.id} | Sub: ${sub.id} | Status: ${sub.status} | PeriodEnd: ${currentPeriodEnd}`);
    console.error('--- STRIPE DEBUG END ---');
    
    // Check if subscription is actually active
    const validStatuses = ['active', 'trialing', 'past_due'];
    const isActive = validStatuses.includes(sub.status);
    
    // SELF-HEALING: Update database to match Stripe truth
    // Verify that the subscription metadata matches this team if present
    // This prevents "leakage" where one customer ID is used for multiple teams
    
    const isCorrectTeam = !sub.metadata?.teamId || sub.metadata.teamId === team.id;
    
    if (isActive && isCorrectTeam) {
        await syncDbStatus(sub.status, 'PRO');
    } else if (!isActive && team.plan === 'PRO') {
         await syncDbStatus(sub.status, 'FREE');
    }

    // Common history mapper
    const mapHistory = (subs: Stripe.Subscription[]) => subs
        .filter(s => !['incomplete', 'incomplete_expired'].includes(s.status))
        .map(s => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const subData = s as any;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const subItem = subData.items?.data[0] as any;
            return {
                id: subData.id,
                status: subData.status,
                currentPeriodStart: subItem?.current_period_start || subItem?.currentPeriodStart || subData.current_period_start || subData.currentPeriodStart,
                currentPeriodEnd: subItem?.current_period_end || subItem?.currentPeriodEnd || subData.current_period_end || subData.currentPeriodEnd,
                cancelAtPeriodEnd: subData.cancel_at_period_end || subData.cancelAtPeriodEnd,
                interval: subItem?.price?.recurring?.interval,
                amount: subItem?.price?.unit_amount,
                currency: subItem?.price?.currency,
            };
        });

    if (!isActive) {
      return NextResponse.json({ 
        hasSubscription: false,
        plan: 'FREE',
        isBillingUser: team.billingUserId === session.user.id,
        isCustomer: true,
        history: mapHistory(subscriptions.data)
      });
    }
    
    // Get payment method details
    const paymentMethod = sub.default_payment_method as Stripe.PaymentMethod;

    // Check if current user is the billing user
    const isBillingUser = team.billingUserId === session.user.id;

    // Get the latest invoice to show actual paid amount (with discounts)
    const invoices = await stripe.invoices.list({
      customer: team.stripeCustomerId!,
      subscription: sub.id,
      limit: 1,
    });
    const latestInvoice = invoices.data[0];
    const actualAmount = latestInvoice?.amount_paid ?? price?.unit_amount ?? 0;

    return NextResponse.json({
      hasSubscription: true,
      plan: 'PRO', // Always return verified status
      isBillingUser,
      isCustomer: true,
      subscription: {
        id: sub.id,
        status: sub.status,
        cancelAtPeriodEnd: sub.cancel_at_period_end || sub.cancelAtPeriodEnd,
        currentPeriodEnd: currentPeriodEnd,
        currentPeriodStart: currentPeriodStart,
        interval: price?.recurring?.interval,
        amount: actualAmount, // Use actual invoice amount (with discounts)
        baseAmount: price?.unit_amount, // Keep base for reference if needed
        currency: price?.currency,
        priceId: priceId,
        paymentMethod: paymentMethod ? {
          brand: paymentMethod.card?.brand,
          last4: paymentMethod.card?.last4,
          expMonth: paymentMethod.card?.exp_month,
          expYear: paymentMethod.card?.exp_year,
        } : null
      },
      history: mapHistory(subscriptions.data)
    });

  } catch (error) {
    console.error('Subscription Details Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
