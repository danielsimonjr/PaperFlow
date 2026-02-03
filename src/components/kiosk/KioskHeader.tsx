/**
 * Kiosk Header Component (Sprint 24)
 *
 * Header for kiosk mode with branding and welcome message.
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
    <header
      className={`kiosk-header ${className}`}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0.75rem 1.5rem',
        backgroundColor: 'var(--bg-header, #1E3A5F)',
        color: 'white',
      }}
    >
      {/* Logo/Branding */}
      <div className="kiosk-branding" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        {brandingLogo ? (
          <img
            src={brandingLogo}
            alt="Logo"
            style={{ height: '40px', objectFit: 'contain' }}
          />
        ) : (
          <span
            style={{
              fontSize: '1.25rem',
              fontWeight: 'bold',
              letterSpacing: '0.05em',
            }}
          >
            PaperFlow
          </span>
        )}
      </div>

      {/* Welcome message */}
      {welcomeMessage && (
        <div
          className="kiosk-welcome"
          style={{
            fontSize: '1rem',
            opacity: 0.9,
          }}
        >
          {welcomeMessage}
        </div>
      )}

      {/* Placeholder for right side */}
      <div style={{ width: '120px' }} />
    </header>
  );
}

export default KioskHeader;
