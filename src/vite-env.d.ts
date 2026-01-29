/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SENTRY_DSN: string;
  readonly VITE_SENTRY_ENVIRONMENT: string;
  readonly VITE_ANALYTICS_ENDPOINT: string;
  readonly VITE_APP_VERSION: string;
  readonly MODE: string;
  readonly DEV: boolean;
  readonly PROD: boolean;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// Optional dependency type declarations
declare module '@sentry/browser' {
  export function init(options: Record<string, unknown>): void;
  export function captureException(
    error: Error,
    context?: { extra?: Record<string, unknown> }
  ): void;
  export function captureMessage(
    message: string,
    level?: 'debug' | 'info' | 'warning' | 'error'
  ): void;
  export function setUser(user: { id?: string } | null): void;
  export function setTag(key: string, value: string): void;
  export function addBreadcrumb(breadcrumb: {
    category?: string;
    message?: string;
    data?: Record<string, unknown>;
    level?: 'debug' | 'info' | 'warning' | 'error';
  }): void;
}
