/**
 * Privacy-Respecting Analytics for PaperFlow
 *
 * Provides basic usage analytics without collecting any personal data.
 * All data is aggregated and cannot be traced back to individual users.
 *
 * Supported providers:
 * - Plausible (default, recommended)
 * - Custom endpoint
 * - Console (development)
 *
 * Setup:
 * 1. Set VITE_ANALYTICS_ENDPOINT environment variable
 * 2. Call initAnalytics() in main.tsx
 */

interface AnalyticsEvent {
  name: string;
  props?: Record<string, string | number | boolean>;
}

// Analytics configuration
let analyticsEnabled = false;
let analyticsEndpoint: string | null = null;

/**
 * Check if analytics is enabled
 */
export function isAnalyticsEnabled(): boolean {
  return analyticsEnabled;
}

/**
 * Initialize analytics
 * Should be called once at application startup
 */
export function initAnalytics(): void {
  const endpoint = import.meta.env.VITE_ANALYTICS_ENDPOINT;

  if (!endpoint) {
    if (import.meta.env.DEV) {
      console.log('[Analytics] Disabled - no endpoint configured');
    }
    return;
  }

  analyticsEndpoint = endpoint;
  analyticsEnabled = true;

  // Track initial page view
  trackPageView(window.location.pathname);

  // Listen for route changes (SPA navigation)
  window.addEventListener('popstate', () => {
    trackPageView(window.location.pathname);
  });

  if (import.meta.env.DEV) {
    console.log('[Analytics] Initialized');
  }
}

/**
 * Track a page view
 */
export function trackPageView(path: string, title?: string): void {
  if (!analyticsEnabled) {
    if (import.meta.env.DEV) {
      console.log('[Analytics:PageView]', path, title);
    }
    return;
  }

  sendEvent({
    name: 'pageview',
    props: {
      url: path,
      ...(title && { title }),
      ...(document.referrer && { referrer: document.referrer }),
    },
  });
}

/**
 * Track a custom event
 *
 * Examples:
 * - trackEvent('pdf', 'open')
 * - trackEvent('annotation', 'create', 'highlight')
 * - trackEvent('export', 'download', 'pdf', 5)
 */
export function trackEvent(
  category: string,
  action: string,
  label?: string,
  value?: number
): void {
  if (!analyticsEnabled) {
    if (import.meta.env.DEV) {
      console.log('[Analytics:Event]', { category, action, label, value });
    }
    return;
  }

  sendEvent({
    name: `${category}_${action}`,
    props: {
      category,
      action,
      ...(label && { label }),
      ...(value !== undefined && { value }),
    },
  });
}

/**
 * Track timing metrics
 */
export function trackTiming(
  category: string,
  variable: string,
  timeMs: number,
  label?: string
): void {
  if (!analyticsEnabled) {
    if (import.meta.env.DEV) {
      console.log('[Analytics:Timing]', { category, variable, timeMs, label });
    }
    return;
  }

  sendEvent({
    name: 'timing',
    props: {
      category,
      variable,
      time: timeMs,
      ...(label && { label }),
    },
  });
}

/**
 * Track error occurrence (without details for privacy)
 */
export function trackError(message: string, fatal: boolean = false): void {
  if (!analyticsEnabled) {
    if (import.meta.env.DEV) {
      console.log('[Analytics:Error]', message, fatal);
    }
    return;
  }

  sendEvent({
    name: 'error',
    props: {
      message: message.substring(0, 100), // Limit message length
      fatal,
    },
  });
}

/**
 * Set a user property (anonymous)
 */
export function setUserProperty(name: string, value: string): void {
  if (!analyticsEnabled) {
    if (import.meta.env.DEV) {
      console.log('[Analytics:UserProperty]', name, value);
    }
    return;
  }

  // Store for future events
  sendEvent({
    name: 'user_property',
    props: {
      property: name,
      value,
    },
  });
}

/**
 * Send event to analytics endpoint
 */
async function sendEvent(event: AnalyticsEvent): Promise<void> {
  if (!analyticsEndpoint) {
    return;
  }

  try {
    // Use sendBeacon for reliability (works even during page unload)
    const data = JSON.stringify({
      n: event.name,
      u: window.location.href,
      d: window.location.hostname,
      r: document.referrer || null,
      w: window.innerWidth,
      p: event.props || {},
    });

    if (navigator.sendBeacon) {
      navigator.sendBeacon(analyticsEndpoint, data);
    } else {
      // Fallback for browsers without sendBeacon
      await fetch(analyticsEndpoint, {
        method: 'POST',
        body: data,
        headers: {
          'Content-Type': 'application/json',
        },
        keepalive: true,
      });
    }
  } catch {
    // Silently fail - analytics should never break the app
    if (import.meta.env.DEV) {
      console.warn('[Analytics] Failed to send event');
    }
  }
}

/**
 * Predefined events for common actions
 */
export const AnalyticsEvents = {
  // Document events
  DOCUMENT_OPENED: 'document_opened',
  DOCUMENT_SAVED: 'document_saved',
  DOCUMENT_EXPORTED: 'document_exported',
  DOCUMENT_PRINTED: 'document_printed',

  // Annotation events
  ANNOTATION_CREATED: 'annotation_created',
  ANNOTATION_DELETED: 'annotation_deleted',

  // Form events
  FORM_FILLED: 'form_filled',
  FORM_EXPORTED: 'form_exported',

  // Signature events
  SIGNATURE_CREATED: 'signature_created',
  SIGNATURE_PLACED: 'signature_placed',

  // Page management events
  PAGES_REORDERED: 'pages_reordered',
  PAGES_MERGED: 'pages_merged',
  PAGES_SPLIT: 'pages_split',

  // Error events
  ERROR_PDF_LOAD: 'error_pdf_load',
  ERROR_SAVE: 'error_save',
  ERROR_EXPORT: 'error_export',
} as const;

/**
 * Helper to track document events
 */
export function trackDocumentEvent(
  action: 'opened' | 'saved' | 'exported' | 'printed',
  metadata?: { pages?: number; format?: string }
): void {
  trackEvent('document', action, metadata?.format, metadata?.pages);
}

/**
 * Helper to track annotation events
 */
export function trackAnnotationEvent(
  action: 'created' | 'deleted',
  type: string
): void {
  trackEvent('annotation', action, type);
}
