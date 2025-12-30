import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import Stripe from 'stripe';

// Type for Invoice with expanded payment_intent field
type InvoiceWithPaymentIntent = Stripe.Invoice & { payment_intent?: Stripe.PaymentIntent | string | null };

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { teamId, interval = 'year' } = await request.json();

    if (!teamId) {
      return NextResponse.json({ error: 'Team ID is required' }, { status: 400 });
    }

    // Verify user is owner/captain of the team
    const membership = await prisma.paddler.findFirst({
      where: {
        userId: session.user.id,
        teamId: teamId,
        role: 'CAPTAIN', // Only captains can purchase subscriptions
      },
      include: { team: true }
    });

    if (!membership || !membership.team) {
      return NextResponse.json({ error: 'Not authorized or team not found' }, { status: 403 });
    }
    
    if (!process.env.STRIPE_PRO_PRICE_ID) {
        return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }
    
    // DYNAMIC PRICE LOOKUP
    // 1. Get the configured price to find the product
    const basePrice = await stripe.prices.retrieve(process.env.STRIPE_PRO_PRICE_ID);
    const productId = typeof basePrice.product === 'string' ? basePrice.product : basePrice.product.id;
    
    // 2. List active recurring prices for this product
    const prices = await stripe.prices.list({
        product: productId,
        active: true,
        type: 'recurring',
        limit: 10,
    });
    
    // 3. Find the price matching the requested interval
    const selectedPrice = prices.data.find(p => p.recurring?.interval === interval);
    
    if (!selectedPrice) {
        console.error(`No price found for interval: ${interval} on product: ${productId}`);
        return NextResponse.json({ error: `Price for ${interval} interval not found` }, { status: 404 });
    }
    
    const targetPriceId = selectedPrice.id;
    const team = membership.team;
    let customerId = team.stripeCustomerId;

    if (customerId) {
        // Verify customer exists in Stripe
        try {
            const customer = await stripe.customers.retrieve(customerId);
            if ((customer as Stripe.DeletedCustomer).deleted) {
                customerId = null;
            }
        } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
            if (error.code === 'resource_missing') {
                customerId = null;
            } else {
                throw error;
            }
        }
    }

    if (!customerId) {
        const customer = await stripe.customers.create({
        email: session.user.email || undefined,
        name: team.name,
        metadata: {
            teamId: team.id,
        },
        });
        customerId = customer.id;
        
        // Update team with new customer ID and set billing user
        await prisma.team.update({
            where: { id: team.id },
            data: { 
            stripeCustomerId: customerId,
            billingUserId: session.user.id, // The user purchasing becomes the billing admin
            }
        });
    }

    // Check for existing incomplete subscription
    const existingSubscriptions = await stripe.subscriptions.list({
        customer: customerId,
        status: 'incomplete', 
        limit: 3,
        expand: ['data.latest_invoice.payment_intent'],
    });

    // Helper to ensure we have an expanded invoice
    const getExpandedInvoice = async (invId: string): Promise<InvoiceWithPaymentIntent | null> => {
        try {
            let inv = await stripe.invoices.retrieve(invId, { expand: ['payment_intent'] }) as InvoiceWithPaymentIntent;
            
            if (inv.status === 'draft') {
                inv = await stripe.invoices.finalizeInvoice(invId, { expand: ['payment_intent'] }) as InvoiceWithPaymentIntent;
            }
            return inv;
        } catch (e) {
            console.error('Failed to expand/finalize invoice:', invId, e);
            return null;
        }
    };

    let subscription: Stripe.Subscription | undefined;
    let paymentIntent: Stripe.PaymentIntent | null = null;

    for (const sub of existingSubscriptions.data) {
        // Ensure latest_invoice is an object and has payment_intent
        let inv: InvoiceWithPaymentIntent | null = null;
        if (typeof sub.latest_invoice === 'string') {
            inv = await getExpandedInvoice(sub.latest_invoice);
        } else if (sub.latest_invoice) {
            inv = sub.latest_invoice as InvoiceWithPaymentIntent;
            // If it's an object but PI is just an ID string, we must expand it
            if (typeof inv.payment_intent === 'string') {
                inv = await getExpandedInvoice(inv.id);
            }
        }

        const pi = (inv && typeof inv.payment_intent === 'object' ? inv.payment_intent : null) as Stripe.PaymentIntent | null;
        const subPriceId = sub.items.data[0]?.price.id;
        
        if (subPriceId !== targetPriceId) {
            try { await stripe.subscriptions.cancel(sub.id); } catch { /* ignore */ }
            continue;
        }
        
        if (inv && pi && pi.client_secret) {
            subscription = sub;
            subscription.latest_invoice = inv; // Attach the expanded one
            paymentIntent = pi;
            break;
        } else {
            try {
                await stripe.subscriptions.cancel(sub.id);
            } catch {
                // Ignore errors during cancellation of potentially pre-cancelled subs
            }
        }
    }

    if (!subscription) {
        // Create Subscription
        // Restore explicit payment settings as defaults failed
        subscription = await stripe.subscriptions.create({
            customer: customerId,
            items: [{ price: targetPriceId }],
            payment_behavior: 'default_incomplete',
            payment_settings: { 
                save_default_payment_method: 'on_subscription',
            },
            expand: ['latest_invoice.payment_intent'],
            metadata: {
                teamId: team.id,
            },
        });
    }

    let latestInvoice: InvoiceWithPaymentIntent | null = subscription.latest_invoice as InvoiceWithPaymentIntent;
    const priceDetails = await stripe.prices.retrieve(targetPriceId);

    // ROBUST PI LOOKUP: Sometimes Stripe takes a second to attach the PI to the invoice
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts && !paymentIntent) {
        if (attempts > 0) {
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        const currentInvRef = subscription.latest_invoice;
        const activeInvoiceId = typeof currentInvRef === 'string' ? currentInvRef : currentInvRef?.id;
        
        if (activeInvoiceId) {
            latestInvoice = await getExpandedInvoice(activeInvoiceId);
            if (latestInvoice && typeof latestInvoice.payment_intent === 'object' && latestInvoice.payment_intent !== null) {
                paymentIntent = latestInvoice.payment_intent as Stripe.PaymentIntent;
            } else if (latestInvoice && typeof latestInvoice.payment_intent === 'string') {
                paymentIntent = await stripe.paymentIntents.retrieve(latestInvoice.payment_intent);
            }
        }

        // Final fallback: if no PI on invoice, search for the most recent PI for this customer
        if (!paymentIntent) {
            const recentPIs = await stripe.paymentIntents.list({
                customer: customerId,
                limit: 3,
            });
            
            const now = Math.floor(Date.now() / 1000);
            const foundPI = recentPIs.data.find(pi => 
                pi.status === 'requires_payment_method' && 
                (now - pi.created) < 30
            );

            if (foundPI) {
                paymentIntent = foundPI;
            }
        }
        attempts++;
    }

    if (!latestInvoice || !paymentIntent || !paymentIntent.client_secret) {
         const errorDetails = {
                hasInvoice: !!latestInvoice,
                hasIntent: !!paymentIntent,
                invoiceStatus: latestInvoice?.status,
                priceId: targetPriceId,
                amount: selectedPrice.unit_amount,
                currency: selectedPrice.currency
         };
         return NextResponse.json({ 
            error: 'Failed to create payment intent. Please contact support.',
            details: errorDetails
         }, { status: 500 });
    }

    return NextResponse.json({ 
        subscriptionId: subscription.id, 
        clientSecret: paymentIntent.client_secret,
        price: {
            amount: priceDetails.unit_amount,
            currency: priceDetails.currency,
            interval: priceDetails.recurring?.interval,
        }
    });

  } catch (error) {
    console.error('Stripe Subscription Creation Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
