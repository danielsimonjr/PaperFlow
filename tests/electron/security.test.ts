/**
 * Security configuration tests
 *
 * Covers CSP hardening (no script-src unsafe-inline/unsafe-eval in production)
 * and certificate verification gating on app.isPackaged (not NODE_ENV).
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mockApp, mockBrowserWindow, mockSession, resetMocks } from './setup';

// Re-import the module under test fresh per describe block.
async function importSecurity() {
  vi.resetModules();
  return import('../../electron/main/security');
}

describe('Production CSP', () => {
  let capturedHeaders: string | undefined;
  let capturedDevHeaders: string | undefined;

  beforeEach(async () => {
    resetMocks();
    capturedHeaders = undefined;
    capturedDevHeaders = undefined;

    const window = new mockBrowserWindow();
    window.webContents.session.webRequest.onHeadersReceived = vi.fn(
      (handler: (details: { responseHeaders: Record<string, string[]> }, cb: (r: { responseHeaders: Record<string, string[] | string> }) => void) => void) => {
        handler({ responseHeaders: {} }, (result) => {
          capturedHeaders = (result.responseHeaders['Content-Security-Policy'] as string[])[0];
        });
      }
    );

    const devWindow = new mockBrowserWindow();
    devWindow.webContents.session.webRequest.onHeadersReceived = vi.fn(
      (handler: (details: { responseHeaders: Record<string, string[]> }, cb: (r: { responseHeaders: Record<string, string[] | string> }) => void) => void) => {
        handler({ responseHeaders: {} }, (result) => {
          capturedDevHeaders = (result.responseHeaders['Content-Security-Policy'] as string[])[0];
        });
      }
    );

    const { setupContentSecurityPolicy } = await importSecurity();
    setupContentSecurityPolicy(window as unknown as Electron.BrowserWindow, false);
    setupContentSecurityPolicy(devWindow as unknown as Electron.BrowserWindow, true);
  });

  it('production script-src does not allow unsafe-inline', () => {
    expect(capturedHeaders).toBeDefined();
    const scriptDirective = capturedHeaders!.split(';').find((d) => d.trim().startsWith('script-src'));
    expect(scriptDirective).toBeDefined();
    expect(scriptDirective).not.toMatch(/'unsafe-inline'/);
  });

  it('production script-src does not allow unsafe-eval', () => {
    const scriptDirective = capturedHeaders!.split(';').find((d) => d.trim().startsWith('script-src'));
    expect(scriptDirective).not.toMatch(/'unsafe-eval'/);
  });

  it('production CSP still includes object-src none and frame-src none', () => {
    expect(capturedHeaders).toMatch(/object-src 'none'/);
    expect(capturedHeaders).toMatch(/frame-src 'none'/);
  });

  it('development CSP is permissive (smoke check that dev/prod differ)', () => {
    expect(capturedDevHeaders).toMatch(/'unsafe-eval'/);
    expect(capturedHeaders).not.toMatch(/'unsafe-eval'/);
  });
});

describe('Certificate verification gating', () => {
  beforeEach(() => {
    resetMocks();
  });

  it('accepts all certs when app.isPackaged is false (dev)', async () => {
    mockApp.isPackaged = false;
    let capturedCallback: ((code: number) => void) | undefined;
    mockSession.defaultSession.setCertificateVerifyProc = vi.fn(
      (proc: (req: unknown, cb: (code: number) => void) => void) => {
        proc({}, (code: number) => {
          capturedCallback = () => undefined;
          // Capture what the proc passed to callback
          (capturedCallback as unknown as { code: number }).code = code;
        });
      }
    );

    const { applySecurityDefaults } = await importSecurity();
    applySecurityDefaults();

    expect((capturedCallback as unknown as { code: number }).code).toBe(0);
  });

  it('uses Chromium default verification when app.isPackaged is true (prod)', async () => {
    mockApp.isPackaged = true;
    let capturedCode: number | undefined;
    mockSession.defaultSession.setCertificateVerifyProc = vi.fn(
      (proc: (req: unknown, cb: (code: number) => void) => void) => {
        proc({}, (code: number) => {
          capturedCode = code;
        });
      }
    );

    const { applySecurityDefaults } = await importSecurity();
    applySecurityDefaults();

    expect(capturedCode).toBe(-2);
  });

  it('does NOT trust NODE_ENV for certificate gating', async () => {
    // Even with NODE_ENV=development, packaged builds must use default verification.
    const originalEnv = process.env['NODE_ENV'];
    process.env['NODE_ENV'] = 'development';
    mockApp.isPackaged = true;

    let capturedCode: number | undefined;
    mockSession.defaultSession.setCertificateVerifyProc = vi.fn(
      (proc: (req: unknown, cb: (code: number) => void) => void) => {
        proc({}, (code: number) => {
          capturedCode = code;
        });
      }
    );

    const { applySecurityDefaults } = await importSecurity();
    applySecurityDefaults();

    expect(capturedCode).toBe(-2);
    process.env['NODE_ENV'] = originalEnv;
  });
});
