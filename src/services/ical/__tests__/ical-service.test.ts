/* eslint-disable @typescript-eslint/no-explicit-any */
import { syncTeamEvents } from '../ical-service';
import prisma from '@/lib/prisma';
import ical from 'node-ical';
import { mockDeep, mockReset } from 'jest-mock-extended';
import { PrismaClient } from '@prisma/client';

// Mock prisma
jest.mock('@/lib/prisma', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { mockDeep } = require('jest-mock-extended');
  return {
    __esModule: true,
    default: mockDeep(),
  };
});

// Mock node-ical validation
jest.mock('@/utils/url-validation', () => ({
    validateUrl: jest.fn().mockReturnValue(true)
}));
import { validateUrl } from '@/utils/url-validation';

// Mock safe-fetch
jest.mock('@/utils/safe-fetch', () => ({
    safeFetch: jest.fn()
}));
import { safeFetch } from '@/utils/safe-fetch';

// Mock node-ical
jest.mock('node-ical', () => ({
  parseICS: jest.fn(),
}));

const prismaMock = prisma as unknown as ReturnType<typeof mockDeep<PrismaClient>>;

describe('iCal Service', () => {
  const teamId = 'test-team-id';
  const icalUrl = 'https://example.com/calendar.ics';

  beforeEach(() => {
    mockReset(prismaMock);
    jest.clearAllMocks();
    (validateUrl as jest.Mock).mockReturnValue(true);
    // Mock transaction to immediately execute callback with the prismaMock
    prismaMock.$transaction.mockImplementation((callback: any) => callback(prismaMock));
  });

  it('should fetch iCal feed and upsert events', async () => {
    // 1. Mock Team with iCal URL
    prismaMock.team.findUnique.mockResolvedValue({
      id: teamId,
      icalUrl: icalUrl,
    } as unknown as any);

    // 2. Mock Fetch Response via safeFetch
    (safeFetch as jest.Mock).mockResolvedValue({
        ok: true,
        text: jest.fn().mockResolvedValue('BEGIN:VCALENDAR...'),
        status: 200,
        statusText: 'OK'
    });

    // 3. Mock ICS Parsing
    const mockEvents = {
      'event-1': {
        type: 'VEVENT',
        uid: 'uid-1',
        summary: 'Training',
        start: new Date('2024-01-01T10:00:00Z'),
        end: new Date('2024-01-01T12:00:00Z'),
      },
      'event-2': {
        type: 'VEVENT',
        uid: 'uid-2',
        summary: 'Regatta',
        start: new Date('2024-02-01T10:00:00Z'),
        end: new Date('2024-02-01T18:00:00Z'),
      },
    };
    (ical.parseICS as jest.Mock).mockReturnValue(mockEvents);
    
    // Mock finding existing events (one exists, one new)
    prismaMock.event.findMany
      .mockResolvedValueOnce([{
         id: 'existing-1',
         externalUid: 'uid-1',
         title: 'Old Title',
         date: new Date('2024-01-01T09:00:00Z'), // Different date/time
      }] as any) // Batch find existing
      .mockResolvedValueOnce([]); // Find deletions
      
    // 4. Call Service
    const result = await syncTeamEvents(teamId);

    // 5. Verify
    expect(result.success).toBe(true);
    expect(result.count).toBe(2);
    expect(result.created).toBe(1); // uid-2
    expect(result.updated).toBe(1); // uid-1

    expect(safeFetch).toHaveBeenCalledWith(icalUrl, expect.objectContaining({
        timeout: 10000,
        redirect: 'manual'
    }));
    expect(ical.parseICS).toHaveBeenCalledWith('BEGIN:VCALENDAR...');

    // Verify Batch Fetch
    expect(prismaMock.event.findMany).toHaveBeenCalledWith(expect.objectContaining({
        where: expect.objectContaining({
            teamId,
            externalUid: expect.objectContaining({ in: expect.arrayContaining(['uid-1', 'uid-2']) })
        })
    }));

    // Verify CreateMany
    expect(prismaMock.event.createMany).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.arrayContaining([
            expect.objectContaining({
                externalUid: 'uid-2',
            })
        ])
    }));
  });

  it('should abort if mass deletion is detected (Panic Switch)', async () => {
    prismaMock.team.findUnique.mockResolvedValue({ id: teamId, icalUrl } as any);
    
    // Mock fetch empty calendar
    (safeFetch as jest.Mock).mockResolvedValue({
        ok: true,
        text: jest.fn().mockResolvedValue('BEGIN:VCALENDAR\nEND:VCALENDAR'),
        status: 200
    });
    (ical.parseICS as jest.Mock).mockReturnValue({}); // No events

    // Existing events matching (skipped because validUids is empty)
    
    // Deletions finding (inside TX) - Returns many events
    // This simulates that we have 6 events in DB, but 0 in feed.
    // 100% deletion > 50% threshold.
    prismaMock.event.findMany.mockResolvedValueOnce([
        { id: '1', title: 'E1', date: new Date() },
        { id: '2', title: 'E2', date: new Date() },
        { id: '3', title: 'E3', date: new Date() },
        { id: '4', title: 'E4', date: new Date() },
        { id: '5', title: 'E5', date: new Date() },
        { id: '6', title: 'E6', date: new Date() }
    ] as any);

    await expect(syncTeamEvents(teamId)).rejects.toThrow(/Safety Stop: Attempting to delete 6 of 6 events/);
  });

  it('should throw error if team has no iCal URL', async () => {
    prismaMock.team.findUnique.mockResolvedValue({
        id: teamId,
        icalUrl: null,
    } as any);

    await expect(syncTeamEvents(teamId)).rejects.toThrow('No iCal URL provided');
  });

  it('should throw error if URL validation fails', async () => {
    prismaMock.team.findUnique.mockResolvedValue({
        id: teamId,
        icalUrl: 'http://unsafe-url.com',
    } as any);
    (validateUrl as jest.Mock).mockReturnValue(false);

    await expect(syncTeamEvents(teamId)).rejects.toThrow('Invalid iCal URL (Security Check Failed)');
  });

  it('should handle fetch failure (non-200)', async () => {
      prismaMock.team.findUnique.mockResolvedValue({
          id: teamId,
          icalUrl: icalUrl,
      } as any);
  
      (safeFetch as jest.Mock).mockResolvedValue({
          ok: false,
          status: 404,
          statusText: 'Not Found'
      });
  
      await expect(syncTeamEvents(teamId)).rejects.toThrow('Failed to fetch iCal: 404 Not Found');
  });

  it('should throw error if iCal file is too large', async () => {
    prismaMock.team.findUnique.mockResolvedValue({
        id: teamId,
        icalUrl: icalUrl,
    } as any);

    (safeFetch as jest.Mock).mockResolvedValue({
        ok: true,
        text: jest.fn().mockResolvedValue('a'.repeat(5 * 1024 * 1024 + 1)), // 5MB + 1 byte
        status: 200,
        statusText: 'OK'
    });

    await expect(syncTeamEvents(teamId)).rejects.toThrow('iCal file too large (max 5MB)');
  });
});
