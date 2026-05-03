# License System — Anti-Casual-Piracy Only

**Status:** Accepted
**Date:** 2026-05-01
**Decision driver:** Stop the codebase from claiming a security guarantee it
does not deliver.

## Context

PaperFlow ships with a client-side license module (`src/lib/license/`). Earlier
revisions of that module exposed a function called `verifySignature()` whose
documentation suggested it performed an RSA signature check against an
embedded public key. In reality:

- The "public key" was a placeholder PEM, not the counterpart to any real
  signing key in our infrastructure.
- The function called a 32-bit folding hash (`(hash << 5) - hash + char`),
  truncated to 4 base-36 characters, and compared that to the input.
- A separate, more-realistic Web Crypto verifier in `signatureVerifier.ts`
  was wired to a *different* placeholder PEM and was never imported by any
  production call site.

Net effect: the surface area looked cryptographic. The implementation was a
typo-detector. Anyone reading the code might reasonably assume paid features
were protected by a real signature pipeline. They were not.

## Decision

**This client license layer is anti-casual-piracy only.** It exists to:

1. Validate license-key *format* (length, character set).
2. Catch *accidental* corruption — typos, OCR errors, partial copy/paste —
   via a CRC-style integrity hash.
3. Surface expiry status, edition, and feature flags to the UI.

It does **not** and will **not** in this branch:

- Verify cryptographic signatures.
- Defend against an attacker who reads the source.
- Bind features to identity in a non-bypassable way.

Real cryptographic verification requires a license server (or an offline
signing pipeline with a non-placeholder key plus tamper-resistant client
storage). Both are **intentionally deferred** — see "Server Postponement"
below.

## Consequences

- `verifySignature()` is renamed to `verifyChecksum()` so the name matches
  what it does (commit: `refactor(license): stop claiming cryptographic
  verification we don't perform`).
- `signatureVerifier.ts` retains a single `verifySignature()` stub that
  throws, so any future caller fails loudly instead of being silently
  green-lit by placeholder code.
- The `EMBEDDED_PUBLIC_KEY` and `PUBLIC_KEY` constants are removed.
- Paid features that warrant real protection MUST be gated server-side when
  a server exists. Until then, treat all client-visible features as
  effectively un-gated against a determined attacker.

## Server Postponement

A license server is the natural home for:

- RSA-signed license blobs (server signs, client verifies).
- Online activation, seat counting, transfer, revocation.
- Heartbeat / phone-home checks gated by `app.isPackaged`.

Shipping that server is out of scope for the current security pass. This
branch deliberately ships **without** server-mode code, server-side gating
stubs, or "future server" placeholders to avoid accreting half-implemented
abstractions that are themselves a future security/maintainability liability.

When the server lands, this ADR should be superseded by one describing the
real verification pipeline and the hand-off between offline checksum and
online signature checks.
