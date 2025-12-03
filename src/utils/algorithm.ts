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
  let pool = activePaddlerPool.filter((p) => !lockedIds.includes(p.id));
  
  if (pool.length === 0) return null;

  let bestAss: Assignments | null = null;
  let bestScore = -Infinity;

  // Simulation
  for (let i = 0; i < 1500; i++) {
    let currAss: Assignments = { ...lockedAss };
    let currPool = [...pool].sort(() => Math.random() - 0.5);

    // 1. Steuerleute priorisieren (Zufällige Auswahl aus verfügbaren Steuerleuten)
    if (!currAss['steer']) {
      const steers = currPool.filter((p) => p.skills && p.skills.includes('steer'));
      if (steers.length) {
        const p = steers[Math.floor(Math.random() * steers.length)];
        currAss['steer'] = p.id;
        currPool = currPool.filter((x) => x.id !== p.id);
      }
    }

    // Random shuffle with weight noise
    currPool.sort((a, b) => (b.weight + Math.random() * 5) - (a.weight + Math.random() * 5));

    const mid = (rows + 1) / 2;

    const free: { id: string; side: string; r: number }[] = [];
    if (!currAss['drummer']) free.push({ id: 'drummer', side: 'drum', r: 0 });
    
    for (let r = 1; r <= rows; r++) {
      if (!currAss[`row-${r}-left`]) free.push({ id: `row-${r}-left`, side: 'left', r });
      if (!currAss[`row-${r}-right`]) free.push({ id: `row-${r}-right`, side: 'right', r });
    }
    
    // Steer is already handled above

    for (let p of currPool) {
      // Berechne aktuelle Balance für Heuristik
      let l = 0, r = 0, f = 0, b = 0;
      Object.entries(currAss).forEach(([sid, pid]) => {
        const pad = activePaddlerPool.find((x) => x.id === pid);
        if (!pad) return;
        
        if (sid === 'drummer') {
          f += pad.weight;
        } else if (sid === 'steer') {
          b += pad.weight;
        } else if (sid.includes('row')) {
          if (sid.includes('left')) l += pad.weight; else r += pad.weight;
          const match = sid.match(/row-(\d+)/);
          if (match) {
            const rowNum = parseInt(match[1]);
            if (rowNum < mid) f += pad.weight;
            else if (rowNum > mid) b += pad.weight;
          }
        }
      });

      const currentTrim = f - b;
      const trimDiff = targetTrim - currentTrim; // Positiv = Brauche mehr Vorne, Negativ = Brauche mehr Hinten
      
      const valid = free.filter((s) => p.skills && p.skills.includes(s.side));
      
      if (valid.length) {
        valid.sort((A, B) => {
          let sa = 0, sb = 0;
          
          // Role Bonus (ensure they get filled if possible)
          if (A.side === 'drum' || A.side === 'steer') sa += 40;
          if (B.side === 'drum' || B.side === 'steer') sb += 40;

          // Balance Strategie (L/R)
          if (A.side === 'left' || A.side === 'right') {
             if (l <= r && A.side === 'left') sa += 50;
             else if (l > r && A.side === 'right') sa += 50;
          }
          if (B.side === 'left' || B.side === 'right') {
             if (l <= r && B.side === 'left') sb += 50;
             else if (l > r && B.side === 'right') sb += 50;
          }

          // Nachbar Bonus (Reihe füllen)
          if (A.side === 'left' || A.side === 'right') {
            const oA = A.side === 'left' ? 'right' : 'left';
            if (currAss[`row-${A.r}-${oA}`]) sa += 80;
          }
          if (B.side === 'left' || B.side === 'right') {
            const oB = B.side === 'left' ? 'right' : 'left';
            if (currAss[`row-${B.r}-${oB}`]) sb += 80;
          }

          // Trim Strategie (Proportional)
          // trimDiff > 0 => Brauche Vorne => Kleine Reihennummer bevorzugen
          // trimDiff < 0 => Brauche Hinten => Große Reihennummer bevorzugen
          const factor = 5; // Stärke der Trim-Beeinflussung
          if (trimDiff > 0) {
             sa += (rows + 1 - A.r) * factor;
             sb += (rows + 1 - B.r) * factor;
          } else {
             sa += A.r * factor;
             sb += B.r * factor;
          }
          return sb - sa;
        });

        const best = valid[0];
        currAss[best.id] = p.id;
        free.splice(free.findIndex((x) => x.id === best.id), 1);
      }
    }

    // Scoring
    let fl = 0, fr = 0, ff = 0, fb = 0, full = 0;
    for (let r = 1; r <= rows; r++) {
      if (currAss[`row-${r}-left`] && currAss[`row-${r}-right`]) full++;
    }
    Object.entries(currAss).forEach(([sid, pid]) => {
      const pad = activePaddlerPool.find((x) => x.id === pid);
      if (!pad) return;
      
      if (sid === 'drummer') {
        ff += pad.weight;
      } else if (sid === 'steer') {
        fb += pad.weight;
      } else if (sid.includes('row')) {
        if (sid.includes('left')) fl += pad.weight; else fr += pad.weight;
        const match = sid.match(/row-(\d+)/);
        if (match) {
          const rowNum = parseInt(match[1]);
          if (rowNum < mid) ff += pad.weight;
          else if (rowNum > mid) fb += pad.weight;
        }
      }
    });

    let sc = -Math.pow(Math.abs(fl - fr), 2); // Links/Rechts Strafe
    const trim = ff - fb;
    const dist = Math.abs(trim - targetTrim);
    sc -= dist * 20; // Trim Strafe (erhöht für genaueres Ziel)
    sc += full * 80; // Volle Reihen Bonus
    if (currAss['drummer']) sc += 200;
    if (currAss['steer']) sc += 200;

    if (sc > bestScore) {
      bestScore = sc;
      bestAss = currAss;
    }
  }

  return bestAss;
};
