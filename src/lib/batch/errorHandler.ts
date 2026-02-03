/**
 * Batch Error Handler
 * Comprehensive error handling for batch operations with retry logic, skip options, and detailed error reports.
 */

import type {
  BatchJob,
  BatchFile,
  BatchFileError,
  ErrorStrategy,
} from '@/types/batch';

/**
 * Error codes for batch operations
 */
export const ERROR_CODES = {
  // File errors
  FILE_NOT_FOUND: 'FILE_NOT_FOUND',
  FILE_READ_ERROR: 'FILE_READ_ERROR',
  FILE_WRITE_ERROR: 'FILE_WRITE_ERROR',
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',
  FILE_CORRUPTED: 'FILE_CORRUPTED',
  FILE_ENCRYPTED: 'FILE_ENCRYPTED',
  FILE_LOCKED: 'FILE_LOCKED',

  // PDF errors
  INVALID_PDF: 'INVALID_PDF',
  PDF_PARSE_ERROR: 'PDF_PARSE_ERROR',
  PDF_RENDER_ERROR: 'PDF_RENDER_ERROR',
  PDF_SAVE_ERROR: 'PDF_SAVE_ERROR',
  UNSUPPORTED_PDF_VERSION: 'UNSUPPORTED_PDF_VERSION',

  // Operation errors
  OPERATION_CANCELLED: 'OPERATION_CANCELLED',
  OPERATION_TIMEOUT: 'OPERATION_TIMEOUT',
  OPERATION_FAILED: 'OPERATION_FAILED',
  INVALID_OPTIONS: 'INVALID_OPTIONS',

  // Resource errors
  OUT_OF_MEMORY: 'OUT_OF_MEMORY',
  WORKER_ERROR: 'WORKER_ERROR',
  DISK_FULL: 'DISK_FULL',

  // OCR errors
  OCR_LANGUAGE_NOT_FOUND: 'OCR_LANGUAGE_NOT_FOUND',
  OCR_ENGINE_ERROR: 'OCR_ENGINE_ERROR',
  OCR_NO_TEXT_FOUND: 'OCR_NO_TEXT_FOUND',

  // Unknown
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

/**
 * Determine if an error is recoverable
 */
export function isRecoverableError(code: ErrorCode): boolean {
  const recoverableErrors: ErrorCode[] = [
    ERROR_CODES.FILE_LOCKED,
    ERROR_CODES.OPERATION_TIMEOUT,
    ERROR_CODES.WORKER_ERROR,
    ERROR_CODES.OUT_OF_MEMORY,
  ];

  return recoverableErrors.includes(code);
}

/**
 * Parse error to determine code and message
 */
export function parseError(error: unknown): { code: ErrorCode; message: string } {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();

    // File errors
    if (message.includes('not found') || message.includes('enoent')) {
      return { code: ERROR_CODES.FILE_NOT_FOUND, message: error.message };
    }
    if (message.includes('permission denied') || message.includes('eacces')) {
      return { code: ERROR_CODES.FILE_LOCKED, message: error.message };
    }
    if (message.includes('too large') || message.includes('exceeds')) {
      return { code: ERROR_CODES.FILE_TOO_LARGE, message: error.message };
    }
    if (message.includes('encrypted')) {
      return { code: ERROR_CODES.FILE_ENCRYPTED, message: error.message };
    }
    if (message.includes('corrupted') || message.includes('malformed')) {
      return { code: ERROR_CODES.FILE_CORRUPTED, message: error.message };
    }

    // PDF errors
    if (message.includes('invalid pdf') || message.includes('not a pdf')) {
      return { code: ERROR_CODES.INVALID_PDF, message: error.message };
    }
    if (message.includes('parse') && message.includes('pdf')) {
      return { code: ERROR_CODES.PDF_PARSE_ERROR, message: error.message };
    }

    // Resource errors
    if (message.includes('out of memory') || message.includes('allocation')) {
      return { code: ERROR_CODES.OUT_OF_MEMORY, message: error.message };
    }
    if (message.includes('timeout')) {
      return { code: ERROR_CODES.OPERATION_TIMEOUT, message: error.message };
    }
    if (message.includes('cancelled') || message.includes('aborted')) {
      return { code: ERROR_CODES.OPERATION_CANCELLED, message: error.message };
    }
    if (message.includes('disk full') || message.includes('enospc')) {
      return { code: ERROR_CODES.DISK_FULL, message: error.message };
    }

    // OCR errors
    if (message.includes('language') && message.includes('not')) {
      return { code: ERROR_CODES.OCR_LANGUAGE_NOT_FOUND, message: error.message };
    }
    if (message.includes('tesseract') || message.includes('ocr')) {
      return { code: ERROR_CODES.OCR_ENGINE_ERROR, message: error.message };
    }

    return { code: ERROR_CODES.UNKNOWN_ERROR, message: error.message };
  }

  if (typeof error === 'string') {
    return { code: ERROR_CODES.UNKNOWN_ERROR, message: error };
  }

  return { code: ERROR_CODES.UNKNOWN_ERROR, message: 'An unknown error occurred' };
}

