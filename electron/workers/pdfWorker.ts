/**
 * PDF Worker Thread
 * Handles PDF operations in a dedicated worker thread.
 */

import { parentPort, workerData } from 'worker_threads';
import { readFile, writeFile } from 'fs/promises';
import { PDFDocument } from 'pdf-lib';

/**
 * Worker task message
 */
interface TaskMessage {
  type: 'task';
  task: {
    id: string;
    type: string;
    payload: {
      inputPath: string;
      outputPath: string;
      options: unknown;
    };
  };
}

/**
 * Send progress update
 */
function sendProgress(taskId: string, progress: number): void {
  parentPort?.postMessage({
    type: 'progress',
    taskId,
    progress,
  });
}

/**
 * Send result
 */
function sendResult(taskId: string, result?: unknown, error?: string): void {
  parentPort?.postMessage({
    type: 'result',
    taskId,
    result,
    error,
  });
}

/**
 * Compress PDF operation
 */
async function compressPdf(
  taskId: string,
  inputPath: string,
  outputPath: string,
  options: {
    quality?: string;
    imageQuality?: number;
    removeMetadata?: boolean;
  }
): Promise<{ size: number }> {
  sendProgress(taskId, 10);

  // Read input file
  const inputBytes = await readFile(inputPath);
  sendProgress(taskId, 20);

  // Load PDF
  const pdfDoc = await PDFDocument.load(inputBytes, {
    updateMetadata: false,
  });
  sendProgress(taskId, 40);

  // Remove metadata if requested
  if (options.removeMetadata) {
    pdfDoc.setTitle('');
    pdfDoc.setAuthor('');
    pdfDoc.setSubject('');
    pdfDoc.setKeywords([]);
    pdfDoc.setCreator('');
    pdfDoc.setProducer('PaperFlow');
  }

  sendProgress(taskId, 60);

  // Save with compression
  const outputBytes = await pdfDoc.save({
    useObjectStreams: true,
    addDefaultPage: false,
  });

  sendProgress(taskId, 80);

  // Write output
  await writeFile(outputPath, outputBytes);
  sendProgress(taskId, 100);

  return { size: outputBytes.length };
}

/**
 * Merge PDFs operation
 */
async function mergePdfs(
  taskId: string,
  inputPaths: string[],
  outputPath: string,
  options: {
    strategy?: string;
    addBookmarks?: boolean;
  }
): Promise<{ size: number; pageCount: number }> {
  // Options reserved for future bookmark support
  void options;
  sendProgress(taskId, 5);

  const mergedPdf = await PDFDocument.create();
  let totalPages = 0;

  for (let i = 0; i < inputPaths.length; i++) {
    const inputPath = inputPaths[i]!;
    const progress = 5 + Math.round(((i + 1) / inputPaths.length) * 80);

    // Read and load source PDF
    const inputBytes = await readFile(inputPath);
    const sourcePdf = await PDFDocument.load(inputBytes);
    const pageCount = sourcePdf.getPageCount();

    // Copy all pages
    const copiedPages = await mergedPdf.copyPages(
      sourcePdf,
      Array.from({ length: pageCount }, (_, j) => j)
    );

    for (const page of copiedPages) {
      mergedPdf.addPage(page);
    }

    totalPages += pageCount;
    sendProgress(taskId, progress);
  }

  // Set metadata
  mergedPdf.setProducer('PaperFlow');
  mergedPdf.setCreationDate(new Date());

  sendProgress(taskId, 90);

  // Save
  const outputBytes = await mergedPdf.save();
  await writeFile(outputPath, outputBytes);

  sendProgress(taskId, 100);

  return { size: outputBytes.length, pageCount: totalPages };
}

/**
 * Split PDF operation
 */
