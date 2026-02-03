/**
 * Scanner Provider
 *
 * Unified scanner abstraction layer that provides a consistent API
 * across TWAIN, WIA, SANE, and ImageCapture.
 */

import type {
  ScannerDevice,
  ScannerPlatform,
  ScanSettings,
  ScanResult,
  BatchScanResult,
  ScanEvent,
  ScanEventCallback,
  ScanProgressCallback,
} from './types';

/**
 * Platform-specific scanner interface
 */
export interface PlatformScanner {
  /** Platform type */
  platform: ScannerPlatform;
  /** Initialize the scanner driver */
  initialize(): Promise<boolean>;
  /** Check if platform is available */
  isAvailable(): Promise<boolean>;
  /** Enumerate available devices */
  enumerateDevices(): Promise<ScannerDevice[]>;
  /** Select a device */
  selectDevice(deviceId: string): Promise<boolean>;
  /** Perform a scan */
  scan(settings: ScanSettings): Promise<ScanResult>;
  /** Cancel ongoing scan */
  cancelScan(): Promise<void>;
  /** Cleanup resources */
  dispose(): Promise<void>;
}

/**
 * Default scan settings
 */
const DEFAULT_SCAN_SETTINGS: ScanSettings = {
  resolution: 300,
  colorMode: 'color',
  paperSize: 'auto',
  duplex: false,
  useADF: false,
  brightness: 0,
  contrast: 0,
  autoDetect: true,
  autoCorrect: true,
};

/**
 * Scanner Provider - Unified scanner interface
 */
export class ScannerProvider {
  private static instance: ScannerProvider;
  private platformScanners: Map<ScannerPlatform, PlatformScanner> = new Map();
  private availableDevices: ScannerDevice[] = [];
  private selectedDevice: ScannerDevice | null = null;
  private listeners: Map<ScanEvent, ScanEventCallback[]> = new Map();
  private isInitialized = false;
  private isScanning = false;

  private constructor() {}

  /**
   * Get singleton instance
   */
  static getInstance(): ScannerProvider {
    if (!ScannerProvider.instance) {
      ScannerProvider.instance = new ScannerProvider();
    }
    return ScannerProvider.instance;
  }

  /**
   * Register a platform scanner
   */
  registerPlatformScanner(scanner: PlatformScanner): void {
    this.platformScanners.set(scanner.platform, scanner);
  }

  /**
   * Initialize all available platform scanners
   */
  async initialize(): Promise<boolean> {
    if (this.isInitialized) {
      return true;
    }

    let anyAvailable = false;

    for (const [platform, scanner] of this.platformScanners) {
      try {
        const available = await scanner.isAvailable();
        if (available) {
          const initialized = await scanner.initialize();
          if (initialized) {
            anyAvailable = true;
            console.log(`Scanner platform ${platform} initialized`);
          }
        }
      } catch (error) {
        console.error(`Failed to initialize ${platform}:`, error);
      }
    }

    this.isInitialized = anyAvailable;
    return anyAvailable;
  }

  /**
   * Enumerate all available scanner devices
   */
  async enumerateDevices(): Promise<ScannerDevice[]> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    this.availableDevices = [];

    for (const scanner of this.platformScanners.values()) {
      try {
        const available = await scanner.isAvailable();
        if (available) {
          const devices = await scanner.enumerateDevices();
          this.availableDevices.push(...devices);
        }
      } catch (error) {
        console.error('Failed to enumerate devices:', error);
      }
    }

