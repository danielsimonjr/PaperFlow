/**
 * Touch Bar Manager
 *
 * Manages macOS Touch Bar integration with context-aware layouts.
 * Automatically switches Touch Bar based on app context.
 */

import { BrowserWindow, TouchBar } from 'electron';

const {
  TouchBarButton,
  TouchBarSpacer,
  TouchBarSlider,
  TouchBarSegmentedControl,
  TouchBarColorPicker,
  TouchBarPopover,
  TouchBarGroup,
} = TouchBar;

/**
 * Touch Bar contexts
 */
export type TouchBarContext = 'viewer' | 'editor' | 'forms' | 'signature' | 'comparison';

/**
 * Touch Bar item definitions
 */
interface TouchBarItem {
  type: 'button' | 'slider' | 'segmented' | 'colorPicker' | 'spacer' | 'popover' | 'group';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  config: any;
}

/**
 * Touch Bar layout definition
 */
interface TouchBarLayout {
  items: TouchBarItem[];
}

/**
 * Touch Bar event handler
 */
type TouchBarEventHandler = (action: string, value?: unknown) => void;

/**
 * Touch Bar Manager class
 */
export class TouchBarManager {
  private currentContext: TouchBarContext = 'viewer';
  private layouts: Map<TouchBarContext, TouchBarLayout> = new Map();
  private eventHandler: TouchBarEventHandler | null = null;
  private mainWindow: BrowserWindow | null = null;
  private currentZoom: number = 100;
  private currentPage: number = 1;
  private totalPages: number = 1;

  constructor() {
    // Only initialize on macOS
    if (process.platform !== 'darwin') {
      console.log('[TouchBarManager] Not macOS, Touch Bar disabled');
      return;
    }

    this.initializeLayouts();
  }

  /**
   * Initialize Touch Bar layouts for all contexts
   */
  private initializeLayouts(): void {
    // Viewer layout
    this.layouts.set('viewer', this.createViewerLayout());

    // Editor layout
    this.layouts.set('editor', this.createEditorLayout());

    // Forms layout
    this.layouts.set('forms', this.createFormsLayout());

    // Signature layout
    this.layouts.set('signature', this.createSignatureLayout());

    // Comparison layout
    this.layouts.set('comparison', this.createComparisonLayout());
  }

  /**
   * Create viewer Touch Bar layout
   */
  private createViewerLayout(): TouchBarLayout {
    return {
      items: [
        {
          type: 'button',
          config: {
            label: '\u25C0', // Previous page
            click: () => this.emit('previousPage'),
          },
        },
        {
          type: 'button',
          config: {
            label: `${this.currentPage}/${this.totalPages}`,
            click: () => this.emit('goToPage'),
          },
        },
        {
          type: 'button',
          config: {
            label: '\u25B6', // Next page
            click: () => this.emit('nextPage'),
          },
        },
        { type: 'spacer', config: { size: 'flexible' } },
        {
          type: 'slider',
          config: {
            label: 'Zoom',
            value: this.currentZoom,
            minValue: 25,
            maxValue: 400,
            change: (value: number) => this.emit('zoom', value),
          },
        },
        { type: 'spacer', config: { size: 'small' } },
        {
          type: 'segmented',
          config: {
            segments: [
              { label: 'Single' },
              { label: 'Continuous' },
              { label: 'Spread' },
            ],
            selectedIndex: 0,
            change: (index: number) => {
              const modes = ['single', 'continuous', 'spread'];
              this.emit('viewMode', modes[index]);
            },
          },
        },
        { type: 'spacer', config: { size: 'flexible' } },
        {
          type: 'button',
          config: {
            label: '\uD83D\uDD0D', // Search
            click: () => this.emit('search'),
          },
        },
      ],
    };
  }

