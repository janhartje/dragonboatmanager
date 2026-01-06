import dns from 'node:dns/promises';
import { validateUrl } from './url-validation';

/**
 * Validates if an IP address is private/internal.
 * Checks IPv4 and IPv6 ranges.
 */
function isPrivateIP(ip: string): boolean {
  // IPv4 Private Ranges
  // 10.0.0.0/8
  if (ip.startsWith('10.')) return true;
  // 172.16.0.0/12
  if (/^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(ip)) return true;
  // 192.168.0.0/16
  if (ip.startsWith('192.168.')) return true;
  // 127.0.0.0/8 (Loopback)
  if (ip.startsWith('127.')) return true;
  // 169.254.0.0/16 (Link-local)
  if (ip.startsWith('169.254.')) return true;
  // 100.64.0.0/10 (CGNAT)
  if (/^100\.(6[4-9]|[7-9][0-9]|1[0-1][0-9]|12[0-7])\./.test(ip)) return true;

  // IPv6 Private/Reserved Ranges
  // ::1/128 (Loopback)
  if (ip === '::1') return true;
  // ::/128 (Unspecified)
  if (ip === '::') return true;
  // fc00::/7 (Unique Local)
  if (/^f[cd][0-9a-f]{2}:/i.test(ip)) return true;
  // fe80::/10 (Link-Local)
  if (/^fe[89ab][0-9a-f]{2}:/i.test(ip)) return true;

  return false;
}

interface SafeFetchOptions extends RequestInit {
  timeout?: number;
}

/**
 * Perform a fetch request with SSRF protection.
 * Resolves DNS and validates the IP before making the request.
 * 
 * Note: This implementation validates the IP *before* the request.
 * It does NOT use a custom agent to bind to the IP, so it is technically
 * vulnerable to DNS Rebinding if the attacker controls the DNS and changes
 * the IP between the check and the fetch (Time-of-Check to Time-of-Use).
 * However, this is a significant improvement over no check.
 */
export async function safeFetch(url: string, options: SafeFetchOptions = {}): Promise<Response> {
  // 1. Basic URL String Validation
  if (!validateUrl(url)) {
    throw new Error('Invalid URL format or protocol');
  }

  const parsedUrl = new URL(url);
  const hostname = parsedUrl.hostname;

  // 2. DNS Resolution
  let addresses: string[] = [];
  try {
    // resolve4 and resolve6 might throw if no records found
    // We try both or lookup which handles both (but lookup uses OS config like /etc/hosts)
    // dns.resolve is cleaner for bypassing local hosts file trickery if we want strictness,
    // but dns.lookup is what fetch uses. Let's use lookup to match fetch behavior roughly,
    // but verify the result.
    const result = await dns.lookup(hostname, { all: true });
     addresses = result.map(r => r.address);
  } catch (error) {
     throw new Error(`DNS resolution failed for ${hostname}: ${error instanceof Error ? error.message : String(error)}`);
  }

  if (addresses.length === 0) {
    throw new Error(`No IP addresses found for ${hostname}`);
  }

  // 3. IP Validation
  for (const ip of addresses) {
    if (isPrivateIP(ip)) {
      throw new Error(`Blocked connection to private IP: ${ip}`);
    }
  }

  // 4. Perform Fetch mechanism
  // We use the original URL.
  // Warning: TOCTOU race condition exists here regarding DNS rebinding.
  // A perfect fix requires a custom Agent that uses the validated IP.
  // For this implementation scope, this pre-check is accepted as "High" security improvement.
  
  const { timeout = 10000, ...fetchOptions } = options;
  
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  
  try {
     const response = await fetch(url, {
         ...fetchOptions,
         signal: controller.signal
     });
     return response;
  } finally {
     clearTimeout(id);
  }
}
