import prisma from '@/lib/prisma';
import Stripe from 'stripe';
import { sendEmail } from '@/lib/email';
import { PLAN_LIMITS } from '@/lib/utils';
import PaymentFailedEmail from '@/emails/templates/PaymentFailedEmail';
import TrialEndingEmail from '@/emails/templates/TrialEndingEmail';
import PaymentActionRequiredEmail from '@/emails/templates/PaymentActionRequiredEmail';
import { t, Language } from '@/emails/utils/i18n';

// Helper to determine language
function getLanguage(user: { language: string | null } | null): Language {
  return (user?.language === 'en' ? 'en' : 'de');
}

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
      maxMembers: PLAN_LIMITS.PRO,
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
        maxMembers: PLAN_LIMITS.PRO,
      }
    });

  } else {
    // Redacted log
    console.error('Webhook: No team found for customer');
  }
}

export async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  const customerId = typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id;
  // Redacted log
  console.error(`PRO-PAYMENT-FAILED: Payment failed for Customer (redacted) (Invoice: ${invoice.id})`);

  if (customerId) {
    const team = await prisma.team.findFirst({ where: { stripeCustomerId: customerId } });
    if (team) {


      // Find recipient email (Billing User or Team Email)
      let recipientEmail = team.email;
      let lang: Language = 'de';
      
      if (team.billingUserId) {
        const billingUser = await prisma.user.findUnique({ where: { id: team.billingUserId } });
        if (billingUser?.email) recipientEmail = billingUser.email;
        lang = getLanguage(billingUser);
      }

      if (recipientEmail) {
        await sendEmail({
          to: recipientEmail,
          subject: t(lang, 'emailPaymentFailedSubject'),
          template: 'PaymentFailedEmail',
          react: PaymentFailedEmail({
            teamName: team.name,
            teamId: team.id,
            lang
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
    // Redacted log
    console.error(`Webhook ${eventType}: No team found for customer (redacted) or teamId (redacted)`);
    return;
  }

  if (sub.status === 'active' || sub.status === 'trialing') {
    await prisma.team.update({
      where: { id: customerTeam.id },
      data: {
        plan: 'PRO',
        subscriptionStatus: sub.status,
        maxMembers: PLAN_LIMITS.PRO,
        stripeCustomerId: customerId,
      }
    });


  } else if (sub.status === 'canceled' || sub.status === 'unpaid' || sub.status === 'incomplete_expired') {
    await prisma.team.update({
      where: { id: customerTeam.id },
      data: {
        subscriptionStatus: sub.status,
        plan: 'FREE',
        maxMembers: PLAN_LIMITS.FREE,
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

  // Use updateMany to handle multiple teams and avoid race conditions
  await prisma.team.updateMany({
    where: { stripeCustomerId: customerId },
    data: {
      plan: 'FREE',
      subscriptionStatus: 'canceled',
      maxMembers: PLAN_LIMITS.FREE,
    }
  });
}

export async function handleTrialWillEnd(sub: Stripe.Subscription) {
  const customerId = sub.customer as string;


  const team = await prisma.team.findFirst({ where: { stripeCustomerId: customerId } });
  if (team) {
    let recipientEmail = team.email;
    let lang: Language = 'de';

    if (team.billingUserId) {
      const billingUser = await prisma.user.findUnique({ where: { id: team.billingUserId } });
      if (billingUser?.email) recipientEmail = billingUser.email;
      lang = getLanguage(billingUser);
    }

    if (recipientEmail) {
      await sendEmail({
        to: recipientEmail,
        subject: t(lang, 'emailTrialEndingSubject'),
        template: 'TrialEndingEmail',
        react: TrialEndingEmail({
          teamName: team.name,
          teamId: team.id,
          lang
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
      let lang: Language = 'de';

      if (team.billingUserId) {
        const billingUser = await prisma.user.findUnique({ where: { id: team.billingUserId } });
        if (billingUser?.email) recipientEmail = billingUser.email;
        lang = getLanguage(billingUser);
      }

      if (recipientEmail) {
        await sendEmail({
          to: recipientEmail,
          subject: t(lang, 'emailPaymentActionRequiredSubject'),
          template: 'PaymentActionRequiredEmail',
          react: PaymentActionRequiredEmail({
            teamName: team.name,
            teamId: team.id,
            lang
          })
        });

      }
    }
  }
}
