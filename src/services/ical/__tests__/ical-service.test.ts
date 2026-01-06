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

// Mock node-ical
jest.mock('node-ical', () => ({
  async: {
    fromURL: jest.fn(),
  },
}));

const prismaMock = prisma as unknown as ReturnType<typeof mockDeep<PrismaClient>>;

describe('iCal Service', () => {
  const teamId = 'test-team-id';
  const icalUrl = 'https://example.com/calendar.ics';

  beforeEach(() => {
    mockReset(prismaMock);
    jest.clearAllMocks();
  });

  it('should fetch iCal feed and upsert events', async () => {
    // 1. Mock Team with iCal URL
    prismaMock.team.findUnique.mockResolvedValue({
      id: teamId,
      icalUrl: icalUrl,
    } as unknown as any);

    // 2. Mock iCal Response
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
    (ical.async.fromURL as jest.Mock).mockResolvedValue(mockEvents);
    
    // Mock finding existing events (one exists, one new)
    prismaMock.event.findMany
      .mockResolvedValueOnce([{
         id: 'existing-1',
         externalUid: 'uid-1',
         title: 'Old Title',
         date: new Date('2024-01-01T09:00:00Z'), // Different date/time
      }] as any) // Batch find existing
      .mockResolvedValueOnce([]); // Find deletions
      
    // 3. Call Service
    const result = await syncTeamEvents(teamId);

    // 4. Verify
    expect(result.success).toBe(true);
    expect(result.count).toBe(2);
    expect(result.created).toBe(1); // uid-2
    expect(result.updated).toBe(1); // uid-1

    expect(ical.async.fromURL).toHaveBeenCalledWith(icalUrl);

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

    // Verify Update (Sequential for now)
    expect(prismaMock.event.update).toHaveBeenCalledWith(expect.objectContaining({
        where: { id: 'existing-1' },
        data: expect.objectContaining({ title: 'Training' })
    }));
  });

  it('should throw error if team has no iCal URL', async () => {
    prismaMock.team.findUnique.mockResolvedValue({
        id: teamId,
        icalUrl: null,
    } as any);

    await expect(syncTeamEvents(teamId)).rejects.toThrow('No iCal URL provided');
  });

  it('should throw error for HTTP URL (HTTPS only enforcement)', async () => {
    prismaMock.team.findUnique.mockResolvedValue({
        id: teamId,
        icalUrl: 'http://example.com/calendar.ics',
    } as any);

    await expect(syncTeamEvents(teamId)).rejects.toThrow('Invalid iCal URL');
  });

  it('should throw error for invalid iCal URL (SSRF Prevention)', async () => {
    prismaMock.team.findUnique.mockResolvedValue({
        id: teamId,
        icalUrl: 'http://localhost:3000/secret',
    } as any);

    await expect(syncTeamEvents(teamId)).rejects.toThrow('Invalid iCal URL');
  });
});
