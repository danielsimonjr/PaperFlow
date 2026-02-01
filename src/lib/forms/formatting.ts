/**
 * Form Field Formatting
 * Provides input formatting and display formatting for form fields.
 */

export type NumberFormat = 'integer' | 'decimal' | 'currency' | 'percentage';
export type DateFormat = 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD' | 'MMMM D, YYYY';
export type TextCase = 'upper' | 'lower' | 'title' | 'none';

export interface NumberFormatOptions {
  format: NumberFormat;
  decimalPlaces?: number;
  thousandsSeparator?: string;
  decimalSeparator?: string;
  currencySymbol?: string;
  currencyPosition?: 'before' | 'after';
  negativeFormat?: 'minus' | 'parentheses';
}

export interface DateFormatOptions {
  format: DateFormat;
  locale?: string;
}

export interface TextFormatOptions {
  case?: TextCase;
  trim?: boolean;
  maxLength?: number;
  mask?: string;
}

const DEFAULT_NUMBER_OPTIONS: NumberFormatOptions = {
  format: 'decimal',
  decimalPlaces: 2,
  thousandsSeparator: ',',
  decimalSeparator: '.',
  currencySymbol: '$',
  currencyPosition: 'before',
  negativeFormat: 'minus',
};

/**
 * Format a number according to options
 */
export function formatNumber(value: number | string, options: Partial<NumberFormatOptions> = {}): string {
  const opts = { ...DEFAULT_NUMBER_OPTIONS, ...options };
  let num = typeof value === 'string' ? parseFloat(value.replace(/[^0-9.-]/g, '')) : value;

  if (isNaN(num)) return '';

  const isNegative = num < 0;
  num = Math.abs(num);

  // Handle percentage
  if (opts.format === 'percentage') {
    num = num * 100;
  }

  // Round to decimal places
  const decimalPlaces = opts.format === 'integer' ? 0 : (opts.decimalPlaces ?? 2);
  const rounded = num.toFixed(decimalPlaces);

  // Split into integer and decimal parts
  const [intPart, decPart] = rounded.split('.');

  // Add thousands separators
  const formattedInt = intPart!.replace(/\B(?=(\d{3})+(?!\d))/g, opts.thousandsSeparator || ',');

  // Build formatted number
  let formatted = formattedInt;
  if (decPart !== undefined) {
    formatted += (opts.decimalSeparator || '.') + decPart;
  }

  // Handle negative
  if (isNegative) {
    if (opts.negativeFormat === 'parentheses') {
      formatted = `(${formatted})`;
    } else {
      formatted = `-${formatted}`;
    }
  }

  // Add currency symbol or percentage
  switch (opts.format) {
    case 'currency':
      if (opts.currencyPosition === 'before') {
        formatted = (opts.currencySymbol || '$') + formatted;
      } else {
        formatted = formatted + (opts.currencySymbol || '$');
      }
      break;
    case 'percentage':
      formatted = formatted + '%';
      break;
  }

  return formatted;
}

/**
 * Parse a formatted number back to a number
 */
export function parseFormattedNumber(value: string, options: Partial<NumberFormatOptions> = {}): number {
  const opts = { ...DEFAULT_NUMBER_OPTIONS, ...options };

  // Remove currency symbol
  let cleaned = value.replace(new RegExp(`\\${opts.currencySymbol || '$'}`, 'g'), '');

  // Handle parentheses for negative
  if (cleaned.startsWith('(') && cleaned.endsWith(')')) {
    cleaned = '-' + cleaned.slice(1, -1);
  }

  // Remove thousands separators
  cleaned = cleaned.replace(new RegExp(`\\${opts.thousandsSeparator || ','}`, 'g'), '');

  // Handle percentage
  if (opts.format === 'percentage') {
    cleaned = cleaned.replace('%', '');
    const num = parseFloat(cleaned);
    return isNaN(num) ? 0 : num / 100;
  }

  return parseFloat(cleaned) || 0;
}

/**
 * Format a date according to options
 */
export function formatDate(date: Date | string, options: Partial<DateFormatOptions> = {}): string {
  const format = options.format || 'MM/DD/YYYY';
  const d = typeof date === 'string' ? new Date(date) : date;

  if (isNaN(d.getTime())) return '';

  const month = d.getMonth() + 1;
  const day = d.getDate();
  const year = d.getFullYear();

  const pad = (n: number): string => n.toString().padStart(2, '0');

  switch (format) {
    case 'MM/DD/YYYY':
      return `${pad(month)}/${pad(day)}/${year}`;
    case 'DD/MM/YYYY':
      return `${pad(day)}/${pad(month)}/${year}`;
    case 'YYYY-MM-DD':
      return `${year}-${pad(month)}-${pad(day)}`;
    case 'MMMM D, YYYY': {
      const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ];
      return `${monthNames[d.getMonth()]} ${day}, ${year}`;
    }
    default:
      return `${pad(month)}/${pad(day)}/${year}`;
  }
}

