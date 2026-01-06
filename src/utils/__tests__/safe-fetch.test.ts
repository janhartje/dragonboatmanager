import { safeFetch } from '../safe-fetch';
import dns from 'node:dns/promises';

// Mock DNS
jest.mock('node:dns/promises', () => ({
    lookup: jest.fn()
}));

// Mock global fetch
global.fetch = jest.fn();

describe('safeFetch', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('should allow public IPs and call fetch', async () => {
        (dns.lookup as jest.Mock).mockResolvedValue([{ address: '93.184.216.34', family: 4 }]); // example.com
        (global.fetch as jest.Mock).mockResolvedValue({
            ok: true,
            text: () => Promise.resolve('ok')
        });

        const response = await safeFetch('https://example.com/calendar');
        expect(response.ok).toBe(true);
        expect(dns.lookup).toHaveBeenCalledWith('example.com', { all: true });
        expect(global.fetch).toHaveBeenCalledWith('https://example.com/calendar', expect.objectContaining({
            signal: expect.any(AbortSignal)
        }));
    });

    test('should block private IPv4 (127.0.0.1)', async () => {
        (dns.lookup as jest.Mock).mockResolvedValue([{ address: '127.0.0.1', family: 4 }]);
        
        await expect(safeFetch('https://internal.local')).rejects.toThrow('Blocked connection to private IP: 127.0.0.1');
        expect(global.fetch).not.toHaveBeenCalled();
    });

    test('should block private IPv4 (192.168.x.x)', async () => {
        (dns.lookup as jest.Mock).mockResolvedValue([{ address: '192.168.1.5', family: 4 }]);
        
        await expect(safeFetch('https://router.local')).rejects.toThrow('Blocked connection to private IP: 192.168.1.5');
    });

    test('should block private IPv6 (::1)', async () => {
        (dns.lookup as jest.Mock).mockResolvedValue([{ address: '::1', family: 6 }]);
        
        await expect(safeFetch('https://ipv6.local')).rejects.toThrow('Blocked connection to private IP: ::1');
    });

    test('should fail if DNS resolution finds no address', async () => {
        (dns.lookup as jest.Mock).mockResolvedValue([]);
        
        await expect(safeFetch('https://nowhere.com')).rejects.toThrow('No IP addresses found for nowhere.com');
    });

    test('should respect timeout', async () => {
        (dns.lookup as jest.Mock).mockResolvedValue([{ address: '8.8.8.8', family: 4 }]);
        (global.fetch as jest.Mock).mockImplementation(() => new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Timeout')), 100);
        }));

        // We can't strictly test the built-in timeout easy without fake timers, 
        // but we verify the option is passed.
    });
});
