/**
 * Printer Status Monitor
 *
 * Real-time printer status monitoring with paper, ink,
 * and error notifications.
 */

import { BrowserWindow } from 'electron';
import type {
  PrinterStatusInfo,
  InkStatus,
} from './types';
import { PrinterManager } from './printerManager';

/**
 * Monitor event types
 */
export type MonitorEvent =
  | 'statusChanged'
  | 'paperLow'
  | 'paperEmpty'
  | 'inkLow'
  | 'inkEmpty'
  | 'error'
  | 'printerOffline'
  | 'printerOnline';

/**
 * Monitor callback
 */
export type MonitorCallback = (
  event: MonitorEvent,
  printer: string,
  data?: PrinterStatusInfo
) => void;

/**
 * Printer monitor
 */
export class PrinterMonitor {
  private static pollInterval: NodeJS.Timer | null = null;
  private static previousStatus: Map<string, PrinterStatusInfo> = new Map();
  private static listeners: Map<MonitorEvent, MonitorCallback[]> = new Map();
  private static isMonitoring = false;
  private static pollFrequency = 10000; // 10 seconds
  private static watchedPrinters: Set<string> = new Set();

  /**
   * Start monitoring all printers
   */
  static startMonitoring(frequency: number = 10000): void {
    if (this.isMonitoring) {
      return;
    }

    this.pollFrequency = frequency;
    this.isMonitoring = true;

    // Initial check
    this.checkAllPrinters();

    // Set up polling
    this.pollInterval = setInterval(() => {
      this.checkAllPrinters();
    }, this.pollFrequency);
  }

  /**
   * Stop monitoring
   */
  static stopMonitoring(): void {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
    this.isMonitoring = false;
  }

  /**
   * Watch a specific printer
   */
  static watchPrinter(name: string): void {
    this.watchedPrinters.add(name);
  }

  /**
   * Stop watching a specific printer
   */
  static unwatchPrinter(name: string): void {
    this.watchedPrinters.delete(name);
    this.previousStatus.delete(name);
  }

  /**
   * Check all printers
   */
  private static async checkAllPrinters(): Promise<void> {
    const window = BrowserWindow.getAllWindows()[0];
    if (!window) {
      return;
    }

    try {
      const printers = await PrinterManager.getPrinters(window);

      for (const printer of printers) {
        // Only check watched printers if list is not empty
        if (this.watchedPrinters.size > 0 && !this.watchedPrinters.has(printer.name)) {
          continue;
        }

        const currentStatus = await PrinterManager.getPrinterStatus(printer.name, window);
        if (!currentStatus) continue;

        const previousStatus = this.previousStatus.get(printer.name);

        if (!previousStatus) {
          // First check, just store status
          this.previousStatus.set(printer.name, currentStatus);
          continue;
        }

        // Check for changes
        this.checkStatusChange(printer.name, previousStatus, currentStatus);
        this.previousStatus.set(printer.name, currentStatus);
      }
    } catch (error) {
      console.error('Printer monitoring error:', error);
    }
  }

  /**
   * Check for status changes
   */
  private static checkStatusChange(
    printerName: string,
    previous: PrinterStatusInfo,
    current: PrinterStatusInfo
  ): void {
    // Status changed
    if (previous.status !== current.status) {
      this.emit('statusChanged', printerName, current);

      // Online/offline
      if (previous.status !== 'offline' && current.status === 'offline') {
        this.emit('printerOffline', printerName, current);
      } else if (previous.status === 'offline' && current.status !== 'offline') {
        this.emit('printerOnline', printerName, current);
      }

      // Error
      if (current.status === 'error') {
        this.emit('error', printerName, current);
      }
    }

    // Paper status changed
    if (previous.paperStatus !== current.paperStatus) {
      if (current.paperStatus === 'low') {
        this.emit('paperLow', printerName, current);
      } else if (current.paperStatus === 'empty' || current.paperStatus === 'jam') {
        this.emit('paperEmpty', printerName, current);
      }
    }

    // Ink status changed
    this.checkInkStatus(printerName, previous.inkStatus, current.inkStatus, current);
  }

  /**
   * Check ink status changes
   */
  private static checkInkStatus(
    printerName: string,
    previous: InkStatus[] | undefined,
    current: InkStatus[] | undefined,
    statusInfo: PrinterStatusInfo
  ): void {
    if (!previous || !current) return;

    for (const currentInk of current) {
      const previousInk = previous.find((p) => p.color === currentInk.color);
      if (!previousInk) continue;

      // Low ink (less than 20%)
      if (previousInk.level >= 20 && currentInk.level < 20) {
        this.emit('inkLow', printerName, statusInfo);
      }

      // Empty ink (less than 5%)
      if (previousInk.level >= 5 && currentInk.level < 5) {
        this.emit('inkEmpty', printerName, statusInfo);
      }
    }
  }

  /**
   * Get current status for a printer
   */
  static getStatus(printerName: string): PrinterStatusInfo | undefined {
    return this.previousStatus.get(printerName);
  }

  /**
   * Get status for all monitored printers
   */
  static getAllStatus(): Map<string, PrinterStatusInfo> {
    return new Map(this.previousStatus);
  }

  /**
   * Subscribe to events
   */
  static on(event: MonitorEvent, callback: MonitorCallback): void {
    const callbacks = this.listeners.get(event) || [];
    callbacks.push(callback);
    this.listeners.set(event, callbacks);
  }

  /**
   * Unsubscribe from events
   */
  static off(event: MonitorEvent, callback: MonitorCallback): void {
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
  private static emit(
    event: MonitorEvent,
    printerName: string,
    data?: PrinterStatusInfo
  ): void {
    const callbacks = this.listeners.get(event) || [];
    for (const callback of callbacks) {
      try {
        callback(event, printerName, data);
      } catch (error) {
        console.error('Monitor callback error:', error);
      }
    }
  }

  /**
   * Check if monitoring is active
   */
  static isActive(): boolean {
    return this.isMonitoring;
  }

  /**
   * Set poll frequency
   */
  static setPollFrequency(frequency: number): void {
    this.pollFrequency = frequency;
    if (this.isMonitoring) {
      this.stopMonitoring();
      this.startMonitoring(frequency);
    }
  }

  /**
   * Clear all listeners
   */
  static clearListeners(): void {
    this.listeners.clear();
  }
}

export default PrinterMonitor;
