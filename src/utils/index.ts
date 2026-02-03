/**
 * Utils Barrel Export
 *
 * Central export for all utility functions.
 */

// Class name utilities (Tailwind CSS)
export { cn } from './cn';

// PDF coordinate conversion utilities
export {
  pdfToScreen,
  screenToPdf,
  pdfRectToScreen,
  screenRectToPdf,
  getBoundingRect,
  isPointInRect,
  rectsIntersect,
  domRectToRect,
  normalizeRects,
} from './coordinates';

export type { Point, Rect, TransformContext } from './coordinates';

// Platform detection utilities
export {
  detectPlatform,
  detectOSVersion,
  detectArch,
  detectDesktopEnvironment,
  isWayland,
  isElectron,
  detectCapabilities,
  getPlatformInfo,
  hasCapability,
  getModifierKey,
  getAltKey,
  formatShortcut,
  isHighContrastMode,
  prefersReducedMotion,
  getDevicePixelRatio,
  isTouchDevice,
} from './platform';

export type {
  PlatformType,
  DesktopEnvironment,
  PlatformCapabilities,
  PlatformInfo,
} from './platform';
