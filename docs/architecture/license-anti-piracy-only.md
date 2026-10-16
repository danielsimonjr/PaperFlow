# License System — Anti-Casual-Piracy Only

The client license layer is anti-casual-piracy only. The layer does not claim a security guarantee that the layer does not deliver.

## Context

The client license layer runs in the copy of the application that the user installs. Anyone with that copy can read the layer's source. The layer contains no key material. A check name that suggests a cryptographic check would overstate what the layer does.

## Decision

The client license layer does three things:

1. It checks the format of a license key. A valid key has 25 characters from the license character set, after dashes and spaces are removed. Source: `isValidFormat()` in `src/lib/license/licenseFormat.ts`.
2. It detects accidental corruption, such as typing errors, OCR errors and partial copy and paste. It uses a checksum for this. Source: `calculateChecksum()` and `verifyChecksum()` in `src/lib/license/licenseFormat.ts`.
3. It gives the expiry status, the edition and the feature flags to the UI. Source: `validateLicenseKey()`, `isFeatureAvailable()` and `getExpiryWarning()` in `src/lib/license/licenseValidator.ts`. The store `src/stores/licenseStore.ts` calls these functions.

The layer does not do these things:

- It does not verify cryptographic signatures.
- It does not protect against an attacker who reads the source.
- It does not bind features to a user identity in a way that cannot be bypassed.

Real cryptographic verification needs a license server, or an offline signing pipeline with a real signing key and tamper-resistant client storage. The repository has neither.

## Checksum

The function `calculateChecksum()` in `src/lib/license/licenseFormat.ts` works as follows:

1. It starts with a hash value of 0.
2. For each UTF-16 code unit, `calculateChecksum()` sets the hash to 31 times the hash plus the code unit. The function keeps the hash to 32 bits.
3. It takes the absolute value of the hash.
4. It keeps the low 25 bits of that value. It writes them as 5 characters from the alphabet `ABCDEFGHJKLMNPQRSTUVWXYZ23456789`.

Anyone who knows the algorithm can compute a valid checksum. The checksum finds accidental errors. The checksum does not stop deliberate changes.

## Second Checksum

The file `src/lib/license/licenseValidator.ts` contains a second function named `calculateChecksum()`. `calculateChecksum()` is not exported. `calculateChecksum()` returns 4 base-36 characters. The exported `verifyChecksum()` in `src/lib/license/licenseValidator.ts` uses `calculateChecksum()`. No production code calls `verifyChecksum()`.

Production key validation does not use this second checksum. `validateLicenseKey()` calls `isValidFormat()` in `src/lib/license/licenseFormat.ts`.

## Consequences

- `src/lib/license/signatureVerifier.ts` exports `verifySignature()`. That function throws on every call. A caller fails loudly.
- The code does not define a public key constant. A search of `src/`, `electron/` and `tests/` finds no `PUBLIC_KEY` and no `EMBEDDED_PUBLIC_KEY`.
- The test at `tests/unit/lib/license/licenseValidator.test.ts`, lines 197 to 202, checks that `verifyChecksum` exists and that `verifySignature` does not exist on the module.
- Gate paid features that need real protection on a server. The client layer does not provide that protection. Treat each client-side feature as un-gated against a determined attacker.

## Server Code

The repository does not contain a license server.

The file `src/lib/license/licenseBinding.ts` contains the class `ActivationManager`. Its method `activateOnline()` sends a request to `/api/v1/activate` on the configured server. Its method `deactivate()` sends a request to `/api/v1/deactivate`. No code outside `licenseBinding.ts` imports this class.

<!-- repo-map:no-verification -->
