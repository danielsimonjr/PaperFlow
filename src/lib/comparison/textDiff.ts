/**
 * Text Diff
 * Implements text comparison algorithms for document comparison.
 */

import type { DiffToken, LineDiff } from './types';

/**
 * Longest Common Subsequence (LCS) using dynamic programming
 */
function lcs<T>(a: T[], b: T[], equals: (x: T, y: T) => boolean = (x, y) => x === y): T[] {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array(m + 1)
    .fill(null)
    .map(() => Array(n + 1).fill(0));

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (equals(a[i - 1]!, b[j - 1]!)) {
        dp[i]![j] = dp[i - 1]![j - 1]! + 1;
      } else {
        dp[i]![j] = Math.max(dp[i - 1]![j]!, dp[i]![j - 1]!);
      }
    }
  }

  // Backtrack to find the LCS
  const result: T[] = [];
  let i = m;
  let j = n;
  while (i > 0 && j > 0) {
    if (equals(a[i - 1]!, b[j - 1]!)) {
      result.unshift(a[i - 1]!);
      i--;
      j--;
    } else if (dp[i - 1]![j]! > dp[i]![j - 1]!) {
      i--;
    } else {
      j--;
    }
  }

  return result;
}

/**
 * Compute character-level diff between two strings
 */
export function diffCharacters(text1: string, text2: string): DiffToken[] {
  const chars1 = text1.split('');
  const chars2 = text2.split('');
  return computeDiff(chars1, chars2);
}

/**
 * Compute word-level diff between two strings
 */
export function diffWords(text1: string, text2: string, ignoreCase = false): DiffToken[] {
  const normalize = (s: string) => (ignoreCase ? s.toLowerCase() : s);
  const words1 = tokenizeWords(text1);
  const words2 = tokenizeWords(text2);

  const equals = (a: string, b: string) => normalize(a) === normalize(b);
  return computeDiff(words1, words2, equals);
}

/**
 * Compute line-level diff between two strings
 */
export function diffLines(text1: string, text2: string, ignoreCase = false): LineDiff[] {
  const lines1 = text1.split('\n');
  const lines2 = text2.split('\n');
  const normalize = (s: string) => (ignoreCase ? s.toLowerCase() : s);

  const result: LineDiff[] = [];
  const commonLines = lcs(lines1, lines2, (a, b) => normalize(a.trim()) === normalize(b.trim()));

  let i1 = 0;
  let i2 = 0;
  let commonIdx = 0;

  while (i1 < lines1.length || i2 < lines2.length) {
    if (commonIdx < commonLines.length) {
      const commonLine = commonLines[commonIdx]!;

      // Find removed lines (in text1 but not in common)
      while (i1 < lines1.length && normalize(lines1[i1]!.trim()) !== normalize(commonLine.trim())) {
        result.push({
          lineNumber1: i1 + 1,
          type: 'removed',
          content1: lines1[i1],
        });
        i1++;
      }

      // Find added lines (in text2 but not in common)
      while (i2 < lines2.length && normalize(lines2[i2]!.trim()) !== normalize(commonLine.trim())) {
        result.push({
          lineNumber2: i2 + 1,
          type: 'added',
          content2: lines2[i2],
        });
        i2++;
      }

      // Equal line
      if (i1 < lines1.length && i2 < lines2.length) {
        // Check if the lines are exactly equal or just case-different
        if (lines1[i1] === lines2[i2]) {
          result.push({
            lineNumber1: i1 + 1,
            lineNumber2: i2 + 1,
            type: 'equal',
            content1: lines1[i1],
            content2: lines2[i2],
          });
        } else {
          // Lines match case-insensitively but differ in case - treat as modified
          result.push({
            lineNumber1: i1 + 1,
            lineNumber2: i2 + 1,
            type: 'modified',
            content1: lines1[i1],
            content2: lines2[i2],
            tokens: diffWords(lines1[i1]!, lines2[i2]!),
          });
        }
        i1++;
        i2++;
        commonIdx++;
      }
    } else {
      // Remaining lines
      while (i1 < lines1.length) {
        result.push({
          lineNumber1: i1 + 1,
          type: 'removed',
          content1: lines1[i1],
        });
        i1++;
      }
      while (i2 < lines2.length) {
        result.push({
          lineNumber2: i2 + 1,
          type: 'added',
          content2: lines2[i2],
        });
        i2++;
      }
    }
  }

  return result;
}

/**
 * Compute diff tokens from two arrays
 */