  /**
   * Create editor Touch Bar layout
   */
  private createEditorLayout(): TouchBarLayout {
    return {
      items: [
        {
          type: 'button',
          config: {
            label: '\u21B6', // Undo
            click: () => this.emit('undo'),
          },
        },
        {
          type: 'button',
          config: {
            label: '\u21B7', // Redo
            click: () => this.emit('redo'),
          },
        },
        { type: 'spacer', config: { size: 'small' } },
        {
          type: 'segmented',
          config: {
            segments: [
              { label: 'Select' },
              { label: 'Highlight' },
              { label: 'Note' },
              { label: 'Draw' },
            ],
            selectedIndex: 0,
            change: (index: number) => {
              const tools = ['select', 'highlight', 'note', 'draw'];
              this.emit('tool', tools[index]);
            },
          },
        },
        { type: 'spacer', config: { size: 'flexible' } },
        {
          type: 'colorPicker',
          config: {
            selectedColor: '#FFEB3B',
            availableColors: [
              '#FFEB3B', // Yellow
              '#4CAF50', // Green
              '#2196F3', // Blue
              '#E91E63', // Pink
              '#FF9800', // Orange
            ],
            change: (color: string) => this.emit('color', color),
          },
        },
        { type: 'spacer', config: { size: 'flexible' } },
        {
          type: 'button',
          config: {
            label: 'Save',
            backgroundColor: '#3B82F6',
            click: () => this.emit('save'),
          },
        },
      ],
    };
  }

  /**
   * Create forms Touch Bar layout
   */
  private createFormsLayout(): TouchBarLayout {
    return {
      items: [
        {
          type: 'button',
          config: {
            label: '\u2B05', // Previous field
            click: () => this.emit('previousField'),
          },
        },
        {
          type: 'button',
          config: {
            label: '\u27A1', // Next field
            click: () => this.emit('nextField'),
          },
        },
        { type: 'spacer', config: { size: 'flexible' } },
        {
          type: 'button',
          config: {
            label: 'Clear',
            click: () => this.emit('clearField'),
          },
        },
        {
          type: 'button',
          config: {
            label: 'Fill All',
            click: () => this.emit('fillAll'),
          },
        },
        { type: 'spacer', config: { size: 'flexible' } },
        {
          type: 'button',
          config: {
            label: 'Submit',
            backgroundColor: '#3B82F6',
            click: () => this.emit('submitForm'),
          },
        },
      ],
    };
  }

  /**
   * Create signature Touch Bar layout
   */
  private createSignatureLayout(): TouchBarLayout {
    return {
      items: [
        {
          type: 'button',
          config: {
            label: 'Draw',
            click: () => this.emit('signatureMode', 'draw'),
          },
        },
        {
          type: 'button',
          config: {
            label: 'Type',
            click: () => this.emit('signatureMode', 'type'),
          },
        },
        {
          type: 'button',
          config: {
            label: 'Upload',
            click: () => this.emit('signatureMode', 'upload'),
          },
        },
        { type: 'spacer', config: { size: 'flexible' } },
        {
          type: 'button',
          config: {
            label: 'Saved',
            click: () => this.emit('showSavedSignatures'),
          },
        },
        { type: 'spacer', config: { size: 'flexible' } },
        {
          type: 'button',
          config: {
            label: 'Cancel',
            click: () => this.emit('cancelSignature'),
          },
        },
        {
          type: 'button',
          config: {
            label: 'Apply',
            backgroundColor: '#3B82F6',
            click: () => this.emit('applySignature'),
          },
        },
      ],
    };
  }

  /**
   * Create comparison Touch Bar layout
   */
  private createComparisonLayout(): TouchBarLayout {
    return {
      items: [
        {
          type: 'segmented',
          config: {
            segments: [
              { label: 'Side by Side' },
              { label: 'Overlay' },
            ],
            selectedIndex: 0,
            change: (index: number) => {
              const modes = ['sideBySide', 'overlay'];
              this.emit('comparisonMode', modes[index]);
            },
          },
        },
        { type: 'spacer', config: { size: 'flexible' } },
        {
          type: 'button',
          config: {
            label: '\u25C0 Prev',
            click: () => this.emit('previousChange'),
          },
        },
        {
          type: 'button',
          config: {
            label: 'Next \u25B6',
            click: () => this.emit('nextChange'),
          },
        },
        { type: 'spacer', config: { size: 'flexible' } },
        {
          type: 'button',
          config: {
            label: 'Report',
            click: () => this.emit('generateReport'),
          },
        },
      ],
    };
  }

