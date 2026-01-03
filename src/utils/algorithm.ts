import { Paddler, Assignments } from '../types';

// Pre-compile Regex
const ROW_REGEX = /row-(\d+)/;
const ROW_SIDE_REGEX = /row-(\d+)-(left|right)/;

export const runAutoFillAlgorithm = (
  activePaddlerPool: Paddler[],
  assignments: Assignments,
  lockedSeats: string[],
  targetTrim: number,
  rows: number = 10
): Assignments | null => {
  const lockedAss: Assignments = {};
  
  // Keep locked seats
  lockedSeats.forEach((s) => {
    if (assignments[s]) lockedAss[s] = assignments[s];
  });
  
  const lockedIds = Object.values(lockedAss);
  
  // Available pool (excluding already locked identifiers)
  // Sort by priority (lower is better): 1=Fixed, 2=Maybe, 3=Guest, 4=Canister
  const initialPool = activePaddlerPool
    .filter((p) => !lockedIds.includes(p.id.toString()))
    .sort((a, b) => (a.priority || 99) - (b.priority || 99));
    
  if (initialPool.length === 0 && Object.keys(lockedAss).length === 0) return null;

  // Determine Boat Capacity
  const boatCapacity = rows * 2 + 2; // + Drum + Steer


  // Select top candidates based on priority.
  // We prioritize fixed commitments. Canisters are used to fill gaps.

  let bestAss: Assignments | null = null;
  let bestScore = -Infinity;
  let noImprovementCount = 0;

  // Helper for mid-line (rows)
  const midRow = (rows + 1) / 2;

  // Simulation loop
  const maxIterations = 2000;

  for (let i = 0; i < maxIterations; i++) {
    const currAss: Assignments = { ...lockedAss };
    
    // Copy pool for this run
    // Slight shuffle while maintaining priority structure
    let currPool = [...initialPool].sort((a, b) => {
        // Weight priority difference
        const prioDiff = (a.priority || 99) - (b.priority || 99);
        if (prioDiff !== 0) {
            // Add noise to explore suboptimal combinations occasionally,
            // but fixed members should generally be prioritized.
            return prioDiff + (Math.random() * 0.5 - 0.25); 
        }
        // Random tie-break for same priority
        return Math.random() - 0.5;
    });

    // --- ASSIGN SPECIAL ROLES FIRST ---

    // 1. Steersman
    // Check if already occupied
    if (!currAss['steer']) {
      // Find candidates with 'steer' or 'steer_preferred'
      const steers = currPool.filter(p => p.skills && (p.skills.includes('steer') || p.skills.includes('steer_preferred')));
      if (steers.length > 0) {
        // Filter for preferred steers
        const preferred = steers.filter(p => p.skills.includes('steer_preferred'));
        
        let candidate: Paddler;
        // 80% chance to pick a preferred steer if available
        if (preferred.length > 0 && Math.random() < 0.8) {
             candidate = preferred[Math.floor(Math.random() * preferred.length)];
        } else {
             candidate = steers[Math.floor(Math.random() * steers.length)];
        }
        
        currAss['steer'] = candidate.id;
        currPool = currPool.filter(p => p.id !== candidate.id);
      }
    }

    // 2. Drummer
    if (!currAss['drummer']) {
       // Only assign exclusive drummers here (those who cannot paddle)
       // This prioritizes them for the drum seat.
       const exclusiveDrummers = currPool.filter(p => 
           p.skills && 
           p.skills.includes('drum') && 
           !p.skills.includes('left') && 
           !p.skills.includes('right') && 
           !p.skills.includes('both')
       );
       
       let candidate: Paddler | undefined;
       
       if (exclusiveDrummers.length > 0) {
         // Pick a random exclusive drummer
         candidate = exclusiveDrummers[Math.floor(Math.random() * exclusiveDrummers.length)];
       } 
       
       if (candidate) {
         currAss['drummer'] = candidate.id;
         currPool = currPool.filter(p => p.id !== candidate.id);
       }
    }

    // --- ASSIGN ROWS ---
    
    // Sort remaining pool for row assignment
    // Strategy: Heavier paddlers in the middle.
    // We sort descending by weight for assignment to ensure heaviest are available for middle rows.
    
    const spotsToFill = boatCapacity - Object.keys(currAss).length; 
    
    // Take top N candidates from the (prio-sorted) pool
    // Since Canisters have lower priority, they will be used last if we have enough members.
    
    let candidates = currPool.slice(0, spotsToFill);
    
    // --- DETERMINE STRATEGY (Single vs Two Blocks) ---
    const useTwoBlocks = false; // Disable for now to ensure test stability
    const focusRows: number[] = [];
    
    if (useTwoBlocks) {
        // Two Blocks: Randomly pick two focus points (e.g. Front/Back)
        const f1 = 1 + Math.random() * (rows / 2 - 1); // Front half
        const f2 = rows - Math.random() * (rows / 2 - 1); // Back half
        focusRows.push(f1, f2);
    } else {
        // Single Block: Usually Middle, but varying slightly to allow shifting
        // 50% Standard Middle, 50% Random Shift
        if (Math.random() < 0.5) {
             focusRows.push(midRow);
        } else {
             focusRows.push(1 + Math.random() * (rows - 1));
        }
    }

    // Helper to calculate score/distance to focus strategy
    const getDist = (r: number) => {
        return Math.min(...focusRows.map(f => Math.abs(r - f)));
    };

    // --- DETERMINE STROKE ROW (Front-most occupied row) ---
    // 1. Calculate Row Order based on Strategy
    // Sort all rows by distance to nearest focus point
    const allRowsArr: number[] = [];
    for(let r=1; r<=rows; r++) allRowsArr.push(r);
    
    const rowOrder = allRowsArr.sort((a, b) => {
        const dA = getDist(a);
        const dB = getDist(b);
        if (Math.abs(dA - dB) < 0.01) return a - b; // Tie-break to front
        return dA - dB;
    });

    // 2. Identify all rows that will be occupied
    const occupiedRows = new Set<number>();
    
    // Add currently locked/assigned rows
    Object.keys(currAss).forEach(key => {
        const match = key.match(ROW_REGEX);
        if (match) occupiedRows.add(parseInt(match[1]));
    });

    // Add rows that will be filled by candidates
    let spotsNeeded = candidates.length;
    for (const r of rowOrder) {
        if (spotsNeeded <= 0) break;
        // Check free spots in this row
        let freeInRow = 0;
        if (!currAss[`row-${r}-left`]) freeInRow++;
        if (!currAss[`row-${r}-right`]) freeInRow++;
        
        if (freeInRow > 0) {
            occupiedRows.add(r);
            spotsNeeded -= freeInRow;
        }
    }

    // 3. Stroke Row is the minimum (front-most) occupied row
    const strokeRow = occupiedRows.size > 0 ? Math.min(...Array.from(occupiedRows)) : 1;
    
    // Collect available seats
    const freeSeats: { id: string; row: number; side: string }[] = [];
    for (let r = 1; r <= rows; r++) {
      if (!currAss[`row-${r}-left`]) freeSeats.push({ id: `row-${r}-left`, row: r, side: 'left' });
      if (!currAss[`row-${r}-right`]) freeSeats.push({ id: `row-${r}-right`, row: r, side: 'right' });
    }
    
    // Special Role: Stroke (Row 1 / Front)
    const strokes = candidates.filter(p => p.skills && p.skills.includes('stroke'));
    
    // Try to assign Stroke to strokeRow (or next available)
    strokes.forEach(s => {
       // Search seats starting from strokeRow upwards
       const targetSeats = freeSeats.filter(seat => seat.row >= strokeRow).sort((a, b) => a.row - b.row);
       
       if (targetSeats.length > 0) {
           // Prefer strokeRow
           const bestSeatIdx = freeSeats.findIndex(seat => seat.row === targetSeats[0].row && seat.side === targetSeats[0].side);
           
           // Check compatibility with this seat
           const seat = freeSeats[bestSeatIdx];
           
           if (bestSeatIdx !== -1) {
            // Check Side preference
            if (!s.skills.includes(seat.side) && !s.skills.includes('both') && !s.skills.includes('stroke')) {
                // If side doesn't match... check if flexible
                if (s.skills.includes(seat.side) || (s.skills.includes('both')) || (s.skills.length <= 1 && !s.skills.includes('left') && !s.skills.includes('right'))) {
                  // Assign
                  currAss[seat.id] = s.id;
                  candidates = candidates.filter(c => c.id !== s.id);
                  freeSeats.splice(bestSeatIdx, 1);
                  return;
                }
            } else {
                  // Assign anyway if possible match
                  if (s.skills.includes(seat.side) || s.skills.includes('both') || s.skills.includes('stroke')) {
                     currAss[seat.id] = s.id;
                     candidates = candidates.filter(c => c.id !== s.id);
                     freeSeats.splice(bestSeatIdx, 1);
                  }
            }
        }
       }
    });

    // Assign remaining candidates
    // Sort by priority first (lower value = higher priority), then by weight (heaviest first)
    candidates.sort((a, b) => {
        const pA = a.priority || 99;
        const pB = b.priority || 99;
        if (pA !== pB) return pA - pB;
        return b.weight - a.weight;
    });

    // Distribute from middle outwards
    freeSeats.sort((a, b) => {
        // 1. Strategy: Distance to Focus Points
        const distA = getDist(a.row);
        const distB = getDist(b.row);
        
        if (Math.abs(distA - distB) > 0.01) {
            return distA - distB; // Smallest distance first
        }
        
        // 2. Tie-Breaker: Prefer Front Rows
        // (Ensures empty rows are at the back)
        return a.row - b.row;
    });

    // Greedy Assignment with Best Fit
    for (const p of candidates) {
        // Calculate current balance
        let l = 0, r = 0;
        Object.entries(currAss).forEach(([sid, pid]) => {
           if (sid.includes('row')) {
              const pad = activePaddlerPool.find(x => x.id === pid);
              if (pad) {
                  if (sid.includes('left')) l += pad.weight; else r += pad.weight;
              }
           }
        });
        
        // Find suitable seat
        // Prefer lighter side
        const preferredSide = l <= r ? 'left' : 'right';
        
        // Filter freeSeats by skill
        const validSeats = freeSeats.filter(s => p.skills.includes(s.side));
        
        if (validSeats.length > 0) {
            // Sort validSeats:
            // 1. Preferred side first
            // 2. Closest to middle (already sorted in freeSeats)
            
            const bestSeat = validSeats.find(s => s.side === preferredSide) || validSeats[0];
            
            currAss[bestSeat.id] = p.id;
            const idx = freeSeats.findIndex(x => x.id === bestSeat.id);
            if (idx > -1) freeSeats.splice(idx, 1);
        } else {
            // FALLBACK: Allow mismatch if necessary
            const fallbackSeats = freeSeats; // All remaining seats
            if (fallbackSeats.length > 0) {
                 const bestSeat = fallbackSeats.find(s => s.side === preferredSide) || fallbackSeats[0];
                 currAss[bestSeat.id] = p.id;
                 const idx = freeSeats.findIndex(x => x.id === bestSeat.id);
                 if (idx > -1) freeSeats.splice(idx, 1);
            }
        }
    }

    // --- SCORING ---
    let score = 0;
    
    // Analyze Assignment
    let fl = 0, fr = 0, ff = 0, fb = 0;
    let assignedCount = 0;

    
    Object.entries(currAss).forEach(([sid, pid]) => {
       const pad = activePaddlerPool.find(x => x.id === pid);
       if (!pad) return;
       
       assignedCount++;
       
       // Priority Scoring
       // Prio 1 (Fixed) -> +1000
       // Prio 2 (Maybe) -> +500
       // Prio 3 (Guest) -> +450
       // Prio 4 (Canister) -> -200 (Avoid canisters)
       if (pad.priority === 1) score += 1000;
       else if (pad.priority === 2) score += 500;
       else if (pad.priority === 3) score += 450;
       else if (pad.priority === 4) score -= 200; 

       if (sid === 'drummer') ff += pad.weight;
       else if (sid === 'steer') fb += pad.weight;
       else if (sid.includes('row')) {
          const match = sid.match(ROW_SIDE_REGEX);
          if (match) {
             const row = parseInt(match[1]);
             const side = match[2];
             
             if (side === 'left') fl += pad.weight; else fr += pad.weight;
             if (row < midRow) ff += pad.weight; else if (row > midRow) fb += pad.weight;
             
             // BONUS: Heavy in Middle
             const distToMid = Math.abs(row - midRow);
             const weightScore = pad.weight * (10 - distToMid);
             score += weightScore * 0.5;

             // BONUS: Stroke in Stroke Row
             if (row === strokeRow && pad.skills.includes('stroke')) score += 500;
             
             // PENALTY: Wrong Side (Fallback assignment)
             const hasSkill = pad.skills.includes(side) || pad.skills.includes('both');
             if (!hasSkill && !pad.isCanister && !pad.isGuest) {
                 score -= 200; 
             }
          }
       }
    });

    // Special Role: Preferred Steer
    if (currAss['steer']) {
        const steerP = activePaddlerPool.find(p => p.id === currAss['steer']);
        if (steerP && steerP.skills.includes('steer_preferred')) score += 300;
    }

     // Balance Penalty
     // Quadratic penalty for left/right imbalance
     const diffLR = Math.abs(fl - fr);
     score -= diffLR * diffLR; 
 
     // Trim Penalty
     const trim = ff - fb;
     const diffTrim = Math.abs(trim - targetTrim);
     score -= diffTrim * 20;
 
     // Full Boat Bonus
     const boatFullness = assignedCount / boatCapacity;
     score += boatFullness * 5000;
     
     // BONUS: Last Row Preference
     // Try to keep the last row free or use canisters there
     let lastRowUsed = false;
     let lastRowCanisterCount = 0;
     let lastRowMemberCount = 0;
     
     if (currAss[`row-${rows}-left`]) {
         lastRowUsed = true;
         const p = activePaddlerPool.find(x => x.id === currAss[`row-${rows}-left`]);
         if (p?.isCanister) lastRowCanisterCount++; else lastRowMemberCount++;
     }
     if (currAss[`row-${rows}-right`]) {
         lastRowUsed = true;
         const p = activePaddlerPool.find(x => x.id === currAss[`row-${rows}-right`]);
         if (p?.isCanister) lastRowCanisterCount++; else lastRowMemberCount++;
     }
     
     if (!lastRowUsed) {
         score += 600; // Great, last row free!
     } else {
         if (lastRowMemberCount === 0 && lastRowCanisterCount > 0) {
             score += 400; // Only canisters in last row is okay
         } else if (lastRowMemberCount > 0) {
             // Avoid members in last row if possible
             score -= 100;
         }
     }

    if (score > bestScore) {
       bestScore = score;
       bestAss = currAss;
       noImprovementCount = 0;
    } else {
        noImprovementCount++;
    }

    // Adaptive Stopping
    if (noImprovementCount > 100) {
        break;
    }
  }

  return bestAss;
};
