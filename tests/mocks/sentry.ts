/**
 * Mock @sentry/browser module for testing
 * This is used when the actual package is not installed
 */

export function init(_options: Record<string, unknown>): void {
  // Mock implementation - does nothing
}

export function captureException(
  _error: Error,
  _context?: { extra?: Record<string, unknown> }
): void {
  // Mock implementation - does nothing
}

export function captureMessage(
  _message: string,
  _level?: 'debug' | 'info' | 'warning' | 'error'
): void {
  // Mock implementation - does nothing
}

export function setUser(_user: { id?: string } | null): void {
  // Mock implementation - does nothing
}

export function setTag(_key: string, _value: string): void {
  // Mock implementation - does nothing
}

export function addBreadcrumb(_breadcrumb: {
  category?: string;
  message?: string;
  data?: Record<string, unknown>;
  level?: 'debug' | 'info' | 'warning' | 'error';
}): void {
  // Mock implementation - does nothing
}
