/**
 * OCR Export Formats
 * Exports OCR results in various formats (plain text, HTML, hOCR).
 */

import type { OCRResult, BoundingBox } from './types';
import type { LayoutAnalysis, Table } from './layoutAnalyzer';
import { tableToCSV } from './layoutAnalyzer';

export interface ExportOptions {
  /** Include confidence scores in output */
  includeConfidence: boolean;
  /** Include bounding boxes in output */
  includeBoundingBoxes: boolean;
  /** Preserve line breaks */
  preserveLineBreaks: boolean;
  /** Preserve paragraph breaks */
  preserveParagraphs: boolean;
  /** Page range to export (empty = all) */
  pageRange?: number[];
}

const DEFAULT_OPTIONS: ExportOptions = {
  includeConfidence: false,
  includeBoundingBoxes: false,
  preserveLineBreaks: true,
  preserveParagraphs: true,
};

/**
 * Exports OCR results to plain text
 */
export function exportToPlainText(
  results: Map<number, OCRResult>,
  _layout?: LayoutAnalysis,
  options: Partial<ExportOptions> = {}
): string {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const pages = opts.pageRange ?? Array.from(results.keys()).sort((a, b) => a - b);

  const textParts: string[] = [];

  for (const pageIndex of pages) {
    const result = results.get(pageIndex);
    if (!result) continue;

    if (textParts.length > 0) {
      textParts.push('\n\n--- Page ' + (pageIndex + 1) + ' ---\n\n');
    }

    if (opts.preserveParagraphs && result.blocks.length > 0) {
      // Use block structure for paragraphs
      for (const block of result.blocks) {
        textParts.push(block.text);
        textParts.push('\n\n');
      }
    } else if (opts.preserveLineBreaks && result.lines.length > 0) {
      // Use line structure
      for (const line of result.lines) {
        textParts.push(line.text);
        textParts.push('\n');
      }
    } else {
      // Raw text
      textParts.push(result.text);
    }
  }

  return textParts.join('').trim();
}

/**
 * Exports OCR results to HTML
 */
export function exportToHTML(
  results: Map<number, OCRResult>,
  layout?: LayoutAnalysis,
  options: Partial<ExportOptions> = {}
): string {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const pages = opts.pageRange ?? Array.from(results.keys()).sort((a, b) => a - b);

  const html: string[] = [
    '<!DOCTYPE html>',
    '<html lang="en">',
    '<head>',
    '  <meta charset="UTF-8">',
    '  <meta name="viewport" content="width=device-width, initial-scale=1.0">',
    '  <title>OCR Results</title>',
    '  <style>',
    '    body { font-family: Arial, sans-serif; line-height: 1.6; max-width: 800px; margin: 0 auto; padding: 20px; }',
    '    .page { margin-bottom: 40px; padding-bottom: 20px; border-bottom: 2px solid #ccc; }',
    '    .page-header { color: #666; font-size: 14px; margin-bottom: 10px; }',
    '    .paragraph { margin-bottom: 16px; }',
    '    .line { margin-bottom: 4px; }',
    '    .word { display: inline; }',
    '    .low-confidence { background-color: #ffcccc; }',
    '    .medium-confidence { background-color: #ffffcc; }',
    '    table { border-collapse: collapse; margin: 16px 0; width: 100%; }',
    '    th, td { border: 1px solid #ccc; padding: 8px; text-align: left; }',
    '    th { background-color: #f5f5f5; }',
    '  </style>',
    '</head>',
    '<body>',
  ];

  for (const pageIndex of pages) {
    const result = results.get(pageIndex);
    if (!result) continue;

    html.push(`  <div class="page" data-page="${pageIndex + 1}">`);
    html.push(`    <div class="page-header">Page ${pageIndex + 1}</div>`);

    // Check if layout has tables for this page
    if (layout?.tables && layout.tables.length > 0) {
      // Render tables
      for (const table of layout.tables) {
        html.push(renderTableHTML(table));
      }
    }

    // Render text content
    if (opts.preserveParagraphs && result.blocks.length > 0) {
      for (const block of result.blocks) {
        html.push(`    <div class="paragraph">`);

        if (opts.includeConfidence) {
          // Render with word-level confidence
          for (const line of block.lines) {
            html.push(`      <div class="line">`);
            for (const word of line.words) {
              const confClass = getConfidenceClass(word.confidence);
              html.push(`        <span class="word ${confClass}" title="Confidence: ${word.confidence.toFixed(1)}%">${escapeHTML(word.text)}</span> `);
            }
            html.push(`      </div>`);
          }
        } else {
          html.push(`      ${escapeHTML(block.text)}`);
        }

        html.push(`    </div>`);
      }
    } else if (opts.preserveLineBreaks && result.lines.length > 0) {
      for (const line of result.lines) {
        html.push(`    <div class="line">${escapeHTML(line.text)}</div>`);
      }
    } else {
      html.push(`    <p>${escapeHTML(result.text)}</p>`);
    }

    html.push(`  </div>`);
  }

  html.push('</body>');
  html.push('</html>');

  return html.join('\n');
}

/**
 * Renders a table as HTML
 */
function renderTableHTML(table: Table): string {
  const rows: string[][] = [];

  // Initialize empty grid
  for (let r = 0; r < table.rows; r++) {
    rows.push(new Array(table.cols).fill(''));
  }

  // Fill cells
  for (const cell of table.cells) {
    if (rows[cell.row]) {
      rows[cell.row]![cell.col] = escapeHTML(cell.text);
    }
  }

  const html: string[] = ['    <table>'];

  for (let r = 0; r < rows.length; r++) {
    html.push('      <tr>');
    const tag = table.hasHeader && r === 0 ? 'th' : 'td';
    for (const cell of rows[r]!) {
      html.push(`        <${tag}>${cell || '&nbsp;'}</${tag}>`);
    }
    html.push('      </tr>');
  }

  html.push('    </table>');
  return html.join('\n');
}

