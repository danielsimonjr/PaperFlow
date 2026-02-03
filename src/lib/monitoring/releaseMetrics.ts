/**
 * Release Metrics Monitoring
 *
 * Tracks release metrics including downloads, crash reports, and user feedback.
 */

import { isElectron } from '@lib/electron/platform';

/**
 * Metric types
 */
export type MetricType =
  | 'download'
  | 'install'
  | 'uninstall'
  | 'update'
  | 'crash'
  | 'error'
  | 'session_start'
  | 'session_end'
  | 'feature_usage';

/**
 * Platform types for metrics
 */
export type MetricPlatform = 'windows' | 'macos' | 'linux' | 'web' | 'unknown';

/**
 * Metric data
 */
export interface Metric {
  type: MetricType;
  timestamp: number;
  platform: MetricPlatform;
  version: string;
  arch?: string;
  data?: Record<string, unknown>;
}

/**
 * Release metrics configuration
 */
export interface ReleaseMetricsConfig {
  /** Metrics endpoint URL */
  endpointUrl?: string;
  /** Whether to collect metrics */
  enabled: boolean;
  /** Whether to send anonymous usage data */
  anonymousUsage: boolean;
  /** Batch size for sending metrics */
  batchSize: number;
  /** Interval for sending batched metrics (ms) */
  batchInterval: number;
}

const DEFAULT_CONFIG: ReleaseMetricsConfig = {
  enabled: true,
  anonymousUsage: true,
  batchSize: 10,
  batchInterval: 60000, // 1 minute
};

/**
 * Release Metrics class
 */
class ReleaseMetrics {
  private config: ReleaseMetricsConfig;
  private metricQueue: Metric[] = [];
  private batchTimer: ReturnType<typeof setInterval> | null = null;
  private sessionId: string;
  private sessionStartTime: number;

  constructor(config?: Partial<ReleaseMetricsConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.sessionId = this.generateSessionId();
    this.sessionStartTime = Date.now();

    if (this.config.enabled) {
      this.initVersion();
      this.startBatchTimer();
      this.trackSessionStart();
    }
  }

  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get current platform
   */
  private getPlatform(): MetricPlatform {
    if (!isElectron()) return 'web';

    if (typeof process !== 'undefined') {
      switch (process.platform) {
        case 'win32':
          return 'windows';
        case 'darwin':
          return 'macos';
        case 'linux':
          return 'linux';
      }
    }

    return 'unknown';
  }

  /**
   * Get current version
   */
  private getVersion(): string {
    // Note: getAppVersion is async but we need a sync value here
    // Use a cached version or fallback
    return this.cachedVersion || 'unknown';
  }

  private cachedVersion: string = 'unknown';

  /**
   * Initialize version asynchronously
   */
  private async initVersion(): Promise<void> {
    if (isElectron() && window.electron?.getAppVersion) {
      try {
        this.cachedVersion = await window.electron.getAppVersion();
      } catch {
        this.cachedVersion = 'unknown';
      }
    }
  }

  /**
   * Get architecture
   */
  private getArch(): string {
    if (typeof process !== 'undefined') {
      return process.arch;
    }
    return 'unknown';
  }

  /**
   * Start batch timer
   */
  private startBatchTimer(): void {
    if (this.batchTimer) return;

    this.batchTimer = setInterval(() => {
      this.sendBatch();
    }, this.config.batchInterval);
  }

  /**
   * Stop batch timer
   */
  private stopBatchTimer(): void {
    if (this.batchTimer) {
      clearInterval(this.batchTimer);
      this.batchTimer = null;
    }
  }

  /**
   * Add metric to queue
   */
  private queueMetric(metric: Metric): void {
    this.metricQueue.push(metric);

    // Send immediately if batch size reached
    if (this.metricQueue.length >= this.config.batchSize) {
      this.sendBatch();
    }
  }

