/**
 * Platform Detection Utilities
 *
 * Provides utilities for detecting OS, version, and capabilities
 * to enable platform-specific UI adaptations.
 */

/**
 * Platform types
 */
export type PlatformType = 'windows' | 'macos' | 'linux' | 'unknown';

/**
 * Desktop environment types (Linux)
 */
export type DesktopEnvironment = 'gnome' | 'kde' | 'xfce' | 'cinnamon' | 'mate' | 'unity' | 'unknown';

/**
 * Platform capabilities
 */
export interface PlatformCapabilities {
  /** Native window decorations */
  nativeDecorations: boolean;
  /** Client-side decorations (CSD) */
  clientSideDecorations: boolean;
  /** Native file dialogs */
  nativeDialogs: boolean;
  /** System tray support */
  systemTray: boolean;
  /** Touch Bar (macOS only) */
  touchBar: boolean;
  /** Jump Lists / Dock (Windows/macOS) */
  jumpLists: boolean;
  /** Taskbar progress (Windows) */
  taskbarProgress: boolean;
  /** Dock badge (macOS) */
  dockBadge: boolean;
  /** Overlay scrollbars */
  overlayScrollbars: boolean;
  /** Dark mode detection */
  darkModeDetection: boolean;
  /** High DPI support */
  highDpi: boolean;
  /** Wayland display server (Linux) */
  wayland: boolean;
}

/**
 * Platform info structure
 */
export interface PlatformInfo {
  platform: PlatformType;
  version: string;
  arch: 'x64' | 'arm64' | 'x86' | 'unknown';
  isElectron: boolean;
  isBrowser: boolean;
  desktopEnvironment?: DesktopEnvironment;
  capabilities: PlatformCapabilities;
}

// Cached platform info
let cachedPlatformInfo: PlatformInfo | null = null;

/**
 * Detect current platform
 */
export function detectPlatform(): PlatformType {
  if (typeof navigator === 'undefined') return 'unknown';

  const ua = navigator.userAgent.toLowerCase();
  const platform = navigator.platform?.toLowerCase() || '';

  if (ua.includes('win') || platform.includes('win')) {
    return 'windows';
  }
  if (ua.includes('mac') || platform.includes('mac')) {
    return 'macos';
  }
  if (ua.includes('linux') || platform.includes('linux')) {
    return 'linux';
  }

  return 'unknown';
}

/**
 * Detect OS version
 */
export function detectOSVersion(): string {
  if (typeof navigator === 'undefined') return 'unknown';

  const ua = navigator.userAgent;

  // Windows
  const winMatch = ua.match(/Windows NT (\d+\.\d+)/);
  if (winMatch && winMatch[1]) {
    const ntVersion = parseFloat(winMatch[1]);
    if (ntVersion >= 10.0) {
      // Check for Windows 11 via user agent hints if available
      return 'Windows 10+';
    }
    return `Windows NT ${ntVersion}`;
  }

  // macOS
  const macMatch = ua.match(/Mac OS X (\d+[._]\d+[._]?\d*)/);
  if (macMatch && macMatch[1]) {
    return `macOS ${macMatch[1].replace(/_/g, '.')}`;
  }

  // Linux (kernel version from Electron)
  if (typeof process !== 'undefined' && process.platform === 'linux') {
    // getSystemVersion may not exist in all Node environments
    const getVersion = (process as unknown as { getSystemVersion?: () => string }).getSystemVersion;
    return `Linux ${getVersion?.() || 'unknown'}`;
  }

  return 'unknown';
}

/**
 * Detect CPU architecture
 */
export function detectArch(): 'x64' | 'arm64' | 'x86' | 'unknown' {
  if (typeof process !== 'undefined') {
    if (process.arch === 'x64') return 'x64';
    if (process.arch === 'arm64') return 'arm64';
    if (process.arch === 'ia32') return 'x86';
  }

  if (typeof navigator !== 'undefined') {
    const ua = navigator.userAgent.toLowerCase();
    if (ua.includes('arm64') || ua.includes('aarch64')) return 'arm64';
    if (ua.includes('x64') || ua.includes('x86_64') || ua.includes('amd64')) return 'x64';
    if (ua.includes('x86') || ua.includes('i686') || ua.includes('i386')) return 'x86';
  }

  return 'unknown';
}

/**
 * Detect Linux desktop environment
 */
export function detectDesktopEnvironment(): DesktopEnvironment {
  if (typeof process === 'undefined' || process.platform !== 'linux') {
    return 'unknown';
  }

  const xdgDesktop = (process.env.XDG_CURRENT_DESKTOP || '').toLowerCase();
  const desktopSession = (process.env.DESKTOP_SESSION || '').toLowerCase();

  if (xdgDesktop.includes('gnome') || desktopSession.includes('gnome')) {
    return 'gnome';
  }
  if (xdgDesktop.includes('kde') || desktopSession.includes('kde') || desktopSession.includes('plasma')) {
    return 'kde';
  }
  if (xdgDesktop.includes('xfce') || desktopSession.includes('xfce')) {
    return 'xfce';
  }
  if (xdgDesktop.includes('cinnamon') || desktopSession.includes('cinnamon')) {
    return 'cinnamon';
  }
  if (xdgDesktop.includes('mate') || desktopSession.includes('mate')) {
    return 'mate';
  }
  if (xdgDesktop.includes('unity') || desktopSession.includes('unity')) {
    return 'unity';
  }

  return 'unknown';
}

