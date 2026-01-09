import { validateRedirectUrl } from '../security';

describe('validateRedirectUrl', () => {
    const origin = 'https://example.com';

    it('allows valid relative URLs', () => {
        const result = validateRedirectUrl('/dashboard', origin);
        expect(result).toBe('https://example.com/dashboard');
    });

    it('allows valid absolute URLs on same origin', () => {
        const result = validateRedirectUrl('https://example.com/dashboard', origin);
        expect(result).toBe('https://example.com/dashboard');
    });

    it('throws on cross-origin URLs', () => {
        expect(() => validateRedirectUrl('https://evil.com/hack', origin)).toThrow('Origin mismatch');
    });

    it('throws on protocol-relative cross-origin URLs', () => {
        // //evil.com resolves to https://evil.com if base is https
        expect(() => validateRedirectUrl('//evil.com', origin)).toThrow('Origin mismatch');
    });

    it('throws on javascript: protocol', () => {
        expect(() => validateRedirectUrl('javascript:alert(1)', origin)).toThrow('Unsafe protocol');
    });

    it('throws on data: protocol', () => {
        expect(() => validateRedirectUrl('data:text/html,Bad', origin)).toThrow('Unsafe protocol');
    });
});
