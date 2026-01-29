/**
 * Sentry Error Monitoring Integration
 *
 * Provides error tracking and performance monitoring for PaperFlow.
 * Configured to respect user privacy - no PII is collected.
 *
 * Setup:
 * 1. Create a Sentry project at https://sentry.io
 * 2. Set VITE_SENTRY_DSN environment variable
 * 3. Call initSentry() in main.tsx
 */

// Sentry SDK types (matches @sentry/browser)
interface SentryUser {
  id?: string;
  email?: string;
  ip_address?: string;
  username?: string;
}

interface SentryStackFrame {
  filename?: string;
  function?: string;
  lineno?: number;
  colno?: number;
}

interface SentryStackTrace {
  frames?: SentryStackFrame[];
}

interface SentryException {
  value?: string;
  type?: string;
  stacktrace?: SentryStackTrace;
}

interface SentryEvent {
  user?: SentryUser;
  exception?: {
    values?: SentryException[];
  };
}

interface SentryBreadcrumb {
  category?: string;
  message?: string;
  level?: 'debug' | 'info' | 'warning' | 'error';
  data?: Record<string, unknown>;
}

interface SentrySDK {
  init: (config: Record<string, unknown>) => void;
  captureException: (
    error: Error,
    context?: { extra?: Record<string, unknown> }
  ) => void;
  captureMessage: (
    message: string,
    level?: 'debug' | 'info' | 'warning' | 'error'
  ) => void;
  setUser: (user: SentryUser | null) => void;
  setTag: (key: string, value: string) => void;
  addBreadcrumb: (breadcrumb: SentryBreadcrumb) => void;
}

// Sentry instance (lazy loaded)
let sentryInstance: SentrySDK | null = null;

/**
 * Check if Sentry is configured
 */
export function isSentryEnabled(): boolean {
  return Boolean(import.meta.env.VITE_SENTRY_DSN);
}

/**
 * Initialize Sentry error tracking
 * Should be called once at application startup
 */
export async function initSentry(): Promise<void> {
  const dsn = import.meta.env.VITE_SENTRY_DSN;

  if (!dsn) {
    if (import.meta.env.DEV) {
      console.log('[Sentry] Disabled - no DSN configured');
    }
    return;
  }

  try {
    // Dynamically import Sentry to keep bundle size small when not used
    const Sentry = (await import('@sentry/browser')) as unknown as SentrySDK;
    sentryInstance = Sentry;

    Sentry.init({
      dsn,
      environment: import.meta.env.MODE,
      release: import.meta.env.VITE_APP_VERSION || '1.0.0',
      // Performance monitoring - sample 10% of transactions
      tracesSampleRate: 0.1,
      // Session replay - disabled by default for privacy
      replaysSessionSampleRate: 0,
      // Capture replays on error - 10% sample
      replaysOnErrorSampleRate: 0.1,
      // Filter out sensitive data
      beforeSend(event: SentryEvent) {
        // Remove any potential PII from error reports
        if (event.user) {
          delete event.user.email;
          delete event.user.ip_address;
          delete event.user.username;
        }

        // Remove file paths that might contain usernames
        if (event.exception?.values) {
          event.exception.values.forEach((exception: SentryException) => {
            if (exception.stacktrace?.frames) {
              exception.stacktrace.frames.forEach(
                (frame: SentryStackFrame) => {
                  if (frame.filename) {
                    // Remove local file paths
                    frame.filename = frame.filename.replace(
                      /\/Users\/[^/]+\//g,
                      '/user/'
                    );
                    frame.filename = frame.filename.replace(
                      /C:\\Users\\[^\\]+\\/g,
                      'C:\\user\\'
                    );
                  }
                }
              );
            }
          });
        }

        return event;
      },
      // Ignore common non-actionable errors
      ignoreErrors: [
        // Browser extensions
        /extensions\//i,
        /^chrome-extension:\/\//,
        /^moz-extension:\/\//,
        // Network errors
        'Network request failed',
        'Failed to fetch',
        'Load failed',
        // User-initiated actions
        'ResizeObserver loop',
        // PDF.js expected errors
        'Invalid PDF structure',
      ],
    });

    if (import.meta.env.DEV) {
      console.log('[Sentry] Initialized successfully');
    }
  } catch (error) {
    console.error('[Sentry] Failed to initialize:', error);
  }
}

/**
 * Capture an error/exception
 */
export function captureError(
  error: Error,
  context?: Record<string, unknown>
): void {
  if (!sentryInstance) {
    console.error('[Error]', error, context);
    return;
  }

  sentryInstance.captureException(error, {
    extra: context,
  });
}

/**
 * Capture a message manually
 */
export function captureMessage(
  message: string,
  level: 'debug' | 'info' | 'warning' | 'error' = 'info'
): void {
  if (!sentryInstance) {
    console.log(`[${level.toUpperCase()}]`, message);
    return;
  }

  sentryInstance.captureMessage(message, level);
}

/**
 * Add a breadcrumb for debugging
 */
export function addBreadcrumb(
  category: string,
  message: string,
  data?: Record<string, unknown>,
  level: 'debug' | 'info' | 'warning' | 'error' = 'info'
): void {
  if (!sentryInstance) {
    return;
  }

  sentryInstance.addBreadcrumb({
    category,
    message,
    data,
    level,
  });
}

/**
 * Set user context (anonymous ID only, no PII)
 */
export function setUser(anonymousId: string): void {
  if (!sentryInstance) {
    return;
  }

  sentryInstance.setUser({
    id: anonymousId,
  });
}

/**
 * Clear user context
 */
export function clearUser(): void {
  if (!sentryInstance) {
    return;
  }

  sentryInstance.setUser(null);
}

/**
 * Set a tag for filtering errors
 */
export function setTag(key: string, value: string): void {
  if (!sentryInstance) {
    return;
  }

  sentryInstance.setTag(key, value);
}
