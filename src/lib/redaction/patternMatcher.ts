/**
 * Pattern Matcher
 * Provides pattern-based text detection for redaction.
 */

import type { RedactionPattern, PatternMatch } from './types';

/**
 * Built-in patterns for common PII and sensitive data
 */
export const BUILT_IN_PATTERNS: RedactionPattern[] = [
  // Personal Identifiers
  {
    id: 'ssn',
    name: 'Social Security Number',
    regex: '\\b\\d{3}-\\d{2}-\\d{4}\\b',
    caseSensitive: false,
    wholeWord: true,
    description: 'US Social Security Numbers (###-##-####)',
    category: 'pii',
  },
  {
    id: 'ssn-no-dash',
    name: 'SSN (no dashes)',
    regex: '\\b\\d{9}\\b',
    caseSensitive: false,
    wholeWord: true,
    description: 'SSN without dashes (9 consecutive digits)',
    category: 'pii',
  },

  // Contact Information
  {
    id: 'email',
    name: 'Email Address',
    regex: '[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}',
    caseSensitive: false,
    wholeWord: false,
    description: 'Email addresses',
    category: 'contact',
  },
  {
    id: 'phone-us',
    name: 'US Phone Number',
    regex: '(?:\\+1[-\\s]?)?(?:\\(\\d{3}\\)|\\d{3})[-\\s]?\\d{3}[-\\s]?\\d{4}',
    caseSensitive: false,
    wholeWord: false,
    description: 'US phone numbers (various formats)',
    category: 'contact',
  },
  {
    id: 'phone-intl',
    name: 'International Phone',
    regex: '\\+\\d{1,3}[-\\s]?\\d{1,4}[-\\s]?\\d{1,4}[-\\s]?\\d{1,9}',
    caseSensitive: false,
    wholeWord: false,
    description: 'International phone numbers',
    category: 'contact',
  },

  // Financial
  {
    id: 'credit-card',
    name: 'Credit Card Number',
    regex: '\\b(?:\\d{4}[-\\s]?){3}\\d{4}\\b',
    caseSensitive: false,
    wholeWord: true,
    description: 'Credit card numbers (16 digits)',
    category: 'financial',
  },
  {
    id: 'bank-account',
    name: 'Bank Account Number',
    regex: '\\b\\d{8,17}\\b',
    caseSensitive: false,
    wholeWord: true,
    description: 'Bank account numbers (8-17 digits)',
    category: 'financial',
  },
  {
    id: 'routing-number',
    name: 'Routing Number',
    regex: '\\b\\d{9}\\b',
    caseSensitive: false,
    wholeWord: true,
    description: 'Bank routing numbers (9 digits)',
    category: 'financial',
  },

  // Dates
  {
    id: 'date-us',
    name: 'Date (US Format)',
    regex: '\\b(?:0?[1-9]|1[0-2])/(?:0?[1-9]|[12]\\d|3[01])/(?:19|20)?\\d{2}\\b',
    caseSensitive: false,
    wholeWord: true,
    description: 'Dates in MM/DD/YYYY or MM/DD/YY format',
    category: 'date',
  },
  {
    id: 'date-iso',
    name: 'Date (ISO Format)',
    regex: '\\b(?:19|20)\\d{2}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\\d|3[01])\\b',
    caseSensitive: false,
    wholeWord: true,
    description: 'Dates in YYYY-MM-DD format',
    category: 'date',
  },

  // Additional PII
  {
    id: 'ip-address',
    name: 'IP Address',
    regex: '\\b(?:(?:25[0-5]|2[0-4]\\d|[01]?\\d\\d?)\\.){3}(?:25[0-5]|2[0-4]\\d|[01]?\\d\\d?)\\b',
    caseSensitive: false,
    wholeWord: true,
    description: 'IPv4 addresses',
    category: 'pii',
  },
  {
    id: 'drivers-license',
    name: "Driver's License",
    regex: '[A-Z]\\d{7}',
    caseSensitive: true,
    wholeWord: true,
    description: "Driver's license numbers (common format)",
    category: 'pii',
  },
  {
    id: 'passport',
    name: 'Passport Number',
    regex: '[A-Z]{2}\\d{7}',
    caseSensitive: true,
    wholeWord: true,
    description: 'Passport numbers (common format)',
    category: 'pii',
  },

  // Addresses
  {
    id: 'zip-code',
    name: 'ZIP Code',
    regex: '\\b\\d{5}(?:-\\d{4})?\\b',
    caseSensitive: false,
    wholeWord: true,
    description: 'US ZIP codes (5 or 9 digit)',
    category: 'contact',
  },
];

/**
 * Get all available patterns
 */
