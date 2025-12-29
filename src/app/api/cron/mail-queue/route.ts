import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { Resend } from 'resend';

export const dynamic = 'force-dynamic'; // Ensure it's not cached
export const maxDuration = 60; // Allow 60 seconds (max for hobby/pro usually enough for batch)

const BATCH_SIZE = 10;
const MAX_RETRIES = 3;

export async function GET() {
  const resendApiKey = process.env.RESEND_API_KEY;
  if (!resendApiKey) {
     return NextResponse.json({ error: 'RESEND_API_KEY is not set' }, { status: 500 });
  }
  const resend = new Resend(resendApiKey);
  // Security: You might want to add a CRON_SECRET check here
  // const authHeader = req.headers.get('authorization');
  // if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
  //   return new Response('Unauthorized', { status: 401 });
  // }

  try {
    // 1. Fetch pending emails
    const pendingEmails = await prisma.emailQueue.findMany({
      where: {
        status: { in: ['pending'] },
         // optionally handle stuck 'processing' items if they are old
      },
      take: BATCH_SIZE,
      orderBy: { createdAt: 'asc' },
    });

    if (pendingEmails.length === 0) {
      return NextResponse.json({ message: 'No pending emails' });
    }

    const results = [];

    // 2. Process each email
    for (const email of pendingEmails) {
      try {
        // Mark as processing
        await prisma.emailQueue.update({
          where: { id: email.id },
          data: { status: 'processing' },
        });

        if (!process.env.RESEND_API_KEY) {
            throw new Error('RESEND_API_KEY not set');
        }

        // Send via Resend
        const { error } = await resend.emails.send({
          from: email.from || 'Drachenboot Manager <no-reply@drachenbootmanager.de>',
          to: email.to,
          replyTo: email.replyTo || undefined,
          subject: email.subject,
          html: email.body,
        });

        if (error) {
          throw new Error(JSON.stringify(error));
        }

        // Success
        await prisma.emailQueue.update({
          where: { id: email.id },
          data: { 
            status: 'sent', 
            attempts: { increment: 1 },
            // Optionally clear body here to save space? Keeping it for now.
          },
        });
        
        results.push({ id: email.id, status: 'sent' });

      } catch (err) {
        console.error(`Failed to send email ${email.id}:`, err);
        const isRetryable = (email.attempts + 1) < MAX_RETRIES;
        const newStatus = isRetryable ? 'pending' : 'failed';
        
        await prisma.emailQueue.update({
          where: { id: email.id },
          data: { 
            status: newStatus, 
            attempts: { increment: 1 },
            lastError: err instanceof Error ? err.message : String(err)
          },
        });
        results.push({ id: email.id, status: newStatus, error: err instanceof Error ? err.message : String(err) });
      }
    }

    return NextResponse.json({ processed: results.length, results });

  } catch (error) {
    console.error('Cron job error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
