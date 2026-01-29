/**
 * Mock @sentry/browser module for testing
 * This is used when the actual package is not installed
 */

/* eslint-disable @typescript-eslint/no-unused-vars */

export function init(options: Record<string, unknown>): void {
  // Mock implementation - does nothing
}

export function captureException(
  error: Error,
  context?: { extra?: Record<string, unknown> }
): void {
  // Mock implementation - does nothing
}

export function captureMessage(
  message: string,
  level?: 'debug' | 'info' | 'warning' | 'error'
): void {
  // Mock implementation - does nothing
}

export function setUser(user: { id?: string } | null): void {
  // Mock implementation - does nothing
}

export function setTag(key: string, value: string): void {
  // Mock implementation - does nothing
}

export function addBreadcrumb(breadcrumb: {
  category?: string;
  message?: string;
  data?: Record<string, unknown>;
  level?: 'debug' | 'info' | 'warning' | 'error';
}): void {
  // Mock implementation - does nothing
}
