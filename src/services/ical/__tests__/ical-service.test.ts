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

// Mock node-ical
jest.mock('node-ical', () => ({
  parseICS: jest.fn(),
}));

// Mock global fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

const prismaMock = prisma as unknown as ReturnType<typeof mockDeep<PrismaClient>>;

describe('iCal Service', () => {
  const teamId = 'test-team-id';
  const icalUrl = 'https://example.com/calendar.ics';

  beforeEach(() => {
    mockReset(prismaMock);
    jest.clearAllMocks();
    (validateUrl as jest.Mock).mockReturnValue(true);
  });

  it('should fetch iCal feed and upsert events', async () => {
    // 1. Mock Team with iCal URL
    prismaMock.team.findUnique.mockResolvedValue({
      id: teamId,
      icalUrl: icalUrl,
    } as unknown as any);

    // 2. Mock Fetch Response
    mockFetch.mockResolvedValue({
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

    expect(mockFetch).toHaveBeenCalledWith(icalUrl, expect.objectContaining({
        signal: expect.any(AbortSignal)
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

  it('should handle fetch timeout', async () => {
    prismaMock.team.findUnique.mockResolvedValue({
        id: teamId,
        icalUrl: icalUrl,
    } as any);

    // Simulate AbortError
    const abortError = new Error('The operation was aborted');
    abortError.name = 'AbortError';
    mockFetch.mockRejectedValue(abortError);

    await expect(syncTeamEvents(teamId)).rejects.toThrow('iCal fetch timed out after 10s');
  });

  it('should handle fetch failure (non-200)', async () => {
      prismaMock.team.findUnique.mockResolvedValue({
          id: teamId,
          icalUrl: icalUrl,
      } as any);
  
      mockFetch.mockResolvedValue({
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

    mockFetch.mockResolvedValue({
        ok: true,
        text: jest.fn().mockResolvedValue('a'.repeat(5 * 1024 * 1024 + 1)), // 5MB + 1 byte
        status: 200,
        statusText: 'OK'
    });

    await expect(syncTeamEvents(teamId)).rejects.toThrow('iCal file too large (max 5MB)');
  });
});
