/**
 * Scanner Bridge
 *
 * Electron main process bridge for scanner operations.
 * Connects renderer process to native scanner drivers.
 */

import { ipcMain, IpcMainInvokeEvent } from 'electron';
import type {
  ScannerDevice,
  ScanSettings,
  ScanResult,
  BatchScanResult,
} from '../../../src/lib/scanner/types';

/**
 * Scanner IPC channels
 */
export const SCANNER_CHANNELS = {
  // Device management
  ENUMERATE_DEVICES: 'scanner-enumerate-devices',
  SELECT_DEVICE: 'scanner-select-device',
  GET_SELECTED_DEVICE: 'scanner-get-selected-device',
  GET_DEVICE_CAPABILITIES: 'scanner-get-device-capabilities',

  // Scanning
  SCAN: 'scanner-scan',
  BATCH_SCAN: 'scanner-batch-scan',
  CANCEL_SCAN: 'scanner-cancel-scan',
  GET_SCAN_STATUS: 'scanner-get-scan-status',

  // Preview
  PREVIEW_SCAN: 'scanner-preview-scan',

  // Events
  SCAN_PROGRESS: 'scanner-scan-progress',
  SCAN_COMPLETED: 'scanner-scan-completed',
  SCAN_ERROR: 'scanner-scan-error',
  DEVICE_CONNECTED: 'scanner-device-connected',
  DEVICE_DISCONNECTED: 'scanner-device-disconnected',
} as const;

/**
 * Mock scanner for development and testing
 */
class MockScanner {
  private devices: ScannerDevice[] = [
    {
      id: 'mock-scanner-1',
      name: 'PaperFlow Virtual Scanner',
      manufacturer: 'PaperFlow',
      model: 'Virtual Scanner Pro',
      platform: 'wia',
      available: true,
      capabilities: {
        resolutions: [75, 100, 150, 200, 300, 600],
        colorModes: ['color', 'grayscale', 'blackwhite'],
        duplex: true,
        hasADF: true,
        hasFlatbed: true,
        maxWidth: 8.5,
        maxHeight: 14,
        paperSizes: ['auto', 'letter', 'legal', 'a4'],
      },
    },
    {
      id: 'mock-scanner-2',
      name: 'Basic Flatbed Scanner',
      manufacturer: 'Generic',
      model: 'Flatbed 1000',
      platform: 'twain',
      available: true,
      capabilities: {
        resolutions: [75, 150, 300],
        colorModes: ['color', 'grayscale'],
        duplex: false,
        hasADF: false,
        hasFlatbed: true,
        maxWidth: 8.5,
        maxHeight: 11,
        paperSizes: ['auto', 'letter', 'a4'],
      },
    },
  ];

  private selectedDevice: ScannerDevice | null = null;
  private isScanning = false;

  async enumerateDevices(): Promise<ScannerDevice[]> {
    return this.devices;
  }

  async selectDevice(deviceId: string): Promise<boolean> {
    const device = this.devices.find((d) => d.id === deviceId);
    if (device) {
      this.selectedDevice = device;
      return true;
    }
    return false;
  }

  getSelectedDevice(): ScannerDevice | null {
    return this.selectedDevice;
  }

  async scan(settings: ScanSettings): Promise<ScanResult> {
    if (!this.selectedDevice) {
      return { success: false, error: 'No scanner selected' };
    }

    this.isScanning = true;

    // Simulate scan delay
    await new Promise((resolve) => setTimeout(resolve, 1500));

    this.isScanning = false;

    // Generate mock scan result
    const width = Math.round(settings.resolution * 8.5);
    const height = Math.round(settings.resolution * 11);

    // Create a simple gradient image as mock data
    const canvas = createMockCanvas(width, height, settings.colorMode);

    return {
      success: true,
      dataUrl: canvas,
      width,
      height,
      resolution: settings.resolution,
      colorMode: settings.colorMode,
    };
  }

  async cancelScan(): Promise<void> {
    this.isScanning = false;
  }

  isScanInProgress(): boolean {
    return this.isScanning;
  }
}

/**
 * Create mock canvas data URL
 * Note: Parameters are provided for future implementation of actual canvas generation
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function createMockCanvas(width: number, height: number, colorMode: string): string {
  // Return a data URL for a simple gray image
  // In production, this would be actual scan data
  return `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==`;
}

/**
 * Scanner Bridge class
 */
export class ScannerBridge {
  private static instance: ScannerBridge;
  private mockScanner = new MockScanner();
  private initialized = false;

  private constructor() {}

  static getInstance(): ScannerBridge {
    if (!ScannerBridge.instance) {
      ScannerBridge.instance = new ScannerBridge();
    }
    return ScannerBridge.instance;
  }

  /**
   * Initialize scanner bridge and register IPC handlers
   */
  initialize(): void {
    if (this.initialized) {
      return;
    }

    // Enumerate devices
    ipcMain.handle(SCANNER_CHANNELS.ENUMERATE_DEVICES, async () => {
      return this.mockScanner.enumerateDevices();
    });

    // Select device
    ipcMain.handle(
      SCANNER_CHANNELS.SELECT_DEVICE,
      async (_event: IpcMainInvokeEvent, deviceId: string) => {
        return this.mockScanner.selectDevice(deviceId);
      }
    );

    // Get selected device
    ipcMain.handle(SCANNER_CHANNELS.GET_SELECTED_DEVICE, async () => {
      return this.mockScanner.getSelectedDevice();
    });

    // Scan
    ipcMain.handle(
      SCANNER_CHANNELS.SCAN,
      async (_event: IpcMainInvokeEvent, settings: ScanSettings) => {
        return this.mockScanner.scan(settings);
      }
    );

    // Batch scan
    ipcMain.handle(
      SCANNER_CHANNELS.BATCH_SCAN,
      async (_event: IpcMainInvokeEvent, settings: ScanSettings, pageCount: number) => {
        const pages: ScanResult[] = [];

        for (let i = 0; i < pageCount; i++) {
          const result = await this.mockScanner.scan(settings);
          if (result.success) {
            pages.push(result);
          } else {
            break;
          }
        }

        return {
          success: pages.length > 0,
          pageCount: pages.length,
          pages,
        } as BatchScanResult;
      }
    );

    // Cancel scan
    ipcMain.handle(SCANNER_CHANNELS.CANCEL_SCAN, async () => {
      await this.mockScanner.cancelScan();
    });

    // Get scan status
    ipcMain.handle(SCANNER_CHANNELS.GET_SCAN_STATUS, async () => {
      return {
        isScanning: this.mockScanner.isScanInProgress(),
      };
    });

    // Preview scan (low-res quick scan)
    ipcMain.handle(
      SCANNER_CHANNELS.PREVIEW_SCAN,
      async () => {
        return this.mockScanner.scan({
          resolution: 75,
          colorMode: 'color',
          paperSize: 'auto',
        });
      }
    );

    this.initialized = true;
    console.log('[ScannerBridge] Initialized');
  }

  /**
   * Cleanup
   */
  dispose(): void {
    // Remove IPC handlers
    Object.values(SCANNER_CHANNELS).forEach((channel) => {
      ipcMain.removeHandler(channel);
    });

    this.initialized = false;
  }
}

// Export singleton instance creator
export function setupScannerBridge(): ScannerBridge {
  const bridge = ScannerBridge.getInstance();
  bridge.initialize();
  return bridge;
}

export default ScannerBridge;
