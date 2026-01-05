import prisma from '@/lib/prisma';
import ical from 'node-ical';

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

    // Fetch and parse iCal
    const events = await ical.async.fromURL(urlToUse);
    let createdCount = 0;
    let updatedCount = 0;

    for (const event of Object.values(events)) {
      if (event.type === 'VEVENT') {
        const vevent = event as ical.VEvent;
        
        const title = vevent.summary;
        const date = vevent.start; // node-ical returns Date object
        const uid = vevent.uid;
        
        if (!title || !date || !uid) continue;

      validUids.add(uid);

        // Check if exists
        const existing = await prisma.event.findUnique({
          where: {
            teamId_externalUid: {
              teamId,
              externalUid: uid
            }
          }
        });

        if (existing) {
            await prisma.event.update({
                where: { id: existing.id },
                data: {
                    title: title,
                    date: date,
                }
            });
            updatedCount++;
            syncDetails.push(`Updated: "${title}" on ${date.toLocaleDateString()}`);
        } else {
            await prisma.event.create({
                data: {
                    teamId,
                    title: title,
                    date: date,
                    externalUid: uid,
                    type: 'training', // default
                    boatSize: 'standard'
                }
            });
            createdCount++;
            syncDetails.push(`Created: "${title}" on ${date.toLocaleDateString()}`);
        }
      }
    }

    // Handle Deletions
    const dbEvents = await prisma.event.findMany({
      where: {
        teamId,
        externalUid: { not: null }
      },
      select: { id: true, externalUid: true, title: true, date: true }
    });

    const eventsToDelete = dbEvents.filter(e => e.externalUid && !validUids.has(e.externalUid));
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
