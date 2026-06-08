/**
 * Tests for the SSRF guard helpers (security finding 2026-05-01 #4).
 *
 * Covered:
 *   - isPrivateOrLoopbackIP correctly classifies IPv4 + IPv6 reserved blocks
 *   - assertSafeURL refuses non-https URLs by default
 *   - assertSafeURL refuses hostnames that resolve to private/loopback IPs
 *   - assertSafeURL refuses to disable SSL validation on a public URL
 *   - the allowInsecureURL escape hatch works for explicit test/loopback use
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { isPrivateOrLoopbackIP, assertSafeURL } from '@lib/enterprise/ssrfGuard';

const dnsLookup = vi.fn();
vi.mock('dns/promises', () => ({
  lookup: (host: string, opts: { all: true }) => dnsLookup(host, opts),
}));

describe('isPrivateOrLoopbackIP', () => {
  it.each([
    '127.0.0.1',
    '127.5.6.7',
    '10.0.0.1',
    '169.254.169.254', // AWS / GCP / Azure metadata
    '192.168.1.1',
    '172.16.0.1',
    '172.31.255.255',
    '0.0.0.0',
    '::1',
    'fc00::1',
    'fd12:3456::1',
    'fe80::1',
    '::ffff:127.0.0.1',
  ])('flags %s as private/loopback/link-local', (ip) => {
    expect(isPrivateOrLoopbackIP(ip)).toBe(true);
  });

  it.each([
    '8.8.8.8',
    '1.1.1.1',
    '172.32.0.1', // outside RFC1918 /12
    '169.253.1.1', // outside link-local /16
    '2606:4700:4700::1111', // public IPv6 (Cloudflare)
  ])('does NOT flag %s', (ip) => {
    expect(isPrivateOrLoopbackIP(ip)).toBe(false);
  });
});

describe('assertSafeURL', () => {
  beforeEach(() => {
    dnsLookup.mockReset();
  });

  it('refuses http:// URLs by default', async () => {
    await expect(assertSafeURL('http://config.example.com/x.json')).rejects.toThrow(
      /non-https|use https/i,
    );
  });

  it('refuses URLs that resolve to RFC1918 private IPs', async () => {
    dnsLookup.mockResolvedValue([{ address: '10.0.0.5' }]);
    await expect(
      assertSafeURL('https://internal.example.com/x.json'),
    ).rejects.toThrow(/private|loopback/i);
  });

  it('refuses URLs that resolve to the cloud metadata IP (169.254.169.254)', async () => {
    dnsLookup.mockResolvedValue([{ address: '169.254.169.254' }]);
    await expect(
      assertSafeURL('https://attacker.example.com/x.json'),
    ).rejects.toThrow(/169\.254\.169\.254|private|loopback/i);
  });

  it('refuses URLs that resolve to IPv6 loopback', async () => {
    dnsLookup.mockResolvedValue([{ address: '::1' }]);
    await expect(
      assertSafeURL('https://internal.example.com/x.json'),
    ).rejects.toThrow();
  });

  it('refuses an IP literal in the URL when it is private', async () => {
    await expect(assertSafeURL('https://10.0.0.1/x.json')).rejects.toThrow();
  });

  it('refuses an IP literal IPv6 loopback', async () => {
    await expect(assertSafeURL('https://[::1]/x.json')).rejects.toThrow();
  });

  it('allows public IP literals without DNS lookup', async () => {
    await expect(assertSafeURL('https://1.1.1.1/x.json')).resolves.toBeUndefined();
    expect(dnsLookup).not.toHaveBeenCalled();
  });

  it('refuses to disable validateSSL on a public URL', async () => {
    await expect(
      assertSafeURL('https://config.example.com/x.json', { validateSSL: false }),
    ).rejects.toThrow(/SSL|allowInsecureURL/i);
  });

  it('allows the happy path with a public-resolving hostname', async () => {
    dnsLookup.mockResolvedValue([{ address: '93.184.216.34' }]); // example.com
    await expect(
      assertSafeURL('https://config.example.com/x.json'),
    ).resolves.toBeUndefined();
  });

  it('refuses if any resolved address is private (multi-record DNS)', async () => {
    dnsLookup.mockResolvedValue([
      { address: '8.8.8.8' },
      { address: '10.0.0.5' },
    ]);
    await expect(
      assertSafeURL('https://config.example.com/x.json'),
    ).rejects.toThrow(/private|loopback/i);
  });

  it('allowInsecureURL bypass works for explicit loopback/localhost use', async () => {
    await expect(
      assertSafeURL('http://localhost:8080/x.json', { allowInsecureURL: true }),
    ).resolves.toBeUndefined();
  });

  it('throws on malformed URL', async () => {
    await expect(assertSafeURL('not a url')).rejects.toThrow(/Invalid URL/);
  });
});
