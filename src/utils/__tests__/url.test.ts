import { getBaseUrl } from '../url';

describe('getBaseUrl', () => {
    const originalEnv = process.env;

    beforeEach(() => {
        jest.resetModules();
        process.env = { ...originalEnv };
    });

    afterAll(() => {
        process.env = originalEnv;
    });

    it('should use NEXT_PUBLIC_SERVER_URL if set', () => {
        process.env.NEXT_PUBLIC_SERVER_URL = 'https://custom-override.com';
        expect(getBaseUrl()).toBe('https://custom-override.com');
    });

    it('should use VERCEL_PROJECT_PRODUCTION_URL when in production environment', () => {
        delete process.env.NEXT_PUBLIC_SERVER_URL; // Ensure override is off
        process.env.VERCEL_ENV = 'production';
        process.env.VERCEL_PROJECT_PRODUCTION_URL = 'production-domain.com';
        process.env.VERCEL_URL = 'deployment-url.vercel.app'; // Should be ignored
        expect(getBaseUrl()).toBe('https://production-domain.com');
    });

    it('should use VERCEL_URL when NOT in production environment (e.g. preview)', () => {
        delete process.env.NEXT_PUBLIC_SERVER_URL; // Ensure override is off
        process.env.VERCEL_ENV = 'preview';
        process.env.VERCEL_PROJECT_PRODUCTION_URL = 'production-domain.com';
        process.env.VERCEL_URL = 'preview-deployment.vercel.app';
        expect(getBaseUrl()).toBe('https://preview-deployment.vercel.app');
    });

    it('should fallback to VERCEL_PROJECT_PRODUCTION_URL if VERCEL_URL is missing', () => {
        delete process.env.NEXT_PUBLIC_SERVER_URL; // Ensure override is off
        delete process.env.VERCEL_URL;
        process.env.VERCEL_PROJECT_PRODUCTION_URL = 'production-domain.com';
        expect(getBaseUrl()).toBe('https://production-domain.com');
    });

    it('should fallback to localhost if no env vars are set', () => {
        delete process.env.NEXT_PUBLIC_SERVER_URL;
        delete process.env.VERCEL_URL;
        delete process.env.VERCEL_PROJECT_PRODUCTION_URL;
        delete process.env.VERCEL_ENV;
        expect(getBaseUrl()).toBe('http://localhost:3000');
    });
});