/**
 * Detect if running under Wayland
 */
export function isWayland(): boolean {
  if (typeof process === 'undefined' || process.platform !== 'linux') {
    return false;
  }

  return !!(
    process.env.WAYLAND_DISPLAY ||
    process.env.XDG_SESSION_TYPE === 'wayland'
  );
}

/**
 * Check if running in Electron
 */
export function isElectron(): boolean {
  return typeof window !== 'undefined' && typeof window.electron !== 'undefined';
}

/**
 * Detect platform capabilities
 */
export function detectCapabilities(platform: PlatformType): PlatformCapabilities {
  const inElectron = isElectron();

  const baseCapabilities: PlatformCapabilities = {
    nativeDecorations: true,
    clientSideDecorations: false,
    nativeDialogs: inElectron,
    systemTray: inElectron,
    touchBar: false,
    jumpLists: false,
    taskbarProgress: false,
    dockBadge: false,
    overlayScrollbars: false,
    darkModeDetection: true,
    highDpi: true,
    wayland: false,
  };

  switch (platform) {
    case 'windows':
      return {
        ...baseCapabilities,
        jumpLists: inElectron,
        taskbarProgress: inElectron,
      };

    case 'macos':
      return {
        ...baseCapabilities,
        clientSideDecorations: true,
        touchBar: inElectron,
        jumpLists: inElectron, // Dock recent items
        dockBadge: inElectron,
        overlayScrollbars: true,
      };

    case 'linux':
      return {
        ...baseCapabilities,
        clientSideDecorations: true,
        wayland: isWayland(),
        overlayScrollbars: detectDesktopEnvironment() === 'gnome',
      };

    default:
      return baseCapabilities;
  }
}

/**
 * Get complete platform info
 */
export function getPlatformInfo(): PlatformInfo {
  if (cachedPlatformInfo) {
    return cachedPlatformInfo;
  }

  const platform = detectPlatform();

  cachedPlatformInfo = {
    platform,
    version: detectOSVersion(),
    arch: detectArch(),
    isElectron: isElectron(),
    isBrowser: !isElectron(),
    desktopEnvironment: platform === 'linux' ? detectDesktopEnvironment() : undefined,
    capabilities: detectCapabilities(platform),
  };

  return cachedPlatformInfo;
}

/**
 * Check if a specific capability is available
 */
export function hasCapability(capability: keyof PlatformCapabilities): boolean {
  const info = getPlatformInfo();
  return info.capabilities[capability];
}

/**
 * Get platform-specific modifier key
 */
export function getModifierKey(): 'Cmd' | 'Ctrl' {
  return getPlatformInfo().platform === 'macos' ? 'Cmd' : 'Ctrl';
}

/**
 * Get platform-specific alt key name
 */
export function getAltKey(): 'Option' | 'Alt' {
  return getPlatformInfo().platform === 'macos' ? 'Option' : 'Alt';
}

/**
 * Format keyboard shortcut for display
 */
export function formatShortcut(shortcut: string): string {
  const platform = getPlatformInfo().platform;

  if (platform === 'macos') {
    return shortcut
      .replace(/Ctrl\+/gi, '\u2318') // Command
      .replace(/Alt\+/gi, '\u2325') // Option
      .replace(/Shift\+/gi, '\u21E7') // Shift
      .replace(/Meta\+/gi, '\u2318'); // Command
  }

  return shortcut
    .replace(/Meta\+/gi, 'Win+')
    .replace(/Ctrl\+/gi, 'Ctrl+')
    .replace(/Alt\+/gi, 'Alt+')
    .replace(/Shift\+/gi, 'Shift+');
}

/**
 * Check if high contrast mode is enabled
 */
export function isHighContrastMode(): boolean {
  if (typeof window === 'undefined') return false;

  // Windows high contrast
  if (window.matchMedia('(forced-colors: active)').matches) {
    return true;
  }

  // macOS increase contrast
  if (window.matchMedia('(prefers-contrast: more)').matches) {
    return true;
  }

  return false;
}

/**
 * Check if reduced motion is preferred
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Get device pixel ratio
 */
export function getDevicePixelRatio(): number {
  if (typeof window === 'undefined') return 1;
  return window.devicePixelRatio || 1;
}

/**
 * Check if touch device
 */
export function isTouchDevice(): boolean {
  if (typeof window === 'undefined') return false;

  return (
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0 ||
    // @ts-expect-error Legacy property
    navigator.msMaxTouchPoints > 0
  );
}
