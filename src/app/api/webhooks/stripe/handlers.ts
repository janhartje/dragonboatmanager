import prisma from '@/lib/prisma';
import Stripe from 'stripe';
import { sendEmail } from '@/lib/email';
import PaymentFailedEmail from '@/emails/templates/PaymentFailedEmail';
import TrialEndingEmail from '@/emails/templates/TrialEndingEmail';

export async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  if (!session.metadata?.teamId) {
    console.error('Webhook: Missing teamId in metadata');
    return;
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

}

export async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  const customerId = typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id;

  if (!customerId) {
    console.error('Webhook invoice.payment_succeeded: No customer ID');
    return;
  }

  // Prefer metadata from subscription if available
  let teamId = invoice.parent?.subscription_details?.metadata?.teamId;
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

  } else {
    console.error('Webhook: No team found for customer:', customerId);
  }
}

export async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  const customerId = typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id;
  console.error(`PRO-PAYMENT-FAILED: Payment failed for Customer ${customerId} (Invoice: ${invoice.id})`);

  if (customerId) {
    const team = await prisma.team.findFirst({ where: { stripeCustomerId: customerId } });
    if (team) {


      // Find recipient email (Billing User or Team Email)
      let recipientEmail = team.email;
      if (team.billingUserId) {
        const billingUser = await prisma.user.findUnique({ where: { id: team.billingUserId } });
        if (billingUser?.email) recipientEmail = billingUser.email;
      }

      if (recipientEmail) {
        await sendEmail({
          to: recipientEmail,
          subject: 'Zahlung fehlgeschlagen - Drachenboot Manager',
          template: 'PaymentFailedEmail',
          react: PaymentFailedEmail({
            teamName: team.name,
            teamId: team.id
          })
        });

      } else {
        console.warn(`EMAIL-SKIPPED: No email found for Team ${team.id}`);
      }
    }
  }
}

export async function handleSubscriptionUpdated(sub: Stripe.Subscription, eventType: string) {
  const teamId = sub.metadata?.teamId;
  const customerId = sub.customer as string;

  // Try to find team by ID first (more reliable), then by customer ID
  const customerTeam = teamId
    ? await prisma.team.findUnique({ where: { id: teamId } })
    : await prisma.team.findFirst({ where: { stripeCustomerId: customerId } });

  if (!customerTeam) {
    console.error(`Webhook ${eventType}: No team found for customer ${customerId} or teamId ${teamId}`);
    return;
  }

  if (sub.status === 'active' || sub.status === 'trialing') {
    await prisma.team.update({
      where: { id: customerTeam.id },
      data: {
        plan: 'PRO',
        subscriptionStatus: sub.status,
        maxMembers: 100,
        stripeCustomerId: customerId,
      }
    });


  } else if (sub.status === 'canceled' || sub.status === 'unpaid' || sub.status === 'incomplete_expired') {
    await prisma.team.update({
      where: { id: customerTeam.id },
      data: {
        subscriptionStatus: sub.status,
        plan: 'FREE',
        maxMembers: 25,
      }
    });


  } else {
    // past_due, incomplete -> just update status
    await prisma.team.update({
      where: { id: customerTeam.id },
      data: { subscriptionStatus: sub.status }
    });

  }
}

export async function handleSubscriptionDeleted(sub: Stripe.Subscription) {
  const customerId = sub.customer as string;

  const canceledTeams = await prisma.team.findMany({
    where: { stripeCustomerId: customerId }
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
}

export async function handleTrialWillEnd(sub: Stripe.Subscription) {
  const customerId = sub.customer as string;


  const team = await prisma.team.findFirst({ where: { stripeCustomerId: customerId } });
  if (team) {
    let recipientEmail = team.email;
    if (team.billingUserId) {
      const billingUser = await prisma.user.findUnique({ where: { id: team.billingUserId } });
      if (billingUser?.email) recipientEmail = billingUser.email;
    }

    if (recipientEmail) {
      await sendEmail({
        to: recipientEmail,
        subject: 'Deine Testphase endet bald',
        template: 'TrialEndingEmail',
        react: TrialEndingEmail({
          teamName: team.name,
          teamId: team.id
        })
      });

    }
  }
}



export async function handleInvoicePaymentActionRequired(invoice: Stripe.Invoice) {
  const customerId = typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id;


  if (customerId) {
    const team = await prisma.team.findFirst({ where: { stripeCustomerId: customerId } });
    if (team) {


      let recipientEmail = team.email;
      if (team.billingUserId) {
        const billingUser = await prisma.user.findUnique({ where: { id: team.billingUserId } });
        if (billingUser?.email) recipientEmail = billingUser.email;
      }

      if (recipientEmail) {
        await sendEmail({
          to: recipientEmail,
          subject: 'Zahlung bestätigt werden - Drachenboot Manager',
          template: 'PaymentFailedEmail', // Reusing Failed template as it conveys "Action Needed" reasonably well, or create new.
          // Ideally we create a specific template, but to minimize scope creep we reuse 'failed' with slightly different context if possible, 
          // or just rely on generic message. For now, reusing failed email is better than nothing, but let's see if we can substitute text.
          // Actually, let's just use PaymentFailedEmail for now as it prompts user to check billing. 
          react: PaymentFailedEmail({
            teamName: team.name,
            teamId: team.id
          })
        });

      }
    }
  }
}
