import { getProductionUrl } from "@/utils/url";

/**
 * Submit URLs to IndexNow to notify search engines of content updates.
 * 
 * @param urls Array of URLs that have been updated, added, or deleted.
 * @returns Promise resolving to true if submission was successful (or skipped), false otherwise.
 */
export async function submitToIndexNow(urls: string[]): Promise<boolean> {
    const indexNowKey = process.env.INDEXNOW_KEY;

    // Only run in production
    if (process.env.NODE_ENV !== 'production') {
        return false;
    }

    // Skip if no key configured
    if (!indexNowKey) {
        console.warn('IndexNow: specific key not configured (INDEXNOW_KEY). Skipping submission.');
        return false;
    }

    // Validate that URLs array is not empty
    if (!urls || urls.length === 0) {
        return true; // Return true as there's nothing to submit (not an error condition)
    }

    // Determine host and key location
    // We use the production URL as the host.
    // Note: getProductionUrl() returns something like "https://dragonboatmanager.com"
    const hostUrl = getProductionUrl();
    const host = new URL(hostUrl).hostname;

    // The key location is hosted at /api/indexnow/key because we don't want to pollute the public root
    const keyLocation = `${hostUrl}/api/indexnow/key`;

    const body = {
        host,
        key: indexNowKey,
        keyLocation,
        urlList: urls,
    };

    try {
        const response = await fetch('https://api.indexnow.org/indexnow', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json; charset=utf-8',
            },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            console.error(`IndexNow submission failed: ${response.status} ${response.statusText}`);
            return false;
        }

        // Success (200 or 202)
        return true;
    } catch (error) {
        console.error('IndexNow submission error:', error);
        return false;
    }
}
