import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import ical from 'node-ical';
import { validateUrl } from '@/utils/url-validation';

const MAX_ICAL_SIZE_BYTES = 5 * 1024 * 1024;

export interface SyncResult {
  success: boolean;
  count: number;
  created: number;
  updated: number;
  deleted: number;
}

// Returns SyncResult
// Returns SyncResult
export async function syncTeamEvents(teamId: string, icalUrl?: string): Promise<SyncResult> {
  const syncDetails: string[] = [];
  const validUids = new Set<string>();
  
  try {
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      select: { icalUrl: true },
    });

    if (!team) throw new Error('Team not found');
    
    // Use provided URL or fallback to stored one
    const urlToUse = icalUrl || team.icalUrl;
    if (!urlToUse) throw new Error('No iCal URL provided');

    // Security Check
    // Note: safeFetch also strictly validates, but we fail fast here if it's obviously bad
    if (!validateUrl(urlToUse)) {
        throw new Error('Invalid iCal URL (Security Check Failed)');
    }

    // Fetch and parse iCal with timeout SAFE FETCH
    // We rely on safeFetch's internal timeout and IP validation
    let events: ical.CalendarResponse;
    const { safeFetch } = await import('@/utils/safe-fetch');

    try {
        const response = await safeFetch(urlToUse, { 
            timeout: 10000,
            redirect: 'manual' 
        });
        
        if (!response.ok) {
            throw new Error(`Failed to fetch iCal: ${response.status} ${response.statusText}`);
        }
        const text = await response.text();
        
        // Safety: Prevent processing excessively large files (limit to 5MB)
        if (text.length > MAX_ICAL_SIZE_BYTES) {
            throw new Error('iCal file too large (max 5MB)');
        }

        events = ical.parseICS(text);
    } catch (error: unknown) {
        if (error instanceof Error && error.name === 'AbortError') {
             throw new Error('iCal fetch timed out after 10s');
        }
        throw error;
    }

    let createdCount = 0;
    let updatedCount = 0;

    const parsedEvents: { title: string; date: Date; uid: string; type: string; boatSize: string }[] = [];

    for (const event of Object.values(events)) {
      if (event.type === 'VEVENT') {
        const vevent = event as ical.VEvent;
        
        const title = vevent.summary?.replace(/<[^>]*>?/g, '').trim();
        const date = vevent.start; // node-ical returns Date object
        const uid = vevent.uid;
        
        if (!title || !date || !uid) continue;

        validUids.add(uid);
        
        parsedEvents.push({
            title,
            date,
            uid,
            type: 'training', // default
            boatSize: 'standard' // default
        });
      }
    }

    // Batch Fetch Existing Events (Read Phase - Outside Transaction)
    // Avoids "too many parameters" error for large calendars
    const validUidsArray = Array.from(validUids);
    const BATCH_SIZE = 500;
    const existingEvents: { id: string; externalUid: string | null; title: string; date: Date }[] = [];

    for (let i = 0; i < validUidsArray.length; i += BATCH_SIZE) {
        const chunk = validUidsArray.slice(i, i + BATCH_SIZE);
        const chunkEvents = await prisma.event.findMany({
            where: {
                teamId,
                externalUid: { in: chunk }
            },
            select: { id: true, externalUid: true, title: true, date: true }
        });
        existingEvents.push(...chunkEvents);
    }

    const existingMap = new Map(existingEvents.map(e => [e.externalUid!, e]));
    
    // Use correct Prisma input type
    const eventsToCreate: Prisma.EventCreateManyInput[] = [];
    const eventsToUpdate: { id: string, title: string, date: Date }[] = [];

    for (const p of parsedEvents) {
        const existing = existingMap.get(p.uid);

        if (existing) {
            // Check if update is needed
            if (existing.title !== p.title || existing.date.getTime() !== p.date.getTime()) {
                eventsToUpdate.push({
                    id: existing.id,
                    title: p.title,
                    date: p.date
                });
                if (syncDetails.length < 50) {
                    syncDetails.push(`Updated: "${p.title}" on ${p.date.toLocaleDateString()}`);
                } else if (syncDetails.length === 50) {
                    syncDetails.push('... and more updates');
                }
                updatedCount++;
            }
        } else {
            eventsToCreate.push({
                teamId,
                title: p.title,
                date: p.date,
                externalUid: p.uid,
                type: p.type,
                boatSize: p.boatSize
            });
            if (syncDetails.length < 50) {
                syncDetails.push(`Created: "${p.title}" on ${p.date.toLocaleDateString()}`);
            } else if (syncDetails.length === 50) {
                syncDetails.push('... and more creations');
            }
            createdCount++;
        }
    }

    // Wrap DB writes in a transaction (Write Phase)
    return await prisma.$transaction(async (tx) => {
        // Bulk Create
        if (eventsToCreate.length > 0) {
            await tx.event.createMany({
                data: eventsToCreate
            });
        }

        // Parallel Updates to prevent connection pool starvation and reduce transaction time
        if (eventsToUpdate.length > 0) {
            await Promise.all(eventsToUpdate.map(e => 
                tx.event.update({
                    where: { id: e.id },
                    data: { title: e.title, date: e.date }
                })
            ));
        }

        // Handle Deletions
        // Get all events that are NOT in the validUids set
        // Note: For deletion finding, we rely on the specific NOT IN query.
        // If validUids is large, NOT IN can also be slow/problematic, but usually better handled or we can invert logic.
        // However, standard prisma 'notIn' might also hit param limits.
        // Safe approach for massive calendars: Select ALL externalUid events for team, then filter in memory?
        // Or if validUids is > 2000, maybe do that?
        // Let's keep it simple for now, but aware of limits. If validUids is HUGE, we have other problems.
        // Actually, if we use notIn with a huge list, it will crash.
        // BETTER: Fetch ALL event IDs + UIDs for the team, then set diff.
        
        let eventsToDelete: { id: string; title: string; date: Date }[] = [];
        
        if (validUids.size > 2000) {
             // In-memory diff for large sets
             const allTeamEvents = await tx.event.findMany({
                 where: { teamId, externalUid: { not: null } },
                 select: { id: true, externalUid: true, title: true, date: true }
             });
             eventsToDelete = allTeamEvents.filter(e => e.externalUid && !validUids.has(e.externalUid));
        } else {
             // Standard DB query for normal sizes
             eventsToDelete = await tx.event.findMany({
                where: {
                    teamId,
                    externalUid: { not: null, notIn: Array.from(validUids) }
                },
                select: { id: true, title: true, date: true }
             });
        }
        
        const deletedCount = eventsToDelete.length;

        // PANIC SWITCH: Mass Deletion Protection
        // If attempting to delete > 50% of the managed calendar, aborted.
        // Calculate total previously existing managed events
        // Method: existingEvents (those matching current feed) + eventsToDelete (those NOT matching)
        // Note: existingEvents only contains those that were found in the feed.
        // If the feed is empty, validUids is empty. existingEvents is empty. 
        // eventsToDelete is ALL DB events. Total = 0 + all = all. 
        // deletedCount / all = 100% > 50% -> ABORT. Correct.
        const matchesCount = existingEvents.length;
        const totalBefore = matchesCount + deletedCount;

        if (totalBefore > 5 && deletedCount > 0) {
            const deleteRatio = deletedCount / totalBefore;
            if (deleteRatio > 0.5) {
                throw new Error(`Safety Stop: Attempting to delete ${deletedCount} of ${totalBefore} events (${(deleteRatio * 100).toFixed(1)}%). Manual confirmation required.`);
            }
        }

        if (deletedCount > 0) {
          // Batch deletes
          const deleteIds = eventsToDelete.map(e => e.id);
          // Prisma deleteMany with 'in' also checks param limits, so batch it
          for (let i = 0; i < deleteIds.length; i += BATCH_SIZE) {
               await tx.event.deleteMany({
                   where: { id: { in: deleteIds.slice(i, i + BATCH_SIZE) } }
               });
          }

          eventsToDelete.forEach(e => {
            if (syncDetails.length < 50) {
              syncDetails.push(`Deleted: "${e.title}" (${e.date.toISOString().split('T')[0]})`);
            } else if (syncDetails.length === 50) {
              syncDetails.push('... and more deletions');
            }
          });
        }

        // Log success
        await tx.syncLog.create({
          data: {
            teamId,
            status: 'SUCCESS',
            createdCount,
            updatedCount, // These counts are computed outside but valid
            deletedCount: deletedCount, 
            details: syncDetails
          },
        });

        return { success: true, count: createdCount + updatedCount, created: createdCount, updated: updatedCount, deleted: deletedCount };
    });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('iCal Sync Error:', message);
    // Log error
    await prisma.syncLog.create({
      data: {
        teamId,
        status: 'ERROR',
        createdCount: 0,
        updatedCount: 0,
        error: message,
        details: syncDetails // Save whatever we logged so far
      },
    });
    throw error;
  }
} // End syncTeamEvents
