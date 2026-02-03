/**
 * Remote Configuration Tests (Sprint 20)
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { RemoteConfigLoader, fetchRemoteConfig } from '@lib/enterprise/remoteConfigLoader';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('RemoteConfigLoader', () => {
  let loader: RemoteConfigLoader;

  beforeEach(() => {
    vi.clearAllMocks();
    loader = new RemoteConfigLoader({
      url: 'https://config.example.com/config.json',
      cacheTTL: 60000,
      retries: 2,
      retryDelay: 100,
    });
  });

  afterEach(() => {
    loader.clearCache();
  });

  describe('load', () => {
    it('should fetch and parse JSON config', async () => {
      const mockConfig = {
        version: '1.0.0',
        application: { defaultZoom: 150 },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Map([['Content-Type', 'application/json']]),
        text: () => Promise.resolve(JSON.stringify(mockConfig)),
      });

      const result = await loader.load();

      expect(result.success).toBe(true);
      expect(result.config?.application?.defaultZoom).toBe(150);
      expect(result.fromCache).toBe(false);
    });

    it('should return cached config within TTL', async () => {
      const mockConfig = {
        version: '1.0.0',
        application: { defaultZoom: 150 },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Map([['Content-Type', 'application/json']]),
        text: () => Promise.resolve(JSON.stringify(mockConfig)),
      });

      // First load
      await loader.load();

      // Second load should use cache
      const result = await loader.load();

      expect(result.success).toBe(true);
      expect(result.fromCache).toBe(true);
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should force refresh when requested', async () => {
      const mockConfig = {
        version: '1.0.0',
        application: { defaultZoom: 150 },
      };

      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Map([['Content-Type', 'application/json']]),
        text: () => Promise.resolve(JSON.stringify(mockConfig)),
      });

      await loader.load();
      const result = await loader.load(true);

      expect(result.fromCache).toBe(false);
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('should handle 304 Not Modified', async () => {
      const mockConfig = {
        version: '1.0.0',
        application: { defaultZoom: 150 },
      };

      // First request - success
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Map([
          ['Content-Type', 'application/json'],
          ['ETag', '"abc123"'],
        ]),
        text: () => Promise.resolve(JSON.stringify(mockConfig)),
      });

      await loader.load();

      // Clear cache TTL to trigger refresh attempt
      loader.clearCache();

      // Re-cache with initial load
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Map([
          ['Content-Type', 'application/json'],
          ['ETag', '"abc123"'],
        ]),
        text: () => Promise.resolve(JSON.stringify(mockConfig)),
      });

      await loader.load();

      // Force refresh - should get 304
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 304,
        headers: new Map(),
      });

      const result = await loader.load(true);

      expect(result.success).toBe(true);
      expect(result.config?.application?.defaultZoom).toBe(150);
    });

    it('should handle network errors with retry', async () => {
      mockFetch
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'));

      const result = await loader.load();

      expect(result.success).toBe(false);
      expect(result.error).toContain('Network error');
      expect(mockFetch).toHaveBeenCalledTimes(2); // Initial + 1 retry (retries: 2)
    });

    it('should return cached data on network failure', async () => {
      const mockConfig = {
        version: '1.0.0',
        application: { defaultZoom: 150 },
      };

      // First load - success
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Map([['Content-Type', 'application/json']]),
        text: () => Promise.resolve(JSON.stringify(mockConfig)),
      });

      await loader.load();

      // Force refresh - network error
      mockFetch
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'));

      const result = await loader.load(true);

      expect(result.success).toBe(true);
      expect(result.fromCache).toBe(true);
      expect(result.error).toContain('Using cached data');
    });

    it('should handle HTTP errors', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      const result = await loader.load();

      expect(result.success).toBe(false);
      expect(result.error).toContain('500');
    });

    it('should handle invalid JSON', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Map([['Content-Type', 'application/json']]),
        text: () => Promise.resolve('invalid json'),
      });

      const result = await loader.load();

      expect(result.success).toBe(false);
    });
  });

  describe('authentication', () => {
    it('should add bearer token header', async () => {
      const authLoader = new RemoteConfigLoader({
        url: 'https://config.example.com/config.json',
        auth: {
          type: 'bearer',
          token: 'test-token',
        },
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Map([['Content-Type', 'application/json']]),
        text: () => Promise.resolve('{"version":"1.0.0"}'),
      });

      await authLoader.load();

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer test-token',
          }),
        })
      );
    });

    it('should add basic auth header', async () => {
      const authLoader = new RemoteConfigLoader({
        url: 'https://config.example.com/config.json',
        auth: {
          type: 'basic',
          username: 'user',
          password: 'pass',
        },
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Map([['Content-Type', 'application/json']]),
        text: () => Promise.resolve('{"version":"1.0.0"}'),
      });

      await authLoader.load();

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: expect.stringContaining('Basic'),
          }),
        })
      );
    });

    it('should add API key header', async () => {
      const authLoader = new RemoteConfigLoader({
        url: 'https://config.example.com/config.json',
        auth: {
          type: 'api-key',
          apiKey: 'my-api-key',
          apiKeyHeader: 'X-Custom-Key',
        },
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Map([['Content-Type', 'application/json']]),
        text: () => Promise.resolve('{"version":"1.0.0"}'),
      });

      await authLoader.load();

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'X-Custom-Key': 'my-api-key',
          }),
        })
      );
    });
  });

  describe('getCachedConfig', () => {
    it('should return null when no cached config', () => {
      expect(loader.getCachedConfig()).toBeNull();
    });

    it('should return cached config even if expired', async () => {
      const mockConfig = {
        version: '1.0.0',
        application: { defaultZoom: 150 },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Map([['Content-Type', 'application/json']]),
        text: () => Promise.resolve(JSON.stringify(mockConfig)),
      });

      await loader.load();

      expect(loader.getCachedConfig()).toBeDefined();
      expect(loader.getCachedConfig()?.application?.defaultZoom).toBe(150);
    });
  });

  describe('setUrl and setAuth', () => {
    it('should update server URL', async () => {
      loader.setUrl('https://new-config.example.com/config.json');

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Map([['Content-Type', 'application/json']]),
        text: () => Promise.resolve('{"version":"1.0.0"}'),
      });

      await loader.load();

      expect(mockFetch).toHaveBeenCalledWith('https://new-config.example.com/config.json', expect.any(Object));
    });
  });
});

describe('fetchRemoteConfig', () => {
  it('should fetch config with simple API', async () => {
    const mockConfig = {
      version: '1.0.0',
      application: { defaultZoom: 150 },
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: new Map([['Content-Type', 'application/json']]),
      text: () => Promise.resolve(JSON.stringify(mockConfig)),
    });

    const result = await fetchRemoteConfig('https://config.example.com/config.json');

    expect(result.success).toBe(true);
    expect(result.config?.application?.defaultZoom).toBe(150);
  });
});
