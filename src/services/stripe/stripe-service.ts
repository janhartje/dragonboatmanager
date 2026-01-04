/**
 * Centralized Stripe Service
 * 
 * This module contains all business logic for Stripe interactions.
 * API routes should call this service, not Stripe directly.
 */

import { stripe } from '@/lib/stripe';
import prisma from '@/lib/prisma';
import Stripe from 'stripe';
import type { SubscriptionResponse } from './types';

// Type for Invoice with expanded payment_intent
type InvoiceWithPaymentIntent = Stripe.Invoice & { 
  payment_intent?: Stripe.PaymentIntent | string | null 
};

// Type for Subscription with expanded fields
type SubscriptionWithExpansion = Stripe.Subscription & {
  latest_invoice?: InvoiceWithPaymentIntent | string | null;
  pending_setup_intent?: Stripe.SetupIntent | string | null;
  current_period_end: number;
  discount?: (Stripe.Discount & { coupon: Stripe.Coupon }) | null;
};

/**
 * Get or create a Stripe customer for a team.
 */
export async function getOrCreateCustomer(
  teamId: string, 
  userEmail?: string | null
): Promise<{ customerId: string; team: Awaited<ReturnType<typeof prisma.team.findUniqueOrThrow>> }> {
  const team = await prisma.team.findUniqueOrThrow({ where: { id: teamId } });
  
  let customerId = team.stripeCustomerId;
  
  // 1. Validate existing customer ID from DB
  if (customerId) {
    try {
      const customer = await stripe.customers.retrieve(customerId);
      if ((customer as Stripe.DeletedCustomer).deleted) {
        customerId = null;
      }
    } catch (error: unknown) {
      if ((error as { code?: string }).code === 'resource_missing') {
        customerId = null;
      } else {
        throw error;
      }
    }
  }

  // 2. If no valid ID, search by Email (Faster & More Consistent than Search API)
  if (!customerId && userEmail) {
    const existingCustomers = await stripe.customers.list({
      email: userEmail,
      limit: 10,
    });
    
    // Find exact match by Team ID
    const match = existingCustomers.data.find(c => c.metadata.teamId === teamId);
    
    if (match) {
      customerId = match.id;
      
      await prisma.team.update({
        where: { id: team.id },
        data: { stripeCustomerId: customerId },
      });
    } else {
        // Fallback: orphan check
        const orphaned = existingCustomers.data.find(c => !c.metadata.teamId);
        
        if (orphaned) {
            customerId = orphaned.id;
            
            await stripe.customers.update(customerId, { metadata: { teamId } });
            await prisma.team.update({
                where: { id: team.id },
                data: { stripeCustomerId: customerId },
            });
        }
    }
  }
  
  // 3. Create new customer if absolutely needed
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: userEmail || undefined,
      name: team.name,
      metadata: { teamId: team.id },
    });
    customerId = customer.id;
    
    await prisma.team.update({
      where: { id: team.id },
      data: { stripeCustomerId: customerId },
    });
  }
  
  return { customerId, team };
}

/**
 * Find the most recent subscription for a customer.
 */
export async function findExistingSubscription(
  customerId: string
): Promise<Stripe.Subscription | null> {
  const subscriptions = await stripe.subscriptions.list({
    customer: customerId,
    limit: 10,
    expand: ['data.latest_invoice.payment_intent', 'data.pending_setup_intent', 'data.default_payment_method', 'data.discount'],
  });
  
  // Priority: active/trialing > incomplete > nothing
  const active = subscriptions.data.find(s => 
    s.status === 'active' || s.status === 'trialing'
  );
  if (active) return active;
  
  const incomplete = subscriptions.data.find(s => s.status === 'incomplete');
  if (incomplete) return incomplete;
  
  return null;
}

/**
 * Lookup a promotion code by its code string.
 */
export async function lookupPromotionCode(code: string): Promise<string | null> {
  const promos = await stripe.promotionCodes.list({
    code,
    active: true,
    limit: 1,
  });
  return promos.data.length > 0 ? promos.data[0].id : null;
}

/**
 * Get the correct price ID for the requested interval.
 */
