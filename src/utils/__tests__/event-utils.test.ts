import { filterFutureEvents } from '../event-utils';
import { Event } from '../../types';

describe('event-utils', () => {
  describe('filterFutureEvents', () => {
    const fixedNow = new Date('2024-06-15T12:00:00Z');
    
    // Relative times from fixedNow
    const twoDaysAgo = new Date(fixedNow.getTime() - 86400000 * 2).toISOString();
    const twoDaysFuture = new Date(fixedNow.getTime() + 86400000 * 2).toISOString();
    const today = fixedNow.toISOString();

    const mockEvents: Event[] = [
      {
        id: '1',
        title: 'Past Event',
        date: twoDaysAgo,
        type: 'training',
        boatSize: 'standard',
        canisterCount: 0,
        attendance: {},
        guests: []
      },
      {
        id: '2',
        title: 'Future Event',
        date: twoDaysFuture,
        type: 'training',
        boatSize: 'standard',
        canisterCount: 0,
        attendance: {},
        guests: []
      },
      {
        id: '3',
        title: 'Today Event',
        date: today,
        type: 'training',
        boatSize: 'standard',
        canisterCount: 0,
        attendance: {},
        guests: []
      }
    ];

    it('should filter out events strictly in the past (yesterday or older)', () => {
      // Inject fixedNow to ensure test works regardless of real time
      const result = filterFutureEvents(mockEvents, fixedNow);
      expect(result).toHaveLength(2);
      expect(result.map((e: Event) => e.id)).toEqual(expect.arrayContaining(['2', '3']));
      expect(result.map((e: Event) => e.id)).not.toContain('1');
    });

    it('should return empty array if all events are in the past', () => {
        const pastEvents = [mockEvents[0]];
        const result = filterFutureEvents(pastEvents, fixedNow);
        expect(result).toHaveLength(0);
    });

    it('should return all events if all are in future', () => {
        const futureEvents = [mockEvents[1]];
        const result = filterFutureEvents(futureEvents, fixedNow);
        expect(result).toHaveLength(1);
    });
    
    it('should handle invalid input securely', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(filterFutureEvents(null as any)).toEqual([]);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(filterFutureEvents(undefined as any)).toEqual([]);
    });

    it('should filter out events with invalid dates', () => {
      const invalidEvent = { ...mockEvents[0], id: 'bad', date: 'invalid-date' };
      const result = filterFutureEvents([invalidEvent], fixedNow);
      expect(result).toHaveLength(0);
    });
  });
});
