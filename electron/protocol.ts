/**
 * Protocol Handler Module
 *
 * Registers and handles the paperflow:// protocol for deep linking.
 * Allows opening files and navigating to specific features from external links.
 */

import { app, protocol } from 'electron';
import { URL } from 'url';

/**
 * Protocol scheme for deep linking
 */
export const PROTOCOL_SCHEME = 'paperflow';

/**
 * Protocol actions
 */
export type ProtocolAction = 'open' | 'view' | 'edit' | 'print' | 'merge' | 'sign';

/**
 * Protocol handler result
 */
export interface ProtocolHandlerResult {
  action: ProtocolAction;
  filePath?: string;
  page?: number;
  params?: Record<string, string>;
}

/**
 * Callback for handling protocol requests
 */
type ProtocolCallback = (result: ProtocolHandlerResult) => void;

// Store the callback and pending URLs
let protocolCallback: ProtocolCallback | null = null;
let pendingProtocolUrl: string | null = null;

/**
 * Check if the app is registered as the default protocol handler
 */
export function isDefaultProtocolClient(): boolean {
  return app.isDefaultProtocolClient(PROTOCOL_SCHEME);
}

/**
 * Register the app as the default protocol handler for paperflow://
 */
export function registerAsDefaultProtocolClient(): boolean {
  if (app.isDefaultProtocolClient(PROTOCOL_SCHEME)) {
    console.log(`[Protocol] Already registered as default handler for ${PROTOCOL_SCHEME}://`);
    return true;
  }

  const success = app.setAsDefaultProtocolClient(PROTOCOL_SCHEME);

  if (success) {
    console.log(`[Protocol] Registered as default handler for ${PROTOCOL_SCHEME}://`);
  } else {
    console.error(`[Protocol] Failed to register as default handler for ${PROTOCOL_SCHEME}://`);
  }

  return success;
}

/**
 * Unregister the app as the default protocol handler
 */
export function unregisterAsDefaultProtocolClient(): boolean {
  if (!app.isDefaultProtocolClient(PROTOCOL_SCHEME)) {
    return true;
  }

  const success = app.removeAsDefaultProtocolClient(PROTOCOL_SCHEME);

  if (success) {
    console.log(`[Protocol] Unregistered as default handler for ${PROTOCOL_SCHEME}://`);
  } else {
    console.error(`[Protocol] Failed to unregister as default handler for ${PROTOCOL_SCHEME}://`);
  }

  return success;
}

/**
 * Parse a protocol URL and extract the action and parameters
 *
 * @param url - The protocol URL (e.g., paperflow://open?file=/path/to/file.pdf)
 */
export function parseProtocolUrl(url: string): ProtocolHandlerResult | null {
  try {
    const parsed = new URL(url);

    // Validate protocol
    if (parsed.protocol !== `${PROTOCOL_SCHEME}:`) {
      console.warn(`[Protocol] Invalid protocol: ${parsed.protocol}`);
      return null;
    }

    // Extract action from pathname (removing leading slashes)
    const action = (parsed.pathname.replace(/^\/+/, '') || parsed.host || 'open') as ProtocolAction;

    // Extract file path from query parameters
    const filePath = parsed.searchParams.get('file') || undefined;
    const page = parsed.searchParams.get('page')
      ? parseInt(parsed.searchParams.get('page')!, 10)
      : undefined;

    // Collect all other params
    const params: Record<string, string> = {};
    parsed.searchParams.forEach((value, key) => {
      if (key !== 'file' && key !== 'page') {
        params[key] = value;
      }
    });

    return {
      action,
      filePath,
      page,
      params: Object.keys(params).length > 0 ? params : undefined,
    };
  } catch (error) {
    console.error(`[Protocol] Failed to parse URL: ${url}`, error);
    return null;
  }
}

/**
 * Set the callback for handling protocol requests
 */
export function setProtocolCallback(callback: ProtocolCallback): void {
  protocolCallback = callback;

  // Process any pending URL
  if (pendingProtocolUrl) {
    handleProtocolUrl(pendingProtocolUrl);
    pendingProtocolUrl = null;
  }
}

/**
 * Handle a protocol URL
 */
