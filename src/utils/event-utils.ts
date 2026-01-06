import { Event } from '@/types';

/**
 * Filters events to show only those happening today or in the future.
 * @param events Array of events to filter
 * @param referenceDate Optional reference date (default: now) for deterministic testing and timezone control
 */
export const filterFutureEvents = (events: Event[] | undefined | null, referenceDate: Date = new Date()): Event[] => {
  // 1. Fail Safe: Trust no input
  if (!Array.isArray(events)) {
    console.warn('[filterFutureEvents] Invalid input:', events);
    return [];
  }

  const threshold = new Date(referenceDate);
  // Reset to start of day relative to the reference date's timezone context
  threshold.setHours(0, 0, 0, 0);

  return events.filter(event => {
    // 2. Data Integrity Check
    if (!event?.date) return false;
    
    const eventDate = new Date(event.date);
    // 3. Invalid Date Check
    if (isNaN(eventDate.getTime())) {
        console.warn('[filterFutureEvents] Invalid date encountered:', event.date);
        return false;
    }

    return eventDate >= threshold;
  });
};
