import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const eventId = params.id;
    
    // Transaction to safely increment
    const result = await prisma.$transaction(async (tx) => {
      const event = await tx.event.findUnique({ where: { id: eventId } });
      if (!event) throw new Error('Event not found');

      const newCount = (event.canisterCount || 0) + 1;

      const updatedEvent = await tx.event.update({
        where: { id: eventId },
        data: { canisterCount: newCount },
      });
      
      return updatedEvent;
    });

    return NextResponse.json({ 
      canisterCount: result.canisterCount,
      newCanisterId: `canister-${result.canisterCount}`
    });
  } catch (error) {
    console.error('Failed to add canister:', error);
    return NextResponse.json({ error: 'Failed to add canister' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const eventId = params.id;
    const { searchParams } = new URL(request.url);
    const canisterId = searchParams.get('canisterId'); // e.g. "canister-2"

    if (!canisterId) {
      return NextResponse.json({ error: 'Canister ID required' }, { status: 400 });
    }

    await prisma.$transaction(async (tx) => {
      const event = await tx.event.findUnique({ where: { id: eventId } });
      if (!event || !event.canisterCount || event.canisterCount <= 0) {
        throw new Error('No canisters to remove');
      }

      const currentCount = event.canisterCount;
      const lastCanisterId = `canister-${currentCount}`;
      
      // Logic: If we remove a canister that is NOT the last one,
      // and the last one IS assigned, we move the assignment to the one being removed.
      
      if (canisterId !== lastCanisterId) {
        // Find assignment for the last canister
        const lastAssignment = await tx.assignment.findFirst({
          where: { 
            eventId, 
            paddlerId: null, // Canisters have null paddlerId
            isCanister: true,
            // We can't easily query by "virtual ID" here because DB stores isCanister=true
            // But wait, the DB DOES NOT store "canister-1". It just stores isCanister=true.
            // The frontend/API mapping logic assigns IDs based on count.
            // This is tricky. The DB doesn't know "canister-1" vs "canister-2".
            // It just knows "this seat has a canister".
            
            // PROBLEM: The DB schema for Assignment is:
            // paddlerId: String? (null for canister)
            // isCanister: Boolean
            
            // It does NOT store WHICH canister number it is.
            // So "canister-1" vs "canister-2" is purely a frontend/runtime concept based on count.
            // If I have 3 canisters, and 3 assignments with isCanister=true, they are indistinguishable in the DB.
            
            // So, if the user wants to "delete canister 2", and we have 3 canisters assigned to Seat A, Seat B, Seat C.
            // Which one is "canister 2"?
            // The frontend assigns them:
            // Seat A -> canister-1
            // Seat B -> canister-2
            // Seat C -> canister-3
            // (Order depends on iteration order of assignments? Or just arbitrary?)
            
            // In `DrachenbootContext` fetchEvents:
            // "assignments[a.seatId] = `canister-${canisterCounter}`"
            // This implies the ID depends on the ORDER of assignments returned by the DB.
            // This is unstable if we don't sort.
          } 
        });
      }
      
      // RE-EVALUATION:
      // Since "canister-X" is virtual and depends on load order, "deleting canister X" is ambiguous if we don't persist the ID.
      // BUT, the goal is just to reduce the count.
      // If "canister-2" is assigned to Seat B, and we "delete" it:
      // We should remove the assignment from Seat B.
      // And decrement the count.
      
      // So the API needs to know: "Remove the assignment for Seat B (if any) and decrement count".
      // OR "Just decrement count (if unassigned)".
      
      // The frontend sends `canisterId`. The frontend knows which seat `canisterId` is assigned to (if any).
      // If the canister is assigned, the frontend should probably send the SEAT ID to unassign?
      // Or the backend needs to reconstruct the mapping to find the seat.
      
      // Let's rely on the frontend passing the `seatId` if the canister is assigned?
      // The user said: "kanister nur gelöscht werden können, wenn sie nicht zugewisen sind" (canisters can only be deleted if NOT assigned).
      
      // AH! "only be deleted if NOT assigned".
      // So if `canister-2` is assigned, the UI should block deletion.
      // So we only delete unassigned canisters.
      // But wait, `canister-3` might be assigned. If we delete `canister-2` (unassigned),
      // then `canister-3` becomes `canister-2`.
      // The assignment for `canister-3` (Seat C) effectively becomes `canister-2`.
      // This is fine! The seat still has "a canister".
      // The number changes, but it's still a canister.
      
      // So, if we only allow deleting UNASSIGNED canisters:
      // We just decrement the count.
      // The existing assignments (isCanister=true) remain.
      // The frontend will re-number them 1..N-1.
      // Since we had N canisters and N-1 assignments (because 1 was unassigned),
      // we now have N-1 canisters and N-1 assignments.
      // All assignments are still valid.
      
      // Example:
      // Count = 3.
      // Seat A: canister (1)
      // Seat B: empty
      // Seat C: canister (2) -> Wait, frontend numbers them 1, 2.
      // If Seat A and Seat C have canisters.
      // Frontend: Seat A = canister-1, Seat C = canister-2.
      // Pool has canister-3 (unassigned).
      // User deletes canister-3.
      // Count -> 2.
      // Frontend: Seat A = canister-1, Seat C = canister-2.
      // Pool empty.
      // Correct.
      
      // Example 2:
      // Count = 3.
      // Seat A: canister (1)
      // Seat B: canister (2)
      // Pool: canister-3.
      // User deletes canister-2 (Assigned!).
      // User rule: "only delete if unassigned".
      // So user CANNOT delete canister-2.
      
      // So the API just needs to:
      // 1. Check if (Count > Number of Assignments).
      //    If yes, we have "spare" canisters. We can decrement count.
      //    If no, all canisters are assigned. We cannot decrement without removing an assignment.
      //    But the user said "only if unassigned". So we throw error if Count == Assignments.
      
      // 2. Decrement count.
      
      const assignmentCount = await tx.assignment.count({
        where: { eventId, isCanister: true }
      });
      
      if (assignmentCount >= currentCount) {
        throw new Error('Cannot delete assigned canister. Unassign first.');
      }

      await tx.event.update({
        where: { id: eventId },
        data: { canisterCount: currentCount - 1 },
      });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to remove canister:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed' }, { status: 500 });
  }
}
