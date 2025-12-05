import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { runAutoFillAlgorithm } from '@/utils/algorithm';
import { Paddler } from '@/types';
import { auth } from '@/auth';

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { eventId, assignments: assignmentsOverride, lockedSeats, targetTrim } = await request.json();

    if (!eventId) {
      return NextResponse.json({ error: 'Missing eventId' }, { status: 400 });
    }

    // Fetch Event with all necessary data
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        attendances: {
          include: {
            paddler: true
          }
        },
        assignments: true
      }
    });

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Determine config
    const rows = event.boatSize === 'small' ? 5 : 10;
    
    // Construct Active Paddler Pool
    // 1. Regular Paddlers & Guests (from attendance)
    // Filter: status is 'yes' or 'maybe' (assuming maybe should be included? Planner does.)
    // Wait, Planner logic was: 
    // const regular = paddlers.filter((p) => !p.isCanister && ['yes', 'maybe'].includes(activeEvent.attendance[p.id]));
    
    // We iterate attendances
    const attendees = event.attendances
      .filter(a => ['yes', 'maybe'].includes(a.status))
      .map(a => {
        const p = a.paddler;
        // Normalize skills and side into valid skills array for algorithm
        const algoSkills: string[] = [];
        if (p.side === 'both') { algoSkills.push('left', 'right'); }
        else if (p.side) { algoSkills.push(p.side); }
        
        if (p.skills) {
           p.skills.forEach(s => algoSkills.push(s)); // drum, steer
        }

        return {
          id: p.id,
          name: p.name,
          weight: p.weight,
          skills: algoSkills,
          isGuest: p.isGuest,
          isCanister: false
        };
      });

    // 2. Canisters
    const canisters: any[] = [];
    const count = event.canisterCount || 0;
    for (let i = 1; i <= count; i++) {
        canisters.push({
            id: `canister-${i}`,
            name: 'Kanister',
            weight: 25,
            skills: ['left', 'right'],
            isCanister: true
        });
    }

    const activePaddlerPool = [...attendees, ...canisters].sort((a, b) => a.name.localeCompare(b.name));

    // Determine Assignments
    let assignments = assignmentsOverride;
    if (!assignments) {
      assignments = {};
      let canisterCounter = 1;
      event.assignments.forEach((a) => {
        if (a.isCanister) {
          assignments[a.seatId] = `canister-${canisterCounter}`;
          canisterCounter++;
        } else if (a.paddlerId) {
          assignments[a.seatId] = a.paddlerId;
        }
      });
    }

    // Run Algorithm
    // Default lockedSeats to empty if not provided
    const locks = lockedSeats || [];
    // Default targetTrim to 0 if not provided
    const trim = targetTrim !== undefined ? targetTrim : 0;

    const result = runAutoFillAlgorithm(activePaddlerPool, assignments, locks, trim, rows);

    return NextResponse.json({ assignments: result });

  } catch (error) {
    console.error('Auto-fill error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
