import { NextResponse } from 'next/server';
import { processMailQueue } from '@/lib/mailQueue';

export const dynamic = 'force-dynamic'; // Ensure it's not cached
export const maxDuration = 60; // Allow 60 seconds (max for hobby/pro usually enough for batch)

export async function GET() {
  // Security: You might want to add a CRON_SECRET check here
  // const authHeader = req.headers.get('authorization');
  // if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
  //   return new Response('Unauthorized', { status: 401 });
  // }

  try {
    const result = await processMailQueue();
    
    if (result.processed === 0) {
      return NextResponse.json({ message: 'No pending emails' });
    }

    return NextResponse.json(result);

  } catch (error) {
    console.error('Cron job error:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Internal Server Error' 
    }, { status: 500 });
  }
}