function computeDiff<T extends string>(
  arr1: T[],
  arr2: T[],
  equals: (a: T, b: T) => boolean = (a, b) => a === b
): DiffToken[] {
  const common = lcs(arr1, arr2, equals);
  const result: DiffToken[] = [];

  let i1 = 0;
  let i2 = 0;
  let commonIdx = 0;

  while (i1 < arr1.length || i2 < arr2.length) {
    if (commonIdx < common.length) {
      const commonItem = common[commonIdx]!;

      // Delete tokens (in arr1 but not in common)
      let deleteValue = '';
      while (i1 < arr1.length && !equals(arr1[i1]!, commonItem)) {
        deleteValue += arr1[i1];
        i1++;
      }
      if (deleteValue) {
        result.push({ type: 'delete', value: deleteValue });
      }

      // Insert tokens (in arr2 but not in common)
      let insertValue = '';
      while (i2 < arr2.length && !equals(arr2[i2]!, commonItem)) {
        insertValue += arr2[i2];
        i2++;
      }
      if (insertValue) {
        result.push({ type: 'insert', value: insertValue });
      }

      // Equal token
      if (i1 < arr1.length && i2 < arr2.length) {
        result.push({ type: 'equal', value: arr1[i1]! });
        i1++;
        i2++;
        commonIdx++;
      }
    } else {
      // Remaining deletions
      let deleteValue = '';
      while (i1 < arr1.length) {
        deleteValue += arr1[i1];
        i1++;
      }
      if (deleteValue) {
        result.push({ type: 'delete', value: deleteValue });
      }

      // Remaining insertions
      let insertValue = '';
      while (i2 < arr2.length) {
        insertValue += arr2[i2];
        i2++;
      }
      if (insertValue) {
        result.push({ type: 'insert', value: insertValue });
      }
    }
  }

  return mergeConsecutiveTokens(result);
}

/**
 * Merge consecutive tokens of the same type
 */
function mergeConsecutiveTokens(tokens: DiffToken[]): DiffToken[] {
  if (tokens.length === 0) return tokens;

  const result: DiffToken[] = [];
  let current = { ...tokens[0]! };

  for (let i = 1; i < tokens.length; i++) {
    const token = tokens[i]!;
    if (token.type === current.type) {
      current.value += token.value;
    } else {
      result.push(current);
      current = { ...token };
    }
  }
  result.push(current);

  return result;
}

/**
 * Tokenize text into words (including whitespace as separate tokens)
 */
function tokenizeWords(text: string): string[] {
  const tokens: string[] = [];
  let current = '';

  for (const char of text) {
    const isWhitespace = /\s/.test(char);

    if (isWhitespace) {
      if (current) {
        tokens.push(current);
        current = '';
      }
      tokens.push(char);
    } else {
      current += char;
    }
  }

  if (current) {
    tokens.push(current);
  }

  return tokens;
}

/**
 * Calculate similarity between two strings (0-100%)
 */
export function calculateSimilarity(text1: string, text2: string): number {
  if (text1 === text2) return 100;
  if (text1.length === 0 && text2.length === 0) return 100;
  if (text1.length === 0 || text2.length === 0) return 0;

  const words1 = text1.split(/\s+/).filter(Boolean);
  const words2 = text2.split(/\s+/).filter(Boolean);

  const common = lcs(words1, words2);
  const maxLength = Math.max(words1.length, words2.length);

  return Math.round((common.length / maxLength) * 100);
}

/**
 * Get statistics from diff tokens
 */
export function getDiffStats(tokens: DiffToken[]): {
  additions: number;
  deletions: number;
  unchanged: number;
} {
  let additions = 0;
  let deletions = 0;
  let unchanged = 0;

  for (const token of tokens) {
    const length = token.value.length;
    switch (token.type) {
      case 'insert':
        additions += length;
        break;
      case 'delete':
        deletions += length;
        break;
      case 'equal':
        unchanged += length;
        break;
    }
  }

  return { additions, deletions, unchanged };
}

/**
 * Get change count from line diffs
 */
export function getLineChangeStats(lines: LineDiff[]): {
  added: number;
  removed: number;
  modified: number;
  equal: number;
} {
  let added = 0;
  let removed = 0;
  let modified = 0;
  let equal = 0;

  for (const line of lines) {
    switch (line.type) {
      case 'added':
        added++;
        break;
      case 'removed':
        removed++;
        break;
      case 'modified':
        modified++;
        break;
      case 'equal':
        equal++;
        break;
    }
  }

  return { added, removed, modified, equal };
}

/**
 * Normalize text for comparison (based on options)
 */
export function normalizeText(
  text: string,
  options: { ignoreWhitespace?: boolean; ignoreCase?: boolean } = {}
): string {
  let result = text;

  if (options.ignoreWhitespace) {
    result = result.replace(/\s+/g, ' ').trim();
  }

  if (options.ignoreCase) {
    result = result.toLowerCase();
  }

  return result;
}
