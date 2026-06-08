/**
 * Kiosk Header Component (Sprint 24)
 *
 * Header for kiosk mode with branding and welcome message.
 *
 * Styling lives in `src/styles/kiosk.css` — all visual rules are class-based
 * so the renderer emits no inline `style` attribute, which is what allows
 * `'unsafe-inline'` to be dropped from `style-src` (Wave 2 CSP migration).
 */

import React from 'react';

/**
 * Kiosk header props
 */
interface KioskHeaderProps {
  /** Branding logo URL */
  brandingLogo?: string;
  /** Welcome message */
  welcomeMessage?: string;
  /** Custom class name */
  className?: string;
}

/**
 * Kiosk Header Component
 */
export function KioskHeader({
  brandingLogo,
  welcomeMessage,
  className = '',
}: KioskHeaderProps): React.ReactElement {
  return (
    <header className={`kiosk-header ${className}`.trim()}>
      {/* Logo/Branding */}
      <div className="kiosk-branding">
        {brandingLogo ? (
          <img src={brandingLogo} alt="Logo" className="kiosk-branding-logo" />
        ) : (
          <span className="kiosk-branding-text">PaperFlow</span>
        )}
      </div>

      {/* Welcome message */}
      {welcomeMessage && <div className="kiosk-welcome">{welcomeMessage}</div>}

      {/* Placeholder for right side */}
      <div className="kiosk-header-spacer" />
    </header>
  );
}

export default KioskHeader;
