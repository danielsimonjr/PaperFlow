/**
 * Kiosk Shell Component (Sprint 24)
 *
 * Main UI shell for kiosk mode with restricted interface.
 *
 * Styling lives in `src/styles/kiosk.css` — class-based rules only, no inline
 * `style` attribute and no `<style>` JSX block. This is what allows the
 * `'unsafe-inline'` directive to be dropped from `style-src` (Wave 2 CSP).
 */

import React, { useEffect, useCallback } from 'react';
import { useKioskStore } from '@/stores/kioskStore';
import { KioskToolbar } from './KioskToolbar';
import { KioskHeader } from './KioskHeader';

/**
 * Kiosk shell props
 */
interface KioskShellProps {
  /** Children to render (main content) */
  children: React.ReactNode;
  /** Custom class name */
  className?: string;
}

/**
 * Kiosk Shell Component
 */
export function KioskShell({ children, className = '' }: KioskShellProps): React.ReactElement {
  const {
    isActive,
    config,
    inactivityCountdown,
    error,
    recordActivity,
    dismissResetWarning,
    exitKioskMode,
  } = useKioskStore();

  /**
   * Handle activity
   */
  const handleActivity = useCallback(() => {
    if (isActive) {
      recordActivity();
    }
  }, [isActive, recordActivity]);

  /**
   * Set up activity listeners
   */
  useEffect(() => {
    if (!isActive) return;

    const events = ['mousedown', 'mousemove', 'keydown', 'touchstart', 'scroll'];

    for (const event of events) {
      window.addEventListener(event, handleActivity, { passive: true });
    }

    return () => {
      for (const event of events) {
        window.removeEventListener(event, handleActivity);
      }
    };
  }, [isActive, handleActivity]);

  /**
   * Handle keyboard shortcuts (block most in kiosk mode)
   */
  useEffect(() => {
    if (!isActive || !config?.restrictions.disableShortcuts) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Block common shortcuts
      const blockedKeys = ['s', 'o', 'n', 'p', 'w', 'q', 'f4'];
      const key = e.key.toLowerCase();

      if ((e.ctrlKey || e.metaKey) && blockedKeys.includes(key)) {
        e.preventDefault();
        e.stopPropagation();
      }

      // Block F11 (fullscreen toggle)
      if (e.key === 'F11') {
        e.preventDefault();
      }

      // Allow admin shortcut (Ctrl+Alt+Shift+K)
      if (
        config.exitAuth.allowAdminShortcut &&
        e.ctrlKey &&
        e.altKey &&
        e.shiftKey &&
        key === 'k'
      ) {
        // Show PIN dialog
        showExitDialog();
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [isActive, config]);

  /**
   * Handle context menu (block if disabled)
   */
  useEffect(() => {
    if (!isActive || !config?.restrictions.disableContextMenu) return;

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
    };

    window.addEventListener('contextmenu', handleContextMenu, true);
    return () => window.removeEventListener('contextmenu', handleContextMenu, true);
  }, [isActive, config]);

  /**
   * Handle text selection (disable if configured)
   *
   * NOTE: This still uses an imperative DOM mutation rather than a class
   * toggle. It does not violate `style-src` because it sets the `style.*`
   * property via the CSSOM (which runs after parse-time and is not the
   * inline `style` attribute the directive guards). Leaving as-is.
   */
  useEffect(() => {
    if (!isActive || !config?.restrictions.disableTextSelection) return;

    document.body.style.userSelect = 'none';
    return () => {
      document.body.style.userSelect = '';
    };
  }, [isActive, config]);

  /**
   * Show exit dialog
   */
  const [showExitDialogState, setShowExitDialog] = React.useState(false);
  const [exitPin, setExitPin] = React.useState('');

  const showExitDialog = () => {
    setShowExitDialog(true);
    setExitPin('');
  };

  const handleExitSubmit = () => {
    const success = exitKioskMode(exitPin);
    if (success) {
      setShowExitDialog(false);
    }
    setExitPin('');
  };

  if (!isActive) {
    return <>{children}</>;
  }

  return (
    <div className={`kiosk-shell ${className}`.trim()}>
      {/* Header */}
      {config?.ui.showToolbar && (
        <KioskHeader
          brandingLogo={config.ui.brandingLogoUrl}
          welcomeMessage={config.ui.welcomeMessage}
        />
      )}

      {/* Main content */}
      <div className="kiosk-content">{children}</div>

      {/* Toolbar */}
      {config?.ui.showToolbar && (
        <KioskToolbar
          items={config.ui.toolbarItems}
          showPageNavigation={config.ui.showPageNavigation}
          showZoomControls={config.ui.showZoomControls}
          showSearch={config.ui.showSearch}
          touchMode={config.ui.touchMode}
        />
      )}

      {/* Inactivity warning */}
      {inactivityCountdown !== null && (
        <div className="kiosk-warning-overlay">
          <div className="kiosk-warning-dialog">
            <h2>Are you still there?</h2>
            <p>
              Session will reset in <strong>{inactivityCountdown}</strong> seconds.
            </p>
            <button className="kiosk-button primary" onClick={dismissResetWarning}>
              Continue Session
            </button>
          </div>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="kiosk-error">
          <span>{error}</span>
        </div>
      )}

      {/* Exit dialog */}
      {showExitDialogState && (
        <div className="kiosk-warning-overlay">
          <div className="kiosk-warning-dialog">
            <h2>Exit Kiosk Mode</h2>
            <p>Enter PIN to exit:</p>
            <input
              type="password"
              value={exitPin}
              onChange={(e) => setExitPin(e.target.value)}
              placeholder="PIN"
              autoFocus
              maxLength={10}
            />
            <div className="kiosk-dialog-buttons">
              <button className="kiosk-button" onClick={() => setShowExitDialog(false)}>
                Cancel
              </button>
              <button className="kiosk-button primary" onClick={handleExitSubmit}>
                Exit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default KioskShell;
