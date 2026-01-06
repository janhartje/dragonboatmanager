
/**
 * Strict URL validation to prevent SSRF.
 * Allows only https protocol.
 * Blocks private IP ranges, localhost, and loopback addresses.
 */
export function validateUrl(url: string): boolean {
  try {
    const parsed = new URL(url);

    // 1. Protocol check - STRICT HTTPS
    if (parsed.protocol !== 'https:') {
      return false;
    }

    const hostname = parsed.hostname;

    // 2. Localhost & Loopback check
    if (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === '[::1]' ||
      hostname === '0.0.0.0' ||
      hostname === '[::]'
    ) {
      return false;
    }

    // 3. Private IP check (IPv4)
    // 10.0.0.0/8
    if (hostname.startsWith('10.')) return false;
    
    // 192.168.0.0/16
    if (hostname.startsWith('192.168.')) return false;
    
    // 172.16.0.0/12 (172.16.x.x - 172.31.x.x)
    if (hostname.startsWith('172.')) {
      const parts = hostname.split('.');
      if (parts.length === 4) {
        const secondOctet = parseInt(parts[1], 10);
        if (secondOctet >= 16 && secondOctet <= 31) return false;
      }
    }
    
    // 100.64.0.0/10 (CGNAT)
    if (hostname.startsWith('100.')) {
         const parts = hostname.split('.');
         if (parts.length === 4) {
            const secondOctet = parseInt(parts[1], 10);
            if (secondOctet >= 64 && secondOctet <= 127) return false;
         }
    }
    
    // 169.254.0.0/16 (Link-local)
     if (hostname.startsWith('169.254.')) return false;

    return true;
  } catch {
    return false;
  }
}
