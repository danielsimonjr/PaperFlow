/**
 * Update Client Module (Sprint 23)
 *
 * Client for checking and downloading updates from enterprise update server.
 */

/**
 * Update check request
 */
export interface UpdateCheckRequest {
  currentVersion: string;
  platform: string;
  arch: string;
  channel: 'stable' | 'beta' | 'alpha';
  licenseKey?: string;
}

/**
 * Release file info
 */
export interface ReleaseFile {
  name: string;
  url: string;
  size: number;
  sha256: string;
  platform: string;
  arch: string;
  type: 'installer' | 'delta' | 'full';
  baseVersion?: string;
}

/**
 * Release info
 */
export interface Release {
  version: string;
  releaseDate: string;
  releaseNotes: string;
  mandatory: boolean;
  files: ReleaseFile[];
}

/**
 * Update check response
 */
export interface UpdateCheckResponse {
  updateAvailable: boolean;
  release?: Release;
  mandatory: boolean;
  message?: string;
}

/**
 * Download progress
 */
export interface DownloadProgress {
  bytesDownloaded: number;
  totalBytes: number;
  percent: number;
  bytesPerSecond: number;
}

/**
 * Update client options
 */
export interface UpdateClientOptions {
  /** Update server URL */
  serverUrl: string;
  /** Current app version */
  currentVersion: string;
  /** Update channel */
  channel: 'stable' | 'beta' | 'alpha';
  /** License key for enterprise */
  licenseKey?: string;
  /** Proxy configuration */
  proxy?: {
    server: string;
    port: number;
    bypass?: string[];
  };
  /** Custom headers */
  headers?: Record<string, string>;
  /** Request timeout in ms */
  timeout?: number;
  /** Certificate pinning */
  certificatePins?: string[];
}

/**
 * Update client for enterprise update server
 */
class UpdateClient {
  private options: UpdateClientOptions;
  private platform: string;
  private arch: string;
  private abortController: AbortController | null = null;

  constructor(options: UpdateClientOptions) {
    this.options = {
      timeout: 30000,
      ...options,
    };

    // Detect platform and arch
    this.platform = this.detectPlatform();
    this.arch = this.detectArch();
  }

  /**
   * Detect current platform
   */
  private detectPlatform(): string {
    if (typeof process !== 'undefined') {
      return process.platform;
    }
    // Browser detection
    const userAgent = navigator.userAgent.toLowerCase();
    if (userAgent.includes('win')) return 'win32';
    if (userAgent.includes('mac')) return 'darwin';
    if (userAgent.includes('linux')) return 'linux';
    return 'unknown';
  }

  /**
   * Detect current architecture
   */
  private detectArch(): string {
    if (typeof process !== 'undefined') {
      return process.arch;
    }
    // Browser detection (limited)
    return 'x64';
  }

