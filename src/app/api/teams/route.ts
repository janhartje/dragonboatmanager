import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthContext } from '@/lib/api-auth';
import { auth } from '@/auth';

export async function GET(request: Request) {
  try {
    const auth = await getAuthContext(request);
    
    if (auth.type === 'none') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // API Key Case: Return only the authorized team
    if (auth.type === 'apiKey' && auth.teamId) {
      const team = await prisma.team.findUnique({
        where: { id: auth.teamId },
        include: {
            // minimal info or full info? list_teams currently returns minimal but with counts
            _count: {
                select: {
                    paddlers: true,
                    events: true
                }
            }
        }
      });
      return NextResponse.json(team ? [team] : []);
    }

    // Session Case: Return all teams for the user
    if (auth.type === 'session' && auth.user?.id) {
        const memberships = await prisma.paddler.findMany({
        where: { userId: auth.user.id },
        include: { team: true },
        });

        const teams = memberships.map(m => m.team).filter(t => t !== null);
        
        // Sort teams by name
        teams.sort((a, b) => (a?.name || '').localeCompare(b?.name || ''));

        return NextResponse.json(teams);
    }
    
    return NextResponse.json([], { status: 200 }); // Should not happen given checks above
  } catch (error) {
    console.error('Failed to fetch teams:', error);
    return NextResponse.json({ error: 'Failed to fetch teams' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name } = await request.json();
    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    // No limit on team creation - PRO is per-team, not per-user
    const team = await prisma.team.create({
      data: { 
        name,
        paddlers: {
          create: {
            name: session.user.name || 'Captain',
            userId: session.user.id,
            role: 'CAPTAIN',
            weight: session.user.weight || 75,
            skills: [], // Default skills for creator
          }
        }
      },
    });
    return NextResponse.json(team);
  } catch (error) {
    console.error('Failed to create team:', error);
    return NextResponse.json({ error: 'Failed to create team' }, { status: 500 });
  }
}
