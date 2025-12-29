import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const adminEmails = process.env.ADMIN_EMAILS?.split(',').map(e => e.trim()) || [];
    if (!adminEmails.includes(session.user.email)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Calculate start dates
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    sixMonthsAgo.setDate(1);

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [
      userCount,
      teamCount,
      eventCount,
      paddlerCount,
      openInviteCount,
      activeSessionCount,
      sentEmailCount,
      recentTeams,
      recentEvents,
      recentUsers,
      historicalTeams,
      historicalUsers
    ] = await Promise.all([
      prisma.user.count(),
      prisma.team.count(),
      prisma.event.count(),
      prisma.paddler.count(),
      prisma.paddler.count({ where: { inviteEmail: { not: null } } }),
      prisma.session.count({ where: { expires: { gt: new Date() } } }),
      prisma.sentEmail.count(),
      prisma.team.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: { id: true, name: true, createdAt: true }
      }),
      prisma.event.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          title: true,
          createdAt: true,
          team: { select: { name: true } }
        },
      }),
      prisma.user.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: { id: true, name: true, email: true, createdAt: true }
      }),
      prisma.team.findMany({
        where: { createdAt: { gte: sixMonthsAgo } },
        select: { createdAt: true }
      }),
      prisma.user.findMany({
        where: { createdAt: { gte: sixMonthsAgo } },
        select: { createdAt: true }
      })
    ]);

    // Aggregate helper
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const aggregate = (items: any[], dateKey: string, type: 'days' | 'months') => {
      const counts: { [key: string]: number } = {};
      
      if (type === 'months') {
          for (let i = 5; i >= 0; i--) {
            const d = new Date();
            d.setMonth(d.getMonth() - i);
            const key = d.toISOString().slice(0, 7);
            counts[key] = 0;
          }
      } else {
          for (let i = 29; i >= 0; i--) {
              const d = new Date();
              d.setDate(d.getDate() - i);
              const key = d.toISOString().slice(0, 10);
              counts[key] = 0;
          }
      }

      items.forEach(item => {
        const dateVal = item[dateKey];
        if (!dateVal) return;
        
        const date = new Date(dateVal);
        // Filter based on resolution range logic
        if (type === 'days' && date < thirtyDaysAgo) return;
        if (type === 'months' && date < sixMonthsAgo) return;

        const key = date.toISOString().slice(0, type === 'months' ? 7 : 10);
        if (counts[key] !== undefined) counts[key]++;
      });

      return Object.entries(counts)
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([date, count]) => ({ date, count }));
    };

    return NextResponse.json({
      counts: {
        users: userCount,
        teams: teamCount,
        events: eventCount,
        paddlers: paddlerCount,
        openInvites: openInviteCount,
        activeSessions: activeSessionCount,
        sentEmails: sentEmailCount
      },
      recent: {
        teams: recentTeams,
        events: recentEvents,
        users: recentUsers
      },
      history: {
        teams: {
            days: aggregate(historicalTeams, 'createdAt', 'days'),
            months: aggregate(historicalTeams, 'createdAt', 'months')
        },
        users: {
            days: aggregate(historicalUsers, 'createdAt', 'days'),
            months: aggregate(historicalUsers, 'createdAt', 'months')
        }
      }
    });

  } catch (error) {
    console.error('Admin Stats Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
