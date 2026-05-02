/**
 * SSRF guard utilities for remote-config and any other user-supplied URL fetch.
 *
 * Security finding 2026-05-01 #4. The guard rejects:
 *   - non-https URLs (unless `allowInsecureURL` is opted-in for tests)
 *   - hostnames that resolve to private / loopback / link-local IPs
 *
 * This file deliberately has no third-party imports so it can be mocked
 * cleanly by tests and reused by any caller that needs the same checks.
 */

/**
 * Returns true if the IP address falls in a private, loopback, or
 * link-local block that should never be the target of a user-supplied URL.
 */
export function isPrivateOrLoopbackIP(address: string): boolean {
  if (!address) return false;
  const lower = address.toLowerCase();

  // IPv6
  if (lower.includes(':')) {
    if (lower === '::1' || lower === '::') return true;
    // IPv4-mapped IPv6 (::ffff:a.b.c.d) — strip and check IPv4 octets
    const mapped = lower.match(/^::ffff:([0-9.]+)$/);
    if (mapped && mapped[1]) return isPrivateOrLoopbackIP(mapped[1]);
    // fc00::/7 (unique local) - first byte 0xfc or 0xfd
    if (/^f[cd][0-9a-f]{2}:/.test(lower)) return true;
    // fe80::/10 (link-local)
    if (/^fe[89ab][0-9a-f]:/.test(lower)) return true;
    return false;
  }

  // IPv4
  const parts = lower.split('.').map((p) => parseInt(p, 10));
  if (parts.length !== 4 || parts.some((p) => Number.isNaN(p) || p < 0 || p > 255)) {
    return false;
  }
  const a = parts[0]!;
  const b = parts[1]!;
  if (a === 10) return true; // 10.0.0.0/8
  if (a === 127) return true; // 127.0.0.0/8 loopback
  if (a === 169 && b === 254) return true; // 169.254.0.0/16 link-local (incl. cloud metadata)
  if (a === 172 && b >= 16 && b <= 31) return true; // 172.16.0.0/12
  if (a === 192 && b === 168) return true; // 192.168.0.0/16
  if (a === 0) return true; // 0.0.0.0/8
  return false;
}

export interface URLValidationOptions {
  /** Allow http:// and private hosts (test/loopback only). Default false. */
  allowInsecureURL?: boolean;
  /** SSL validation flag from caller; refused unless allowInsecureURL too. */
  validateSSL?: boolean;
}

/**
 * Validate a URL for SSRF safety. Throws on rejection.
 *
 * Resolves the hostname via DNS and refuses any address that lands in a
 * private / loopback / link-local block. Pass `allowInsecureURL: true`
 * (with `validateSSL: false` if needed) only for explicit test/loopback use.
 */
export async function assertSafeURL(
  url: string,
  options: URLValidationOptions = {},
): Promise<void> {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error(`Invalid URL: ${url}`);
  }

  if (options.validateSSL === false && !options.allowInsecureURL) {
    throw new Error(
      'Refusing to disable SSL validation for a public URL. ' +
        'Set allowInsecureURL: true together with validateSSL: false for test/loopback hosts only.',
    );
  }

  if (options.allowInsecureURL) {
    return; // explicit opt-out for tests / loopback
  }

  if (parsed.protocol !== 'https:') {
    throw new Error(
      `Refusing non-https URL for remote config: ${parsed.protocol} (use https://)`,
    );
  }

  const hostname = parsed.hostname.replace(/^\[|\]$/g, '');

  // Direct IP literal — validate without DNS.
  const isIPLiteral = /^[0-9.]+$/.test(hostname) || hostname.includes(':');
  if (isIPLiteral) {
    if (isPrivateOrLoopbackIP(hostname)) {
      throw new Error(`Refusing remote-config request to private/loopback IP: ${hostname}`);
    }
    return;
  }

  // Resolve via DNS. Dynamic import keeps this file safe to load in any env.
  let lookup: (host: string, opts: { all: true }) => Promise<{ address: string }[]>;
  try {
    const dns = await import('dns/promises');
    lookup = dns.lookup as unknown as typeof lookup;
  } catch {
    throw new Error(`DNS resolution unavailable; refusing remote-config request to ${hostname}`);
  }

  let addresses: { address: string }[];
  try {
    addresses = await lookup(hostname, { all: true });
  } catch (err) {
    throw new Error(
      `DNS lookup failed for ${hostname}: ${err instanceof Error ? err.message : String(err)}`,
    );
  }

  for (const { address } of addresses) {
    if (isPrivateOrLoopbackIP(address)) {
      throw new Error(
        `Refusing remote-config request: ${hostname} resolves to private/loopback IP ${address}`,
      );
    }
  }
}