    return this.availableDevices;
  }

  /**
   * Get all available devices
   */
  getAvailableDevices(): ScannerDevice[] {
    return [...this.availableDevices];
  }

  /**
   * Select a scanner device
   */
  async selectDevice(deviceId: string): Promise<boolean> {
    const device = this.availableDevices.find((d) => d.id === deviceId);
    if (!device) {
      return false;
    }

    const scanner = this.platformScanners.get(device.platform);
    if (!scanner) {
      return false;
    }

    const selected = await scanner.selectDevice(deviceId);
    if (selected) {
      this.selectedDevice = device;
      return true;
    }

    return false;
  }

  /**
   * Get selected device
   */
  getSelectedDevice(): ScannerDevice | null {
    return this.selectedDevice;
  }

  /**
   * Perform a single scan
   */
  async scan(settings: Partial<ScanSettings> = {}): Promise<ScanResult> {
    if (!this.selectedDevice) {
      return { success: false, error: 'No scanner selected' };
    }

    if (this.isScanning) {
      return { success: false, error: 'Scan already in progress' };
    }

    const scanner = this.platformScanners.get(this.selectedDevice.platform);
    if (!scanner) {
      return { success: false, error: 'Scanner platform not available' };
    }

    const fullSettings: ScanSettings = {
      ...DEFAULT_SCAN_SETTINGS,
      ...settings,
    };

    this.isScanning = true;
    this.emit('scanStarted', undefined);

    try {
      const result = await scanner.scan(fullSettings);

      if (result.success) {
        this.emit('scanCompleted', result);
      } else {
        this.emit('scanError', result);
      }

      return result;
    } catch (error) {
      const errorResult: ScanResult = {
        success: false,
        error: error instanceof Error ? error.message : 'Scan failed',
      };
      this.emit('scanError', errorResult);
      return errorResult;
    } finally {
      this.isScanning = false;
    }
  }

  /**
   * Perform batch scan (multiple pages)
   */
  async batchScan(
    settings: Partial<ScanSettings> = {},
    onProgress?: ScanProgressCallback
  ): Promise<BatchScanResult> {
    if (!this.selectedDevice) {
      return { success: false, pageCount: 0, pages: [], error: 'No scanner selected' };
    }

    const pages: ScanResult[] = [];
    let pageIndex = 0;
    let continueScanning = true;

    // For ADF, scan until no more pages
    // For flatbed, prompt user for each page
    const useADF = settings.useADF && this.selectedDevice.capabilities.hasADF;

    while (continueScanning) {
      onProgress?.(pageIndex + 1, -1); // -1 indicates unknown total

      const result = await this.scan(settings);

      if (result.success) {
        pages.push(result);
        pageIndex++;
        this.emit('pageScanned', result);
      } else {
        // For ADF, error usually means no more pages
        if (useADF) {
          continueScanning = false;
        } else {
          return {
            success: pages.length > 0,
            pageCount: pages.length,
            pages,
            error: result.error,
          };
        }
      }

      // For flatbed, we'd need user confirmation to continue
      // This is handled by the UI layer
      if (!useADF) {
        continueScanning = false;
      }
    }

    return {
      success: pages.length > 0,
      pageCount: pages.length,
      pages,
    };
  }

  /**
   * Cancel ongoing scan
   */
  async cancelScan(): Promise<void> {
    if (!this.selectedDevice || !this.isScanning) {
      return;
    }

    const scanner = this.platformScanners.get(this.selectedDevice.platform);
    if (scanner) {
      await scanner.cancelScan();
    }

    this.isScanning = false;
  }

  /**
   * Check if currently scanning
   */
  isScanInProgress(): boolean {
    return this.isScanning;
  }

  /**
   * Subscribe to scan events
   */
  on(event: ScanEvent, callback: ScanEventCallback): void {
    const callbacks = this.listeners.get(event) || [];
    callbacks.push(callback);
    this.listeners.set(event, callbacks);
  }

  /**
   * Unsubscribe from scan events
   */
  off(event: ScanEvent, callback: ScanEventCallback): void {
    const callbacks = this.listeners.get(event) || [];
    const index = callbacks.indexOf(callback);
    if (index !== -1) {
      callbacks.splice(index, 1);
      this.listeners.set(event, callbacks);
    }
  }

  /**
   * Emit event
   */
  private emit(event: ScanEvent, data: ScanResult | ScannerDevice | { progress: number } | undefined): void {
    const callbacks = this.listeners.get(event) || [];
    for (const callback of callbacks) {
      try {
        callback(event, data);
      } catch (error) {
        console.error('Scan event callback error:', error);
      }
    }
  }

  /**
   * Dispose all resources
   */
  async dispose(): Promise<void> {
    for (const scanner of this.platformScanners.values()) {
      try {
        await scanner.dispose();
      } catch (error) {
        console.error('Failed to dispose scanner:', error);
      }
    }

    this.platformScanners.clear();
    this.availableDevices = [];
    this.selectedDevice = null;
    this.isInitialized = false;
  }

  /**
   * Get default scan settings
   */
  static getDefaultSettings(): ScanSettings {
    return { ...DEFAULT_SCAN_SETTINGS };
  }
}

// Export singleton
export const scannerProvider = ScannerProvider.getInstance();

export default ScannerProvider;