/**
 * Exports OCR results to hOCR format
 * hOCR is a standard format for OCR output with bounding boxes
 */
export function exportToHOCR(
  results: Map<number, OCRResult>,
  options: Partial<ExportOptions> = {}
): string {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const pages = opts.pageRange ?? Array.from(results.keys()).sort((a, b) => a - b);

  const hocr: string[] = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">',
    '<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="en" lang="en">',
    '<head>',
    '  <title>OCR Results - hOCR Format</title>',
    '  <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />',
    '  <meta name="ocr-system" content="PaperFlow OCR" />',
    '  <meta name="ocr-capabilities" content="ocr_page ocr_carea ocr_par ocr_line ocrx_word" />',
    '</head>',
    '<body>',
  ];

  for (const pageIndex of pages) {
    const result = results.get(pageIndex);
    if (!result) continue;

    const pageBbox = result.imageDimensions
      ? `0 0 ${result.imageDimensions.width} ${result.imageDimensions.height}`
      : '0 0 0 0';

    hocr.push(`  <div class="ocr_page" id="page_${pageIndex + 1}" title="image page${pageIndex + 1}.png; bbox ${pageBbox}; ppageno ${pageIndex}">`);

    // Output blocks (content areas)
    for (let bIdx = 0; bIdx < result.blocks.length; bIdx++) {
      const block = result.blocks[bIdx]!;
      const blockBbox = formatBbox(block.bbox);
      hocr.push(`    <div class="ocr_carea" id="block_${pageIndex}_${bIdx}" title="bbox ${blockBbox}">`);

      // Output lines
      for (let lIdx = 0; lIdx < block.lines.length; lIdx++) {
        const line = block.lines[lIdx]!;
        const lineBbox = formatBbox(line.bbox);
        const baseline = line.baseline ? `baseline ${((line.baseline.y1 - line.baseline.y0) / Math.max(1, line.baseline.x1 - line.baseline.x0)).toFixed(3)} ${line.baseline.y0.toFixed(1)}` : '';
        hocr.push(`      <span class="ocr_line" id="line_${pageIndex}_${bIdx}_${lIdx}" title="bbox ${lineBbox}; ${baseline}">`);

        // Output words
        for (let wIdx = 0; wIdx < line.words.length; wIdx++) {
          const word = line.words[wIdx]!;
          const wordBbox = formatBbox(word.bbox);
          const conf = Math.round(word.confidence);
          hocr.push(`        <span class="ocrx_word" id="word_${pageIndex}_${bIdx}_${lIdx}_${wIdx}" title="bbox ${wordBbox}; x_wconf ${conf}">${escapeHTML(word.text)}</span>`);
        }

        hocr.push(`      </span>`);
      }

      hocr.push(`    </div>`);
    }

    hocr.push(`  </div>`);
  }

  hocr.push('</body>');
  hocr.push('</html>');

  return hocr.join('\n');
}

/**
 * Exports OCR results to JSON format
 */
export function exportToJSON(
  results: Map<number, OCRResult>,
  layout?: LayoutAnalysis,
  options: Partial<ExportOptions> = {}
): string {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const pages = opts.pageRange ?? Array.from(results.keys()).sort((a, b) => a - b);

  const output: Record<string, unknown> = {
    exportDate: new Date().toISOString(),
    pageCount: pages.length,
    pages: [] as unknown[],
  };

  for (const pageIndex of pages) {
    const result = results.get(pageIndex);
    if (!result) continue;

    const pageData: Record<string, unknown> = {
      pageNumber: pageIndex + 1,
      text: result.text,
      confidence: result.confidence,
      processingTime: result.processingTime,
    };

    if (opts.includeBoundingBoxes) {
      pageData.blocks = result.blocks.map((block) => ({
        text: block.text,
        bbox: block.bbox,
        confidence: block.confidence,
        lines: block.lines.map((line) => ({
          text: line.text,
          bbox: line.bbox,
          confidence: line.confidence,
          words: line.words.map((word) => ({
            text: word.text,
            bbox: word.bbox,
            confidence: word.confidence,
          })),
        })),
      }));
    } else {
      pageData.blocks = result.blocks.map((block) => ({
        text: block.text,
        confidence: block.confidence,
      }));
    }

    (output.pages as unknown[]).push(pageData);
  }

  if (layout) {
    output.layout = {
      isMultiColumn: layout.isMultiColumn,
      estimatedColumns: layout.estimatedColumns,
      language: layout.language,
      tables: layout.tables.map((t) => ({
        rows: t.rows,
        cols: t.cols,
        hasHeader: t.hasHeader,
        csv: tableToCSV(t),
      })),
    };
  }

  return JSON.stringify(output, null, 2);
}

/**
 * Exports tables to CSV
 */
export function exportTablesToCSV(layout: LayoutAnalysis): Map<string, string> {
  const csvMap = new Map<string, string>();

  for (const table of layout.tables) {
    csvMap.set(table.id, tableToCSV(table));
  }

  return csvMap;
}

/**
 * Gets confidence class for styling
 */
function getConfidenceClass(confidence: number): string {
  if (confidence < 70) return 'low-confidence';
  if (confidence < 90) return 'medium-confidence';
  return '';
}

/**
 * Formats bounding box for hOCR
 */
function formatBbox(bbox: BoundingBox): string {
  return `${Math.round(bbox.x0)} ${Math.round(bbox.y0)} ${Math.round(bbox.x1)} ${Math.round(bbox.y1)}`;
}

/**
 * Escapes HTML special characters
 */
function escapeHTML(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
