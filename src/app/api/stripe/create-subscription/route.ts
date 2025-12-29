import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import Stripe from 'stripe';

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
    console.log(`Selected Price ID for ${interval}:`, targetPriceId);

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
                console.log('Stripe customer missing, creating new one');
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

    console.log('Creating subscription for team:', teamId, 'with price:', targetPriceId);
    
    // Check for existing incomplete subscription
    console.log('Checking for existing subscriptions for customer:', customerId);
    const existingSubscriptions = await stripe.subscriptions.list({
        customer: customerId,
        status: 'incomplete', 
        limit: 3,
        expand: ['data.latest_invoice.payment_intent'],
    });

    let subscription: Stripe.Subscription | undefined;

    // Find a suitable incomplete subscription
    // If we find one, we should also check if it has the CORRECT price.
    // If not, we might need to cancel it or update it. 
    // For simplicity, if the price doesn't match, we cancel and create new.
    
    for (const sub of existingSubscriptions.data) {
        const inv = sub.latest_invoice as Stripe.Invoice;
        const pi = inv?.payment_intent as Stripe.PaymentIntent;
        const subPriceId = sub.items.data[0]?.price.id;
        
        if (subPriceId !== targetPriceId) {
                console.log('Found incomplete subscription but with wrong price, cancelling:', sub.id);
                try { await stripe.subscriptions.cancel(sub.id); } catch { /* ignore */ }
                continue;
        }
        
        if (inv && pi && pi.client_secret) {
            console.log('Found valid reusable subscription:', sub.id);
            subscription = sub;
            break;
        } else {
            console.log('Found broken/stuck subscription, cancelling:', sub.id);
            try {
                await stripe.subscriptions.cancel(sub.id);
            } catch (e) {
                console.error('Failed to cancel broken sub:', e);
            }
        }
    }

    if (subscription) {
        console.log('Reusing existing incomplete subscription:', subscription.id);
    } else {
        console.log('No reusable valid subscription found. Creating new one.');
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
        console.log('Subscription created:', subscription.id, 'Status:', subscription.status);
    }
    
    // Fetch price details to return to frontend
    const priceDetails = await stripe.prices.retrieve(targetPriceId);

    let latestInvoice = subscription.latest_invoice as Stripe.Invoice;
    let paymentIntent = latestInvoice?.payment_intent as Stripe.PaymentIntent | null;

    // Retry fetching invoice if payment intent is missing/null
    if (latestInvoice && !paymentIntent) {
        console.log('Payment Intent missing in inv object, fetching invoice explicitly...');
        latestInvoice = await stripe.invoices.retrieve(latestInvoice.id, {
            expand: ['payment_intent'],
        });
        paymentIntent = latestInvoice.payment_intent as Stripe.PaymentIntent;
        
        console.log('Explicitly fetched invoice:', JSON.stringify(latestInvoice, null, 2));
    }

    console.log('Latest Invoice ID:', latestInvoice?.id);
    
    // If still no payment intent, maybe we need to finalize?
    if (latestInvoice && latestInvoice.status !== 'open' && latestInvoice.status !== 'paid') {
            console.log('Invoice status is:', latestInvoice.status, 'Attempting to finalize...');
            // Note: You can't finalize if it's already open, but if it's draft, we can.
            if (latestInvoice.status === 'draft') {
                latestInvoice = await stripe.invoices.finalizeInvoice(latestInvoice.id, { expand: ['payment_intent'] });
                paymentIntent = latestInvoice.payment_intent as Stripe.PaymentIntent;
            }
    }

    if (latestInvoice && !paymentIntent) {
        // Fallback: If for some reason the invoice has no payment intent, create one manually?
        // Actually, subscription invoices usually have one automatically.
        // If it's OPEN and has no payment intent, it might be that payment_settings aren't sticking.
        console.log('Invoice is OPEN but has no Payment Intent. Attempting to create ad-hoc Payment Intent or update invoice?');
        
        // Try to update the invoice to force payment collection?
        // Or just create a separate PaymentIntent for the amount?
        // STRIPE QUIRK: Sometimes initial subscription invoices don't generate PIs if the amount is 0 or if there's a race?
        // But amount is 5000.
        
        // Let's create a standalone PaymentIntent for this invoice?
        // Risky if we duplicate.
        // Better approach:
        // If the invoice is open, we can try to pay it?
        
        // ULTIMATE FALLBACK:
        // Use SetupIntent for future payments if this is just a setup? 
        // No, we want to pay.
        
        // Let's create a PaymentIntent manually linked to the customer.
        // Note: This won't technically pay the invoice automatically unless we handle webhooks to mark invoice paid.
        // But for "subscription creation", usually we want the subscription's own PI.
        
        // Let's try to update the subscription to force incomplete?
        console.log('Forcing creation of Payment Intent for Invoice:', latestInvoice.id);
        
        try {
            // Cannot 'create' a PI for an existing invoice easily via API if not auto-generated.
            // But we can finalize? It is already finalized.
            
            // Checking if we can retrieve it from the subscription directly?
                const subRefetched = await stripe.subscriptions.retrieve(subscription.id, { expand: ['latest_invoice.payment_intent'] });
                const inv = subRefetched.latest_invoice as Stripe.Invoice;
                if (inv.payment_intent) {
                    paymentIntent = inv.payment_intent as Stripe.PaymentIntent;
                }
        } catch (e) {
            console.error('Error refetching:', e);
        }
    }
    
    // Last ditch: create a SetupIntent if all else fails, just to get a client secret?
    // No, that won't charge the card.
    
    // Correction:
    // If the invoice is open and finalized but has no payment_intent, it implies "collection_method" might be 'send_invoice'?
    // Let's check collection_method.
    if (latestInvoice?.collection_method === 'send_invoice') {
        // We need 'charge_automatically'
        console.log('Collection method is send_invoice! Updating to charge_automatically...');
        // We can't update finalized invoices easily.
        // But we can update the subscription payment settings.
    }

    if (latestInvoice) {
        // Handle case where payment_intent is a string
        if (typeof paymentIntent === 'string') {
             console.log('Payment intent is string ID, fetching object...');
             paymentIntent = await stripe.paymentIntents.retrieve(paymentIntent);
        }
        
        console.log('Final Payment Intent Status:', paymentIntent?.status);
    }

    if (!latestInvoice || !paymentIntent || !paymentIntent.client_secret) {
        // Create a new fresh subscription if the old one is borked
        // Or just return error
         console.error('Missing invoicing details:', { 
            hasInvoice: !!latestInvoice, 
            hasIntent: !!paymentIntent, 
            hasSecret: !!paymentIntent?.client_secret 
         });
         return NextResponse.json({ error: 'Failed to create payment intent. Please contact support.' }, { status: 500 });
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
