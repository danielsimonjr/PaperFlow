/**
 * PatternSearchDialog - Dialog for searching patterns in the document
 * such as SSN, phone numbers, email addresses, and custom patterns.
 */

import React from 'react';

export interface PatternSearchDialogProps {
  /** Whether the dialog is open */
  isOpen?: boolean;
  /** Callback when dialog is closed */
  onClose?: () => void;
  /** Callback when patterns are found and selected for redaction */
  onPatternsSelected?: (patterns: PatternMatch[]) => void;
}

interface PatternMatch {
  /** The matched text */
  text: string;
  /** Page number where the match was found */
  pageNumber: number;
  /** Pattern type that matched */
  patternType: 'ssn' | 'phone' | 'email' | 'creditCard' | 'custom';
  /** Bounding rectangle for the match */
  rect: { x: number; y: number; width: number; height: number };
}

export function PatternSearchDialog(): React.ReactElement {
  return (
    <div className="pattern-search-dialog">
      {/* Component implementation pending */}
    </div>
  );
}
