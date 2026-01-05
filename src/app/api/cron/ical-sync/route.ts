import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { syncTeamEvents } from '@/services/ical/ical-service';

export async function GET(req: NextRequest) {
  // Verify Vercel Cron Secret
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  // Find teams with iCal URL
  const teams = await prisma.team.findMany({
    where: {
      icalUrl: {
        not: null
      }
    },
    select: {
      id: true,
      name: true
    }
  });

  const results = [];

  for (const team of teams) {
    try {
      const result = await syncTeamEvents(team.id);
      results.push({ team: team.name, ...result });
    } catch (error) {
       console.error(`Failed to sync team ${team.name}:`, error);
       results.push({ team: team.name, success: false, error: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  return Response.json({ success: true, results });
}