export function getAllPatterns(): RedactionPattern[] {
  return [...BUILT_IN_PATTERNS];
}

/**
 * Get patterns by category
 */
export function getPatternsByCategory(category: RedactionPattern['category']): RedactionPattern[] {
  return BUILT_IN_PATTERNS.filter((p) => p.category === category);
}

/**
 * Get pattern by ID
 */
export function getPatternById(id: string): RedactionPattern | undefined {
  return BUILT_IN_PATTERNS.find((p) => p.id === id);
}

/**
 * Create a custom pattern
 */
export function createCustomPattern(
  name: string,
  regex: string,
  options: Partial<Omit<RedactionPattern, 'id' | 'name' | 'regex' | 'category'>> = {}
): RedactionPattern {
  return {
    id: `custom-${Date.now()}`,
    name,
    regex,
    caseSensitive: options.caseSensitive ?? false,
    wholeWord: options.wholeWord ?? false,
    description: options.description || 'Custom pattern',
    category: 'custom',
  };
}

/**
 * Validate a regex pattern
 */
export function validatePattern(regex: string): { valid: boolean; error?: string } {
  try {
    new RegExp(regex);
    return { valid: true };
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Invalid regular expression',
    };
  }
}

/**
 * Find all matches of a pattern in text
 */
export function findPatternMatches(
  text: string,
  pattern: RedactionPattern,
  pageIndex: number = 0
): PatternMatch[] {
  const matches: PatternMatch[] = [];

  try {
    let regexPattern = pattern.regex;

    // Add word boundaries if wholeWord is enabled
    if (pattern.wholeWord) {
      regexPattern = `\\b(?:${regexPattern})\\b`;
    }

    const flags = pattern.caseSensitive ? 'g' : 'gi';
    const regex = new RegExp(regexPattern, flags);

    let match;
    while ((match = regex.exec(text)) !== null) {
      matches.push({
        text: match[0],
        pageIndex,
        bounds: [], // Bounds will be calculated by the caller with text position info
        pattern,
        startIndex: match.index,
        endIndex: match.index + match[0].length,
      });

      // Prevent infinite loops with zero-length matches
      if (match[0].length === 0) {
        regex.lastIndex++;
      }
    }
  } catch (error) {
    console.error('Pattern matching error:', error);
  }

  return matches;
}

/**
 * Find matches for multiple patterns
 */
export function findAllPatternMatches(
  text: string,
  patterns: RedactionPattern[],
  pageIndex: number = 0
): PatternMatch[] {
  const allMatches: PatternMatch[] = [];

  for (const pattern of patterns) {
    const matches = findPatternMatches(text, pattern, pageIndex);
    allMatches.push(...matches);
  }

  // Sort by position in text
  allMatches.sort((a, b) => a.startIndex - b.startIndex);

  // Remove overlapping matches (keep the first one)
  const filtered: PatternMatch[] = [];
  let lastEnd = -1;

  for (const match of allMatches) {
    if (match.startIndex >= lastEnd) {
      filtered.push(match);
      lastEnd = match.endIndex;
    }
  }

  return filtered;
}

/**
 * Search for a simple text string (not regex)
 */
export function findTextMatches(
  text: string,
  searchText: string,
  options: {
    caseSensitive?: boolean;
    wholeWord?: boolean;
    pageIndex?: number;
  } = {}
): PatternMatch[] {
  const { caseSensitive = false, wholeWord = false, pageIndex = 0 } = options;

  // Escape special regex characters in search text
  const escaped = searchText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  const pattern: RedactionPattern = {
    id: 'text-search',
    name: 'Text Search',
    regex: escaped,
    caseSensitive,
    wholeWord,
    description: `Search for "${searchText}"`,
    category: 'custom',
  };

  return findPatternMatches(text, pattern, pageIndex);
}

/**
 * Get match statistics for patterns
 */
export function getMatchStatistics(
  matches: PatternMatch[]
): {
  total: number;
  byPattern: Record<string, number>;
  byPage: Record<number, number>;
  byCategory: Record<string, number>;
} {
  const byPattern: Record<string, number> = {};
  const byPage: Record<number, number> = {};
  const byCategory: Record<string, number> = {};

  for (const match of matches) {
    // Count by pattern
    const patternId = match.pattern.id;
    byPattern[patternId] = (byPattern[patternId] || 0) + 1;

    // Count by page
    byPage[match.pageIndex] = (byPage[match.pageIndex] || 0) + 1;

    // Count by category
    const category = match.pattern.category;
    byCategory[category] = (byCategory[category] || 0) + 1;
  }

  return {
    total: matches.length,
    byPattern,
    byPage,
    byCategory,
  };
}
