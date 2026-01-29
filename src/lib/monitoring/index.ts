/**
 * Monitoring Module
 *
 * Provides error tracking and analytics for PaperFlow.
 * All monitoring is privacy-respecting - no PII is collected.
 */

export {
  initSentry,
  isSentryEnabled,
  captureError,
  captureMessage,
  addBreadcrumb,
  setUser,
  clearUser,
  setTag,
} from './sentry';

export {
  initAnalytics,
  isAnalyticsEnabled,
  trackPageView,
  trackEvent,
  trackTiming,
  trackError,
  setUserProperty,
  trackDocumentEvent,
  trackAnnotationEvent,
  AnalyticsEvents,
} from './analytics';

/**
 * Initialize all monitoring services
 * Call this once at application startup
 */
export async function initMonitoring(): Promise<void> {
  const { initSentry } = await import('./sentry');
  const { initAnalytics } = await import('./analytics');

  await initSentry();
  initAnalytics();
}
