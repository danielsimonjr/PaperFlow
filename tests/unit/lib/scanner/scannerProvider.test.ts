/**
 * Scanner Provider Tests
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach } from 'vitest';
import { ScannerProvider } from '@lib/scanner/scannerProvider';
import type { PlatformScanner, ScannerDevice, ScanResult } from '@lib/scanner/types';

// Mock platform scanner
const createMockScanner = (devices: ScannerDevice[] = []): PlatformScanner => ({
  platform: 'mock' as any,
  initialize: async () => true,
  isAvailable: async () => true,
  enumerateDevices: async () => devices,
  selectDevice: async () => true,
  scan: async (): Promise<ScanResult> => ({
    success: true,
    dataUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    width: 100,
    height: 100,
    resolution: 300,
    colorMode: 'color',
    timestamp: Date.now(),
  }),
  cancelScan: async () => {},
  dispose: async () => {},
});

describe('ScannerProvider', () => {
  // Provider instance obtained for each test setup
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let provider: ScannerProvider;

  beforeEach(() => {
    // Get fresh instance
    provider = ScannerProvider.getInstance();
  });

  describe('device enumeration', () => {
    it('should return empty array when no scanners registered', async () => {
      const newProvider = new (ScannerProvider as any)();
      const devices = await newProvider.enumerateDevices();
      expect(devices).toEqual([]);
    });

    it('should enumerate devices from registered scanner', async () => {
      const mockDevices: ScannerDevice[] = [
        {
          id: 'scanner-1',
          name: 'Test Scanner',
          manufacturer: 'Test',
          available: true,
          platform: 'mock' as any,
          capabilities: {
            hasFlatbed: true,
            hasADF: false,
            duplex: false,
            resolutions: [300],
            colorModes: ['color'],
            paperSizes: ['letter'],
            maxWidth: 8.5,
            maxHeight: 11,
          },
        },
      ];

      const newProvider = new (ScannerProvider as any)();
      newProvider.registerPlatformScanner(createMockScanner(mockDevices));

      const devices = await newProvider.enumerateDevices();
      expect(devices.length).toBe(1);
      expect(devices[0].name).toBe('Test Scanner');
    });

    it('should merge devices from multiple scanners', async () => {
      const devices1: ScannerDevice[] = [
        {
          id: 'scanner-1',
          name: 'Scanner One',
          available: true,
          platform: 'mock' as any,
          capabilities: {
            hasFlatbed: true,
            hasADF: false,
            duplex: false,
            resolutions: [300],
            colorModes: ['color'],
            paperSizes: ['letter'],
            maxWidth: 8.5,
            maxHeight: 11,
          },
        },
      ];

      const devices2: ScannerDevice[] = [
        {
          id: 'scanner-2',
          name: 'Scanner Two',
          available: true,
          platform: 'mock2' as any,
          capabilities: {
            hasFlatbed: true,
            hasADF: false,
            duplex: false,
            resolutions: [300],
            colorModes: ['color'],
            paperSizes: ['letter'],
            maxWidth: 8.5,
            maxHeight: 11,
          },
        },
      ];

      const newProvider = new (ScannerProvider as any)();
      newProvider.registerPlatformScanner(createMockScanner(devices1));
      newProvider.registerPlatformScanner({
        ...createMockScanner(devices2),
        platform: 'mock2',
      });

      const devices = await newProvider.enumerateDevices();
      expect(devices.length).toBe(2);
    });
  });

  describe('scanning', () => {
    it('should perform a scan with selected device', async () => {
      const mockDevices: ScannerDevice[] = [
        {
          id: 'scanner-1',
          name: 'Test Scanner',
          available: true,
          platform: 'mock' as any,
          capabilities: {
            hasFlatbed: true,
            hasADF: false,
            duplex: false,
            resolutions: [300],
            colorModes: ['color'],
            paperSizes: ['letter'],
            maxWidth: 8.5,
            maxHeight: 11,
          },
        },
      ];

      const newProvider = new (ScannerProvider as any)();
      newProvider.registerPlatformScanner(createMockScanner(mockDevices));

      // Must enumerate devices before selecting
      await newProvider.enumerateDevices();
      await newProvider.selectDevice('scanner-1');
      const result = await newProvider.scan();

      expect(result.success).toBe(true);
      expect(result.dataUrl).toBeDefined();
    });

    it('should return error when scanning without device selected', async () => {
      const newProvider = new (ScannerProvider as any)();
      newProvider.registerPlatformScanner(createMockScanner([]));

      const result = await newProvider.scan();
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('batch scanning', () => {
    it('should perform batch scan', async () => {
      const mockDevices: ScannerDevice[] = [
        {
          id: 'scanner-1',
          name: 'Test Scanner',
          available: true,
          platform: 'mock' as any,
          capabilities: {
            hasFlatbed: true,
            hasADF: true,
            duplex: false,
            resolutions: [300],
            colorModes: ['color'],
            paperSizes: ['letter'],
            maxWidth: 8.5,
            maxHeight: 11,
          },
        },
      ];

      const newProvider = new (ScannerProvider as any)();
      newProvider.registerPlatformScanner(createMockScanner(mockDevices));

      // Must enumerate devices before selecting
      await newProvider.enumerateDevices();
      await newProvider.selectDevice('scanner-1');
      const result = await newProvider.batchScan({ maxPages: 3 });

      expect(result.success).toBe(true);
      // Result uses 'pages' not 'scans'
      expect(result.pages).toBeDefined();
      expect(result.pages.length).toBeGreaterThan(0);
    });
  });

  describe('capabilities', () => {
    it('should return device capabilities from selected device', async () => {
      const mockDevices: ScannerDevice[] = [
        {
          id: 'scanner-1',
          name: 'Test Scanner',
          available: true,
          platform: 'mock' as any,
          capabilities: {
            hasFlatbed: true,
            hasADF: false,
            duplex: false,
            resolutions: [150, 300, 600],
            colorModes: ['color', 'grayscale'],
            paperSizes: ['letter', 'a4'],
            maxWidth: 8.5,
            maxHeight: 11,
          },
        },
      ];

      const newProvider = new (ScannerProvider as any)();
      newProvider.registerPlatformScanner(createMockScanner(mockDevices));

      // Must enumerate devices before selecting
      await newProvider.enumerateDevices();
      await newProvider.selectDevice('scanner-1');
      // ScannerProvider stores capabilities on the device itself
      const selectedDevice = newProvider.getSelectedDevice();

      expect(selectedDevice).toBeDefined();
      expect(selectedDevice).not.toBeNull();
      expect(selectedDevice!.capabilities.hasFlatbed).toBe(true);
      expect(selectedDevice!.capabilities.resolutions).toContain(300);
      expect(selectedDevice!.capabilities.colorModes).toContain('color');
    });
  });
});