export async function getPriceForInterval(
  interval: 'month' | 'year'
): Promise<Stripe.Price> {
  if (!process.env.STRIPE_PRO_PRICE_ID) {
    throw new Error('STRIPE_PRO_PRICE_ID not configured');
  }
  
  const basePrice = await stripe.prices.retrieve(process.env.STRIPE_PRO_PRICE_ID);
  const productId = typeof basePrice.product === 'string' 
    ? basePrice.product 
    : basePrice.product.id;
  
  const prices = await stripe.prices.list({
    product: productId,
    active: true,
    type: 'recurring',
    limit: 10,
  });
  
  const matchingPrice = prices.data.find(p => p.recurring?.interval === interval);
  if (!matchingPrice) {
    throw new Error(`No price found for interval: ${interval}`);
  }
  
  return matchingPrice;
}

/**
 * Helper to extract client secret from a subscription's latest invoice/intent.
 * NO WAIT LOOPS - Direct extraction only.
 */
function extractClientSecretFromSubscription(
  subscription: SubscriptionWithExpansion
): { clientSecret: string | null; amount: number; currency: string } {
    
  // 1. Pending Setup Intent (e.g. Trial with no immediate payment)
  if (subscription.pending_setup_intent) {
      const si = subscription.pending_setup_intent;
      if (typeof si === 'object' && si.client_secret) {
          return { clientSecret: si.client_secret, amount: 0, currency: 'eur' };
      }
  }

  // 2. Latest Invoice Payment Intent
  const invoice = subscription.latest_invoice;
  if (invoice && typeof invoice === 'object') {
     const pi = invoice.payment_intent;
     
     // Case A: PaymentIntent exists and has a secret (Standard flow)
     if (typeof pi === 'object' && pi?.client_secret) {
         return {
             clientSecret: pi.client_secret,
             amount: invoice.amount_due,
             currency: invoice.currency
         };
     }
     
     // Case B: Invoice is paid or has 0 amount (No payment needed)
     if (invoice.status === 'paid' || invoice.amount_due === 0) {
         return { clientSecret: null, amount: 0, currency: invoice.currency };
     }
  }

  // Fallback: If status is incomplete but we have no PI, something is wrong or it's a very specific state.
  // We return null and let the frontend handle the state based on subscription status.
  return { clientSecret: null, amount: 0, currency: 'eur' };
}

/**
 * Create or resume a subscription.
 * Follows "Incomplete Subscription" pattern.
 */
export async function createOrResumeSubscription(
  teamId: string,
  userId: string,
  userEmail: string | null,
  interval: 'month' | 'year' = 'year',
  promotionCode?: string,
  paymentMethodId?: string
): Promise<SubscriptionResponse> {
  const safeEmail = userEmail ? userEmail.toLowerCase() : null;

  // 1. Get/create customer
  const { customerId, team } = await getOrCreateCustomer(teamId, safeEmail);
  
  // 2. Update billing user
  if (!team.billingUserId) {
    await prisma.team.update({
      where: { id: teamId },
      data: { billingUserId: userId },
    });
  }

  // 3. Attach PaymentMethod if provided (Optional, usually handled by Elements confirmation now)
  if (paymentMethodId) {
    try {
      await stripe.paymentMethods.attach(paymentMethodId, { customer: customerId });
      await stripe.customers.update(customerId, {
        invoice_settings: { default_payment_method: paymentMethodId },
      });
    } catch (e) {
      console.warn(`[STRIPE] Failed to attach payment method (might already be attached):`, e);
    }
  }
  
  // 4. Prepare Params
  let promotionCodeId: string | undefined;
  if (promotionCode) {
    const promoId = await lookupPromotionCode(promotionCode);
    if (!promoId) throw new Error('Invalid promotion code');
    promotionCodeId = promoId;
  }
  
  const targetPrice = await getPriceForInterval(interval);
  
  // 5. Check for EXISTING subscription
  // We strictly reuse 'incomplete' ones to avoid spamming invoices, or return active ones.
  const existingSub = await findExistingSubscription(customerId);


  if (existingSub) {
      // If Active/Trialing -> Return it (No payment needed)
      if (existingSub.status === 'active' || existingSub.status === 'trialing') {
          return {
              subscriptionId: existingSub.id,
              clientSecret: null,
              status: existingSub.status,
              price: { amount: 0, currency: 'eur', interval },
          };
      }

      // If Incomplete -> We might be able to reuse it if parameters match, 
      // BUT updating 'incomplete' subs is restricted if it generates new invoices.
      // Easiest path: Cancel 'incomplete' and create fresh one to ensure clean state.
      if (existingSub.status === 'incomplete') {
          await stripe.subscriptions.cancel(existingSub.id);
      }
  }

  // 6. Create NEW Subscription (status: incomplete)
  
  const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: targetPrice.id }],
      payment_behavior: 'default_incomplete', // CRITICAL: Allows creation without immediate payment success
      payment_settings: { save_default_payment_method: 'on_subscription' },
      expand: ['latest_invoice.payment_intent', 'pending_setup_intent'],
      metadata: { teamId },
      discounts: promotionCodeId ? [{ promotion_code: promotionCodeId }] : undefined,
  });

  if (!subscription) throw new Error('Failed to create subscription');

  // 7. Extract Secret for Frontend Confirmation
  const { clientSecret, amount, currency } = extractClientSecretFromSubscription(subscription as unknown as SubscriptionWithExpansion);

  return {
      subscriptionId: subscription.id,
      clientSecret,
      status: subscription.status,
      price: { amount, currency, interval },
  };
}

