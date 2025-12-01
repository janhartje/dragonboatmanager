import { Paddler, Assignments } from '../types';

export const runAutoFillAlgorithm = (
  activePaddlerPool: Paddler[],
  assignments: Assignments,
  lockedSeats: string[],
  targetTrim: number
): Assignments | null => {
  const rows = 10;
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

    // 1. Steuerleute priorisieren
    if (!currAss['steer']) {
      const steers = currPool.filter((p) => p.skills && p.skills.includes('steer'));
      if (steers.length) {
        const p = steers[0];
        currAss['steer'] = p.id;
        currPool = currPool.filter((x) => x.id !== p.id);
      }
    }

    // 2. Leichte Reihe 1 (Schlagreihe)
    const sortedW = [...currPool].sort((a, b) => a.weight - b.weight);
    const light = sortedW.slice(0, Math.max(2, Math.floor(currPool.length * 0.3)));
    
    ['row-1-left', 'row-1-right'].forEach((sid) => {
      if (currAss[sid] || currPool.length === 0) return;
      const side = sid.includes('left') ? 'left' : 'right';
      const cands = light.filter((p) => currPool.includes(p) && p.skills && p.skills.includes(side));
      if (cands.length) {
        const p = cands[Math.floor(Math.random() * cands.length)];
        currAss[sid] = p.id;
        currPool = currPool.filter((x) => x.id !== p.id);
      }
    });

    // Random shuffle with weight noise
    currPool.sort((a, b) => (b.weight + Math.random() * 5) - (a.weight + Math.random() * 5));

    const free: { id: string; side: string; r: number }[] = [];
    for (let r = 1; r <= rows; r++) {
      if (!currAss[`row-${r}-left`]) free.push({ id: `row-${r}-left`, side: 'left', r });
      if (!currAss[`row-${r}-right`]) free.push({ id: `row-${r}-right`, side: 'right', r });
    }

    for (let p of currPool) {
      if (p.skills.length === 1 && p.skills[0] === 'drum') continue;
      
      // Berechne aktuelle Balance für Heuristik
      let l = 0, r = 0, f = 0, b = 0;
      Object.entries(currAss).forEach(([sid, pid]) => {
        if (sid === 'drummer' || sid === 'steer') return;
        const pad = activePaddlerPool.find((x) => x.id === pid);
        if (!pad) return;
        if (sid.includes('left')) l += pad.weight; else r += pad.weight;
        const match = sid.match(/row-(\d+)/);
        if (match && parseInt(match[1]) <= 5) f += pad.weight; else b += pad.weight;
      });

      const nBack = f - b > targetTrim; // Benötigt Gewicht hinten?

      const valid = free.filter((s) => p.skills && p.skills.includes(s.side));
      
      if (valid.length) {
        valid.sort((A, B) => {
          let sa = 0, sb = 0;
          // Balance Strategie
          if (l <= r && A.side === 'left') sa += 50;
          else if (l > r && A.side === 'right') sa += 50;
          if (l <= r && B.side === 'left') sb += 50;
          else if (l > r && B.side === 'right') sb += 50;

          // Nachbar Bonus (Reihe füllen)
          const oA = A.side === 'left' ? 'right' : 'left';
          const oB = B.side === 'left' ? 'right' : 'left';
          if (currAss[`row-${A.r}-${oA}`]) sa += 80;
          if (currAss[`row-${B.r}-${oB}`]) sb += 80;

          // Trim Strategie
          if (nBack) {
            sa += A.r * 3;
            sb += B.r * 3;
          } else {
            sa += (11 - A.r) * 3;
            sb += (11 - B.r) * 3;
          }
          return sb - sa;
        });

        const best = valid[0];
        currAss[best.id] = p.id;
        free.splice(free.findIndex((x) => x.id === best.id), 1);
      }
    }

    // Trommler check
    const assignedIds = Object.values(currAss);
    let remainingForDrum = pool.filter((p) => !assignedIds.includes(p.id));
    if (!currAss['drummer'] && remainingForDrum.length > 0) {
      const drummers = remainingForDrum.filter((p) => p.skills && p.skills.includes('drum'));
      if (drummers.length) {
        const p = drummers[0];
        currAss['drummer'] = p.id;
      }
    }

    // Scoring
    let fl = 0, fr = 0, ff = 0, fb = 0, full = 0;
    for (let r = 1; r <= rows; r++) {
      if (currAss[`row-${r}-left`] && currAss[`row-${r}-right`]) full++;
    }
    Object.entries(currAss).forEach(([sid, pid]) => {
      if (sid === 'drummer' || sid === 'steer') return;
      const pad = activePaddlerPool.find((x) => x.id === pid);
      if (!pad) return;
      if (sid.includes('left')) fl += pad.weight; else fr += pad.weight;
      const match = sid.match(/row-(\d+)/);
      if (match && parseInt(match[1]) <= 5) ff += pad.weight; else fb += pad.weight;
    });

    let sc = -Math.pow(Math.abs(fl - fr), 2); // Links/Rechts Strafe
    const trim = ff - fb;
    const dist = Math.abs(trim - targetTrim);
    sc -= dist * 8; // Trim Strafe
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
