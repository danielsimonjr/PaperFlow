/**
 * Printer Discovery Service
 *
 * Discovers and enumerates available printers with capabilities,
 * status, and default printer detection.
 */

import { BrowserWindow } from 'electron';
import type {
  ExtendedPrinterInfo,
  PrinterStatus,
} from './types';
import { PrinterManager } from './printerManager';

/**
 * Discovery event types
 */
export type PrinterDiscoveryEvent =
  | 'printerAdded'
  | 'printerRemoved'
  | 'printerStatusChanged'
  | 'defaultPrinterChanged';

/**
 * Discovery event callback
 */
export type PrinterDiscoveryCallback = (
  event: PrinterDiscoveryEvent,
  printer: ExtendedPrinterInfo
) => void;

/**
 * Printer discovery service
 */
export class PrinterDiscovery {
  private static listeners: Map<string, PrinterDiscoveryCallback[]> = new Map();
  private static pollInterval: NodeJS.Timer | null = null;
  private static previousPrinters: Map<string, ExtendedPrinterInfo> = new Map();
  private static isPolling = false;
  private static pollFrequency = 5000; // 5 seconds

  /**
   * Start printer discovery
   */
  static start(frequency: number = 5000): void {
    if (this.isPolling) {
      return;
    }

    this.pollFrequency = frequency;
    this.isPolling = true;

    // Initial discovery
    this.discover();

    // Set up polling
    this.pollInterval = setInterval(() => {
      this.discover();
    }, this.pollFrequency);
  }

  /**
   * Stop printer discovery
   */
  static stop(): void {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
    this.isPolling = false;
  }

  /**
   * Perform discovery
   */
  static async discover(): Promise<ExtendedPrinterInfo[]> {
    const window = BrowserWindow.getAllWindows()[0];
    if (!window) {
      return [];
    }

    try {
      await PrinterManager.refreshPrinters(window);
      const printers = await PrinterManager.getPrinters(window);

      this.detectChanges(printers);

      return printers;
    } catch (error) {
      console.error('Printer discovery error:', error);
      return [];
    }
  }

  /**
   * Detect changes in printer list
   */
  private static detectChanges(currentPrinters: ExtendedPrinterInfo[]): void {
    const currentMap = new Map<string, ExtendedPrinterInfo>();

    for (const printer of currentPrinters) {
      currentMap.set(printer.name, printer);

      const previous = this.previousPrinters.get(printer.name);

      if (!previous) {
        // New printer added
        this.emit('printerAdded', printer);
      } else {
        // Check for status changes
        if (previous.status !== printer.status) {
          this.emit('printerStatusChanged', printer);
        }

        // Check for default printer change
        if (!previous.isDefault && printer.isDefault) {
          this.emit('defaultPrinterChanged', printer);
        }
      }
    }

    // Check for removed printers
    for (const [name, printer] of this.previousPrinters) {
      if (!currentMap.has(name)) {
        this.emit('printerRemoved', printer);
      }
    }

    this.previousPrinters = currentMap;
  }

  /**
   * Add event listener
   */
  static on(event: PrinterDiscoveryEvent, callback: PrinterDiscoveryCallback): void {
    const callbacks = this.listeners.get(event) || [];
    callbacks.push(callback);
    this.listeners.set(event, callbacks);
  }

  /**
   * Remove event listener
   */
  static off(event: PrinterDiscoveryEvent, callback: PrinterDiscoveryCallback): void {
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
  private static emit(event: PrinterDiscoveryEvent, printer: ExtendedPrinterInfo): void {
    const callbacks = this.listeners.get(event) || [];
    for (const callback of callbacks) {
      try {
        callback(event, printer);
      } catch (error) {
        console.error('Printer discovery callback error:', error);
      }
    }
  }

  /**
   * Get all discovered printers
   */
  static async getAll(): Promise<ExtendedPrinterInfo[]> {
    return this.discover();
  }

  /**
   * Get printers by status
   */
  static async getByStatus(status: PrinterStatus): Promise<ExtendedPrinterInfo[]> {
    const printers = await this.getAll();
    return printers.filter((p) => p.statusInfo?.status === status);
  }

  /**
   * Get online printers
   */
  static async getOnlinePrinters(): Promise<ExtendedPrinterInfo[]> {
    const printers = await this.getAll();
    return printers.filter(
      (p) => p.statusInfo?.status !== 'offline' && p.statusInfo?.status !== 'error'
    );
  }

  /**
   * Get network printers
   */
  static async getNetworkPrinters(): Promise<ExtendedPrinterInfo[]> {
    const printers = await this.getAll();
    return printers.filter((p) => p.capabilities?.isNetworkPrinter);
  }

  /**
   * Get local printers
   */
  static async getLocalPrinters(): Promise<ExtendedPrinterInfo[]> {
    const printers = await this.getAll();
    return printers.filter((p) => !p.capabilities?.isNetworkPrinter);
  }

  /**
   * Get color printers
   */
  static async getColorPrinters(): Promise<ExtendedPrinterInfo[]> {
    const printers = await this.getAll();
    return printers.filter((p) => p.capabilities?.colorCapable);
  }

  /**
   * Get duplex printers
   */
  static async getDuplexPrinters(): Promise<ExtendedPrinterInfo[]> {
    const printers = await this.getAll();
    return printers.filter((p) => p.capabilities?.duplexCapable);
  }

  /**
   * Find printer by name (partial match)
   */
  static async findByName(name: string): Promise<ExtendedPrinterInfo[]> {
    const printers = await this.getAll();
    const lowerName = name.toLowerCase();
    return printers.filter(
      (p) =>
        p.name.toLowerCase().includes(lowerName) ||
        p.displayName.toLowerCase().includes(lowerName)
    );
  }

  /**
   * Check if discovery is running
   */
  static isRunning(): boolean {
    return this.isPolling;
  }

  /**
   * Set poll frequency
   */
  static setPollFrequency(frequency: number): void {
    this.pollFrequency = frequency;
    if (this.isPolling) {
      this.stop();
      this.start(frequency);
    }
  }

  /**
   * Clear all listeners
   */
  static clearListeners(): void {
    this.listeners.clear();
  }
}

export default PrinterDiscovery;