  /**
   * Send batched metrics
   */
  private async sendBatch(): Promise<void> {
    if (this.metricQueue.length === 0) return;
    if (!this.config.endpointUrl) {
      // Just log locally if no endpoint
      console.log('[ReleaseMetrics] Batch:', this.metricQueue);
      this.metricQueue = [];
      return;
    }

    const batch = [...this.metricQueue];
    this.metricQueue = [];

    try {
      await fetch(this.config.endpointUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId: this.sessionId,
          metrics: batch,
        }),
      });

      console.log(`[ReleaseMetrics] Sent ${batch.length} metrics`);
    } catch (error) {
      console.error('[ReleaseMetrics] Failed to send metrics:', error);
      // Re-queue failed metrics
      this.metricQueue.unshift(...batch);
    }
  }

  /**
   * Track a metric
   */
  track(type: MetricType, data?: Record<string, unknown>): void {
    if (!this.config.enabled) return;

    const metric: Metric = {
      type,
      timestamp: Date.now(),
      platform: this.getPlatform(),
      version: this.getVersion(),
      arch: this.getArch(),
      data,
    };

    this.queueMetric(metric);
  }

  /**
   * Track session start
   */
  private trackSessionStart(): void {
    this.track('session_start', {
      sessionId: this.sessionId,
    });
  }

  /**
   * Track session end
   */
  trackSessionEnd(): void {
    const sessionDuration = Date.now() - this.sessionStartTime;

    this.track('session_end', {
      sessionId: this.sessionId,
      duration: sessionDuration,
    });

    // Send any remaining metrics
    this.sendBatch();
    this.stopBatchTimer();
  }

  /**
   * Track download
   */
  trackDownload(installer: string): void {
    this.track('download', { installer });
  }

  /**
   * Track install
   */
  trackInstall(installer: string): void {
    this.track('install', { installer });
  }

  /**
   * Track update
   */
  trackUpdate(fromVersion: string, toVersion: string): void {
    this.track('update', { fromVersion, toVersion });
  }

  /**
   * Track crash
   */
  trackCrash(error: string, stack?: string): void {
    this.track('crash', { error, stack: stack?.slice(0, 1000) });
  }

  /**
   * Track error
   */
  trackError(error: string, context?: Record<string, unknown>): void {
    this.track('error', { error, ...context });
  }

  /**
   * Track feature usage
   */
  trackFeatureUsage(feature: string, action?: string): void {
    if (!this.config.anonymousUsage) return;

    this.track('feature_usage', { feature, action });
  }

  /**
   * Set configuration
   */
  setConfig(config: Partial<ReleaseMetricsConfig>): void {
    this.config = { ...this.config, ...config };

    if (this.config.enabled && !this.batchTimer) {
      this.startBatchTimer();
    } else if (!this.config.enabled && this.batchTimer) {
      this.stopBatchTimer();
    }
  }

  /**
   * Get current configuration
   */
  getConfig(): ReleaseMetricsConfig {
    return { ...this.config };
  }

  /**
   * Flush all pending metrics
   */
  async flush(): Promise<void> {
    await this.sendBatch();
  }
}

// Singleton instance
let releaseMetrics: ReleaseMetrics | null = null;

/**
 * Get or create release metrics instance
 */
export function getReleaseMetrics(): ReleaseMetrics {
  if (!releaseMetrics) {
    releaseMetrics = new ReleaseMetrics();
  }
  return releaseMetrics;
}

/**
 * Initialize release metrics
 */
export function initializeReleaseMetrics(config?: Partial<ReleaseMetricsConfig>): ReleaseMetrics {
  if (releaseMetrics) {
    releaseMetrics.setConfig(config || {});
  } else {
    releaseMetrics = new ReleaseMetrics(config);
  }
  return releaseMetrics;
}

/**
 * Track a metric
 */
export function trackMetric(type: MetricType, data?: Record<string, unknown>): void {
  getReleaseMetrics().track(type, data);
}

/**
 * Track feature usage
 */
export function trackFeature(feature: string, action?: string): void {
  getReleaseMetrics().trackFeatureUsage(feature, action);
}

// Set up session end tracking
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    getReleaseMetrics().trackSessionEnd();
  });
}

export default ReleaseMetrics;
