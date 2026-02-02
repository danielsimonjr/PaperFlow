/**
 * System Tray Manager
 *
 * Manages system tray icon with platform-specific sizing,
 * status indicators, and tooltip updates.
 */

import { Tray, nativeImage, NativeImage, app } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';

// ESM __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Tray icon status types
 */
export type TrayStatus = 'idle' | 'busy' | 'notification' | 'error';

/**
 * Progress info for tooltip
 */
export interface TrayProgressInfo {
  operation: string;
  percent?: number;
  detail?: string;
}

/**
 * Tray manager configuration
 */
export interface TrayManagerConfig {
  onTrayClick?: () => void;
  onTrayDoubleClick?: () => void;
  onTrayRightClick?: () => void;
}

/**
 * Platform-specific icon sizes
 */
const ICON_SIZES = {
  win32: 16, // Windows uses 16x16 in system tray
  darwin: 22, // macOS uses 22x22 (template images)
  linux: 24, // Linux commonly uses 24x24
};

/**
 * TrayManager Class
 *
 * Handles all system tray operations including icon management,
 * status indicators, and tooltip updates.
 */
export class TrayManager {
  private tray: Tray | null = null;
  private status: TrayStatus = 'idle';
  private progressInfo: TrayProgressInfo | null = null;
  private notificationCount = 0;
  private config: TrayManagerConfig;
  private icons: Map<TrayStatus, NativeImage> = new Map();
  private isInitialized = false;

  constructor(config: TrayManagerConfig = {}) {
    this.config = config;
  }

  /**
   * Initialize the system tray
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      // Load icons
      await this.loadIcons();

      // Create tray with idle icon
      const idleIcon = this.icons.get('idle');
      if (!idleIcon) {
        throw new Error('Failed to load tray icon');
      }

      this.tray = new Tray(idleIcon);
      this.tray.setToolTip(this.getDefaultTooltip());

      // Set up event handlers
      this.setupEventHandlers();

      this.isInitialized = true;
      console.log('[TrayManager] System tray initialized');
    } catch (error) {
      console.error('[TrayManager] Failed to initialize:', error);
      throw error;
    }
  }

  /**
   * Get the Tray instance
   */
  getTray(): Tray | null {
    return this.tray;
  }

  /**
   * Check if tray is initialized
   */
  isReady(): boolean {
    return this.isInitialized && this.tray !== null;
  }

  /**
   * Set tray status and update icon
   */
  setStatus(status: TrayStatus): void {
    if (!this.tray) return;

    this.status = status;
    const icon = this.icons.get(status);
    if (icon) {
      this.tray.setImage(icon);
    }

    this.updateTooltip();
  }

  /**
   * Get current status
   */
  getStatus(): TrayStatus {
    return this.status;
  }

  /**
   * Set progress information for tooltip
   */
  setProgress(info: TrayProgressInfo | null): void {
    this.progressInfo = info;
    if (info) {
      this.setStatus('busy');
    } else {
      this.setStatus('idle');
    }
    this.updateTooltip();
  }

  /**
   * Set notification count
   */
  setNotificationCount(count: number): void {
    this.notificationCount = count;
    if (count > 0 && this.status === 'idle') {
      this.setStatus('notification');
    } else if (count === 0 && this.status === 'notification') {
      this.setStatus('idle');
    }
    this.updateTooltip();
  }

  /**
   * Increment notification count
   */
  incrementNotificationCount(): void {
    this.setNotificationCount(this.notificationCount + 1);
  }

  /**
   * Clear notification count
   */
  clearNotificationCount(): void {
    this.setNotificationCount(0);
  }

  /**
   * Get notification count
   */
  getNotificationCount(): number {
    return this.notificationCount;
  }

  /**
   * Set tooltip text directly
   */
  setTooltip(text: string): void {
    if (this.tray) {
      this.tray.setToolTip(text);
    }
  }

  /**
   * Flash the tray icon (for attention)
   */
  flash(duration: number = 500): void {
    if (!this.tray) return;

    const originalIcon = this.icons.get(this.status);
    const notificationIcon = this.icons.get('notification');

    if (!originalIcon || !notificationIcon) return;

    // Toggle between icons
    let isOriginal = true;
    const interval = setInterval(() => {
      if (this.tray) {
        this.tray.setImage(isOriginal ? notificationIcon : originalIcon);
        isOriginal = !isOriginal;
      }
    }, 250);

    // Stop flashing after duration
    setTimeout(() => {
      clearInterval(interval);
      if (this.tray && originalIcon) {
        this.tray.setImage(originalIcon);
      }
    }, duration);
  }

  /**
   * Destroy the tray
   */
  destroy(): void {
    if (this.tray) {
      this.tray.destroy();
      this.tray = null;
    }
    this.isInitialized = false;
    console.log('[TrayManager] System tray destroyed');
  }