/**
 * Create a batch file error
 */
export function createBatchFileError(
  file: BatchFile,
  error: unknown
): BatchFileError {
  const { code, message } = parseError(error);

  return {
    fileId: file.id,
    fileName: file.name,
    error: message,
    code,
    recoverable: isRecoverableError(code),
    timestamp: Date.now(),
  };
}

/**
 * Handle error based on strategy
 */
export function handleError(
  job: BatchJob,
  file: BatchFile,
  error: unknown,
  strategy: ErrorStrategy
): {
  shouldContinue: boolean;
  shouldRetry: boolean;
  fileError: BatchFileError;
} {
  const fileError = createBatchFileError(file, error);

  switch (strategy) {
    case 'stop':
      return {
        shouldContinue: false,
        shouldRetry: false,
        fileError,
      };

    case 'retry': {
      const canRetry =
        fileError.recoverable && file.retryCount < job.options.maxRetries;
      return {
        shouldContinue: !canRetry,
        shouldRetry: canRetry,
        fileError,
      };
    }

    case 'skip':
    default:
      return {
        shouldContinue: true,
        shouldRetry: false,
        fileError,
      };
  }
}

/**
 * Calculate delay for retry (exponential backoff)
 */
export function calculateRetryDelay(retryCount: number, baseDelay = 1000): number {
  const maxDelay = 30000; // 30 seconds max
  const delay = Math.min(baseDelay * Math.pow(2, retryCount), maxDelay);
  // Add jitter (random factor) to prevent thundering herd
  const jitter = delay * 0.1 * Math.random();
  return Math.floor(delay + jitter);
}

/**
 * Get user-friendly error message
 */
export function getUserFriendlyMessage(code: ErrorCode): string {
  const messages: Record<ErrorCode, string> = {
    [ERROR_CODES.FILE_NOT_FOUND]: 'The file could not be found. It may have been moved or deleted.',
    [ERROR_CODES.FILE_READ_ERROR]: 'Unable to read the file. Check if you have permission to access it.',
    [ERROR_CODES.FILE_WRITE_ERROR]: 'Unable to save the file. Check if you have write permission.',
    [ERROR_CODES.FILE_TOO_LARGE]: 'The file is too large to process.',
    [ERROR_CODES.FILE_CORRUPTED]: 'The file appears to be corrupted or damaged.',
    [ERROR_CODES.FILE_ENCRYPTED]: 'The file is encrypted and cannot be processed.',
    [ERROR_CODES.FILE_LOCKED]: 'The file is locked by another application.',
    [ERROR_CODES.INVALID_PDF]: 'This is not a valid PDF file.',
    [ERROR_CODES.PDF_PARSE_ERROR]: 'Unable to read the PDF structure.',
    [ERROR_CODES.PDF_RENDER_ERROR]: 'Unable to render the PDF pages.',
    [ERROR_CODES.PDF_SAVE_ERROR]: 'Unable to save the modified PDF.',
    [ERROR_CODES.UNSUPPORTED_PDF_VERSION]: 'This PDF version is not supported.',
    [ERROR_CODES.OPERATION_CANCELLED]: 'The operation was cancelled.',
    [ERROR_CODES.OPERATION_TIMEOUT]: 'The operation timed out. Try again or process smaller files.',
    [ERROR_CODES.OPERATION_FAILED]: 'The operation failed unexpectedly.',
    [ERROR_CODES.INVALID_OPTIONS]: 'Invalid processing options provided.',
    [ERROR_CODES.OUT_OF_MEMORY]: 'Not enough memory to process this file.',
    [ERROR_CODES.WORKER_ERROR]: 'A processing worker encountered an error.',
    [ERROR_CODES.DISK_FULL]: 'Not enough disk space to save the output.',
    [ERROR_CODES.OCR_LANGUAGE_NOT_FOUND]: 'The selected OCR language is not available.',
    [ERROR_CODES.OCR_ENGINE_ERROR]: 'The OCR engine encountered an error.',
    [ERROR_CODES.OCR_NO_TEXT_FOUND]: 'No text was found in the document.',
    [ERROR_CODES.UNKNOWN_ERROR]: 'An unexpected error occurred.',
  };

  return messages[code] || messages[ERROR_CODES.UNKNOWN_ERROR]!;
}

