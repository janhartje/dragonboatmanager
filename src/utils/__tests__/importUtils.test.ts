
import { normalizeHeader } from '../importUtils';

describe('importUtils', () => {
  describe('normalizeHeader', () => {
    it('should normalize standard English headers', () => {
      expect(normalizeHeader('Title')).toBe('title');
      expect(normalizeHeader('Date')).toBe('date');
      expect(normalizeHeader('Time')).toBe('time');
      expect(normalizeHeader('Type')).toBe('type');
      expect(normalizeHeader('BoatSize')).toBe('boatSize');
      expect(normalizeHeader('Comment')).toBe('comment');
    });

    it('should normalize German aliases correctly', () => {
      expect(normalizeHeader('Titel')).toBe('title');
      expect(normalizeHeader('Datum')).toBe('date');
      expect(normalizeHeader('Uhrzeit')).toBe('time');
      expect(normalizeHeader('Typ')).toBe('type');
      expect(normalizeHeader('Art')).toBe('type');
      expect(normalizeHeader('Bootsgröße')).toBe('boatSize');
      expect(normalizeHeader('Kommentar')).toBe('comment');
      expect(normalizeHeader('Bemerkung')).toBe('comment');
      expect(normalizeHeader('Hinweis')).toBe('comment');
      expect(normalizeHeader('Gewicht')).toBe('weight');
      expect(normalizeHeader('Seite')).toBe('side');
    });

    it('should handle case insensitivity', () => {
      expect(normalizeHeader('TITEL')).toBe('title');
      expect(normalizeHeader('datum')).toBe('date');
      expect(normalizeHeader('CoMmEnT')).toBe('comment');
    });

    it('should remove quotes', () => {
      expect(normalizeHeader('"Title"')).toBe('title');
      expect(normalizeHeader("'Date'")).toBe('date');
    });

    it('should return original string if no alias matches', () => {
      expect(normalizeHeader('Unknown')).toBe('unknown'); // returns lowercased
      expect(normalizeHeader('Custom Column')).toBe('custom column');
    });
  });
});

import { parseEventDateTime } from '../importUtils';

describe('parseEventDateTime', () => {
  it('should parse ISO date format (YYYY-MM-DD)', () => {
    const result = parseEventDateTime('2025-06-15');
    expect(result.getFullYear()).toBe(2025);
    expect(result.getMonth()).toBe(5); // June is month 5 (0-indexed)
    expect(result.getDate()).toBe(15);
  });

  it('should parse European date format (DD.MM.YYYY)', () => {
    const result = parseEventDateTime('20.05.2025');
    expect(result.getFullYear()).toBe(2025);
    expect(result.getMonth()).toBe(4); // May is month 4
    expect(result.getDate()).toBe(20);
  });

  it('should parse ISO datetime format', () => {
    const result = parseEventDateTime('2025-06-15T14:30:00');
    expect(result.getFullYear()).toBe(2025);
    expect(result.getHours()).toBe(14);
    expect(result.getMinutes()).toBe(30);
  });

  it('should apply time string to date', () => {
    const result = parseEventDateTime('2025-06-15', '19:00');
    expect(result.getHours()).toBe(19);
    expect(result.getMinutes()).toBe(0);
  });

  it('should handle Date object input', () => {
    const input = new Date(2025, 5, 15, 10, 30);
    const result = parseEventDateTime(input);
    expect(result.getFullYear()).toBe(2025);
    expect(result.getMonth()).toBe(5);
    expect(result.getDate()).toBe(15);
  });

  it('should return current date for null input', () => {
    const before = new Date();
    const result = parseEventDateTime(null);
    const after = new Date();
    expect(result.getTime()).toBeGreaterThanOrEqual(before.getTime());
    expect(result.getTime()).toBeLessThanOrEqual(after.getTime());
  });

  it('should handle time with seconds (HH:mm:ss)', () => {
    const result = parseEventDateTime('2025-06-15', '14:30:45');
    expect(result.getHours()).toBe(14);
    expect(result.getMinutes()).toBe(30);
  });
});
