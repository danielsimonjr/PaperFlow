/**
 * Kiosk Shell Component (Sprint 24)
 *
 * Main UI shell for kiosk mode with restricted interface.
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
    <div
      className={`kiosk-shell ${className}`}
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'var(--bg-primary, white)',
        zIndex: 9999,
      }}
    >
      {/* Header */}
      {config?.ui.showToolbar && (
        <KioskHeader
          brandingLogo={config.ui.brandingLogoUrl}
          welcomeMessage={config.ui.welcomeMessage}
        />
      )}

      {/* Main content */}
      <div
        className="kiosk-content"
        style={{
          flex: 1,
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {children}
      </div>

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

      <style>{`
        .kiosk-shell {
          font-family: var(--font-family, system-ui);
        }

        .kiosk-warning-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10000;
        }

        .kiosk-warning-dialog {
          background: white;
          padding: 2rem;
          border-radius: 8px;
          text-align: center;
          max-width: 400px;
        }

        .kiosk-warning-dialog h2 {
          margin: 0 0 1rem 0;
        }

        .kiosk-warning-dialog p {
          margin: 0 0 1.5rem 0;
          color: #666;
        }

        .kiosk-warning-dialog input {
          width: 100%;
          padding: 0.75rem;
          font-size: 1.25rem;
          text-align: center;
          border: 2px solid #ddd;
          border-radius: 4px;
          margin-bottom: 1rem;
        }

        .kiosk-dialog-buttons {
          display: flex;
          gap: 1rem;
          justify-content: center;
        }

        .kiosk-button {
          padding: 0.75rem 2rem;
          font-size: 1rem;
          border-radius: 4px;
          cursor: pointer;
          border: 1px solid #ddd;
          background: white;
        }

        .kiosk-button.primary {
          background: var(--primary, #3B82F6);
          color: white;
          border: none;
        }

        .kiosk-button:hover {
          opacity: 0.9;
        }

        .kiosk-error {
          position: fixed;
          bottom: 80px;
          left: 50%;
          transform: translateX(-50%);
          background: #f44336;
          color: white;
          padding: 0.75rem 1.5rem;
          border-radius: 4px;
          z-index: 10001;
        }
      `}</style>
    </div>
  );
}

export default KioskShell;
