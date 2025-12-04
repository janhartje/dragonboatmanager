import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/auth';

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const teamId = searchParams.get('teamId');

  try {
    // If teamId is provided, verify membership
    if (teamId) {
      const membership = await prisma.paddler.findFirst({
        where: {
          teamId,
          userId: session.user.id,
        },
      });

      if (!membership) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }
    } else {
      // If no teamId, only return paddlers from teams the user is a member of
      // This is a bit complex, so for now we might just require teamId or return empty if no teamId
      // But let's stick to the pattern: find teams user is in, then find paddlers in those teams
      const userTeams = await prisma.paddler.findMany({
        where: { userId: session.user.id },
        select: { teamId: true },
      });
      const teamIds = userTeams.map(t => t.teamId).filter(Boolean) as string[];
      
      if (teamIds.length === 0) {
        return NextResponse.json([]);
      }

      // Update query to filter by these teamIds
      // However, the original code used `const where = teamId ? { teamId } : {};`
      // We should change it to:
      // const where = teamId ? { teamId } : { teamId: { in: teamIds } };
    }

    const where = teamId 
      ? { teamId } 
      : { 
          teamId: { 
            in: (await prisma.paddler.findMany({
              where: { userId: session.user.id },
              select: { teamId: true }
            })).map(p => p.teamId).filter(Boolean) as string[]
          } 
        };

    const paddlers = await prisma.paddler.findMany({
      where,
      orderBy: { name: 'asc' },
      include: {
        user: {
          select: {
            email: true,
            name: true,
            image: true,
          },
        },
      },
    });
    return NextResponse.json(paddlers);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch paddlers' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();

    // Verify user is a member of the team
    const membership = await prisma.paddler.findFirst({
      where: {
        teamId: body.teamId,
        userId: session.user.id,
      },
    });

    if (!membership) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const paddler = await prisma.paddler.create({
      data: {
        name: body.name,
        weight: body.weight,
        side: body.side,
        skills: body.skills,
        isGuest: body.isGuest || false,
        teamId: body.teamId,
      },
    });
    return NextResponse.json(paddler);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create paddler' }, { status: 500 });
  }
}
