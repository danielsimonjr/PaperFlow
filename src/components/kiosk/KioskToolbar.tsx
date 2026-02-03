/**
 * Kiosk Toolbar Component (Sprint 24)
 *
 * Simplified toolbar for kiosk mode with large touch targets.
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
  const buttonSize = touchMode ? '56px' : '44px';
  const fontSize = touchMode ? '1.5rem' : '1.25rem';

  return (
    <div
      className={`kiosk-toolbar ${className}`}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: touchMode ? '1rem' : '0.5rem',
        padding: touchMode ? '1rem' : '0.5rem',
        backgroundColor: 'var(--bg-toolbar, #f5f5f5)',
        borderTop: '1px solid var(--border-color, #ddd)',
      }}
    >
      {/* Page navigation */}
      {showPageNavigation && (
        <div className="toolbar-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button
            className="kiosk-toolbar-button"
            onClick={onPrevPage}
            disabled={currentPage <= 1}
            style={{
              width: buttonSize,
              height: buttonSize,
              fontSize,
              border: 'none',
              borderRadius: '8px',
              backgroundColor: 'white',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            aria-label="Previous page"
          >
            ◀
          </button>
          <span style={{ minWidth: '80px', textAlign: 'center', fontSize: touchMode ? '1rem' : '0.875rem' }}>
            {currentPage} / {totalPages}
          </span>
          <button
            className="kiosk-toolbar-button"
            onClick={onNextPage}
            disabled={currentPage >= totalPages}
            style={{
              width: buttonSize,
              height: buttonSize,
              fontSize,
              border: 'none',
              borderRadius: '8px',
              backgroundColor: 'white',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            aria-label="Next page"
          >
            ▶
          </button>
        </div>
      )}

      {/* Divider */}
      {showPageNavigation && (showZoomControls || showSearch || items.length > 0) && (
        <div style={{ width: '1px', height: '32px', backgroundColor: '#ddd' }} />
      )}

      {/* Zoom controls */}
      {showZoomControls && (
        <div className="toolbar-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button
            className="kiosk-toolbar-button"
            onClick={onZoomOut}
            style={{
              width: buttonSize,
              height: buttonSize,
              fontSize,
              border: 'none',
              borderRadius: '8px',
              backgroundColor: 'white',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            aria-label="Zoom out"
          >
            −
          </button>
          <span style={{ minWidth: '60px', textAlign: 'center', fontSize: touchMode ? '1rem' : '0.875rem' }}>
            {zoom}%
          </span>
          <button
            className="kiosk-toolbar-button"
            onClick={onZoomIn}
            style={{
              width: buttonSize,
              height: buttonSize,
              fontSize,
              border: 'none',
              borderRadius: '8px',
              backgroundColor: 'white',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            aria-label="Zoom in"
          >
            +
          </button>
        </div>
      )}

      {/* Divider */}
      {showZoomControls && (showSearch || items.length > 0) && (
        <div style={{ width: '1px', height: '32px', backgroundColor: '#ddd' }} />
      )}

      {/* Search button */}
      {showSearch && (
        <button
          className="kiosk-toolbar-button"
          onClick={onSearch}
          style={{
            width: buttonSize,
            height: buttonSize,
            fontSize,
            border: 'none',
            borderRadius: '8px',
            backgroundColor: 'white',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
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
            style={{
              width: buttonSize,
              height: buttonSize,
              fontSize,
              border: 'none',
              borderRadius: '8px',
              backgroundColor: 'white',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            aria-label={FEATURE_LABELS[feature]}
          >
            {FEATURE_ICONS[feature]}
          </button>
        ))}

      <style>{`
        .kiosk-toolbar-button:hover {
          background-color: #e0e0e0 !important;
        }

        .kiosk-toolbar-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .kiosk-toolbar-button:active {
          transform: scale(0.95);
        }
      `}</style>
    </div>
  );
}

export default KioskToolbar;
