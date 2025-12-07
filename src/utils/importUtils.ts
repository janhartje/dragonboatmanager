
export const columnAliases: { [key: string]: string } = {
  'titel': 'title',
  'datum': 'date',
  'zeit': 'time',
  'uhrzeit': 'time',
  'typ': 'type',
  'art': 'type',
  'bootsgröße': 'boatSize',
  'boot': 'boatSize',
  'boatsize': 'boatSize',
  'kommentar': 'comment',
  'bemerkung': 'comment',
  'hinweis': 'comment',
  'comment': 'comment',
  'weight': 'weight',
  'gewicht': 'weight',
  'side': 'side',
  'seite': 'side',
  'rolle': 'side',
  'skills': 'side'
};

export const normalizeHeader = (header: string): string => {
  let h = String(header).trim().toLowerCase();
  // Remove potential special chars or quotes
  h = h.replace(/["']/g, '');
  if (columnAliases[h]) return columnAliases[h];
  return h;
};

/**
 * Parses a date string and optional time string into a Date object.
 * Handles various formats:
 * - ISO date (YYYY-MM-DD, YYYY-MM-DDTHH:mm:ss)
 * - European format (DD.MM.YYYY)
 * - Time in HH:mm or HH:mm:ss format
 */
export const parseEventDateTime = (dateInput: string | Date | null | undefined, timeStr?: string | null): Date => {
  if (!dateInput) return new Date();
  
  let date: Date;
  
  if (dateInput instanceof Date) {
    date = new Date(dateInput);
  } else {
    const dateString = String(dateInput).trim();
    
    // Handle European format DD.MM.YYYY
    if (dateString.includes('.')) {
      const parts = dateString.split('.');
      if (parts.length === 3) {
        const [day, month, year] = parts.map(Number);
        date = new Date(year, month - 1, day);
      } else {
        date = new Date(dateString);
      }
    } else if (dateString.includes('T')) {
      // ISO format with time already included
      date = new Date(dateString);
    } else if (dateString.includes('-')) {
      // ISO date format YYYY-MM-DD
      const [year, month, day] = dateString.split('-').map(Number);
      date = new Date(year, month - 1, day);
    } else {
      date = new Date(dateString);
    }
  }
  
  // If a separate time string is provided, apply it
  if (timeStr && typeof timeStr === 'string' && timeStr.includes(':')) {
    const timeParts = timeStr.split(':').map(Number);
    const hours = timeParts[0] || 0;
    const minutes = timeParts[1] || 0;
    date.setHours(hours, minutes, 0, 0);
  }
  
  return date;
};