  /**
   * Build Touch Bar from layout
   */
  private buildTouchBar(layout: TouchBarLayout): TouchBar {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const items: any[] = layout.items.map((item) => {
      switch (item.type) {
        case 'button':
          return new TouchBarButton(item.config);
        case 'slider':
          return new TouchBarSlider(item.config);
        case 'segmented':
          return new TouchBarSegmentedControl(item.config);
        case 'colorPicker':
          return new TouchBarColorPicker(item.config);
        case 'spacer':
          return new TouchBarSpacer(item.config);
        case 'popover':
          return new TouchBarPopover(item.config);
        case 'group':
          return new TouchBarGroup(item.config);
        default:
          return new TouchBarSpacer({ size: 'small' });
      }
    });

    return new TouchBar({ items });
  }

  /**
   * Set the main window for Touch Bar
   */
  setWindow(window: BrowserWindow): void {
    this.mainWindow = window;
    this.applyCurrentContext();
  }

  /**
   * Set event handler for Touch Bar actions
   */
  setEventHandler(handler: TouchBarEventHandler): void {
    this.eventHandler = handler;
  }

  /**
   * Emit Touch Bar event
   */
  private emit(action: string, value?: unknown): void {
    if (this.eventHandler) {
      this.eventHandler(action, value);
    }
  }

  /**
   * Switch Touch Bar context
   */
  switchContext(context: TouchBarContext): void {
    if (context === this.currentContext) {
      return;
    }

    this.currentContext = context;
    this.applyCurrentContext();

    console.log(`[TouchBarManager] Switched to context: ${context}`);
  }

  /**
   * Apply current context Touch Bar
   */
  private applyCurrentContext(): void {
    if (!this.mainWindow || process.platform !== 'darwin') {
      return;
    }

    const layout = this.layouts.get(this.currentContext);
    if (!layout) {
      console.error(`[TouchBarManager] No layout for context: ${this.currentContext}`);
      return;
    }

    const touchBar = this.buildTouchBar(layout);
    this.mainWindow.setTouchBar(touchBar);
  }

  /**
   * Update page info (for viewer context)
   */
  updatePageInfo(currentPage: number, totalPages: number): void {
    this.currentPage = currentPage;
    this.totalPages = totalPages;

    if (this.currentContext === 'viewer') {
      this.applyCurrentContext();
    }
  }

  /**
   * Update zoom level (for viewer context)
   */
  updateZoom(zoom: number): void {
    this.currentZoom = zoom;

    if (this.currentContext === 'viewer') {
      this.applyCurrentContext();
    }
  }

  /**
   * Clear Touch Bar
   */
  clear(): void {
    if (this.mainWindow && process.platform === 'darwin') {
      this.mainWindow.setTouchBar(null);
    }
  }

  /**
   * Get current context
   */
  getCurrentContext(): TouchBarContext {
    return this.currentContext;
  }
}

// Singleton instance
let touchBarManager: TouchBarManager | null = null;

/**
 * Get or create Touch Bar manager
 */
export function getTouchBarManager(): TouchBarManager {
  if (!touchBarManager) {
    touchBarManager = new TouchBarManager();
  }
  return touchBarManager;
}

/**
 * Initialize Touch Bar for a window
 */
export function initializeTouchBar(
  window: BrowserWindow,
  eventHandler: TouchBarEventHandler
): TouchBarManager {
  const manager = getTouchBarManager();
  manager.setWindow(window);
  manager.setEventHandler(eventHandler);
  return manager;
}