async function splitPdf(
  taskId: string,
  inputPath: string,
  outputDir: string,
  options: {
    method?: string;
    pagesPerFile?: number;
  }
): Promise<{ parts: number; totalPages: number }> {
  sendProgress(taskId, 10);

  // Read input
  const inputBytes = await readFile(inputPath);
  const sourcePdf = await PDFDocument.load(inputBytes);
  const totalPages = sourcePdf.getPageCount();

  const pagesPerFile = options.pagesPerFile || 10;
  const totalParts = Math.ceil(totalPages / pagesPerFile);

  sendProgress(taskId, 20);

  for (let part = 0; part < totalParts; part++) {
    const startPage = part * pagesPerFile;
    const endPage = Math.min(startPage + pagesPerFile, totalPages);
    const pageIndices = Array.from(
      { length: endPage - startPage },
      (_, i) => startPage + i
    );

    // Create part PDF
    const partPdf = await PDFDocument.create();
    const copiedPages = await partPdf.copyPages(sourcePdf, pageIndices);

    for (const page of copiedPages) {
      partPdf.addPage(page);
    }

    partPdf.setProducer('PaperFlow');

    // Save part
    const partBytes = await partPdf.save();
    const partPath = `${outputDir}/part_${String(part + 1).padStart(3, '0')}.pdf`;
    await writeFile(partPath, partBytes);

    sendProgress(taskId, 20 + Math.round(((part + 1) / totalParts) * 75));
  }

  sendProgress(taskId, 100);

  return { parts: totalParts, totalPages };
}

/**
 * Add watermark operation
 */
async function addWatermark(
  taskId: string,
  inputPath: string,
  outputPath: string,
  options: {
    text?: string;
    opacity?: number;
    rotation?: number;
    fontSize?: number;
    color?: string;
  }
): Promise<{ size: number; pagesProcessed: number }> {
  sendProgress(taskId, 10);

  // Read input
  const inputBytes = await readFile(inputPath);
  const pdfDoc = await PDFDocument.load(inputBytes);
  const pages = pdfDoc.getPages();

  sendProgress(taskId, 20);

  // Get font
  const { StandardFonts, rgb, degrees } = await import('pdf-lib');
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

  const text = options.text || 'WATERMARK';
  const fontSize = options.fontSize || 72;
  const opacity = options.opacity || 0.3;
  const rotation = options.rotation || -45;

  // Parse color
  let colorObj = { r: 0.5, g: 0.5, b: 0.5 };
  if (options.color) {
    const hex = options.color.replace('#', '');
    colorObj = {
      r: parseInt(hex.slice(0, 2), 16) / 255,
      g: parseInt(hex.slice(2, 4), 16) / 255,
      b: parseInt(hex.slice(4, 6), 16) / 255,
    };
  }

  for (let i = 0; i < pages.length; i++) {
    const page = pages[i]!;
    const { width, height } = page.getSize();

    page.drawText(text, {
      x: width / 2,
      y: height / 2,
      size: fontSize,
      font,
      color: rgb(colorObj.r, colorObj.g, colorObj.b),
      opacity,
      rotate: degrees(rotation),
    });

    sendProgress(taskId, 20 + Math.round(((i + 1) / pages.length) * 70));
  }

  sendProgress(taskId, 95);

  // Save
  const outputBytes = await pdfDoc.save();
  await writeFile(outputPath, outputBytes);

  sendProgress(taskId, 100);

  return { size: outputBytes.length, pagesProcessed: pages.length };
}

/**
 * Handle incoming messages
 */
parentPort?.on('message', async (message: TaskMessage) => {
  if (message.type !== 'task') return;

  const { task } = message;
  const { payload } = task;

  try {
    let result: unknown;

    switch (task.type) {
      case 'compress':
        result = await compressPdf(
          task.id,
          payload.inputPath,
          payload.outputPath,
          payload.options as Parameters<typeof compressPdf>[3]
        );
        break;

      case 'merge':
        // For merge, inputPath is actually an array of paths
        result = await mergePdfs(
          task.id,
          (payload.options as { inputPaths: string[] }).inputPaths,
          payload.outputPath,
          payload.options as Parameters<typeof mergePdfs>[3]
        );
        break;

      case 'split':
        result = await splitPdf(
          task.id,
          payload.inputPath,
          payload.outputPath, // outputPath is directory for split
          payload.options as Parameters<typeof splitPdf>[3]
        );
        break;

      case 'watermark':
        result = await addWatermark(
          task.id,
          payload.inputPath,
          payload.outputPath,
          payload.options as Parameters<typeof addWatermark>[3]
        );
        break;

      default:
        throw new Error(`Unknown operation type: ${task.type}`);
    }

    sendResult(task.id, result);
  } catch (error) {
    sendResult(
      task.id,
      undefined,
      error instanceof Error ? error.message : String(error)
    );
  }
});

// Log worker initialization
console.log(`[PDF Worker] Initialized with ID: ${workerData?.workerId}`);
