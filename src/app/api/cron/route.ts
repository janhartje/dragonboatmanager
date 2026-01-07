import { NextRequest, NextResponse } from 'next/server';
import pLimit from 'p-limit';
import prisma from '@/lib/prisma';
import { syncTeamEvents } from '@/services/ical/ical-service';
import { processMailQueue } from '@/lib/mailQueue';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Increased to handle all tasks

// MCP Session TTL: 24 hours
const SESSION_TTL_MS = 24 * 60 * 60 * 1000;

export async function GET(req: NextRequest) {
    // 1. Verify Vercel Cron Secret
    const CRON_SECRET = process.env.CRON_SECRET;
    const authHeader = req.headers.get('authorization');

    if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
        return new Response('Unauthorized', { status: 401 });
    }

    const results: Record<string, unknown> = {
        mailQueue: null,
        icalSync: null,
        mcpCleanup: null,
    };

    // 2. Process Mail Queue
    try {
        results.mailQueue = await processMailQueue();
    } catch (error) {
        console.error('[Cron] Mail Queue Error:', error);
        results.mailQueue = { error: error instanceof Error ? error.message : 'Unknown error' };
    }

    // 3. iCal Sync
    try {
        const teams = await prisma.team.findMany({
            where: { icalUrl: { not: null } },
            select: { id: true, name: true }
        });

        const limit = pLimit(5);
        const icalPromises = teams.map((team) => limit(async () => {
            try {
                const result = await syncTeamEvents(team.id);
                return { team: team.name, ...result };
            } catch (error: unknown) {
                return { team: team.name, success: false, error: error instanceof Error ? error.message : 'Unknown error' };
            }
        }));
        results.icalSync = await Promise.all(icalPromises);
    } catch (error) {
        console.error('[Cron] iCal Sync Error:', error);
        results.icalSync = { error: error instanceof Error ? error.message : 'Unknown error' };
    }

    // 4. MCP Cleanup
    try {
        const cutoffDate = new Date(Date.now() - SESSION_TTL_MS);
        const mcpResult = await prisma.mcpSession.deleteMany({
            where: {
                OR: [
                    { expiresAt: { lt: new Date() } },
                    {
                        createdAt: { lt: cutoffDate },
                        expiresAt: null
                    },
                ],
            },
        });
        results.mcpCleanup = { deletedCount: mcpResult.count };
    } catch (error) {
        console.error('[Cron] MCP Cleanup Error:', error);
        results.mcpCleanup = { error: error instanceof Error ? error.message : 'Unknown error' };
    }

    return NextResponse.json({
        success: true,
        timestamp: new Date().toISOString(),
        results
    });
}
