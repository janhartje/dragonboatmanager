import { McpSessionStore, SessionData } from './session-store';
import prisma from '@/lib/prisma';
import { createHash } from 'crypto';

interface CacheEntry {
    data: SessionData;
    expiresAt: number;
}

export class PostgresSessionStore implements McpSessionStore {
    private maxRetries = 2;
    private retryDelayMs = 100;
    private sessionCache = new Map<string, CacheEntry>();
    private CACHE_TTL_MS = 10000; // 10 seconds
    private cacheCleanupInterval: NodeJS.Timeout | null = null;

    private ensureCacheCleanup() {
        if (this.cacheCleanupInterval) return;
        this.cacheCleanupInterval = setInterval(() => {
            const now = Date.now();
            for (const [key, entry] of this.sessionCache.entries()) {
                if (now > entry.expiresAt) {
                    this.sessionCache.delete(key);
                }
            }
            if (this.sessionCache.size === 0) {
                if (this.cacheCleanupInterval) {
                    clearInterval(this.cacheCleanupInterval);
                    this.cacheCleanupInterval = null;
                }
            }
        }, 30000);
    }

    async createSession(id: string, apiKey: string): Promise<void> {
        const apiKeyHash = createHash('sha256').update(apiKey).digest('hex');

        await this.withRetry(async () => {
            await prisma.mcpSession.create({
                data: {
                    id,
                    apiKeyHash,
                },
            });
        });

        // Pre-populate cache
        const sessionData: SessionData = {
            id,
            apiKey: apiKeyHash,
            createdAt: Date.now(),
        };
        this.sessionCache.set(id, { data: sessionData, expiresAt: Date.now() + this.CACHE_TTL_MS });
        this.ensureCacheCleanup();
    }

    async getSession(id: string): Promise<SessionData | null> {
        // Check cache first
        const cached = this.sessionCache.get(id);
        if (cached && Date.now() < cached.expiresAt) {
            return cached.data;
        }

        // Cache miss or expired - query DB with retry
        const session = await this.withRetry(async () => {
            return prisma.mcpSession.findUnique({
                where: { id },
            });
        });

        if (!session) {
            this.sessionCache.delete(id); // Ensure cache is clean
            return null;
        }

        const sessionData: SessionData = {
            id: session.id,
            apiKey: session.apiKeyHash,
            createdAt: session.createdAt.getTime(),
        };

        // Update cache
        this.sessionCache.set(id, { data: sessionData, expiresAt: Date.now() + this.CACHE_TTL_MS });
        this.ensureCacheCleanup();

        return sessionData;
    }

    async removeSession(id: string): Promise<void> {
        this.sessionCache.delete(id); // Invalidate cache immediately

        try {
            await this.withRetry(async () => {
                await prisma.mcpSession.delete({
                    where: { id },
                });
            });
        } catch {
            // Ignore if not found to ensure idempotency
        }
    }

    /**
     * Executes a database operation with retry logic for transient failures.
     */
    private async withRetry<T>(operation: () => Promise<T>): Promise<T> {
        let lastError: Error | null = null;

        for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
            try {
                return await operation();
            } catch (error) {
                lastError = error instanceof Error ? error : new Error(String(error));

                // Check if it's a transient error worth retrying
                const isTransient = this.isTransientError(lastError);

                if (!isTransient || attempt === this.maxRetries) {
                    console.error(`[PostgresSessionStore] Operation failed after ${attempt + 1} attempts:`, lastError.message);
                    throw lastError;
                }

                // Wait before retrying
                await this.delay(this.retryDelayMs * (attempt + 1));
            }
        }

        throw lastError!;
    }

    private isTransientError(error: Error): boolean {
        const transientPatterns = [
            'ECONNRESET',
            'ECONNREFUSED',
            'ETIMEDOUT',
            'connection',
            'timeout',
            'temporarily unavailable',
        ];
        const message = error.message.toLowerCase();
        return transientPatterns.some(pattern => message.includes(pattern.toLowerCase()));
    }

    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
