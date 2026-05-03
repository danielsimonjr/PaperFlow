/**
 * Signature Verifier Module (Sprint 21) — DEFERRED / NOT IMPLEMENTED
 *
 * Real RSA signature verification for license data is intentionally NOT
 * implemented in this branch. It would require a license server (or at minimum
 * an offline signing pipeline with a real, non-placeholder public key) — both
 * of which are postponed indefinitely.
 *
 * Earlier revisions of this file shipped a Web Crypto verifier wired to a
 * placeholder PEM, which was misleading: the verifier was never imported by
 * any production code path, and the embedded "public key" was not the
 * counterpart to any real signing key. The dead code has been removed so
 * future readers do not mistake the scaffolding for a working pipeline.
 *
 * If/when a license server is introduced, the signature-verification surface
 * should live behind a clear server-online check; offline gating remains
 * limited to the CRC-style checksum in licenseValidator.ts (anti-CASUAL
 * piracy only).
 *
 * See: docs/architecture/license-anti-piracy-only.md
 */

/**
 * Placeholder export to make any accidental call site fail loudly instead of
 * silently returning a verdict. Importers should not depend on this surface.
 */
export function verifySignature(): never {
  throw new Error(
    'Real signature verification requires a license server; not implemented. ' +
      'See docs/architecture/license-anti-piracy-only.md for context.'
  );
}
