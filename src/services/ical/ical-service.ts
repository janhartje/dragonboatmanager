import prisma from '@/lib/prisma';
import ical from 'node-ical';
import { validateUrl } from '@/utils/url-validation';

// Returns { created: number, updated: number }
export async function syncTeamEvents(teamId: string, icalUrl?: string) {
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
    if (!validateUrl(urlToUse)) {
        throw new Error('Invalid iCal URL (Security Check Failed)');
    }

    // Fetch and parse iCal
    const events = await ical.async.fromURL(urlToUse);
    let createdCount = 0;
    let updatedCount = 0;

    const parsedEvents: { title: string; date: Date; uid: string; type: string; boatSize: string }[] = [];

    for (const event of Object.values(events)) {
      if (event.type === 'VEVENT') {
        const vevent = event as ical.VEvent;
        
        const title = vevent.summary;
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

    // Batch Fetch Existing Events
    const existingEvents = await prisma.event.findMany({
        where: {
            teamId,
            externalUid: { in: Array.from(validUids) }
        },
        select: { id: true, externalUid: true, title: true, date: true }
    });

    const existingMap = new Map(existingEvents.map(e => [e.externalUid, e]));
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const eventsToCreate: any[] = [];
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
                syncDetails.push(`Updated: "${p.title}" on ${p.date.toLocaleDateString()}`);
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
            syncDetails.push(`Created: "${p.title}" on ${p.date.toLocaleDateString()}`);
            createdCount++;
        }
    }

    // Bulk Create
    if (eventsToCreate.length > 0) {
        await prisma.event.createMany({
            data: eventsToCreate
        });
    }

    // Sequential Update (Prisma doesn't support bulk update with different data yet efficiently without raw SQL)
    // We use Promise.all to parallelize at least the network requests
    if (eventsToUpdate.length > 0) {
        await Promise.all(eventsToUpdate.map(e => 
            prisma.event.update({
                where: { id: e.id },
                data: { title: e.title, date: e.date }
            })
        ));
    }

    // Handle Deletions
    // We need to fetch ALL events with externalUid for this team to find deletions
    // We can't rely just on 'existingEvents' because that was filtered by validUids (IN clause)
    // But we can just query for events NOT IN validUids
    const eventsToDelete = await prisma.event.findMany({
        where: {
            teamId,
            externalUid: { not: null, notIn: Array.from(validUids) }
        },
        select: { id: true, title: true, date: true }
    });
    
    const deletedCount = eventsToDelete.length;

    if (deletedCount > 0) {
      await prisma.event.deleteMany({
        where: {
          id: { in: eventsToDelete.map(e => e.id) }
        }
      });
      eventsToDelete.forEach(e => {
        syncDetails.push(`Deleted: "${e.title}" (${e.date.toISOString().split('T')[0]})`);
      });
    }

    // Log success
    await prisma.syncLog.create({
      data: {
        teamId,
        status: 'SUCCESS',
        createdCount,
        updatedCount,
        deletedCount: deletedCount, 
        details: syncDetails
      },
    });

    return { success: true, count: createdCount + updatedCount, created: createdCount, updated: updatedCount, deleted: deletedCount };

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
}
