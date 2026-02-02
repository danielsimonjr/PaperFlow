/**
 * Electron Test Setup
 *
 * Sets up mocks for Electron modules that aren't available in Node.js test environment.
 */

import { vi } from 'vitest';

// Mock Electron modules
export const mockApp = {
  isPackaged: false,
  getPath: vi.fn((name: string) => `/mock/path/${name}`),
  getAppPath: vi.fn(() => '/mock/app/path'),
  getVersion: vi.fn(() => '1.0.0'),
  requestSingleInstanceLock: vi.fn(() => true),
  on: vi.fn(),
  quit: vi.fn(),
  whenReady: vi.fn(() => Promise.resolve()),
};

export const mockBrowserWindow = vi.fn().mockImplementation(() => ({
  loadURL: vi.fn(() => Promise.resolve()),
  loadFile: vi.fn(() => Promise.resolve()),
  on: vi.fn(),
  once: vi.fn(),
  webContents: {
    id: 1,
    send: vi.fn(),
    openDevTools: vi.fn(),
    session: {
      webRequest: {
        onHeadersReceived: vi.fn(),
      },
    },
    getWebPreferences: vi.fn(() => ({
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    })),
    setWindowOpenHandler: vi.fn(),
  },
  getBounds: vi.fn(() => ({ x: 100, y: 100, width: 1200, height: 800 })),
  setBounds: vi.fn(),
  isMaximized: vi.fn(() => false),
  isMinimized: vi.fn(() => false),
  maximize: vi.fn(),
  minimize: vi.fn(),
  restore: vi.fn(),
  close: vi.fn(),
  focus: vi.fn(),
  show: vi.fn(),
  setTitle: vi.fn(),
  isDestroyed: vi.fn(() => false),
}));

mockBrowserWindow.getAllWindows = vi.fn(() => []);
mockBrowserWindow.getFocusedWindow = vi.fn(() => null);
mockBrowserWindow.fromWebContents = vi.fn(() => null);

export const mockScreen = {
  getPrimaryDisplay: vi.fn(() => ({
    bounds: { x: 0, y: 0, width: 1920, height: 1080 },
    workArea: { x: 0, y: 0, width: 1920, height: 1040 },
  })),
  getAllDisplays: vi.fn(() => [
    {
      bounds: { x: 0, y: 0, width: 1920, height: 1080 },
      workArea: { x: 0, y: 0, width: 1920, height: 1040 },
    },
  ]),
};

export const mockIpcMain = {
  handle: vi.fn(),
  on: vi.fn(),
  removeHandler: vi.fn(),
  removeAllListeners: vi.fn(),
};

export const mockIpcRenderer = {
  invoke: vi.fn(),
  on: vi.fn(),
  send: vi.fn(),
  removeListener: vi.fn(),
  removeAllListeners: vi.fn(),
};

export const mockContextBridge = {
  exposeInMainWorld: vi.fn(),
};

export const mockDialog = {
  showOpenDialog: vi.fn(() =>
    Promise.resolve({ canceled: false, filePaths: ['/mock/file.pdf'] })
  ),
  showSaveDialog: vi.fn(() =>
    Promise.resolve({ canceled: false, filePath: '/mock/save.pdf' })
  ),
  showMessageBox: vi.fn(() => Promise.resolve({ response: 0 })),
};

export const mockShell = {
  openExternal: vi.fn(() => Promise.resolve()),
  openPath: vi.fn(() => Promise.resolve('')),
  showItemInFolder: vi.fn(),
  trashItem: vi.fn(() => Promise.resolve()),
};

export const mockClipboard = {
  readText: vi.fn(() => 'mock clipboard text'),
  writeText: vi.fn(),
  readImage: vi.fn(() => ({ isEmpty: () => true })),
  writeImage: vi.fn(),
};

export const mockNativeImage = {
  createFromDataURL: vi.fn(() => ({})),
  createFromPath: vi.fn(() => ({
    isEmpty: vi.fn(() => false),
    resize: vi.fn().mockReturnThis(),
    setTemplateImage: vi.fn(),
    toPNG: vi.fn(() => Buffer.from('')),
    addRepresentation: vi.fn(),
  })),
  createFromBuffer: vi.fn(() => ({
    isEmpty: vi.fn(() => false),
    resize: vi.fn().mockReturnThis(),
  })),
};

export const mockNotification = vi.fn().mockImplementation(() => ({
  show: vi.fn(),
  on: vi.fn(),
  close: vi.fn(),
}));

mockNotification.isSupported = vi.fn(() => true);

export const mockTray = vi.fn().mockImplementation(() => ({
  setToolTip: vi.fn(),
  setImage: vi.fn(),
  setContextMenu: vi.fn(),
  popUpContextMenu: vi.fn(),
  on: vi.fn(),
  destroy: vi.fn(),
  getBounds: vi.fn(() => ({ x: 0, y: 0, width: 22, height: 22 })),
}));

export const mockMenu = {
  buildFromTemplate: vi.fn(() => ({
    append: vi.fn(),
    popup: vi.fn(),
  })),
  getApplicationMenu: vi.fn(() => null),
  setApplicationMenu: vi.fn(),
};

export const mockMenuItem = vi.fn().mockImplementation((options) => options);

export const mockSession = {
  defaultSession: {
    webRequest: {
      onHeadersReceived: vi.fn(),
      onBeforeRequest: vi.fn(),
    },
    setPermissionRequestHandler: vi.fn(),
    setCertificateVerifyProc: vi.fn(),
  },
};

// Mock electron module
vi.mock('electron', () => ({
  app: mockApp,
  BrowserWindow: mockBrowserWindow,
  screen: mockScreen,
  ipcMain: mockIpcMain,
  ipcRenderer: mockIpcRenderer,
  contextBridge: mockContextBridge,
  dialog: mockDialog,
  shell: mockShell,
  clipboard: mockClipboard,
  nativeImage: mockNativeImage,
  Notification: mockNotification,
  Tray: mockTray,
  Menu: mockMenu,
  MenuItem: mockMenuItem,
  session: mockSession,
}));

// Reset all mocks before each test
export function resetMocks(): void {
  vi.clearAllMocks();
  mockBrowserWindow.getAllWindows.mockReturnValue([]);
  mockBrowserWindow.getFocusedWindow.mockReturnValue(null);
  mockBrowserWindow.fromWebContents.mockReturnValue(null);
}
