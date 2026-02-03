/**
 * Windows Thumbnail Toolbar
 *
 * Adds navigation and action buttons to the Windows taskbar thumbnail preview.
 */

import { BrowserWindow, ThumbarButton, nativeImage, NativeImage } from 'electron';

/**
 * Thumbnail toolbar button IDs
 */
export type ThumbnailButtonId = 'previousPage' | 'nextPage' | 'zoomIn' | 'zoomOut' | 'save';

/**
 * Thumbnail button state
 */
interface ThumbnailButtonState {
  enabled: boolean;
  visible: boolean;
}

/**
 * Event handler for thumbnail toolbar actions
 */
type ThumbnailToolbarHandler = (buttonId: ThumbnailButtonId) => void;

/**
 * Thumbnail Toolbar Manager
 */
export class ThumbnailToolbarManager {
  private window: BrowserWindow | null = null;
  private handler: ThumbnailToolbarHandler | null = null;
  private buttonStates: Map<ThumbnailButtonId, ThumbnailButtonState> = new Map();
  private icons: Map<ThumbnailButtonId, NativeImage> = new Map();

  constructor() {
    if (process.platform !== 'win32') {
      console.log('[ThumbnailToolbar] Not Windows, thumbnail toolbar disabled');
      return;
    }

    this.initializeButtonStates();
    this.initializeIcons();
  }

  /**
   * Initialize button states
   */
  private initializeButtonStates(): void {
    const buttons: ThumbnailButtonId[] = ['previousPage', 'nextPage', 'zoomIn', 'zoomOut', 'save'];

    for (const button of buttons) {
      this.buttonStates.set(button, { enabled: true, visible: true });
    }
  }

  /**
   * Initialize button icons
   */
  private initializeIcons(): void {
    // Create simple SVG icons
    // In production, these would be loaded from actual icon files

    this.icons.set('previousPage', this.createIcon('\u25C0')); // ◀
    this.icons.set('nextPage', this.createIcon('\u25B6')); // ▶
    this.icons.set('zoomIn', this.createIcon('+')); // +
    this.icons.set('zoomOut', this.createIcon('-')); // -
    this.icons.set('save', this.createIcon('\u2193')); // ↓
  }

  /**
   * Create a simple icon with a character
   */
  private createIcon(char: string): NativeImage {
    const size = 16;
    const svg = `
      <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
        <rect width="${size}" height="${size}" fill="transparent" />
        <text x="50%" y="50%" dominant-baseline="central" text-anchor="middle"
              font-family="Segoe UI Symbol, Arial" font-size="12" fill="#ffffff">${char}</text>
      </svg>
    `;

    const dataUrl = `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
    return nativeImage.createFromDataURL(dataUrl);
  }

  /**
   * Set the window to show toolbar on
   */
  setWindow(window: BrowserWindow): void {
    this.window = window;
    this.updateToolbar();
  }

  /**
   * Set event handler for button clicks
   */
  setHandler(handler: ThumbnailToolbarHandler): void {
    this.handler = handler;
  }

  /**
   * Update the thumbnail toolbar
   */
  updateToolbar(): void {
    if (!this.window || process.platform !== 'win32') return;

    const buttons: ThumbarButton[] = [];

    // Previous page
    const prevState = this.buttonStates.get('previousPage');
    if (prevState?.visible) {
      buttons.push({
        tooltip: 'Previous Page',
        icon: this.icons.get('previousPage')!,
        flags: prevState.enabled ? [] : ['disabled'],
        click: () => this.handleClick('previousPage'),
      });
    }

    // Next page
    const nextState = this.buttonStates.get('nextPage');
    if (nextState?.visible) {
      buttons.push({
        tooltip: 'Next Page',
        icon: this.icons.get('nextPage')!,
        flags: nextState.enabled ? [] : ['disabled'],
        click: () => this.handleClick('nextPage'),
      });
    }

    // Separator (using dismissonclick to create visual break)
    buttons.push({
      tooltip: '',
      icon: nativeImage.createEmpty(),
      flags: ['nobackground', 'noninteractive'],
      click: () => {},
    });

    // Zoom in
    const zoomInState = this.buttonStates.get('zoomIn');
    if (zoomInState?.visible) {
      buttons.push({
        tooltip: 'Zoom In',
        icon: this.icons.get('zoomIn')!,
        flags: zoomInState.enabled ? [] : ['disabled'],
        click: () => this.handleClick('zoomIn'),
      });
    }

    // Zoom out
    const zoomOutState = this.buttonStates.get('zoomOut');
    if (zoomOutState?.visible) {
      buttons.push({
        tooltip: 'Zoom Out',
        icon: this.icons.get('zoomOut')!,
        flags: zoomOutState.enabled ? [] : ['disabled'],
        click: () => this.handleClick('zoomOut'),
      });
    }

    this.window.setThumbarButtons(buttons);
  }

  /**
   * Handle button click
   */
  private handleClick(buttonId: ThumbnailButtonId): void {
    if (this.handler) {
      this.handler(buttonId);
    }
  }

  /**
   * Enable/disable a button
   */
  setButtonEnabled(buttonId: ThumbnailButtonId, enabled: boolean): void {
    const state = this.buttonStates.get(buttonId);
    if (state) {
      state.enabled = enabled;
      this.updateToolbar();
    }
  }

  /**
   * Show/hide a button
   */
  setButtonVisible(buttonId: ThumbnailButtonId, visible: boolean): void {
    const state = this.buttonStates.get(buttonId);
    if (state) {
      state.visible = visible;
      this.updateToolbar();
    }
  }

  /**
   * Update navigation button states based on page position
   */
  updateNavigation(currentPage: number, totalPages: number): void {
    this.setButtonEnabled('previousPage', currentPage > 1);
    this.setButtonEnabled('nextPage', currentPage < totalPages);
  }

  /**
   * Clear the toolbar
   */
  clear(): void {
    if (this.window && process.platform === 'win32') {
      this.window.setThumbarButtons([]);
    }
  }
}

// Singleton instance
let thumbnailToolbarManager: ThumbnailToolbarManager | null = null;

/**
 * Get or create thumbnail toolbar manager
 */
export function getThumbnailToolbarManager(): ThumbnailToolbarManager {
  if (!thumbnailToolbarManager) {
    thumbnailToolbarManager = new ThumbnailToolbarManager();
  }
  return thumbnailToolbarManager;
}

/**
 * Initialize thumbnail toolbar for a window
 */
export function initializeThumbnailToolbar(
  window: BrowserWindow,
  handler: ThumbnailToolbarHandler
): ThumbnailToolbarManager {
  const manager = getThumbnailToolbarManager();
  manager.setWindow(window);
  manager.setHandler(handler);
  return manager;
}
