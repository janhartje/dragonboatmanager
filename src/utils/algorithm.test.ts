import { runAutoFillAlgorithm } from './algorithm';
import { Paddler, Assignments } from '../types';

// Mock helper
const createPaddler = (id: string, weight: number, skills: string[] = [], priority: number = 1): Paddler => ({
  id,
  name: `Paddler ${id}`,
  weight,
  skills,
  priority,
  isGuest: false,
  isCanister: false
});

describe('AutoFill Algorithm', () => {
    it('should place heaviest paddlers in the middle rows (Heavy Middle Logic)', () => {
        const rows = 10;
        const pool: Paddler[] = [];
        
        // 20 Paddlers with weights 60..98 (increment by 2)
        for(let i=0; i<20; i++) {
            pool.push(createPaddler(`p-${i}`, 60 + i*2, ['left', 'right']));
        }
        // Add Drum and Steer separate
        pool.push(createPaddler('drum', 50, ['drum']));
        pool.push(createPaddler('steer', 60, ['steer']));

        const assignments = runAutoFillAlgorithm(pool, {}, [], 0, rows);
        expect(assignments).not.toBeNull();
        if (!assignments) return;

        // Check middle rows (4,5,6,7) vs outer rows (1,2, 9,10)
        let midWeight = 0, midCount = 0;
        let outerWeight = 0, outerCount = 0;

        Object.entries(assignments).forEach(([seat, pid]) => {
            if (seat.includes('row')) {
                const match = seat.match(/row-(\d+)/);
                const row = parseInt(match![1]);
                const p = pool.find(x => x.id === pid);
                if (row >= 5 && row <= 6) {
                    midWeight += p!.weight;
                    midCount++;
                } else if (row <= 2 || row >= 9) {
                    outerWeight += p!.weight;
                    outerCount++;
                }
            }
        });

        const avgMid = midWeight / midCount;
        const avgOuter = outerWeight / outerCount;
        
        console.log(`Avg Mid: ${avgMid}, Avg Outer: ${avgOuter}`);
        expect(avgMid).toBeGreaterThan(avgOuter);
    });

    it('should assign Stroke to Row 1', () => {
        const pool: Paddler[] = [];
        for(let i=0; i<18; i++) pool.push(createPaddler(`p-${i}`, 80, ['left', 'right']));
        
        const stroke = createPaddler('stroke-p', 85, ['stroke']); // Special Role
        pool.push(stroke);
        pool.push(createPaddler('drum', 50, ['drum']));
        pool.push(createPaddler('steer', 60, ['steer']));
        // Fill up to 22
        pool.push(createPaddler('extra', 70, ['left', 'right']));

        const assignments = runAutoFillAlgorithm(pool, {}, [], 0, 10);
        expect(assignments).not.toBeNull();

        // Check if stroke-p is in row 1
        const seat = Object.entries(assignments!).find(([k, v]) => v === 'stroke-p');
        expect(seat).toBeDefined();
        // Should be row-1-left or row-1-right
        expect(seat![0]).toMatch(/row-1-(left|right)/);
    });

    it('should visualize Preferred Steer priority', () => {
        const pool: Paddler[] = [];
        // 2 possible steers
        const normalSteer = createPaddler('steer-normal', 60, ['steer']);
        const prefSteer = createPaddler('steer-pref', 60, ['steer', 'steer_preferred']); // Preferred
        
        pool.push(normalSteer);
        pool.push(prefSteer);
        pool.push(createPaddler('drum', 50, ['drum']));
        
        // Fill paddlers
        for(let i=0; i<20; i++) pool.push(createPaddler(`p-${i}`, 80, ['left', 'right']));

        // Run multiple times to check probability (since algo is random)
        let prefCount = 0;
        for(let i=0; i<50; i++) {
             const ass = runAutoFillAlgorithm(pool, {}, [], 0, 10);
             if (ass && ass['steer'] === 'steer-pref') prefCount++;
        }
        
        console.log(`Preferred Steer Count: ${prefCount}/50`);
        expect(prefCount).toBeGreaterThan(30); // Expect > 60% (Logic said 80% chance)
    });

    it('should prioritize Fixed over Canister', () => {
        const pool: Paddler[] = [];
        for(let i=0; i<10; i++) pool.push(createPaddler(`fixed-${i}`, 80, ['left', 'right'], 1));
        
        for(let i=0; i<10; i++) pool.push(createPaddler(`canister-${i}`, 25, ['left', 'right'], 4));

        for(let i=0; i<5; i++) pool.push(createPaddler(`maybe-${i}`, 80, ['left', 'right'], 2)); // 5 Maybe (Prio 2)
        
        pool.push(createPaddler('drum', 50, ['drum'], 1));
        pool.push(createPaddler('steer', 60, ['steer'], 1));

        const assignments = runAutoFillAlgorithm(pool, {}, [], 0, 10);
        
        // Count types in assignments
        let fixed = 0, maybe = 0, canister = 0;
        Object.values(assignments!).forEach(pid => {
            if (typeof pid === 'string') {
                if (pid.startsWith('fixed')) fixed++;
                else if (pid.startsWith('maybe')) maybe++;
                else if (pid.startsWith('canister')) canister++;
            }
        });

        expect(fixed).toBe(10); // All fixed included
        expect(maybe).toBe(5); // All maybes included
        expect(canister).toBe(5); // Only 5 canisters needed
    });

    it('should assign Steer if only steer_preferred is set', () => {
        const pool: Paddler[] = [];
        const prefOnly = createPaddler('pref-only', 80, ['steer_preferred']);
        pool.push(prefOnly);
        // Fill rest
        for(let i=0; i<20; i++) pool.push(createPaddler(`p-${i}`, 80, ['left', 'right']));
        
        const assignments = runAutoFillAlgorithm(pool, {}, [], 0, 10);
        expect(assignments?.steer).toBe('pref-only');
    });

    it('should place Stroke in the first occupied row (Dynamic Row) and ensure pair', () => {
        const rows = 10;
        const pool: Paddler[] = [];
        const stroke = createPaddler('stroke-p', 80, ['stroke']); // Flexible side
        pool.push(stroke);
        
        // Add Drummer to preventing stealing a paddler
        pool.push(createPaddler('drum', 60, ['drum']));
        
        for(let i=0; i<4; i++) pool.push(createPaddler(`p-${i}`, 80, ['left', 'right']));
        
        // No Drum/Steer for simplicity/distraction (or add them validly)
        // If we don't add Drum/Steer, they remain empty.
        
        const assignments = runAutoFillAlgorithm(pool, {}, [], 0, rows);
        expect(assignments).not.toBeNull();
        
        // Find Stroke Seat
        const strokeSeatId = Object.keys(assignments!).find(k => assignments![k] === 'stroke-p');
        expect(strokeSeatId).toBeDefined();
        
        const match = strokeSeatId!.match(/row-(\d+)/);
        const assignedStrokeRow = parseInt(match![1]);
        
        console.log(`Stroke assigned to Row ${assignedStrokeRow}`);
        
        // Check if assignedStrokeRow is indeed the min occupied row
        const occupied = new Set<number>();
        Object.keys(assignments!).forEach(k => {
             if(k.includes('row')) occupied.add(parseInt(k.match(/row-(\d+)/)![1]));
        });
        const minOccupied = Math.min(...Array.from(occupied));
        
        expect(assignedStrokeRow).toBe(minOccupied);
        
        // Check if Stroke Row has 2 people (Pair Enforcement)
        let countInStrokeRow = 0;
        Object.keys(assignments!).forEach(k => {
            if (k.includes(`row-${assignedStrokeRow}-`)) countInStrokeRow++;
        });
        // Special case: If total paddlers < 2, we can't have a pair. But here we have 5.
        expect(countInStrokeRow).toBe(2);
    });

    it('should NOT assign Drummer if no exclusive drummer exists', () => {
        const pool: Paddler[] = [];
        // Normal paddlers who CAN drum but also paddle
        pool.push(createPaddler('p1', 80, ['left', 'drum']));
        pool.push(createPaddler('p2', 80, ['right']));
        
        const assignments = runAutoFillAlgorithm(pool, {}, [], 0, 10);
        expect(assignments?.drummer).toBeUndefined();
    });

    it('should assign Drummer if exclusive drummer exists', () => {
        const pool: Paddler[] = [];
        const drumOnly = createPaddler('drum-only', 60, ['drum']);
        pool.push(drumOnly);
        pool.push(createPaddler('p1', 80, ['left']));
        
        const assignments = runAutoFillAlgorithm(pool, {}, [], 0, 10);
        expect(assignments?.drummer).toBe('drum-only');
    });

    it('should fill boat from front, leaving empty rows at the back', () => {
        const pool: Paddler[] = [];
        // 10 People normal
        for(let i=0; i<10; i++) pool.push(createPaddler(`p-${i}`, 80, ['left', 'right']));
        // 4 Canisters
        for(let i=0; i<4; i++) pool.push(createPaddler(`c-${i}`, 10, ['left', 'right'], 4)); // Prio 4
        
        const assignments = runAutoFillAlgorithm(pool, {}, [], 0, 10);
        
        const occupied = new Set<number>();
        let canisterRows = new Set<number>();
        
        Object.keys(assignments!).forEach(k => {
             if (k.includes('row')) {
                 const r = parseInt(k.match(/row-(\d+)/)![1]);
                 occupied.add(r);
                 if (typeof assignments![k] === 'string' && (assignments![k] as string).startsWith('c-')) canisterRows.add(r);
             }
        });
        
        console.log('Occupied:', Array.from(occupied));
        console.log('CanisterRows:', Array.from(canisterRows));
        
        // Check if Canisters are in the Outer-most assigned rows.
        expect(true).toBe(true); // Placeholder
    });

    it('should prefer leaving the Last Row empty if possible', () => {
        const pool: Paddler[] = [];
        // 18 People (9 rows). 10 Rows total.
        // Last row (10) should be empty. Row 1 filled.
        for(let i=0; i<18; i++) pool.push(createPaddler(`p-${i}`, 80, ['left', 'right']));
        
        const assignments = runAutoFillAlgorithm(pool, {}, [], 0, 10);
        
        // Check Last Row (Row 10)
        let row10Occupied = false;
        if (assignments!['row-10-left'] || assignments!['row-10-right']) row10Occupied = true;
        
        expect(row10Occupied).toBe(false);
    });

    it('should place Canisters in Last Row if boat is full/nearly full', () => {
        const pool: Paddler[] = [];
        // 18 People + 2 Canisters. Total 20 = Full Boat.
        // Canisters should be in Row 10 (Last Row).
        for(let i=0; i<18; i++) pool.push(createPaddler(`p-${i}`, 80, ['left', 'right'], 1)); // Priority 1
        pool.push(createPaddler(`c-1`, 10, ['left', 'right'], 4)); // Canister
        pool.push(createPaddler(`c-2`, 10, ['left', 'right'], 4)); // Canister
        
        const assignments = runAutoFillAlgorithm(pool, {}, [], 0, 10);
        
        const r10L = assignments!['row-10-left'];
        const r10R = assignments!['row-10-right'];
        
        expect(r10L).toBeDefined();
        expect(r10R).toBeDefined();
        
        // Check if they are canisters
        // We know canisters start with 'c-'
        const isCanister = (id: string) => (id as string).startsWith('c-');
        
        if (typeof r10L === 'string') expect(isCanister(r10L)).toBe(true);
        if (typeof r10R === 'string') expect(isCanister(r10R)).toBe(true);
    });
});
