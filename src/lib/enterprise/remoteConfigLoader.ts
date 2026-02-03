/**
 * Remote Configuration Loader (Sprint 20)
 *
 * Fetches configuration from remote HTTP/HTTPS endpoints.
 */

import { loadJsonString } from './jsonConfigLoader';
import { loadYamlString, isYamlContent } from './yamlConfigLoader';
import type { EnterpriseConfig } from '@/types/enterpriseConfig';

/**
 * Remote config options
 */
export interface RemoteConfigOptions {
  /** Server URL */
  url: string;
  /** Authentication method */
  auth?: {
    type: 'bearer' | 'basic' | 'api-key';
    token?: string;
    username?: string;
    password?: string;
    apiKey?: string;
    apiKeyHeader?: string;
  };
  /** Request timeout in milliseconds */
  timeout?: number;
  /** Cache TTL in milliseconds */
  cacheTTL?: number;
  /** Retry count on failure */
  retries?: number;
  /** Retry delay in milliseconds */
  retryDelay?: number;
  /** Custom headers */
  headers?: Record<string, string>;
  /** Validate SSL certificates */
  validateSSL?: boolean;
}

/**
 * Remote config result
 */
export interface RemoteConfigResult {
  success: boolean;
  config: EnterpriseConfig | null;
  error?: string;
  fromCache: boolean;
  cachedAt?: number;
  expiresAt?: number;
  etag?: string;
  lastModified?: string;
}

/**
 * Cache entry
 */
interface CacheEntry {
  config: EnterpriseConfig;
  cachedAt: number;
  expiresAt: number;
  etag?: string;
  lastModified?: string;
}

/**
 * Remote configuration loader class
 */
export class RemoteConfigLoader {
  private options: RemoteConfigOptions;
  private cache: Map<string, CacheEntry> = new Map();
  private pendingRequests: Map<string, Promise<RemoteConfigResult>> = new Map();

  constructor(options: RemoteConfigOptions) {
    this.options = {
      timeout: 30000,
      cacheTTL: 300000, // 5 minutes
      retries: 3,
      retryDelay: 1000,
      validateSSL: true,
      ...options,
    };
  }

  /**
   * Load configuration from remote server
   */
  async load(force = false): Promise<RemoteConfigResult> {
    const cacheKey = this.options.url;

    // Check cache first (unless forced)
    if (!force) {
      const cached = this.getFromCache(cacheKey);
      if (cached) {
        return {
          success: true,
          config: cached.config,
          fromCache: true,
          cachedAt: cached.cachedAt,
          expiresAt: cached.expiresAt,
          etag: cached.etag,
          lastModified: cached.lastModified,
        };
      }
    }

    // Deduplicate concurrent requests
    const pending = this.pendingRequests.get(cacheKey);
    if (pending) {
      return pending;
    }

    // Make request
    const requestPromise = this.fetchWithRetry();
    this.pendingRequests.set(cacheKey, requestPromise);

    try {
      const result = await requestPromise;
      return result;
    } finally {
      this.pendingRequests.delete(cacheKey);
    }
  }

