/**
 * Watcher Optimizations Module
 *
 * Performance optimizations for file watching to minimize CPU and memory usage,
 * especially when watching many files.
 */

import { WatcherService } from './watcherService';
import { getFolderWatcherStats, cleanupStaleWatches } from './folderWatcher';

export interface WatcherPerformanceMetrics {
  cpuUsagePercent: number;
  memoryUsageMB: number;
  totalWatchers: number;
  activeWatchers: number;
  pendingEvents: number;
  averageEventLatencyMs: number;
}

export interface OptimizationSettings {
  maxWatchers: number;
  maxWatchersPerFolder: number;
  debounceMs: number;
  batchFlushMs: number;
  cleanupIntervalMs: number;
  maxInactiveMs: number;
  cpuThresholdPercent: number;
  memoryThresholdMB: number;
}

const DEFAULT_SETTINGS: OptimizationSettings = {
  maxWatchers: 100,
  maxWatchersPerFolder: 50,
  debounceMs: 100,
  batchFlushMs: 50,
  cleanupIntervalMs: 300000, // 5 minutes
  maxInactiveMs: 3600000, // 1 hour
  cpuThresholdPercent: 2,
  memoryThresholdMB: 100,
};

let currentSettings: OptimizationSettings = { ...DEFAULT_SETTINGS };
let cleanupInterval: NodeJS.Timeout | null = null;
let metricsHistory: WatcherPerformanceMetrics[] = [];
const MAX_METRICS_HISTORY = 60;

// Event latency tracking
let eventTimestamps: number[] = [];
const MAX_EVENT_TIMESTAMPS = 100;

/**
 * Get current optimization settings
 */
export function getOptimizationSettings(): OptimizationSettings {
  return { ...currentSettings };
}

/**
 * Update optimization settings
 */
export function updateOptimizationSettings(
  settings: Partial<OptimizationSettings>
): OptimizationSettings {
  currentSettings = { ...currentSettings, ...settings };

  // Restart cleanup interval if changed
  if (settings.cleanupIntervalMs !== undefined) {
    startPeriodicCleanup();
  }

  return { ...currentSettings };
}

/**
 * Record event latency for metrics
 */
export function recordEventLatency(startTime: number): void {
  const latency = Date.now() - startTime;
  eventTimestamps.push(latency);

  if (eventTimestamps.length > MAX_EVENT_TIMESTAMPS) {
    eventTimestamps.shift();
  }
}

/**
 * Get average event latency
 */
function getAverageEventLatency(): number {
  if (eventTimestamps.length === 0) return 0;
  const sum = eventTimestamps.reduce((a, b) => a + b, 0);
  return Math.round(sum / eventTimestamps.length);
}

/**
 * Get current performance metrics
 */
export function getPerformanceMetrics(): WatcherPerformanceMetrics {
  const watcherService = WatcherService.getInstance();
  const watcherStats = watcherService.getWatcherStats();
  const folderStats = getFolderWatcherStats();
  const memUsage = process.memoryUsage();

  // Estimate CPU usage (simplified - actual implementation would need sampling)
  const cpuUsage = process.cpuUsage();
  const cpuPercent = (cpuUsage.user + cpuUsage.system) / 1000000 / process.uptime() * 100;

  const metrics: WatcherPerformanceMetrics = {
    cpuUsagePercent: Math.round(cpuPercent * 100) / 100,
    memoryUsageMB: Math.round(memUsage.heapUsed / 1024 / 1024 * 100) / 100,
    totalWatchers: watcherStats.totalWatchers + folderStats.totalFolders,
    activeWatchers: watcherStats.totalWatchers,
    pendingEvents: 0, // Would need to track this in watcher service
    averageEventLatencyMs: getAverageEventLatency(),
  };

  // Store in history
  metricsHistory.push(metrics);
  if (metricsHistory.length > MAX_METRICS_HISTORY) {
    metricsHistory.shift();
  }

  return metrics;
}

/**
 * Get metrics history
 */
export function getMetricsHistory(): WatcherPerformanceMetrics[] {
  return [...metricsHistory];
}

/**
 * Check if performance thresholds are exceeded
 */