/**
 * Get suggested action for error
 */
export function getSuggestedAction(code: ErrorCode): string {
  const actions: Record<ErrorCode, string> = {
    [ERROR_CODES.FILE_NOT_FOUND]: 'Verify the file path and try again.',
    [ERROR_CODES.FILE_READ_ERROR]: 'Check file permissions or try a different file.',
    [ERROR_CODES.FILE_WRITE_ERROR]: 'Choose a different output location.',
    [ERROR_CODES.FILE_TOO_LARGE]: 'Try splitting the file into smaller parts first.',
    [ERROR_CODES.FILE_CORRUPTED]: 'Try opening the file in a PDF viewer to repair it.',
    [ERROR_CODES.FILE_ENCRYPTED]: 'Remove the encryption from the file first.',
    [ERROR_CODES.FILE_LOCKED]: 'Close other applications using this file and retry.',
    [ERROR_CODES.INVALID_PDF]: 'Verify this is a valid PDF file.',
    [ERROR_CODES.PDF_PARSE_ERROR]: 'Try re-saving the PDF from another application.',
    [ERROR_CODES.PDF_RENDER_ERROR]: 'Try a lower rendering quality setting.',
    [ERROR_CODES.PDF_SAVE_ERROR]: 'Check disk space and try a different output location.',
    [ERROR_CODES.UNSUPPORTED_PDF_VERSION]: 'Try converting the PDF to a newer version.',
    [ERROR_CODES.OPERATION_CANCELLED]: 'Restart the operation when ready.',
    [ERROR_CODES.OPERATION_TIMEOUT]: 'Try processing fewer files or increase timeout.',
    [ERROR_CODES.OPERATION_FAILED]: 'Check the file and try again.',
    [ERROR_CODES.INVALID_OPTIONS]: 'Review your settings and try again.',
    [ERROR_CODES.OUT_OF_MEMORY]: 'Close other applications or reduce parallelism.',
    [ERROR_CODES.WORKER_ERROR]: 'Retry the operation.',
    [ERROR_CODES.DISK_FULL]: 'Free up disk space or choose a different drive.',
    [ERROR_CODES.OCR_LANGUAGE_NOT_FOUND]: 'Download the required language pack.',
    [ERROR_CODES.OCR_ENGINE_ERROR]: 'Restart the application and try again.',
    [ERROR_CODES.OCR_NO_TEXT_FOUND]: 'Verify the document contains text or adjust preprocessing.',
    [ERROR_CODES.UNKNOWN_ERROR]: 'Try again or contact support if the problem persists.',
  };

  return actions[code] || actions[ERROR_CODES.UNKNOWN_ERROR]!;
}

/**
 * Error collection for a batch job
 */
export class BatchErrorCollector {
  private errors: BatchFileError[] = [];
  private maxErrors: number;

  constructor(maxErrors = 1000) {
    this.maxErrors = maxErrors;
  }

  /**
   * Add an error
   */
  addError(error: BatchFileError): void {
    if (this.errors.length < this.maxErrors) {
      this.errors.push(error);
    }
  }

  /**
   * Get all errors
   */
  getErrors(): BatchFileError[] {
    return [...this.errors];
  }

  /**
   * Get errors by code
   */
  getErrorsByCode(code: ErrorCode): BatchFileError[] {
    return this.errors.filter((e) => e.code === code);
  }

  /**
   * Get recoverable errors
   */
  getRecoverableErrors(): BatchFileError[] {
    return this.errors.filter((e) => e.recoverable);
  }

  /**
   * Get error count
   */
  getErrorCount(): number {
    return this.errors.length;
  }

  /**
   * Check if has errors
   */
  hasErrors(): boolean {
    return this.errors.length > 0;
  }

  /**
   * Clear errors
   */
  clear(): void {
    this.errors = [];
  }

  /**
   * Get error summary
   */
  getSummary(): Record<ErrorCode, number> {
    const summary: Record<string, number> = {};

    for (const error of this.errors) {
      const code = error.code || ERROR_CODES.UNKNOWN_ERROR;
      summary[code] = (summary[code] || 0) + 1;
    }

    return summary as Record<ErrorCode, number>;
  }
}

/**
 * Create error collector
 */
export function createErrorCollector(maxErrors?: number): BatchErrorCollector {
  return new BatchErrorCollector(maxErrors);
}
