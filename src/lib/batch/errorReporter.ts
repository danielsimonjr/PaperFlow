/**
 * Batch Error Reporter
 * Generates detailed error reports for batch operations.
 */

import type {
  BatchJob,
  BatchFileError,
  BatchJobResult,
  OutputFileInfo,
} from '@/types/batch';
import { getUserFriendlyMessage, getSuggestedAction, type ErrorCode } from './errorHandler';

/**
 * Error report format
 */
export interface BatchErrorReport {
  summary: BatchReportSummary;
  details: BatchReportDetails;
  recommendations: string[];
  exportable: BatchReportExport;
}

/**
 * Report summary section
 */
export interface BatchReportSummary {
  jobId: string;
  jobName: string;
  operationType: string;
  startTime: string;
  endTime: string;
  duration: string;
  totalFiles: number;
  successCount: number;
  failedCount: number;
  skippedCount: number;
  successRate: string;
}

/**
 * Report details section
 */
export interface BatchReportDetails {
  successfulFiles: Array<{
    name: string;
    inputPath: string;
    outputPath: string;
    inputSize: string;
    outputSize: string;
    processingTime: string;
  }>;
  failedFiles: Array<{
    name: string;
    path: string;
    error: string;
    errorCode: string;
    suggestion: string;
    recoverable: boolean;
    timestamp: string;
  }>;
  errorsByType: Array<{
    code: string;
    count: number;
    description: string;
  }>;
}

/**
 * Exportable report format
 */
export interface BatchReportExport {
  text: string;
  csv: string;
  json: string;
}

/**
 * Format bytes to human-readable size
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Format duration in milliseconds to human-readable string
 */