/**
 * Parse a formatted date back to a Date
 */
export function parseFormattedDate(value: string, format: DateFormat = 'MM/DD/YYYY'): Date | null {
  if (!value) return null;

  let day: number, month: number, year: number;

  switch (format) {
    case 'MM/DD/YYYY': {
      const parts = value.split('/');
      if (parts.length !== 3) return null;
      month = parseInt(parts[0]!, 10);
      day = parseInt(parts[1]!, 10);
      year = parseInt(parts[2]!, 10);
      break;
    }
    case 'DD/MM/YYYY': {
      const parts = value.split('/');
      if (parts.length !== 3) return null;
      day = parseInt(parts[0]!, 10);
      month = parseInt(parts[1]!, 10);
      year = parseInt(parts[2]!, 10);
      break;
    }
    case 'YYYY-MM-DD': {
      const parts = value.split('-');
      if (parts.length !== 3) return null;
      year = parseInt(parts[0]!, 10);
      month = parseInt(parts[1]!, 10);
      day = parseInt(parts[2]!, 10);
      break;
    }
    default:
      return null;
  }

  if (isNaN(day) || isNaN(month) || isNaN(year)) return null;

  const date = new Date(year, month - 1, day);

  // Validate date components match
  if (date.getDate() !== day || date.getMonth() !== month - 1 || date.getFullYear() !== year) {
    return null;
  }

  return date;
}

/**
 * Format text according to options
 */
export function formatText(value: string, options: Partial<TextFormatOptions> = {}): string {
  let result = value;

  // Trim
  if (options.trim) {
    result = result.trim();
  }

  // Max length
  if (options.maxLength && result.length > options.maxLength) {
    result = result.substring(0, options.maxLength);
  }

  // Case transformation
  switch (options.case) {
    case 'upper':
      result = result.toUpperCase();
      break;
    case 'lower':
      result = result.toLowerCase();
      break;
    case 'title':
      result = toTitleCase(result);
      break;
  }

  // Apply mask
  if (options.mask) {
    result = applyMask(result, options.mask);
  }

  return result;
}

/**
 * Convert to title case
 */
function toTitleCase(str: string): string {
  return str.replace(
    /\w\S*/g,
    (word) => word.charAt(0).toUpperCase() + word.substring(1).toLowerCase()
  );
}

/**
 * Apply an input mask
 * Mask characters:
 * 9 - numeric digit
 * A - letter
 * * - alphanumeric
 * Other characters are literals
 */
export function applyMask(value: string, mask: string): string {
  let result = '';
  let valueIndex = 0;

  for (let i = 0; i < mask.length && valueIndex < value.length; i++) {
    const maskChar = mask[i]!;
    const valueChar = value[valueIndex]!;

    switch (maskChar) {
      case '9': // Numeric
        if (/\d/.test(valueChar)) {
          result += valueChar;
          valueIndex++;
        } else {
          // Skip non-numeric characters in value
          valueIndex++;
          i--;
        }
        break;

      case 'A': // Letter
        if (/[a-zA-Z]/.test(valueChar)) {
          result += valueChar;
          valueIndex++;
        } else {
          valueIndex++;
          i--;
        }
        break;

      case '*': // Alphanumeric
        if (/[a-zA-Z0-9]/.test(valueChar)) {
          result += valueChar;
          valueIndex++;
        } else {
          valueIndex++;
          i--;
        }
        break;

      default: // Literal
        result += maskChar;
        // If value char matches literal, consume it
        if (valueChar === maskChar) {
          valueIndex++;
        }
        break;
    }
  }

  return result;
}

/**
 * Remove mask from value
 */
export function removeMask(value: string, mask: string): string {
  let result = '';

  for (let i = 0; i < value.length && i < mask.length; i++) {
    const maskChar = mask[i]!;
    const valueChar = value[i]!;

    if (maskChar === '9' || maskChar === 'A' || maskChar === '*') {
      result += valueChar;
    }
  }

  return result;
}

/**
 * Phone number mask
 */
export const PHONE_MASK = '(999) 999-9999';

/**
 * SSN mask
 */
export const SSN_MASK = '999-99-9999';

/**
 * Date mask
 */
export const DATE_MASK = '99/99/9999';

/**
 * Credit card mask
 */
export const CREDIT_CARD_MASK = '9999 9999 9999 9999';

/**
 * ZIP code mask
 */
export const ZIP_MASK = '99999';

/**
 * ZIP+4 mask
 */
export const ZIP_PLUS_4_MASK = '99999-9999';
