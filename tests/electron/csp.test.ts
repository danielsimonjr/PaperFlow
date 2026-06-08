/**
 * Content Security Policy Tests
 *
 * Pins the current state of PRODUCTION_CSP / DEVELOPMENT_CSP so that any
 * change is intentional. Also tracks the long-running goal of dropping
 * `'unsafe-inline'` from `style-src` (see CHANGELOG: Wave A repair).
 */

import { describe, it, expect } from 'vitest';
import './setup'; // ensure electron mocks are registered before importing security
import { PRODUCTION_CSP, DEVELOPMENT_CSP } from '../../electron/main/security';

describe('Content Security Policy', () => {
  describe('PRODUCTION_CSP', () => {
    it('uses self for default-src', () => {
      expect(PRODUCTION_CSP).toMatch(/default-src 'self'/);
    });

    it('locks script-src to self + blob: (no unsafe-inline, no unsafe-eval)', () => {
      expect(PRODUCTION_CSP).toMatch(/script-src 'self' blob:/);
      expect(PRODUCTION_CSP).not.toMatch(/script-src[^;]*'unsafe-inline'/);
      expect(PRODUCTION_CSP).not.toMatch(/script-src[^;]*'unsafe-eval'/);
    });

    it('blocks frames and objects', () => {
      expect(PRODUCTION_CSP).toMatch(/frame-src 'none'/);
      expect(PRODUCTION_CSP).toMatch(/object-src 'none'/);
    });

    it('restricts connect-src to self', () => {
      expect(PRODUCTION_CSP).toMatch(/connect-src 'self'/);
    });

    // Tracks the React inline-style migration (security/style-src-nonce-migration).
    // Currently asserts the *transitional* state: unsafe-inline still required
    // because ~157 React `style={{...}}` call sites have not yet been migrated
    // to CSS modules / CSS variables. When migration completes, flip this test
    // to assert `style-src 'self'` (no unsafe-inline).
    it("style-src is 'self' plus the transitional 'unsafe-inline' (TODO: drop unsafe-inline)", () => {
      expect(PRODUCTION_CSP).toMatch(/style-src 'self' 'unsafe-inline'/);
    });

    it.todo("style-src should be 'self' only — drop 'unsafe-inline' once all React inline styles are migrated to CSS modules / CSS vars");
  });

  describe('DEVELOPMENT_CSP', () => {
    it('allows localhost for HMR', () => {
      expect(DEVELOPMENT_CSP).toMatch(/http:\/\/localhost:\*/);
      expect(DEVELOPMENT_CSP).toMatch(/ws:\/\/localhost:\*/);
    });

    it('allows unsafe-eval for Vite dev', () => {
      expect(DEVELOPMENT_CSP).toMatch(/'unsafe-eval'/);
    });
  });
});