function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${minutes}m ${seconds}s`;
}

/**
 * Format timestamp to ISO string
 */
function formatTimestamp(timestamp: number): string {
  return new Date(timestamp).toISOString();
}

/**
 * Generate error report from job result
 */
export function generateErrorReport(
  job: BatchJob,
  result: BatchJobResult
): BatchErrorReport {
  const startTime = job.startedAt || job.createdAt;
  const endTime = job.completedAt || Date.now();
  const duration = endTime - startTime;

  // Build summary
  const summary: BatchReportSummary = {
    jobId: job.id,
    jobName: job.name,
    operationType: job.type,
    startTime: formatTimestamp(startTime),
    endTime: formatTimestamp(endTime),
    duration: formatDuration(duration),
    totalFiles: result.totalFiles,
    successCount: result.successCount,
    failedCount: result.failedCount,
    skippedCount: result.skippedCount,
    successRate: `${((result.successCount / result.totalFiles) * 100).toFixed(1)}%`,
  };

  // Build details
  const successfulFiles = result.outputFiles.map((file: OutputFileInfo) => ({
    name: file.inputPath.split('/').pop() || file.inputPath,
    inputPath: file.inputPath,
    outputPath: file.outputPath,
    inputSize: formatBytes(file.inputSize),
    outputSize: formatBytes(file.outputSize),
    processingTime: formatDuration(file.processingTime),
  }));

  const failedFiles = result.errors.map((error: BatchFileError) => ({
    name: error.fileName,
    path: error.fileId,
    error: error.error,
    errorCode: error.code || 'UNKNOWN',
    suggestion: getSuggestedAction((error.code as ErrorCode) || 'UNKNOWN_ERROR'),
    recoverable: error.recoverable,
    timestamp: formatTimestamp(error.timestamp),
  }));

  // Group errors by type
  const errorCounts: Record<string, number> = {};
  for (const error of result.errors) {
    const code = error.code || 'UNKNOWN';
    errorCounts[code] = (errorCounts[code] || 0) + 1;
  }

  const errorsByType = Object.entries(errorCounts).map(([code, count]) => ({
    code,
    count,
    description: getUserFriendlyMessage(code as ErrorCode),
  }));

  const details: BatchReportDetails = {
    successfulFiles,
    failedFiles,
    errorsByType,
  };

  // Generate recommendations
  const recommendations = generateRecommendations(result);

  // Generate exportable formats
  const exportable = generateExportableFormats(summary, details, recommendations);

  return {
    summary,
    details,
    recommendations,
    exportable,
  };
}

/**
 * Generate recommendations based on errors
 */
function generateRecommendations(result: BatchJobResult): string[] {
  const recommendations: string[] = [];
  const errorCodes = new Set(result.errors.map((e: BatchFileError) => e.code));

  // General recommendations based on error types
  if (errorCodes.has('OUT_OF_MEMORY')) {
    recommendations.push(
      'Consider reducing parallelism to process fewer files simultaneously.'
    );
    recommendations.push('Close other applications to free up memory.');
  }

  if (errorCodes.has('FILE_LOCKED')) {
    recommendations.push('Ensure no other applications are using the files.');
  }

  if (errorCodes.has('FILE_ENCRYPTED')) {
    recommendations.push('Remove encryption from files before batch processing.');
  }

  if (errorCodes.has('INVALID_PDF') || errorCodes.has('FILE_CORRUPTED')) {
    recommendations.push('Validate PDF files before adding them to the batch.');
    recommendations.push('Consider using a PDF repair tool for corrupted files.');
  }

  if (errorCodes.has('DISK_FULL')) {
    recommendations.push('Free up disk space or use a different output location.');
  }

  if (errorCodes.has('OPERATION_TIMEOUT')) {
    recommendations.push('Consider processing smaller batches of files.');
    recommendations.push('Increase the operation timeout in settings.');
  }

  // Recoverable error recommendation
  const recoverableCount = result.errors.filter((e: BatchFileError) => e.recoverable).length;
  if (recoverableCount > 0) {
    recommendations.push(
      `${recoverableCount} error(s) may be recoverable. Consider retrying failed files.`
    );
  }

  // Success rate recommendation
  const successRate = result.successCount / result.totalFiles;
  if (successRate < 0.5) {
    recommendations.push(
      'Less than half of the files succeeded. Review your input files and settings.'
    );
  }

  return recommendations;
}

/**
 * Generate exportable report formats
 */
function generateExportableFormats(
  summary: BatchReportSummary,
  details: BatchReportDetails,
  recommendations: string[]
): BatchReportExport {
  // Text format
  const textLines = [
    '='.repeat(60),
    'BATCH PROCESSING REPORT',
    '='.repeat(60),
    '',
    'SUMMARY',
    '-'.repeat(40),
    `Job ID: ${summary.jobId}`,
    `Job Name: ${summary.jobName}`,
    `Operation: ${summary.operationType}`,
    `Start Time: ${summary.startTime}`,
    `End Time: ${summary.endTime}`,
    `Duration: ${summary.duration}`,
    '',
    `Total Files: ${summary.totalFiles}`,
    `Successful: ${summary.successCount}`,
    `Failed: ${summary.failedCount}`,
    `Skipped: ${summary.skippedCount}`,
    `Success Rate: ${summary.successRate}`,
    '',
  ];

  if (details.failedFiles.length > 0) {
    textLines.push('ERRORS', '-'.repeat(40));
    for (const file of details.failedFiles) {
      textLines.push(`File: ${file.name}`);
      textLines.push(`  Error: ${file.error}`);
      textLines.push(`  Code: ${file.errorCode}`);
      textLines.push(`  Suggestion: ${file.suggestion}`);
      textLines.push('');
    }
  }

  if (recommendations.length > 0) {
    textLines.push('RECOMMENDATIONS', '-'.repeat(40));
    for (const rec of recommendations) {
      textLines.push(`- ${rec}`);
    }
  }

  const text = textLines.join('\n');

  // CSV format
  const csvRows = [
    ['File Name', 'Status', 'Error', 'Error Code', 'Processing Time'].join(','),
  ];

  for (const file of details.successfulFiles) {
    csvRows.push(
      [
        `"${file.name}"`,
        'Success',
        '',
        '',
        file.processingTime,
      ].join(',')
    );
  }

  for (const file of details.failedFiles) {
    csvRows.push(
      [
        `"${file.name}"`,
        'Failed',
        `"${file.error.replace(/"/g, '""')}"`,
        file.errorCode,
        '',
      ].join(',')
    );
  }

  const csv = csvRows.join('\n');

  // JSON format
  const json = JSON.stringify(
    {
      summary,
      successfulFiles: details.successfulFiles,
      failedFiles: details.failedFiles,
      errorsByType: details.errorsByType,
      recommendations,
    },
    null,
    2
  );

  return { text, csv, json };
}

/**
 * Create a minimal report for quick display
 */
export function createQuickReport(result: BatchJobResult): string {
  const lines = [
    `Processed ${result.totalFiles} files in ${formatDuration(result.totalTime)}`,
    `  Successful: ${result.successCount}`,
    `  Failed: ${result.failedCount}`,
    `  Skipped: ${result.skippedCount}`,
  ];

  if (result.statistics.compressionRatio !== undefined) {
    lines.push(
      `  Compression: ${result.statistics.compressionRatio.toFixed(1)}%`
    );
  }

  if (result.errors.length > 0) {
    lines.push('');
    lines.push('Recent errors:');
    for (const error of result.errors.slice(-3)) {
      lines.push(`  - ${error.fileName}: ${error.error}`);
    }
  }

  return lines.join('\n');
}

/**
 * Download report as file
 */
export function downloadReport(
  report: BatchErrorReport,
  format: 'text' | 'csv' | 'json',
  filename: string
): void {
  const content = report.exportable[format];
  const mimeTypes = {
    text: 'text/plain',
    csv: 'text/csv',
    json: 'application/json',
  };
  const extensions = {
    text: 'txt',
    csv: 'csv',
    json: 'json',
  };

  const blob = new Blob([content], { type: mimeTypes[format] });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.${extensions[format]}`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