  /**
   * Load platform-specific icons
   */
  private async loadIcons(): Promise<void> {
    const platform = process.platform;
    const size = ICON_SIZES[platform as keyof typeof ICON_SIZES] || 16;
    const isMac = platform === 'darwin';

    // Build icon paths - look in resources for packaged app, build folder for dev
    const basePath = app.isPackaged
      ? path.join(process.resourcesPath, 'icons')
      : path.join(__dirname, '../build/icons');

    // Define icon variants
    const iconVariants: TrayStatus[] = ['idle', 'busy', 'notification', 'error'];

    for (const variant of iconVariants) {
      try {
        let icon: NativeImage;
        const iconName = variant === 'idle' ? 'tray-icon' : `tray-icon-${variant}`;

        if (isMac) {
          // macOS uses template images for proper dark/light mode support
          const templatePath = path.join(basePath, `${iconName}Template.png`);
          const template2xPath = path.join(basePath, `${iconName}Template@2x.png`);

          icon = nativeImage.createFromPath(templatePath);

          // Try to add 2x version for Retina displays
          try {
            const icon2x = nativeImage.createFromPath(template2xPath);
            if (!icon2x.isEmpty()) {
              icon.addRepresentation({
                scaleFactor: 2,
                width: size * 2,
                height: size * 2,
                buffer: icon2x.toPNG(),
              });
            }
          } catch {
            // 2x version not available, continue with 1x
          }

          icon.setTemplateImage(true);
        } else {
          // Windows and Linux use regular icons
          const iconPath = path.join(basePath, `${iconName}.png`);
          icon = nativeImage.createFromPath(iconPath);
        }

        // If icon couldn't be loaded, create a fallback
        if (icon.isEmpty()) {
          icon = this.createFallbackIcon(size, variant);
        }

        // Resize to proper size
        icon = icon.resize({ width: size, height: size });

        this.icons.set(variant, icon);
      } catch (error) {
        console.warn(`[TrayManager] Failed to load ${variant} icon, using fallback:`, error);
        this.icons.set(variant, this.createFallbackIcon(size, variant));
      }
    }
  }

  /**
   * Create a simple fallback icon
   */
  private createFallbackIcon(size: number, variant: TrayStatus): NativeImage {
    // Create a simple colored square as fallback
    const colors: Record<TrayStatus, string> = {
      idle: '#3B82F6', // Blue
      busy: '#F59E0B', // Orange
      notification: '#10B981', // Green
      error: '#EF4444', // Red
    };

    const color = colors[variant];

    // Create a simple SVG
    const svg = `
      <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
        <rect width="${size}" height="${size}" rx="2" fill="${color}"/>
        <text x="50%" y="50%" font-size="${size * 0.6}" fill="white"
              text-anchor="middle" dominant-baseline="central" font-family="sans-serif">P</text>
      </svg>
    `;

    return nativeImage.createFromBuffer(Buffer.from(svg));
  }

  /**
   * Set up tray event handlers
   */
  private setupEventHandlers(): void {
    if (!this.tray) return;

    // Single click - restore window (Windows/Linux) or show menu (macOS)
    this.tray.on('click', () => {
      if (this.config.onTrayClick) {
        this.config.onTrayClick();
      }
    });

    // Double click - restore window
    this.tray.on('double-click', () => {
      if (this.config.onTrayDoubleClick) {
        this.config.onTrayDoubleClick();
      }
    });

    // Right click - show context menu
    this.tray.on('right-click', () => {
      if (this.config.onTrayRightClick) {
        this.config.onTrayRightClick();
      }
    });
  }

  /**
   * Update tooltip based on current state
   */
  private updateTooltip(): void {
    if (!this.tray) return;

    let tooltip = this.getDefaultTooltip();

    // Add progress info if available
    if (this.progressInfo) {
      tooltip += `\n${this.progressInfo.operation}`;
      if (this.progressInfo.percent !== undefined) {
        tooltip += `: ${Math.round(this.progressInfo.percent)}%`;
      }
      if (this.progressInfo.detail) {
        tooltip += `\n${this.progressInfo.detail}`;
      }
    }

    // Add notification count if any
    if (this.notificationCount > 0) {
      tooltip += `\n${this.notificationCount} notification${this.notificationCount > 1 ? 's' : ''}`;
    }

    // Add status if not idle
    if (this.status === 'error') {
      tooltip += '\nStatus: Error';
    }

    this.tray.setToolTip(tooltip);
  }

  /**
   * Get default tooltip text
   */
  private getDefaultTooltip(): string {
    return `PaperFlow${app.isPackaged ? '' : ' (Development)'}`;
  }
}

// Singleton instance
let trayManager: TrayManager | null = null;

/**
 * Get or create the tray manager instance
 */
export function getTrayManager(): TrayManager {
  if (!trayManager) {
    trayManager = new TrayManager();
  }
  return trayManager;
}

/**
 * Initialize the tray manager with configuration
 */
export async function initializeTray(config?: TrayManagerConfig): Promise<TrayManager> {
  if (trayManager) {
    trayManager.destroy();
  }
  trayManager = new TrayManager(config);
  await trayManager.initialize();
  return trayManager;
}

/**
 * Destroy the tray manager
 */
export function destroyTray(): void {
  if (trayManager) {
    trayManager.destroy();
    trayManager = null;
  }
}
