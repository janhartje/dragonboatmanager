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

    const membership = await prisma.paddler.findFirst({
      where: {
        teamId: event.teamId,
        userId: session.user.id,
      },
    });

    if (!membership || membership.role !== 'CAPTAIN') {
      return NextResponse.json({ error: 'Unauthorized: Only captains can use auto-fill' }, { status: 403 });
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
         // Normalize skills into valid skills array for algorithm
         const algoSkills: string[] = [];
         // side is removed from model, so we only rely on skills
         
         if (p.skills) {
           p.skills.forEach(s => algoSkills.push(s)); // drum, steer, stroke, steer_preferred
        }

        // Priority mapping: yes=1, maybe=2
        // Guests usually have 'yes' status if they are in the list effectively, 
        // but we can distinguish by isGuest flag if needed. 
        // Requirement: Fixed > Maybe > Guest > Canister
        let priority = 1; // Default Fixed
        if (a.status === 'maybe') priority = 2;
        if (p.isGuest) priority = 3; // Guests lower than members? "feste zusagen werden vor vieleichts, gästen und kanistern bevorzugt" -> Yes (1) > Maybe (2) > Guest (3) ? 
        // Actually "feste zusagen" (Fixed) > Maybe. 
        // "Guests" are usually fixed commitments too, just external. 
        // Let's interpret: Member(Yes)=1, Guest(Yes)=1 (or 1.5?), Member(Maybe)=2, Guest(Maybe)=2. 
        // User said: "feste zusagen werden vor vieleichts, gästen und kanistern bevorzugt"
        // This implies: Fixed Promises > Maybes, Guests, Canisters.
        // Wait, "Fixed > Maybe, Guest, Canister" could mean Fixed is top, rest is lower.
        // Or Fixed > Maybe > Guest > Canister.
        // Let's assume:
        // 1. Member Yes
        // 2. Member Maybe
        // 3. Guest (Any, usually Yes)
        // 4. Canister
        
        if (p.isGuest) priority = 3;
        else if (a.status === 'maybe') priority = 2;
        else priority = 1;

        return {
          id: p.id,
          name: p.name,
          weight: p.weight,
          skills: algoSkills,
          isGuest: p.isGuest,
          isCanister: false,
          priority
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
            isCanister: true,
            priority: 4 // Lowest priority
        });
    }

    const activePaddlerPool = [...attendees, ...canisters].sort((a, b) => {
        // Sort by priority first
        if (a.priority !== b.priority) return a.priority - b.priority;
        // Then by name
        return a.name.localeCompare(b.name);
    });

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