  /**
   * Check for updates
   */
  async checkForUpdates(): Promise<UpdateCheckResponse> {
    const url = new URL('/api/v1/check', this.options.serverUrl);

    const request: UpdateCheckRequest = {
      currentVersion: this.options.currentVersion,
      platform: this.platform,
      arch: this.arch,
      channel: this.options.channel,
      licenseKey: this.options.licenseKey,
    };

    try {
      const response = await fetch(url.toString(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...this.options.headers,
        },
        body: JSON.stringify(request),
        signal: AbortSignal.timeout(this.options.timeout || 30000),
      });

      if (!response.ok) {
        throw new Error(`Update check failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data as UpdateCheckResponse;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Update check failed: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Download an update file
   */
  async downloadUpdate(
    file: ReleaseFile,
    destPath: string,
    onProgress?: (progress: DownloadProgress) => void
  ): Promise<{ success: boolean; error?: string }> {
    this.abortController = new AbortController();

    try {
      const response = await fetch(file.url, {
        signal: this.abortController.signal,
        headers: this.options.headers,
      });

      if (!response.ok) {
        throw new Error(`Download failed: ${response.status} ${response.statusText}`);
      }

      const contentLength = parseInt(response.headers.get('content-length') || '0', 10);
      const reader = response.body?.getReader();

      if (!reader) {
        throw new Error('Failed to get response reader');
      }

      const chunks: Uint8Array[] = [];
      let downloadedBytes = 0;
      let lastTime = Date.now();
      let lastBytes = 0;

      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        chunks.push(value);
        downloadedBytes += value.length;

        // Calculate progress
        const now = Date.now();
        const timeDiff = (now - lastTime) / 1000;
        const bytesDiff = downloadedBytes - lastBytes;
        const bytesPerSecond = timeDiff > 0 ? bytesDiff / timeDiff : 0;

        if (onProgress) {
          onProgress({
            bytesDownloaded: downloadedBytes,
            totalBytes: contentLength || file.size,
            percent: contentLength ? (downloadedBytes / contentLength) * 100 : 0,
            bytesPerSecond,
          });
        }

        lastTime = now;
        lastBytes = downloadedBytes;
      }

      // Combine chunks
      const data = new Uint8Array(downloadedBytes);
      let offset = 0;
      for (const chunk of chunks) {
        data.set(chunk, offset);
        offset += chunk.length;
      }

      // Verify checksum
      const isValid = await this.verifyChecksum(data, file.sha256);
      if (!isValid) {
        throw new Error('Checksum verification failed');
      }

      // Write to disk (in Electron environment)
      if (typeof window !== 'undefined' && window.electron) {
        const writeResult = await window.electron.writeFile(destPath, data);
        if (!writeResult.success) {
          throw new Error(writeResult.error || 'Failed to write file');
        }
      }

      return { success: true };
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return { success: false, error: 'Download cancelled' };
      }
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Download failed',
      };
    } finally {
      this.abortController = null;
    }
  }

  /**
   * Cancel ongoing download
   */
  cancelDownload(): void {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
  }

  /**
   * Verify file checksum
   */
  private async verifyChecksum(data: Uint8Array, expectedSha256: string): Promise<boolean> {
    if (typeof crypto !== 'undefined' && crypto.subtle) {
      // Create a new Uint8Array that owns its own ArrayBuffer (not SharedArrayBuffer)
      const dataCopy = new Uint8Array(data);
      const hashBuffer = await crypto.subtle.digest('SHA-256', dataCopy.buffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
      return hashHex.toLowerCase() === expectedSha256.toLowerCase();
    }

    // If Web Crypto not available, skip verification (with warning)
    console.warn('Web Crypto API not available, skipping checksum verification');
    return true;
  }

  /**
   * Get release notes for a version
   */
  async getReleaseNotes(version: string): Promise<string> {
    const url = new URL(`/api/v1/releases/${version}/notes`, this.options.serverUrl);

    try {
      const response = await fetch(url.toString(), {
        headers: this.options.headers,
        signal: AbortSignal.timeout(this.options.timeout || 30000),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch release notes: ${response.status}`);
      }

      return await response.text();
    } catch (error) {
      throw new Error(
        `Failed to fetch release notes: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Report download statistics
   */
  async reportDownload(version: string, platform: string, arch: string): Promise<void> {
    const url = new URL('/api/v1/stats/download', this.options.serverUrl);

    try {
      await fetch(url.toString(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...this.options.headers,
        },
        body: JSON.stringify({ version, platform, arch }),
      });
    } catch {
      // Ignore statistics errors
    }
  }

  /**
   * Update server URL
   */
  setServerUrl(url: string): void {
    this.options.serverUrl = url;
  }

  /**
   * Update channel
   */
  setChannel(channel: 'stable' | 'beta' | 'alpha'): void {
    this.options.channel = channel;
  }

  /**
   * Check server health
   */
  async checkServerHealth(): Promise<{ healthy: boolean; version?: string }> {
    const url = new URL('/health', this.options.serverUrl);

    try {
      const response = await fetch(url.toString(), {
        signal: AbortSignal.timeout(5000),
      });

      if (!response.ok) {
        return { healthy: false };
      }

      const data = await response.json();
      return {
        healthy: data.status === 'healthy',
        version: data.version,
      };
    } catch {
      return { healthy: false };
    }
  }
}

/**
 * Create update client instance
 */
export function createUpdateClient(options: UpdateClientOptions): UpdateClient {
  return new UpdateClient(options);
}

export default UpdateClient;
