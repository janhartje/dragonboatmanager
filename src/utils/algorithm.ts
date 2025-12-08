import { Paddler, Assignments } from '../types';

export const runAutoFillAlgorithm = (
  activePaddlerPool: Paddler[],
  assignments: Assignments,
  lockedSeats: string[],
  targetTrim: number,
  rows: number = 10
): Assignments | null => {
  const lockedAss: Assignments = {};
  
  // Gesperrte Sitze behalten
  lockedSeats.forEach((s) => {
    if (assignments[s]) lockedAss[s] = assignments[s];
  });
  
  const lockedIds = Object.values(lockedAss);
  
  // Verfügbarer Pool (ohne bereits gesperrte Personen)
  // Sortiere nach Priorität (kleiner ist wichtiger): 1=Fixed, 2=Maybe, 3=Guest, 4=Canister
  let pool = activePaddlerPool
    .filter((p) => !lockedIds.includes(p.id.toString()))
    .sort((a, b) => (a.priority || 99) - (b.priority || 99));
    
  if (pool.length === 0 && Object.keys(lockedAss).length === 0) return null;

  // Bestimme Boat Capacity
  const boatCapacity = rows * 2 + 2; // + Drum + Steer
  const seatsTaken = Object.keys(lockedAss).length;
  const seatsNeeded = boatCapacity - seatsTaken;

  // Wähle die Top-Kandidaten für das Boot aus, basierend auf Priorität
  // Wir nehmen erstmal mehr als nötig, um Flexibilität für Balance zu haben, 
  // aber versuchen Canister und Low-Prio zu vermeiden.
  // Strategie: Wir nehmen alle Non-Canister und füllen mit Canistern auf.
  // Aber halt: "feste zusagen werden vor vieleichts, gästen und kanistern bevorzugt"
  
  // Wir nutzen den ganzen Pool für die Simulation, aber der "Score" wird bestrafen, wenn "schlechte" (Canister) im Boot sind
  // wenn "gute" (Member) draußen sind.
  
  // Um die Komplexität zu reduzieren, filtern wir Canister raus, die wir sicher nicht brauchen.
  // Aber wir wissen nicht, ob wir sie für Balance brauchen.
  // Wir lassen sie drin, aber bestrafen ihre Nutzung im Score.

  let bestAss: Assignments | null = null;
  let bestScore = -Infinity;

  // Helper für Mittellinie (Reihen)
  const midRow = (rows + 1) / 2;

  // Simulation loop
  const iterations = 2000;

  for (let i = 0; i < iterations; i++) {
    let currAss: Assignments = { ...lockedAss };
    
    // Kopie des Pools für diesen Run
    // Wir shuffeln leicht, aber behalten grobe Priorität
    let currPool = [...pool].sort((a, b) => {
        // Prio Differenz gewichten
        const prioDiff = (a.priority || 99) - (b.priority || 99);
        if (prioDiff !== 0) {
            // Noise hinzufügen, damit auch mal ein Maybe statt Guest reinkommt zum Testen, 
            // aber Fixed sollte fast immer drin sein.
            // Prio 1 vs 4 sollte eindeutig sein.
            return prioDiff + (Math.random() * 0.5 - 0.25); 
        }
        // Bei gleicher Prio random
        return Math.random() - 0.5;
    });

    // --- ASSIGN SPECIAL ROLES FIRST ---

    // 1. Steuermann
    // Prüfen ob schon besetzt
    if (!currAss['steer']) {
      // Suche Kandidaten mit 'steer' Skill oder 'steer_preferred'
      const steers = currPool.filter(p => p.skills && (p.skills.includes('steer') || p.skills.includes('steer_preferred')));
      if (steers.length > 0) {
        // Bevorzugte Steuerleute filtern
        const preferred = steers.filter(p => p.skills.includes('steer_preferred'));
        
        let candidate: Paddler;
        // 80% Chance den Preferred zu nehmen (falls vorhanden)
        if (preferred.length > 0 && Math.random() < 0.8) {
             candidate = preferred[Math.floor(Math.random() * preferred.length)];
        } else {
             candidate = steers[Math.floor(Math.random() * steers.length)];
        }
        
        currAss['steer'] = candidate.id;
        currPool = currPool.filter(p => p.id !== candidate.id);
      }
    }

    // 2. Trommler
    if (!currAss['drummer']) {
       // Wer kann trommeln? (Skill 'drum' oder Gewicht < 65kg als Fallback?)
       // Algorithmus nimmt einfachen einen leichten, der 'drum' kann oder random leicht
       // Wer kann trommeln? (Skill 'drum' oder Gewicht < 65kg als Fallback?)
       // NEU: Trommel nur besetzen, wenn jemand AUSSCHLIESSLICH 'drum' kann.
       // (lockedAss 'drummer' ist schon handled oben)
       
       // Finde Leute, die NUR 'drum' können (und ggf. 'steer_preferred' etc ignorieren wir mal, aber 'left'/'right' ist wichtig)
       // Wir definieren "Exclusive Drummer" als jemanden, der NICHT paddeln kann ('left', 'right', 'both').
       const exclusiveDrummers = currPool.filter(p => 
           p.skills && 
           p.skills.includes('drum') && 
           !p.skills.includes('left') && 
           !p.skills.includes('right') && 
           !p.skills.includes('both')
       );
       
       let candidate: Paddler | undefined;
       
       if (exclusiveDrummers.length > 0) {
         // Nimm einen zufälligen exklusiven Trommler
         candidate = exclusiveDrummers[Math.floor(Math.random() * exclusiveDrummers.length)];
       } 
       // ELSE: Trommel bleibt leer (undefined)
       
       if (candidate) {
         currAss['drummer'] = candidate.id;
         currPool = currPool.filter(p => p.id !== candidate.id);
       }
    }

    // --- ASSIGN ROWS ---
    
    // Sortiere verbleibenden Pool für Reihen-Besetzung
    // Strategie: Schwere in die Mitte. 
    // Wir sortieren nach Gewicht absteigend für die Zuweisung,
    // um sicherzustellen, dass die schwersten "verfügbar" sind für die mittleren Reihen.
    // Aber wir müssen auch "Stroke" beachten.
    
    // Wir nehmen die besten N Kandidaten (nach Prio), um das Boot zu füllen.
    // Die, die übrig bleiben, sind Reserve.
    const spotsToFill = boatCapacity - Object.keys(currAss).length; 
    
    // Wir nehmen nur so viele aus dem Pool, wie wir Plätze haben (plus kleine Reserve für Balance-Swap später?)
    // Nein, wir füllen das Boot strickt.
    // Wir nehmen die Top N nach Prio.
    
    // Da currPool oben schon grob nach Prio sortiert wurde (mit leichtem Shuffle),
    // nehmen wir einfach die ersten N.
    // Aber Achtung: Canister haben Prio 4. Wenn wir genug echte Menschen haben, rutschen Canister nach hinten.
    
    let candidates = currPool.slice(0, spotsToFill);
    
    // --- DETERMINE STRATEGY (Single vs Two Blocks) ---
    const useTwoBlocks = Math.random() < 0.3; // 30% Chance for Two Blocks
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
        const match = key.match(/row-(\d+)/);
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
    // If no rows occupied (empty boat), default to 1?
    const strokeRow = occupiedRows.size > 0 ? Math.min(...Array.from(occupiedRows)) : 1;
    

    
    // Plätze sammeln
    const freeSeats: { id: string; row: number; side: string }[] = [];
    for (let r = 1; r <= rows; r++) {
      if (!currAss[`row-${r}-left`]) freeSeats.push({ id: `row-${r}-left`, row: r, side: 'left' });
      if (!currAss[`row-${r}-right`]) freeSeats.push({ id: `row-${r}-right`, row: r, side: 'right' });
    }
    
    // Special Role: Stroke (Schlag) -> Reihe 1
    const strokes = candidates.filter(p => p.skills && p.skills.includes('stroke'));
    
    // Versuche Stroke in strokeRow (oder der nächsten freien) zu setzen
    strokes.forEach(s => {
       // Finde freien Platz in strokeRow, sonst suche weiter nach hinten
       // Wir suchen Sitze ab strokeRow aufwärts
       const targetSeats = freeSeats.filter(seat => seat.row >= strokeRow).sort((a, b) => a.row - b.row);
       
       if (targetSeats.length > 0) {
           // Nimm den ersten passenden (in strokeRow oder nächster)
           // Preferiere strokeRow
           const bestSeatIdx = freeSeats.findIndex(seat => seat.row === targetSeats[0].row && seat.side === targetSeats[0].side); // Match ID effectively
           
           // Check compatibility with this seat
           const seat = freeSeats[bestSeatIdx];
           
           if (bestSeatIdx !== -1) {
           // Check Side preference
           if (!s.skills.includes(seat.side) && !s.skills.includes('both') && !s.skills.includes('stroke')) {
               // Wenn Seite gar nicht passt... aber 'stroke' skill impliziert oft Flexibilität oder wir ignorieren Seite für Stroke Prio?
               // Besser: Check Side Compatibility
               if (s.skills.includes(seat.side) || (s.skills.includes('both')) || (s.skills.length <= 1 && !s.skills.includes('left') && !s.skills.includes('right'))) {
                 // Assign
                 currAss[seat.id] = s.id;
                 candidates = candidates.filter(c => c.id !== s.id);
                 freeSeats.splice(bestSeatIdx, 1);
                 return;
               }
           } else {
                 // Assign anyway if possible match OR if they are stroke (assume flexible if no side set, or just force it)
                 // If they strictly have only 'stroke', we put them there.
                 if (s.skills.includes(seat.side) || s.skills.includes('both') || s.skills.includes('stroke')) {
                    currAss[seat.id] = s.id;
                    candidates = candidates.filter(c => c.id !== s.id);
                    freeSeats.splice(bestSeatIdx, 1);
                 }
           }
       }
       }
    });

    // Rest verteilen
    // Sortiere Candidates nach Gewicht (Schwerste zuerst)
    candidates.sort((a, b) => b.weight - a.weight);

    // Wir verteilen von der Mitte nach außen
    // Erstelle Reihenfolge der Reihen für Filling: 5, 6, 4, 7, 3, 8... (bei 10 Reihen)
    freeSeats.sort((a, b) => {
        // 1. Prioritize Stroke Row !! (To ensure pairs)
        const isStrokeA = a.row === strokeRow;
        const isStrokeB = b.row === strokeRow;
        if (isStrokeA && !isStrokeB) return -1;
        if (!isStrokeA && isStrokeB) return 1;

        // 2. Then Strategy (Distance to Focus Points)
        const distA = getDist(a.row);
        const distB = getDist(b.row);
        
        if (Math.abs(distA - distB) > 0.01) {
            return distA - distB; // Kleinste Distanz zuerst (nahe an Focus Points)
        }
        
        // 3. Tie-Breaker: Prefer Front Rows (Lower Row Number)
        // This ensures that if we have equal distance (e.g. Row 2 and Row 9 for a 10-row boat),
        // we fill Row 2 first. 
        // Result: Empty rows will be at the back.
        return a.row - b.row;
    });

    // Greedy Assignment mit Backtracking-Light (bzw. Best Fit)
    // Für jeden Kandidaten (schwerste zuerst) suche besten freien Platz
    for (const p of candidates) {
        // Berechne aktuelle Balance
        let l = 0, r = 0;
        Object.entries(currAss).forEach(([sid, pid]) => {
           if (sid.includes('row')) {
              const pad = activePaddlerPool.find(x => x.id === pid);
              if (pad) {
                  if (sid.includes('left')) l += pad.weight; else r += pad.weight;
              }
           }
        });
        
        // Suche passenden Sitz
        // Preferiere Seite, die leichter ist
        const preferredSide = l <= r ? 'left' : 'right';
        
        // Filtere freeSeats nach Skill
        const validSeats = freeSeats.filter(s => p.skills.includes(s.side));
        
        if (validSeats.length > 0) {
            // Sortiere validSeats:
            // 1. Zuerst die, die zur bevorzugten Seite passen (Balance)
            // 2. Dann die, die am nahesten zur Mitte sind (schon durch freeSeats Sortierung gegeben, aber durch filter evtl. Lücken)
            
            // Da freeSeats schon nach "Mitte zuerst" sortiert ist, nehmen wir den ersten validen,
            // der auch zur Balance passt.
            
            const bestSeat = validSeats.find(s => s.side === preferredSide) || validSeats[0];
            
            currAss[bestSeat.id] = p.id;
            // Remove from freeSeats
            const idx = freeSeats.findIndex(x => x.id === bestSeat.id);
            if (idx > -1) freeSeats.splice(idx, 1);
        } else {
            // FALLBACK: Allow wrong side assignment if absolutely necessary
            // Try to find ANY seat from freeSeats
            const fallbackSeats = freeSeats; // All remaining seats
            if (fallbackSeats.length > 0) {
                 // Try to balance if possible, otherwise just take the first one
                 // Still prefer the "preferredSide" if available in fallback (unlikely if validSeats was empty, unless skill mismatch)
                 
                 // If validSeats was empty, it means NO seat matched skills. 
                 // So we just pick the one that helps balance best.
                 
                 const bestSeat = fallbackSeats.find(s => s.side === preferredSide) || fallbackSeats[0];
                 currAss[bestSeat.id] = p.id;
                 const idx = freeSeats.findIndex(x => x.id === bestSeat.id);
                 if (idx > -1) freeSeats.splice(idx, 1);
            }
        }
    }

    // --- SCORING ---
    let score = 0;
    
    // Analyse Assignment
    let fl = 0, fr = 0, ff = 0, fb = 0;
    let assignedCount = 0;
    let canisterCount = 0;
    
    Object.entries(currAss).forEach(([sid, pid]) => {
       const pad = activePaddlerPool.find(x => x.id === pid);
       if (!pad) return;
       
       assignedCount++;
       if (pad.isCanister) canisterCount++;
       
       // Priority Scoring
       // Prio 1 (Fixed) -> +1000
       // Prio 2 (Maybe) -> +500
       // Prio 3 (Guest) -> +450
       // Prio 4 (Canister) -> -200 (Wir wollen Canister vermeiden!)
       if (pad.priority === 1) score += 1000;
       else if (pad.priority === 2) score += 500;
       else if (pad.priority === 3) score += 450;
       else if (pad.priority === 4) score -= 200; // Bestrafe Canister Nutzung

       if (sid === 'drummer') ff += pad.weight;
       else if (sid === 'steer') fb += pad.weight;
       else if (sid.includes('row')) {
          const match = sid.match(/row-(\d+)-(left|right)/);
          if (match) {
             const row = parseInt(match[1]);
             const side = match[2];
             
             if (side === 'left') fl += pad.weight; else fr += pad.weight;
             if (row < midRow) ff += pad.weight; else if (row > midRow) fb += pad.weight;
             
             // BONUS: Heavy in Middle
             // Je näher an Mitte und je schwerer, desto besser
             const distToMid = Math.abs(row - midRow);
             const weightScore = pad.weight * (10 - distToMid); // Mitte = Faktor 10, Außen = Faktor 5
             score += weightScore * 0.5;

             // BONUS: Stroke in Stroke Row (Front-most occupied)
             if (row === strokeRow && pad.skills.includes('stroke')) score += 500;
             
             // PENALTY: Wrong Side (Notfall-Zuweisung)
             // Check if paddler actually has the skill for this side
             const hasSkill = pad.skills.includes(side) || pad.skills.includes('both');
             // Ignore for canisters or special roles if they don't have side skills set? 
             // Assuming humans always have at least 'left' or 'right' set if they are paddlers.
             if (!hasSkill && !pad.isCanister && !pad.isGuest) {
                 score -= 200; // Significant penalty, but less than leaving the boat empty or unbalanced if that's critical
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
     const diffLR = Math.abs(fl - fr);
     score -= diffLR * diffLR; // Quadratische Strafe
 
     // Trim Penalty
     const trim = ff - fb;
     // targetTrim: Positiv = mehr Vorne.
     const diffTrim = Math.abs(trim - targetTrim);
     score -= diffTrim * 20;
 
     // Full Boat Bonus
     const boatFullness = assignedCount / boatCapacity;
     score += boatFullness * 5000;
     
     // BONUS: Last Row (Row 10) Preference
     // "Versuche die letzte Bank möglichst frei zu lassen oder Kanister dort zu platzieren"
     // Check usage of last row
     let lastRowUsed = false;
     let lastRowCanisterCount = 0;
     let lastRowMemberCount = 0;
     
     // Scan assignments for last row
     // We can just iterate row-rows-left/right
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
         score += 600; // Super, letzte Reihe frei!
     } else {
         // Wenn genutzt, dann lieber Kanister als Member
         if (lastRowMemberCount === 0 && lastRowCanisterCount > 0) {
             score += 400; // Okay, nur Kanister
         } else if (lastRowMemberCount > 0) {
             // Member in letzter Reihe -> Vermeiden wenn möglich (Penalty)
             // Aber wenn Boot voll ist, ist das halt so.
             // BoatFullness bonus (5000) overrides this easily.
             score -= 100;
         }
     }

    if (score > bestScore) {
       bestScore = score;
       bestAss = currAss;
    }
  }

  return bestAss;
};