/**
 * Get subscription details for a team.
 */
export async function getSubscriptionDetails(
  teamId: string,
  userId: string
): Promise<{
  hasSubscription: boolean;
  plan: 'FREE' | 'PRO';
  isBillingUser: boolean;
  isCustomer: boolean;
  subscription?: {
    id: string;
    status: string;
    cancelAtPeriodEnd: boolean;
    currentPeriodEnd: number;
    interval?: string;
    amount?: number;
    currency?: string;
    paymentMethod?: {
      brand?: string;
      last4?: string;
      expMonth?: number;
      expYear?: number;
    } | null;
  };
}> {
  const team = await prisma.team.findUniqueOrThrow({ where: { id: teamId } });
  const isBillingUser = team.billingUserId === userId;
  
  if (!team.stripeCustomerId) {
    return {
      hasSubscription: false,
      plan: (team.plan as 'FREE' | 'PRO') || 'FREE',
      isBillingUser,
      isCustomer: false,
    };
  }
  
  const subscription = await findExistingSubscription(team.stripeCustomerId);
  
  if (!subscription) {
    if (team.plan === 'PRO') {
      await prisma.team.update({
        where: { id: teamId },
        data: { plan: 'FREE', subscriptionStatus: 'canceled' },
      });
    }
    return { hasSubscription: false, plan: 'FREE', isBillingUser, isCustomer: true };
  }
  
  const isActive = ['active', 'trialing', 'past_due'].includes(subscription.status);
  const item = subscription.items.data[0];
  const price = item?.price;
  
  // Sync DB if mismatch
  if (isActive && team.plan !== 'PRO') {
      await prisma.team.update({
        where: { id: teamId },
        data: { plan: 'PRO', subscriptionStatus: subscription.status },
      });
  }
  
  return {
    hasSubscription: isActive,
    plan: isActive ? 'PRO' : 'FREE',
    isBillingUser,
    isCustomer: true,
    subscription: {
      id: subscription.id,
      status: subscription.status,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      // Cast to custom type to access fields that might be missing in the installed Stripe types
      currentPeriodEnd: (subscription as unknown as SubscriptionWithExpansion).current_period_end,
      interval: price?.recurring?.interval,
      amount: (() => {
          const discount = (subscription as unknown as SubscriptionWithExpansion).discount;
          const baseAmount = price?.unit_amount ?? 0;
          if (!discount || !discount.coupon) return baseAmount;
          
          if (discount.coupon.percent_off) {
              return Math.round(baseAmount * (1 - discount.coupon.percent_off / 100));
          }
          if (discount.coupon.amount_off) {
              return Math.max(0, baseAmount - discount.coupon.amount_off);
          }
          return baseAmount;
      })(),
      currency: price?.currency,
      paymentMethod: subscription.default_payment_method && typeof subscription.default_payment_method === 'object' && subscription.default_payment_method.card ? {
          brand: subscription.default_payment_method.card.brand,
          last4: subscription.default_payment_method.card.last4,
          expMonth: subscription.default_payment_method.card.exp_month,
          expYear: subscription.default_payment_method.card.exp_year,
      } : null,
    },
  };
}

