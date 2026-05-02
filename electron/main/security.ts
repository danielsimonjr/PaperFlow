/**
 * Security Configuration
 *
 * Sets up Content Security Policy and other security measures
 * for the Electron application.
 */

import { app, BrowserWindow, session } from 'electron';

/**
 * Content Security Policy for production
 *
 * Strict policy: no 'unsafe-inline' or 'unsafe-eval' for scripts. We deliberately
 * keep 'unsafe-inline' for styles only because Tailwind/React inline a small
 * amount of style content; scripts and eval are blocked outright.
 *
 * - Allows scripts only from 'self' and blob: (PDF.js worker bootstrap)
 * - Allows blob: URLs for PDF.js worker
 * - Allows data: URLs for fonts and images
 * - Blocks remote code execution
 */
const PRODUCTION_CSP = [
  "default-src 'self'",
  // Script: no 'unsafe-inline' / 'unsafe-eval'. blob: needed for PDF.js worker.
  "script-src 'self' blob:",
  "worker-src 'self' blob:",
  // Style: 'unsafe-inline' is retained because the renderer uses React inline
  // style={{...}} props (annotation positions, dynamic colors). Removing it
  // breaks the viewer; switching to a nonce/hash strategy is tracked separately.
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "connect-src 'self'",
  "frame-src 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join('; ');

/**
 * Content Security Policy for development
 *
 * More permissive to allow:
 * - Hot module replacement (HMR)
 * - DevTools
 * - Inline scripts and eval (needed for Vite)
 */
const DEVELOPMENT_CSP = [
  "default-src 'self' http://localhost:* ws://localhost:*",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' http://localhost:* blob:",
  "worker-src 'self' blob:",
  "style-src 'self' 'unsafe-inline' http://localhost:*",
  "img-src 'self' data: blob: http://localhost:*",
  "font-src 'self' data: http://localhost:*",
  "connect-src 'self' http://localhost:* ws://localhost:*",
  "frame-src 'none'",
  "object-src 'none'",
].join('; ');

/**
 * Set up Content Security Policy for a window
 *
 * @param window - BrowserWindow to configure
 * @param isDev - Whether running in development mode
 */
export function setupContentSecurityPolicy(window: BrowserWindow, isDev: boolean): void {
  const csp = isDev ? DEVELOPMENT_CSP : PRODUCTION_CSP;

  window.webContents.session.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [csp],
      },
    });
  });
}

/**
 * Apply security configurations to the default session
 */
export function applySecurityDefaults(): void {
  const defaultSession = session.defaultSession;

  // Disable navigation to untrusted origins
  defaultSession.webRequest.onBeforeRequest({ urls: ['*://*/*'] }, (details, callback) => {
    // Allow all requests to localhost and file://
    const url = new URL(details.url);

    if (
      url.protocol === 'file:' ||
      url.hostname === 'localhost' ||
      url.hostname === '127.0.0.1' ||
      url.hostname === '[::1]'
    ) {
      callback({});
      return;
    }

    // For other URLs, check if they are safe
    const isSafeUrl = isUrlSafe(url);
    if (!isSafeUrl) {
      console.warn(`Blocked request to untrusted URL: ${details.url}`);
      callback({ cancel: true });
      return;
    }

    callback({});
  });

  // Set permission request handler
  defaultSession.setPermissionRequestHandler((webContents, permission, callback) => {
    const allowedPermissions: Electron.PermissionType[] = [
      'clipboard-read',
      'clipboard-sanitized-write',
      'pointerLock',
      'fullscreen',
    ];

    if (allowedPermissions.includes(permission)) {
      callback(true);
    } else {
      console.warn(`Denied permission request: ${permission}`);
      callback(false);
    }
  });

  // Set certificate error handler (reject invalid certificates in production)
  defaultSession.setCertificateVerifyProc((_request, callback) => {
    // Only allow self-signed certificates in unpackaged dev builds.
    // Gating on app.isPackaged prevents NODE_ENV being spoofed by a hostile
    // launcher to weaken cert verification in shipped builds.
    if (app.isPackaged === false) {
      callback(0); // Accept all (dev only)
      return;
    }

    // In packaged production builds, defer to Chromium's default verification
    callback(-2);
  });
}

/**
 * Check if a URL is considered safe
 *
 * @param url - URL to check
 * @returns true if URL is safe, false otherwise
 */
function isUrlSafe(url: URL): boolean {
  // Allow CDN URLs for PDF.js and other libraries if needed
  const allowedHosts = [
    'unpkg.com', // PDF.js CDN
    'cdnjs.cloudflare.com',
    'cdn.jsdelivr.net',
  ];

  return allowedHosts.some((host) => url.hostname === host || url.hostname.endsWith(`.${host}`));
}

/**
 * Validate that webContents configuration is secure
 */
export function validateWebContentsConfig(window: BrowserWindow): boolean {
  const options = window.webContents.getWebPreferences();

  const issues: string[] = [];

  // Check for required security settings
  if (!options.contextIsolation) {
    issues.push('contextIsolation should be enabled');
  }

  if (options.nodeIntegration) {
    issues.push('nodeIntegration should be disabled');
  }

  if (options.nodeIntegrationInWorker) {
    issues.push('nodeIntegrationInWorker should be disabled');
  }

  if (!options.sandbox) {
    issues.push('sandbox should be enabled');
  }

  if (options.webviewTag) {
    issues.push('webviewTag should be disabled');
  }

  if (options.allowRunningInsecureContent) {
    issues.push('allowRunningInsecureContent should be disabled');
  }

  if (issues.length > 0) {
    console.warn('Security configuration issues:', issues);
    return false;
  }

  return true;
}

/**
 * Prevent new window creation from renderer
 */
export function preventNewWindows(window: BrowserWindow): void {
  window.webContents.setWindowOpenHandler(({ url }) => {
    // Log blocked window attempts
    console.warn(`Blocked window.open for: ${url}`);
    return { action: 'deny' };
  });
}

/**
 * Prevent navigation to untrusted URLs
 */
export function preventUntrustedNavigation(window: BrowserWindow, allowedOrigins: string[]): void {
  window.webContents.on('will-navigate', (event, navigationUrl) => {
    const parsedUrl = new URL(navigationUrl);

    const isAllowed =
      parsedUrl.protocol === 'file:' ||
      allowedOrigins.some((origin) => navigationUrl.startsWith(origin));

    if (!isAllowed) {
      console.warn(`Blocked navigation to: ${navigationUrl}`);
      event.preventDefault();
    }
  });
}