export function handleProtocolUrl(url: string): void {
  console.log(`[Protocol] Handling URL: ${url}`);

  const result = parseProtocolUrl(url);

  if (!result) {
    console.warn(`[Protocol] Could not parse URL: ${url}`);
    return;
  }

  if (protocolCallback) {
    protocolCallback(result);
  } else {
    // Store for later processing
    pendingProtocolUrl = url;
    console.log(`[Protocol] Callback not set, storing URL for later`);
  }
}

/**
 * Initialize protocol handling
 * Must be called before app.whenReady()
 */
export function initializeProtocol(): void {
  // Handle protocol on Windows/Linux when app is already running
  app.on('second-instance', (_event, commandLine) => {
    // Find the protocol URL in command line arguments
    const protocolUrl = commandLine.find((arg) => arg.startsWith(`${PROTOCOL_SCHEME}://`));
    if (protocolUrl) {
      handleProtocolUrl(protocolUrl);
    }
  });

  // Handle protocol on macOS
  app.on('open-url', (event, url) => {
    event.preventDefault();
    handleProtocolUrl(url);
  });

  // Handle protocol URL from startup arguments (Windows/Linux)
  const startupUrl = process.argv.find((arg) => arg.startsWith(`${PROTOCOL_SCHEME}://`));
  if (startupUrl) {
    pendingProtocolUrl = startupUrl;
  }

  console.log(`[Protocol] Protocol handler initialized`);
}

/**
 * Register custom protocol schemes
 * Must be called before app.whenReady()
 */
export function registerProtocolSchemes(): void {
  protocol.registerSchemesAsPrivileged([
    {
      scheme: PROTOCOL_SCHEME,
      privileges: {
        standard: true,
        secure: true,
        supportFetchAPI: true,
        corsEnabled: true,
      },
    },
  ]);

  console.log(`[Protocol] Registered scheme: ${PROTOCOL_SCHEME}://`);
}

/**
 * Setup protocol handlers after app is ready
 */
export function setupProtocolHandlers(): void {
  // Handle paperflow:// protocol requests
  protocol.handle(PROTOCOL_SCHEME, (request) => {
    const url = request.url;
    console.log(`[Protocol] Received request: ${url}`);

    // Handle the URL
    handleProtocolUrl(url);

    // Return an empty response (actual handling is done via callback)
    return new Response(null, { status: 204 });
  });

  console.log(`[Protocol] Protocol handlers set up`);
}

/**
 * Build a protocol URL
 *
 * @param action - The action to perform
 * @param params - URL parameters
 */
export function buildProtocolUrl(
  action: ProtocolAction,
  params?: { file?: string; page?: number; [key: string]: string | number | undefined }
): string {
  const url = new URL(`${PROTOCOL_SCHEME}://${action}`);

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        url.searchParams.set(key, String(value));
      }
    });
  }

  return url.toString();
}

/**
 * Create deep link URLs for common actions
 */
export const deepLinks = {
  /**
   * Create a URL to open a file
   */
  openFile: (filePath: string, page?: number) =>
    buildProtocolUrl('open', { file: filePath, page }),

  /**
   * Create a URL to view a file
   */
  viewFile: (filePath: string, page?: number) =>
    buildProtocolUrl('view', { file: filePath, page }),

  /**
   * Create a URL to edit a file
   */
  editFile: (filePath: string) => buildProtocolUrl('edit', { file: filePath }),

  /**
   * Create a URL to print a file
   */
  printFile: (filePath: string) => buildProtocolUrl('print', { file: filePath }),

  /**
   * Create a URL to merge files
   */
  mergeFiles: (filePaths: string[]) =>
    buildProtocolUrl('merge', { files: filePaths.join('|') }),

  /**
   * Create a URL to sign a file
   */
  signFile: (filePath: string) => buildProtocolUrl('sign', { file: filePath }),
};

/**
 * Get the pending protocol URL (if any)
 */
export function getPendingProtocolUrl(): string | null {
  return pendingProtocolUrl;
}

/**
 * Clear the pending protocol URL
 */
export function clearPendingProtocolUrl(): void {
  pendingProtocolUrl = null;
}
