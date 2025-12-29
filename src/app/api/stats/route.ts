import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/auth';

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { eventId, assignments: assignmentsOverride, targetTrim } = await request.json();

    if (!eventId) {
      return NextResponse.json({ error: 'Missing eventId' }, { status: 400 });
    }

    // Determine active assignments and IDs to fetch
    let assignments = assignmentsOverride;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let event: { assignments: any[]; boatSize: string } | null = null;
    let paddlers: { id: string, weight: number }[] = [];
    let rows = 10;

    if (assignments) {
      // OPTIMIZATION: Parallel Fetch if we have assignments
      const paddlerIds = Object.values(assignments)
        .filter((id: unknown) => typeof id === 'string' && !id.startsWith('canister-')) as string[];

      const [eventResult, paddlersResult] = await Promise.all([
        prisma.event.findUnique({
          where: { id: eventId },
          select: { boatSize: true } // Only fetch what we need
        }),
        prisma.paddler.findMany({
          where: { id: { in: paddlerIds } },
          select: { id: true, weight: true }
        })
      ]);

      if (!eventResult) return NextResponse.json({ error: 'Event not found' }, { status: 404 });
      
      rows = eventResult.boatSize === 'small' ? 5 : 10;
      paddlers = paddlersResult;

    } else {
      // Fallback: Sequential fetch if we need assignments from DB
      event = await prisma.event.findUnique({
        where: { id: eventId },
        include: { assignments: true }
      });

      if (!event) return NextResponse.json({ error: 'Event not found' }, { status: 404 });

      rows = event.boatSize === 'small' ? 5 : 10;
      
      assignments = {};
      let canisterCounter = 1;
      event.assignments.forEach((a: { isCanister: boolean; seatId: string; paddlerId?: string }) => {
        if (a.isCanister) {
          assignments[a.seatId] = `canister-${canisterCounter}`;
          canisterCounter++;
        } else if (a.paddlerId) {
          assignments[a.seatId] = a.paddlerId;
        }
      });

      // Now fetch weights for these assignments
      const paddlerIds = Object.values(assignments)
        .filter((id: unknown) => typeof id === 'string' && !id.startsWith('canister-')) as string[];
      
      paddlers = await prisma.paddler.findMany({
        where: { id: { in: paddlerIds } },
        select: { id: true, weight: true }
      });
    }

    // 2. Map weights
    const weightMap = new Map<string, number>();
    paddlers.forEach(p => weightMap.set(p.id, p.weight));

    // 3. Calculation Logic (Duplicated from PlannerView but authoritative)
    let l = 0, r = 0, t = 0, f = 0, b = 0, c = 0;
    const mid = (rows + 1) / 2;
    let weightedSumX = 0, weightedSumY = 0;

    // Assignment loop
    Object.entries(assignments).forEach(([sid, pid]) => {
      const seatId = sid as string;
      const paddlerId = pid as string;
      
      // Filter out seats outside current row count
      if (seatId.includes('row')) {
        const match = seatId.match(/row-(\d+)/);
        if (match && parseInt(match[1]) > rows) return;
      }

      let weight = 0;
      if (paddlerId.startsWith('canister-')) {
        weight = 25;
      } else {
        weight = weightMap.get(paddlerId) || 0;
      }

      if (weight > 0) {
        c++;
        t += weight;

        // --- Standard Stats ---
        if (seatId === 'drummer') {
          f += weight;
        } else if (seatId === 'steer') {
          b += weight;
        } else if (seatId.includes('row')) {
          if (seatId.includes('left')) l += weight; else r += weight;
          const match = seatId.match(/row-(\d+)/);
          if (match) {
            const rowNum = parseInt(match[1]);
            if (rowNum < mid) f += weight;
            else if (rowNum > mid) b += weight;
          }
        }

        // --- CG Stats ---
        let xPos = 50; if (seatId.includes('left')) xPos = 25; else if (seatId.includes('right')) xPos = 75;
        
        // Y Position Logic (matching BoatVisualizer approx)
        const totalHeight = 316 + rows * 68;
        const row1Center = 188;
        const rowLastCenter = 188 + (rows - 1) * 68;
        const yStart = (row1Center / totalHeight) * 100;
        const yEnd = (rowLastCenter / totalHeight) * 100;
        
        let yPos = 50; 
        if (seatId === 'drummer') yPos = (100 / totalHeight) * 100; 
        else if (seatId === 'steer') yPos = ((totalHeight - 100) / totalHeight) * 100; 
        else if (seatId.includes('row')) { 
          const match = seatId.match(/row-(\d+)/); 
          if (match) { 
            const r = parseInt(match[1]); 
            if (rows > 1) {
              const rowStep = (yEnd - yStart) / (rows - 1); 
              yPos = yStart + (r - 1) * rowStep;
            } else {
              yPos = yStart;
            }
          } 
        } 
        
        weightedSumX += weight * xPos; 
        weightedSumY += weight * yPos;
      }
    });

    const cgX = t > 0 ? weightedSumX / t : 50;
    const cgY = t > 0 ? weightedSumY / t : 50;
    
    // Calculate targetY based on trim input
    // PlannerView: return { x: cgX, y: cgY, targetY: 50 - targetTrim * 0.1 };
    const targetY = 50 - (targetTrim || 0) * 0.1;

    return NextResponse.json({
      stats: { l, r, t, diffLR: l - r, f, b, diffFB: f - b, c },
      cgStats: { x: cgX, y: cgY, targetY }
    });

  } catch (error) {
    console.error('Stats Calc Error', error);
    return NextResponse.json({ error: 'Calculation failed' }, { status: 500 });
  }
}
