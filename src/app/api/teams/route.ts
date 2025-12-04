import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/auth';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const memberships = await prisma.paddler.findMany({
      where: { userId: session.user.id },
      include: { team: true },
    });

    const teams = memberships.map(m => m.team).filter(t => t !== null);
    
    // Sort teams by name
    teams.sort((a, b) => (a?.name || '').localeCompare(b?.name || ''));

    return NextResponse.json(teams);
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
