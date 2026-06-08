/**
 * Kiosk Toolbar Component (Sprint 24)
 *
 * Simplified toolbar for kiosk mode with large touch targets.
 *
 * Touch vs non-touch sizing is quantized into the `kiosk-touch` /
 * `kiosk-compact` modifier classes; styling lives in `src/styles/kiosk.css`.
 * No inline `style` props or `<style>` JSX blocks are emitted, which is what
 * lets us drop `'unsafe-inline'` from the production `style-src` directive
 * (Wave 2 CSP migration).
 */

import React from 'react';
import type { KioskFeature } from '@/types/kioskConfig';

/**
 * Kiosk toolbar props
 */
interface KioskToolbarProps {
  /** Toolbar items to show */
  items: KioskFeature[];
  /** Show page navigation controls */
  showPageNavigation?: boolean;
  /** Show zoom controls */
  showZoomControls?: boolean;
  /** Show search bar */
  showSearch?: boolean;
  /** Touch mode (larger UI elements) */
  touchMode?: boolean;
  /** Custom class name */
  className?: string;
  /** Current page number */
  currentPage?: number;
  /** Total pages */
  totalPages?: number;
  /** Current zoom level */
  zoom?: number;
  /** Handlers */
  onPrevPage?: () => void;
  onNextPage?: () => void;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onSearch?: () => void;
  onFeatureClick?: (feature: KioskFeature) => void;
}

/**
 * Feature icons (simple Unicode icons)
 */
const FEATURE_ICONS: Record<KioskFeature, string> = {
  view: '👁',
  zoom: '🔍',
  scroll: '↕',
  search: '🔎',
  print: '🖨',
  annotate: '✏',
  form_fill: '📝',
  navigate: '📑',
  thumbnails: '🖼',
};

/**
 * Feature labels
 */
const FEATURE_LABELS: Record<KioskFeature, string> = {
  view: 'View',
  zoom: 'Zoom',
  scroll: 'Scroll',
  search: 'Search',
  print: 'Print',
  annotate: 'Annotate',
  form_fill: 'Fill Form',
  navigate: 'Navigate',
  thumbnails: 'Thumbnails',
};

/**
 * Kiosk Toolbar Component
 */
export function KioskToolbar({
  items,
  showPageNavigation = true,
  showZoomControls = true,
  showSearch = true,
  touchMode = true,
  className = '',
  currentPage = 1,
  totalPages = 1,
  zoom = 100,
  onPrevPage,
  onNextPage,
  onZoomIn,
  onZoomOut,
  onSearch,
  onFeatureClick,
}: KioskToolbarProps): React.ReactElement {
  const sizeMod = touchMode ? 'kiosk-touch' : 'kiosk-compact';

  return (
    <div className={`kiosk-toolbar ${sizeMod} ${className}`.trim()}>
      {/* Page navigation */}
      {showPageNavigation && (
        <div className="kiosk-toolbar-group">
          <button
            className="kiosk-toolbar-button"
            onClick={onPrevPage}
            disabled={currentPage <= 1}
            aria-label="Previous page"
          >
            ◀
          </button>
          <span className={`kiosk-toolbar-page-indicator ${sizeMod}`}>
            {currentPage} / {totalPages}
          </span>
          <button
            className="kiosk-toolbar-button"
            onClick={onNextPage}
            disabled={currentPage >= totalPages}
            aria-label="Next page"
          >
            ▶
          </button>
        </div>
      )}

      {/* Divider */}
      {showPageNavigation && (showZoomControls || showSearch || items.length > 0) && (
        <div className="kiosk-toolbar-divider" />
      )}

      {/* Zoom controls */}
      {showZoomControls && (
        <div className="kiosk-toolbar-group">
          <button
            className="kiosk-toolbar-button"
            onClick={onZoomOut}
            aria-label="Zoom out"
          >
            −
          </button>
          <span className={`kiosk-toolbar-zoom-indicator ${sizeMod}`}>
            {zoom}%
          </span>
          <button
            className="kiosk-toolbar-button"
            onClick={onZoomIn}
            aria-label="Zoom in"
          >
            +
          </button>
        </div>
      )}

      {/* Divider */}
      {showZoomControls && (showSearch || items.length > 0) && (
        <div className="kiosk-toolbar-divider" />
      )}

      {/* Search button */}
      {showSearch && (
        <button
          className="kiosk-toolbar-button"
          onClick={onSearch}
          aria-label="Search"
        >
          🔎
        </button>
      )}

      {/* Feature buttons */}
      {items
        .filter((item) => item !== 'view' && item !== 'zoom' && item !== 'scroll' && item !== 'search')
        .map((feature) => (
          <button
            key={feature}
            className="kiosk-toolbar-button"
            onClick={() => onFeatureClick?.(feature)}
            title={FEATURE_LABELS[feature]}
            aria-label={FEATURE_LABELS[feature]}
          >
            {FEATURE_ICONS[feature]}
          </button>
        ))}
    </div>
  );
}

export default KioskToolbar;
