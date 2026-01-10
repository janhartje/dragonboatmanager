import { submitToIndexNow } from '../indexnow';
import { getProductionUrl } from '@/utils/url';

// Mock getProductionUrl
jest.mock('@/utils/url', () => ({
    getProductionUrl: jest.fn(),
}));

// Mock global fetch
global.fetch = jest.fn();

describe('submitToIndexNow', () => {
    const mockFetch = global.fetch as jest.Mock;
    const mockGetProductionUrl = getProductionUrl as jest.Mock;

    const OLD_ENV = process.env;

    beforeEach(() => {
        jest.clearAllMocks();
        jest.resetModules(); // clears the cache
        process.env = { ...OLD_ENV, INDEXNOW_KEY: 'test-key', NODE_ENV: 'production' };
        mockGetProductionUrl.mockReturnValue('https://example.com');
    });

    afterAll(() => {
        process.env = OLD_ENV;
    });

    it('should submit URLs when key is present', async () => {
        mockFetch.mockResolvedValue({ ok: true, status: 200 });

        const result = await submitToIndexNow(['https://example.com']);

        expect(result).toBe(true);
        expect(mockFetch).toHaveBeenCalledWith('https://api.indexnow.org/indexnow', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json; charset=utf-8',
            },
            body: JSON.stringify({
                host: 'example.com',
                key: 'test-key',
                keyLocation: 'https://example.com/api/indexnow/key',
                urlList: ['https://example.com'],
            }),
        });
    });

    it('should return false if key is missing', async () => {
        delete process.env.INDEXNOW_KEY;

        const result = await submitToIndexNow(['https://example.com']);

        expect(result).toBe(false);
        expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should return false if fetch fails', async () => {
        mockFetch.mockResolvedValue({ ok: false, status: 500, statusText: 'Internal Server Error' });
        // Suppress console.error for this test
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => { });

        const result = await submitToIndexNow(['https://example.com']);

        expect(result).toBe(false);

        consoleSpy.mockRestore();
    });

    it('should handle fetch rejection', async () => {
        mockFetch.mockRejectedValue(new Error('Network error'));
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => { });

        const result = await submitToIndexNow(['https://example.com']);

        expect(result).toBe(false);

        consoleSpy.mockRestore();
    });

    it('should return false if not in production', async () => {
        process.env = { ...process.env, NODE_ENV: 'development' };

        const result = await submitToIndexNow(['https://example.com']);

        expect(result).toBe(false);
        expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should return true without making API call if URLs array is empty', async () => {
        const result = await submitToIndexNow([]);

        expect(result).toBe(true);
        expect(mockFetch).not.toHaveBeenCalled();
    });
});
