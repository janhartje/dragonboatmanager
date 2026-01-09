/**
 * Validates a redirect URL to ensure it is safe and belongs to the same origin.
 * Prevents Open Redirect vulnerabilities by strictly checking the origin and protocol.
 * 
 * @param url The URL to validate
 * @param currentOrigin The current windown.origin to validate against
 * @returns The stringified safe URL
 * @throws Error if the URL is unsafe (origin mismatch or unsafe protocol)
 */
export function validateRedirectUrl(url: string, currentOrigin: string): string {
    const targetUrl = new URL(url, currentOrigin);

    if (!['http:', 'https:'].includes(targetUrl.protocol)) {
        throw new Error('Unsafe protocol');
    }

    if (targetUrl.origin !== currentOrigin) {
        throw new Error('Origin mismatch');
    }

    return targetUrl.toString();
}
