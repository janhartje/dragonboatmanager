/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { PostgresSessionStore } from '../postgres-session-store';
import prisma from '@/lib/prisma';
import { DeepMockProxy } from 'jest-mock-extended';
import { PrismaClient } from '@prisma/client';
import { createHash } from 'crypto';

// Use the manual mock from src/lib/__mocks__/prisma.ts
jest.mock('@/lib/prisma');

const prismaMock = prisma as unknown as DeepMockProxy<PrismaClient>;

describe('PostgresSessionStore', () => {
    let store: PostgresSessionStore;

    beforeEach(() => {
        jest.clearAllMocks();
        store = new PostgresSessionStore();

        // Explicitly mock the mcpSession delegate if auto-mock fails
        // This can happen if the property is dynamic or type definitions are lagging
        (prismaMock as any).mcpSession = {
            create: jest.fn(),
            findUnique: jest.fn(),
            delete: jest.fn(),
        };
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('should create a session in the database', async () => {
        const sessionId = 'test-session-id';
        const apiKey = 'test-api-key';
        const apiKeyHash = createHash('sha256').update(apiKey).digest('hex');

        // Mock prisma.mcpSession.create to resolve
        prismaMock.mcpSession.create.mockResolvedValue({
            id: sessionId,
            apiKeyHash: apiKeyHash,
            createdAt: new Date(),
            expiresAt: null
        } as any);

        await store.createSession(sessionId, apiKey);

        expect(prismaMock.mcpSession.create).toHaveBeenCalledWith({
            data: {
                id: sessionId,
                apiKeyHash: apiKeyHash,
            }
        });
    });

    it('should retrieve a session if it exists', async () => {
        const sessionId = 'existing-session';
        // Note: For retrieval, the store returns what is in the DB.
        // If the DB has the hash, it returns the hash. 
        // The calling code must expect the hash if it uses SessionData.apiKey.
        // Let's assume the DB stores the hash.
        const apiKeyHash = 'hashed-value';
        const now = new Date();

        prismaMock.mcpSession.findUnique.mockResolvedValue({
            id: sessionId,
            apiKeyHash: apiKeyHash,
            createdAt: now,
            expiresAt: null
        } as any);

        const session = await store.getSession(sessionId);

        expect(prismaMock.mcpSession.findUnique).toHaveBeenCalledWith({
            where: { id: sessionId }
        });

        expect(session).toEqual({
            id: sessionId,
            apiKey: apiKeyHash,
            createdAt: now.getTime(),
        });
    });

    it('should return null if session does not exist', async () => {
        prismaMock.mcpSession.findUnique.mockResolvedValue(null);

        const session = await store.getSession('non-existent');
        expect(session).toBeNull();
    });

    it('should remove a session', async () => {
        const sessionId = 'session-to-remove';

        // delete usually returns the deleted record
        prismaMock.mcpSession.delete.mockResolvedValue({
            id: sessionId,
            apiKey: 'key',
            createdAt: new Date(),
            expiresAt: null
        } as any);

        await store.removeSession(sessionId);

        expect(prismaMock.mcpSession.delete).toHaveBeenCalledWith({
            where: { id: sessionId }
        });
    });

    it('should handle delete errors gracefully (e.g. if record missing)', async () => {
        // Prisma throws if record not found on delete
        prismaMock.mcpSession.delete.mockRejectedValue(new Error('Record to delete does not exist.'));

        // We probably want strict delete or loose delete. 
        // Let's assume the store should ignore if it's already gone to be idempotent.
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => { });
        await expect(store.removeSession('missing-id')).resolves.not.toThrow();
        expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('[PostgresSessionStore] Operation failed'), expect.any(String));
    });
});
