#!/usr/bin/env node
/**
 * Generates the PDF fixture used by the web end-to-end specs.
 *
 * Output: tests/fixtures/sample.pdf (ten US Letter pages of plain text).
 * The output is deterministic: dates, producer and object order are fixed, so a
 * second run writes the same bytes.
 *
 * Usage:
 *   node scripts/generate-sample-pdf.mjs           write tests/fixtures/sample.pdf
 *   node scripts/generate-sample-pdf.mjs --check   exit 1 if the committed file differs
 */

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

const here = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT = path.resolve(here, '../tests/fixtures/sample.pdf');

const PAGE_COUNT = 10;
const PAGE_WIDTH = 612;
const PAGE_HEIGHT = 792;
const LEFT_MARGIN = 72;

const BODY_LINES = [
  'This document is a small test fixture for the PaperFlow end-to-end suite.',
  'It holds plain text, so search, selection and highlight tests have real content.',
  'The word test appears on every page of this document.',
];

/** Build the fixture and return its bytes. */
export async function buildSamplePdf() {
  const doc = await PDFDocument.create({ updateMetadata: false });
  doc.setTitle('PaperFlow test fixture');
  doc.setSubject('End-to-end test fixture');
  doc.setProducer('PaperFlow scripts/generate-sample-pdf.mjs');
  doc.setCreator('PaperFlow scripts/generate-sample-pdf.mjs');
  doc.setCreationDate(new Date(0));
  doc.setModificationDate(new Date(0));

  const heading = await doc.embedFont(StandardFonts.HelveticaBold);
  const body = await doc.embedFont(StandardFonts.Helvetica);

  for (let pageNumber = 1; pageNumber <= PAGE_COUNT; pageNumber += 1) {
    const page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    let y = PAGE_HEIGHT - 96;

    page.drawText('PaperFlow Test Document', {
      x: LEFT_MARGIN,
      y,
      size: 24,
      font: heading,
      color: rgb(0, 0, 0),
    });

    y -= 36;
    page.drawText(`Page ${pageNumber} of ${PAGE_COUNT}`, {
      x: LEFT_MARGIN,
      y,
      size: 14,
      font: body,
      color: rgb(0, 0, 0),
    });

    y -= 36;
    for (const line of BODY_LINES) {
      page.drawText(line, { x: LEFT_MARGIN, y, size: 12, font: body, color: rgb(0, 0, 0) });
      y -= 20;
    }
  }

  return doc.save({ useObjectStreams: false });
}

async function main() {
  const bytes = await buildSamplePdf();

  if (process.argv.includes('--check')) {
    const committed = await readFile(OUTPUT).catch(() => null);
    if (committed && Buffer.compare(Buffer.from(bytes), committed) === 0) {
      console.log(`OK: ${path.relative(process.cwd(), OUTPUT)} matches the generator (${bytes.length} bytes).`);
      return;
    }
    console.error(`DIFFERS: ${path.relative(process.cwd(), OUTPUT)} does not match the generator output.`);
    process.exitCode = 1;
    return;
  }

  await mkdir(path.dirname(OUTPUT), { recursive: true });
  await writeFile(OUTPUT, bytes);
  console.log(`Wrote ${path.relative(process.cwd(), OUTPUT)} (${bytes.length} bytes, ${PAGE_COUNT} pages).`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await main();
}
