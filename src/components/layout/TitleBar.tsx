/**
 * TitleBar Component
 *
 * Platform-specific title bar with window controls.
 * - macOS: Frameless with traffic light buttons on left
 * - Windows: Native title bar with buttons on right
 * - Linux: CSD with configurable button position
 */

import React from 'react';
import { Minus, Square, X, Maximize2 } from 'lucide-react';
import { usePlatformContext } from '@/contexts/PlatformContext';
import { cn } from '@utils/cn';

interface TitleBarProps {
  /** Document title to display */
  title?: string;
  /** Whether document has unsaved changes */
  isModified?: boolean;
  /** Whether window is maximized */
  isMaximized?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Child elements (toolbar, etc.) */
  children?: React.ReactNode;
}

/**
 * Window control button component
 */
interface WindowButtonProps {
  type: 'minimize' | 'maximize' | 'close';
  onClick: () => void;
  isMaximized?: boolean;
}

function WindowButton({ type, onClick, isMaximized }: WindowButtonProps): React.ReactElement {
  const { isMacOS } = usePlatformContext();

  // macOS traffic light style
  if (isMacOS) {
    const colors = {
      minimize: 'bg-yellow-400 hover:bg-yellow-500',
      maximize: 'bg-green-400 hover:bg-green-500',
      close: 'bg-red-400 hover:bg-red-500',
    };

    return (
      <button
        type="button"
        onClick={onClick}
        className={cn(
          'w-3 h-3 rounded-full transition-colors',
          'focus:outline-none focus:ring-2 focus:ring-offset-1',
          colors[type]
        )}
        aria-label={type}
      />
    );
  }

  // Windows / Linux button style
  const icons = {
    minimize: Minus,
    maximize: isMaximized ? Square : Maximize2,
    close: X,
  };
  const Icon = icons[type];

  const hoverColors = {
    minimize: 'hover:bg-gray-200 dark:hover:bg-gray-700',
    maximize: 'hover:bg-gray-200 dark:hover:bg-gray-700',
    close: 'hover:bg-red-500 hover:text-white',
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'w-11 h-8 flex items-center justify-center',
        'transition-colors focus:outline-none',
        hoverColors[type]
      )}
      aria-label={type}
    >
      <Icon className="w-4 h-4" />
    </button>
  );
}

/**
 * TitleBar component
 */
export function TitleBar({
  title = 'PaperFlow',
  isModified = false,
  isMaximized = false,
  className,
  children,
}: TitleBarProps): React.ReactElement {
  const { isElectron, isWindows, isMacOS, isLinux, capabilities } = usePlatformContext();

  // Window control handlers
  const handleMinimize = async () => {
    if (isElectron && window.electron) {
      await window.electron.minimizeWindow();
    }
  };

  const handleMaximize = async () => {
    if (isElectron && window.electron) {
      await window.electron.maximizeWindow();
    }
  };

  const handleClose = async () => {
    if (isElectron && window.electron) {
      await window.electron.closeWindow();
    }
  };

  // Don't render custom title bar if not in Electron or using native decorations
  if (!isElectron || !capabilities.clientSideDecorations) {
    return <>{children}</>;
  }

  // Display title with modification indicator
  const displayTitle = isModified ? `${title} *` : title;

  return (
    <div
      className={cn(
        'flex items-center h-8 bg-gray-100 dark:bg-gray-900 select-none',
        'border-b border-gray-200 dark:border-gray-800',
        className
      )}
      style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
    >
      {/* macOS: Traffic lights on left */}
      {isMacOS && (
        <div
          className="flex items-center gap-2 px-3"
          style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
        >
          <WindowButton type="close" onClick={handleClose} />
          <WindowButton type="minimize" onClick={handleMinimize} />
          <WindowButton type="maximize" onClick={handleMaximize} isMaximized={isMaximized} />
        </div>
      )}

      {/* Title - centered on macOS, left on others */}
      <div
        className={cn(
          'flex-1 text-sm font-medium text-gray-700 dark:text-gray-300 truncate',
          isMacOS ? 'text-center' : 'text-left px-3'
        )}
      >
        {displayTitle}
      </div>

      {/* Optional children (toolbar items) */}
      {children && (
        <div style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
          {children}
        </div>
      )}

      {/* Windows/Linux: Window buttons on right */}
      {(isWindows || isLinux) && (
        <div
          className="flex items-center"
          style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
        >
          <WindowButton type="minimize" onClick={handleMinimize} />
          <WindowButton type="maximize" onClick={handleMaximize} isMaximized={isMaximized} />
          <WindowButton type="close" onClick={handleClose} />
        </div>
      )}
    </div>
  );
}

/**
 * macOS traffic lights spacer
 * Use when you need to leave space for traffic lights but don't show them
 */
export function TrafficLightsSpacer(): React.ReactElement | null {
  const { isMacOS, isElectron } = usePlatformContext();

  if (!isMacOS || !isElectron) {
    return null;
  }

  return <div className="w-[70px]" aria-hidden />;
}

export default TitleBar;