/**
 * Preview the price of a subscription (Dry Run).
 */
export async function getSubscriptionPreview(
  teamId: string,
  interval: 'month' | 'year',
  promotionCode?: string
): Promise<{ 
  amount: number; 
  currency: string; 
  subtotal: number;
  discount: number;
}> {

  const { customerId } = await getOrCreateCustomer(teamId, null);
  const targetPrice = await getPriceForInterval(interval);
  
  let promotionCodeId: string | undefined;
  if (promotionCode) {
    const promoId = await lookupPromotionCode(promotionCode);
    if (!promoId) throw new Error('Invalid promotion code');
    promotionCodeId = promoId;
  }

  // Use createPreview (cast to any as types are missing/outdated)

  const upcomingInvoice = await stripe.invoices.createPreview({
    customer: customerId,
    subscription_details: {
      items: [{ price: targetPrice.id }],
    },
    discounts: promotionCodeId ? [{ promotion_code: promotionCodeId }] : undefined,
  });

  const discountTotal = upcomingInvoice.total_discount_amounts?.reduce((a: number, b: { amount: number }) => a + b.amount, 0) || 0;

  return {
    amount: upcomingInvoice.total,
    currency: upcomingInvoice.currency,
    subtotal: upcomingInvoice.subtotal,
    discount: discountTotal,
  };
}

// Re-export other utilities if needed
export async function createPortalSession(teamId: string, returnUrl: string) {
    const team = await prisma.team.findUniqueOrThrow({ where: { id: teamId } });
    if (!team.stripeCustomerId) throw new Error('No customer');
    
    const session = await stripe.billingPortal.sessions.create({
        customer: team.stripeCustomerId,
        return_url: returnUrl,
    });
    return { url: session.url };
}

export async function listInvoices(teamId: string) {
    // Keep existing implementation logic if needed, simplified for brevity here
      const team = await prisma.team.findUniqueOrThrow({ where: { id: teamId } });
  
  if (!team.stripeCustomerId) {
    return { invoices: [] };
  }
  
  const invoices = await stripe.invoices.list({
    customer: team.stripeCustomerId,
    limit: 12,
  });
  
  const formattedInvoices = invoices.data
    .filter(invoice => {
      // Exclude drafts, voided, and uncollectible
      if (['draft', 'void', 'uncollectible'].includes(invoice.status || '')) return false;
      // Exclude abandoned checkout invoices
      if (invoice.status === 'open' && invoice.billing_reason === 'subscription_create') return false;
      return true;
    })
    .map(invoice => ({
      id: invoice.id,
      date: invoice.created,
      amount: invoice.total,
      currency: invoice.currency,
      status: invoice.status,
      invoicePdf: invoice.invoice_pdf ?? null,
      number: invoice.number,
    }));
  
  return { invoices: formattedInvoices };
}

export async function updateSubscriptionStatus(teamId: string, action: 'cancel' | 'reactivate') {
      const team = await prisma.team.findUniqueOrThrow({ where: { id: teamId } });
  
  if (!team.stripeCustomerId) {
    throw new Error('No subscription found');
  }
  
  const subscriptions = await stripe.subscriptions.list({
    customer: team.stripeCustomerId,
    status: 'active',
    limit: 1,
  });
  
  if (subscriptions.data.length === 0) {
    throw new Error('No active subscription found');
  }
  
  const sub = subscriptions.data[0];
  
  if (action === 'cancel') {
    await stripe.subscriptions.update(sub.id, {
      cancel_at_period_end: true,
    });
    return { success: true, message: 'Subscription will be canceled at period end' };
  }
  
  if (action === 'reactivate') {
    await stripe.subscriptions.update(sub.id, {
      cancel_at_period_end: false,
    });
    return { success: true, message: 'Subscription reactivated' };
  }
  
  throw new Error('Invalid action');
}

export async function createSetupIntent(teamId: string, userEmail: string | null) {
      const { customerId } = await getOrCreateCustomer(teamId, userEmail);

  const setupIntent = await stripe.setupIntents.create({
    customer: customerId,
    automatic_payment_methods: {
      enabled: true,
    },
    usage: 'off_session', 
  });

  if (!setupIntent.client_secret) {
    throw new Error('Failed to create SetupIntent');
  }

  return { clientSecret: setupIntent.client_secret };
}