export function checkPerformanceThresholds(): {
  ok: boolean;
  warnings: string[];
} {
  const metrics = getPerformanceMetrics();
  const warnings: string[] = [];

  if (metrics.cpuUsagePercent > currentSettings.cpuThresholdPercent) {
    warnings.push(`CPU usage (${metrics.cpuUsagePercent}%) exceeds threshold (${currentSettings.cpuThresholdPercent}%)`);
  }

  if (metrics.memoryUsageMB > currentSettings.memoryThresholdMB) {
    warnings.push(`Memory usage (${metrics.memoryUsageMB}MB) exceeds threshold (${currentSettings.memoryThresholdMB}MB)`);
  }

  if (metrics.totalWatchers > currentSettings.maxWatchers) {
    warnings.push(`Total watchers (${metrics.totalWatchers}) exceeds maximum (${currentSettings.maxWatchers})`);
  }

  if (metrics.averageEventLatencyMs > 500) {
    warnings.push(`Average event latency (${metrics.averageEventLatencyMs}ms) is high`);
  }

  return {
    ok: warnings.length === 0,
    warnings,
  };
}

/**
 * Perform automatic optimization based on current metrics
 */
export async function autoOptimize(): Promise<{
  optimized: boolean;
  actions: string[];
}> {
  const actions: string[] = [];
  const metrics = getPerformanceMetrics();

  // Clean up stale watches if memory is high
  if (metrics.memoryUsageMB > currentSettings.memoryThresholdMB * 0.8) {
    const cleaned = await cleanupStaleWatches(currentSettings.maxInactiveMs / 2);
    if (cleaned > 0) {
      actions.push(`Cleaned up ${cleaned} stale folder watches`);
    }
  }

  // Increase debounce if CPU is high
  if (metrics.cpuUsagePercent > currentSettings.cpuThresholdPercent) {
    const newDebounce = Math.min(currentSettings.debounceMs * 1.5, 500);
    if (newDebounce !== currentSettings.debounceMs) {
      currentSettings.debounceMs = newDebounce;
      actions.push(`Increased debounce time to ${newDebounce}ms`);
    }
  }

  // Clear event history if latency tracking is using too much memory
  if (eventTimestamps.length > MAX_EVENT_TIMESTAMPS * 0.9) {
    eventTimestamps = eventTimestamps.slice(-Math.floor(MAX_EVENT_TIMESTAMPS / 2));
    actions.push('Cleared old event latency history');
  }

  return {
    optimized: actions.length > 0,
    actions,
  };
}

/**
 * Start periodic cleanup task
 */
export function startPeriodicCleanup(): void {
  // Stop existing interval
  if (cleanupInterval) {
    clearInterval(cleanupInterval);
  }

  // Start new interval
  cleanupInterval = setInterval(async () => {
    try {
      // Clean up stale folder watches
      await cleanupStaleWatches(currentSettings.maxInactiveMs);

      // Check performance and auto-optimize
      const perfCheck = checkPerformanceThresholds();
      if (!perfCheck.ok) {
        console.warn('[WatcherOptimizations] Performance warnings:', perfCheck.warnings);
        await autoOptimize();
      }
    } catch (error) {
      console.error('[WatcherOptimizations] Periodic cleanup failed:', error);
    }
  }, currentSettings.cleanupIntervalMs);

  console.log('[WatcherOptimizations] Started periodic cleanup');
}

/**
 * Stop periodic cleanup task
 */
export function stopPeriodicCleanup(): void {
  if (cleanupInterval) {
    clearInterval(cleanupInterval);
    cleanupInterval = null;
  }
  console.log('[WatcherOptimizations] Stopped periodic cleanup');
}

/**
 * Reset all metrics and settings
 */
export function resetOptimizations(): void {
  currentSettings = { ...DEFAULT_SETTINGS };
  metricsHistory = [];
  eventTimestamps = [];
  stopPeriodicCleanup();
}

/**
 * Get optimization recommendations based on current state
 */
export function getOptimizationRecommendations(): string[] {
  const recommendations: string[] = [];
  const metrics = getPerformanceMetrics();

  if (metrics.totalWatchers > 50) {
    recommendations.push('Consider reducing the number of watched files/folders');
  }

  if (metrics.averageEventLatencyMs > 200) {
    recommendations.push('Increase debounce time to reduce event processing overhead');
  }

  if (metricsHistory.length >= 10) {
    const recentMemory = metricsHistory.slice(-10).map(m => m.memoryUsageMB);
    const avgMemory = recentMemory.reduce((a, b) => a + b, 0) / recentMemory.length;
    const lastMemory = recentMemory[recentMemory.length - 1];

    if (lastMemory > avgMemory * 1.2) {
      recommendations.push('Memory usage is trending upward - consider cleaning up unused watchers');
    }
  }

  return recommendations;
}

/**
 * Initialize optimizations module
 */
export function initializeOptimizations(): void {
  startPeriodicCleanup();
  console.log('[WatcherOptimizations] Initialized');
}

/**
 * Shutdown optimizations module
 */
export function shutdownOptimizations(): void {
  stopPeriodicCleanup();
  resetOptimizations();
  console.log('[WatcherOptimizations] Shutdown complete');
}