  /**
   * Fetch with retry logic
   */
  private async fetchWithRetry(): Promise<RemoteConfigResult> {
    const retries = this.options.retries || 3;
    const retryDelay = this.options.retryDelay || 1000;
    let lastError: string | undefined;

    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        const result = await this.fetch();
        return result;
      } catch (error) {
        lastError = error instanceof Error ? error.message : 'Unknown error';

        // Wait before retry (except for last attempt)
        if (attempt < retries - 1) {
          await this.sleep(retryDelay * Math.pow(2, attempt));
        }
      }
    }

    // All retries failed, try to return cached data
    const cached = this.cache.get(this.options.url);
    if (cached) {
      return {
        success: true,
        config: cached.config,
        fromCache: true,
        cachedAt: cached.cachedAt,
        expiresAt: cached.expiresAt,
        error: `Failed to refresh (${lastError}). Using cached data.`,
      };
    }

    return {
      success: false,
      config: null,
      fromCache: false,
      error: lastError,
    };
  }

  /**
   * Perform the actual fetch
   */
  private async fetch(): Promise<RemoteConfigResult> {
    const headers: Record<string, string> = {
      Accept: 'application/json, application/yaml, text/yaml',
      ...this.options.headers,
    };

    // Add authentication
    if (this.options.auth) {
      const auth = this.options.auth;

      if (auth.type === 'bearer' && auth.token) {
        headers['Authorization'] = `Bearer ${auth.token}`;
      } else if (auth.type === 'basic' && auth.username && auth.password) {
        const credentials = btoa(`${auth.username}:${auth.password}`);
        headers['Authorization'] = `Basic ${credentials}`;
      } else if (auth.type === 'api-key' && auth.apiKey) {
        const headerName = auth.apiKeyHeader || 'X-API-Key';
        headers[headerName] = auth.apiKey;
      }
    }

    // Add conditional headers if we have cached data
    const cached = this.cache.get(this.options.url);
    if (cached?.etag) {
      headers['If-None-Match'] = cached.etag;
    }
    if (cached?.lastModified) {
      headers['If-Modified-Since'] = cached.lastModified;
    }

    const response = await fetch(this.options.url, {
      method: 'GET',
      headers,
      signal: AbortSignal.timeout(this.options.timeout || 30000),
    });

    // Handle 304 Not Modified
    if (response.status === 304 && cached) {
      // Update cache expiry
      cached.expiresAt = Date.now() + (this.options.cacheTTL || 300000);
      this.cache.set(this.options.url, cached);

      return {
        success: true,
        config: cached.config,
        fromCache: true,
        cachedAt: cached.cachedAt,
        expiresAt: cached.expiresAt,
        etag: cached.etag,
        lastModified: cached.lastModified,
      };
    }

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const contentType = response.headers.get('Content-Type') || '';
    const content = await response.text();

    // Parse based on content type
    let config: EnterpriseConfig | null = null;

    if (contentType.includes('yaml') || isYamlContent(content)) {
      const result = loadYamlString(content, this.options.url);
      if (!result.success) {
        throw new Error(result.errors.map((e) => e.message).join('; '));
      }
      config = result.config;
    } else {
      const result = loadJsonString(content, this.options.url);
      if (!result.success) {
        throw new Error(result.errors.map((e) => e.message).join('; '));
      }
      config = result.config;
    }

    if (!config) {
      throw new Error('Failed to parse configuration');
    }

    // Cache the result
    const now = Date.now();
    const cacheEntry: CacheEntry = {
      config,
      cachedAt: now,
      expiresAt: now + (this.options.cacheTTL || 300000),
      etag: response.headers.get('ETag') || undefined,
      lastModified: response.headers.get('Last-Modified') || undefined,
    };
    this.cache.set(this.options.url, cacheEntry);

    return {
      success: true,
      config,
      fromCache: false,
      cachedAt: cacheEntry.cachedAt,
      expiresAt: cacheEntry.expiresAt,
      etag: cacheEntry.etag,
      lastModified: cacheEntry.lastModified,
    };
  }

  /**
   * Get from cache if valid
   */
  private getFromCache(key: string): CacheEntry | null {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      return null;
    }

    return entry;
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cached config (even if expired)
   */
  getCachedConfig(): EnterpriseConfig | null {
    const entry = this.cache.get(this.options.url);
    return entry?.config || null;
  }

  /**
   * Update server URL
   */
  setUrl(url: string): void {
    this.options.url = url;
  }

  /**
   * Update authentication
   */
  setAuth(auth: RemoteConfigOptions['auth']): void {
    this.options.auth = auth;
  }

  /**
   * Sleep helper
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

/**
 * Create a remote config loader
 */
export function createRemoteConfigLoader(options: RemoteConfigOptions): RemoteConfigLoader {
  return new RemoteConfigLoader(options);
}

/**
 * Simple fetch function for one-time loads
 */
export async function fetchRemoteConfig(
  url: string,
  options?: Omit<RemoteConfigOptions, 'url'>
): Promise<RemoteConfigResult> {
  const loader = new RemoteConfigLoader({ url, ...options });
  return loader.load();
}

export default RemoteConfigLoader;
