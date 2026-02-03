/**
 * Print Workflow Integration Tests
 *
 * Tests for the complete print workflow including
 * queue management, settings, and presets.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { PrintQueue } from '@lib/print/printQueue';
import { PrintPresetsManager } from '@lib/print/presets';
import { PrintAccessibility, DEFAULT_ACCESSIBILITY_OPTIONS } from '@lib/print/accessibility';
import { VirtualPrinter, VIRTUAL_PRINTER_NAME } from '@lib/print/virtualPrinter';
import { BookletLayout } from '@lib/print/bookletLayout';
import { NUpLayout } from '@lib/print/nupLayout';
import type { PrintSettings } from '@stores/printStore';

describe('Print Workflow', () => {
  const defaultSettings: PrintSettings = {
    printerName: 'Test Printer',
    copies: 1,
    color: true,
    duplex: 'simplex',
    landscape: false,
    paperSize: 'Letter',
    margins: { top: 72, bottom: 72, left: 72, right: 72 },
    scale: 100,
    pageRanges: [],
    collate: true,
    quality: 'normal',
    printBackground: true,
  };

  describe('PrintQueue', () => {
    let queue: PrintQueue;

    beforeEach(() => {
      queue = new PrintQueue();
    });

    it('should add jobs to the queue', () => {
      const jobId = queue.addJob({
        documentName: 'test.pdf',
        printerName: 'Test Printer',
        totalPages: 10,
        settings: defaultSettings,
      });

      expect(jobId).toBeDefined();
      expect(queue.getJob(jobId)).toBeDefined();
      expect(queue.getAllJobs().length).toBe(1);
    });

    it('should track job status transitions', () => {
      const jobId = queue.addJob({
        documentName: 'test.pdf',
        printerName: 'Test Printer',
        totalPages: 10,
        settings: defaultSettings,
      });

      // First job in queue is auto-started by processNext()
      // So initial status is 'printing' not 'pending'
      expect(queue.getJob(jobId)?.status).toBe('printing');

      // Job is already started
      expect(queue.getJob(jobId)?.startedAt).toBeDefined();

      // Complete job
      queue.completeJob(jobId);
      expect(queue.getJob(jobId)?.status).toBe('completed');
      expect(queue.getJob(jobId)?.completedAt).toBeDefined();
    });

    it('should handle job cancellation', () => {
      const jobId = queue.addJob({
        documentName: 'test.pdf',
        printerName: 'Test Printer',
        totalPages: 10,
        settings: defaultSettings,
      });

      queue.cancelJob(jobId);
      expect(queue.getJob(jobId)?.status).toBe('cancelled');
    });

    it('should track job progress', () => {
      const jobId = queue.addJob({
        documentName: 'test.pdf',
        printerName: 'Test Printer',
        totalPages: 10,
        settings: defaultSettings,
      });

      queue.startJob(jobId);
      queue.updateProgress(jobId, 5);

      expect(queue.getJob(jobId)?.pagesPrinted).toBe(5);
    });

    it('should emit events', () => {
      const addedCallback = vi.fn();
      const startedCallback = vi.fn();
      const completedCallback = vi.fn();

      queue.on('jobAdded', addedCallback);
      queue.on('jobStarted', startedCallback);
      queue.on('jobCompleted', completedCallback);

      const jobId = queue.addJob({
        documentName: 'test.pdf',
        printerName: 'Test Printer',
        totalPages: 10,
        settings: defaultSettings,
      });

      expect(addedCallback).toHaveBeenCalledTimes(1);

      queue.startJob(jobId);
      expect(startedCallback).toHaveBeenCalledTimes(1);

      queue.completeJob(jobId);
      expect(completedCallback).toHaveBeenCalledTimes(1);
    });

    it('should calculate queue statistics', () => {
      // First job is auto-started when added
      const job1Id = queue.addJob({
        documentName: 'doc1.pdf',
        printerName: 'Test Printer',
        totalPages: 10,
        settings: defaultSettings,
      });

      // Second job stays pending because first is printing
      const job2Id = queue.addJob({
        documentName: 'doc2.pdf',
        printerName: 'Test Printer',
        totalPages: 20,
        settings: defaultSettings,
      });

      const stats = queue.getStatistics();
      expect(stats.totalJobs).toBe(2);
      // First job is auto-started, so only 1 pending
      expect(stats.pendingJobs).toBe(1);
      expect(stats.printingJobs).toBe(1);

      // Complete first job, second will auto-start
      queue.completeJob(job1Id);

      // Now complete second job
      queue.completeJob(job2Id);

      const updatedStats = queue.getStatistics();
      // Both jobs completed
      expect(updatedStats.completedJobs).toBe(2);
      // Total pages = 10 + 20
      expect(updatedStats.totalPagesPrinted).toBe(30);
    });

    it('should clear completed jobs', () => {
      const jobId = queue.addJob({
        documentName: 'test.pdf',
        printerName: 'Test Printer',
        totalPages: 10,
        settings: defaultSettings,
      });

      queue.startJob(jobId);
      queue.completeJob(jobId);

      expect(queue.getAllJobs().length).toBe(1);

      queue.clearFinishedJobs();
      expect(queue.getAllJobs().length).toBe(0);
    });
  });

  describe('PrintPresetsManager', () => {
    beforeEach(() => {
      // Clear custom presets before each test
      localStorage.clear();
    });

    it('should return default presets', () => {
      const presets = PrintPresetsManager.getDefaultPresets();

      expect(presets.length).toBeGreaterThan(0);
      expect(presets.every((p) => p.isDefault)).toBe(true);
    });

    it('should save and load custom presets', () => {
      const preset = PrintPresetsManager.savePreset(
        'My Preset',
        { color: false, quality: 'draft' },
        'Custom description'
      );

      expect(preset.id).toBeDefined();
      expect(preset.name).toBe('My Preset');
      expect(preset.settings.color).toBe(false);

      const loaded = PrintPresetsManager.getPreset(preset.id);
      expect(loaded).toBeDefined();
      expect(loaded?.name).toBe('My Preset');
    });

    it('should update custom presets', () => {
      const preset = PrintPresetsManager.savePreset('Test', { color: true });

      const success = PrintPresetsManager.updatePreset(preset.id, {
        name: 'Updated',
      });

      expect(success).toBe(true);

      const updated = PrintPresetsManager.getPreset(preset.id);
      expect(updated?.name).toBe('Updated');
    });

    it('should delete custom presets', () => {
      const preset = PrintPresetsManager.savePreset('To Delete', {});

      const success = PrintPresetsManager.deletePreset(preset.id);
      expect(success).toBe(true);

      const deleted = PrintPresetsManager.getPreset(preset.id);
      expect(deleted).toBeUndefined();
    });

    it('should export and import presets', () => {
      PrintPresetsManager.savePreset('Export Test', { color: false });

      const exported = PrintPresetsManager.exportPresets(false);
      expect(exported).toContain('Export Test');

      // Clear and re-import
      PrintPresetsManager.resetToDefaults();

      const result = PrintPresetsManager.importPresets(exported);
      expect(result.imported).toBe(1);
      expect(result.errors.length).toBe(0);
    });

    it('should suggest presets based on document type', () => {
      expect(PrintPresetsManager.suggestPreset('text')).toBe('draft');
      expect(PrintPresetsManager.suggestPreset('photos')).toBe('photos');
      expect(PrintPresetsManager.suggestPreset('presentation')).toBe('presentation');
    });
  });

  describe('PrintAccessibility', () => {
    it('should apply large print settings', () => {
      const options = {
        ...DEFAULT_ACCESSIBILITY_OPTIONS,
        largePrint: true,
        fontSize: 24,
      };

      const modified = PrintAccessibility.applyOptions(defaultSettings, options);

      // Scale should be increased for large print
      expect(modified.scale).toBeGreaterThan(defaultSettings.scale);
    });

    it('should apply high contrast settings', () => {
      const options = {
        ...DEFAULT_ACCESSIBILITY_OPTIONS,
        highContrast: true,
      };

      const modified = PrintAccessibility.applyOptions(defaultSettings, options);

      expect(modified.color).toBe(false);
    });

    it('should apply text only settings', () => {
      const options = {
        ...DEFAULT_ACCESSIBILITY_OPTIONS,
        textOnly: true,
      };

      const modified = PrintAccessibility.applyOptions(defaultSettings, options);

      expect(modified.printBackground).toBe(false);
    });

    it('should generate CSS for accessibility options', () => {
      const options = {
        ...DEFAULT_ACCESSIBILITY_OPTIONS,
        largePrint: true,
        fontSize: 24,
        lineSpacing: 2,
      };

      const css = PrintAccessibility.generateCSS(options);

      expect(css).toContain('font-size: 24pt');
      expect(css).toContain('line-height: 2');
    });

    it('should validate options', () => {
      const validResult = PrintAccessibility.validateOptions({
        fontSize: 18,
        lineSpacing: 1.5,
      });
      expect(validResult.valid).toBe(true);

      const invalidResult = PrintAccessibility.validateOptions({
        fontSize: 5, // Too small
        lineSpacing: 5, // Too large
      });
      expect(invalidResult.valid).toBe(false);
      expect(invalidResult.errors.length).toBe(2);
    });
  });

  describe('VirtualPrinter', () => {
    it('should identify virtual printer', () => {
      expect(VirtualPrinter.isVirtualPrinter(VIRTUAL_PRINTER_NAME)).toBe(true);
      expect(VirtualPrinter.isVirtualPrinter('Save as PDF')).toBe(true);
      expect(VirtualPrinter.isVirtualPrinter('HP Printer')).toBe(false);
    });

    it('should return virtual printer info', () => {
      const info = VirtualPrinter.getInfo();

      expect(info.name).toBe(VIRTUAL_PRINTER_NAME);
      expect(info.colorCapable).toBe(true);
      expect(info.duplexCapable).toBe(false);
    });

    it('should configure virtual printer options', () => {
      const printer = new VirtualPrinter({
        outputPath: '/documents',
        fileNamePattern: '{documentName}_{date}.pdf',
      });

      const options = printer.getOptions();
      expect(options.outputPath).toBe('/documents');
      expect(options.fileNamePattern).toBe('{documentName}_{date}.pdf');
    });
  });

  describe('Layout Calculations', () => {
    const letterSize = { width: 612, height: 792 };

    describe('BookletLayout', () => {
      it('should recommend binding type based on page count', () => {
        const small = BookletLayout.recommendBindingType(20);
        expect(small.recommended).toBe('saddleStitch');

        const large = BookletLayout.recommendBindingType(100);
        expect(large.recommended).toBe('perfectBind');
      });

      it('should calculate spine width', () => {
        const spine20 = BookletLayout.calculateSpineWidth(20, 0.1);
        const spine100 = BookletLayout.calculateSpineWidth(100, 0.1);

        expect(spine100).toBeGreaterThan(spine20);
      });

      it('should generate booklet info', () => {
        const result = BookletLayout.calculate({
          pageCount: 20,
          sheetSize: letterSize,
          bindingType: 'saddleStitch',
          bindingEdge: 'left',
        });

        expect(result.info.sheetsNeeded).toBeDefined();
        expect(result.info.totalPages).toBeGreaterThanOrEqual(20);
        expect(result.info.recommendations.length).toBeGreaterThan(0);
      });
    });

    describe('NUpLayout', () => {
      it('should calculate paper savings', () => {
        const savings = NUpLayout.calculateSavings(100, 4);

        expect(savings.originalSheets).toBe(100);
        expect(savings.nupSheets).toBe(25);
        expect(savings.sheetsSaved).toBe(75);
        expect(savings.percentSaved).toBe(75);
      });

      it('should recommend layout based on purpose', () => {
        const review = NUpLayout.recommendLayout(20, 'review');
        expect(review.pagesPerSheet).toBe(2);

        const archive = NUpLayout.recommendLayout(20, 'archive');
        expect(archive.pagesPerSheet).toBe(9);
      });

      it('should generate detailed sheet layouts', () => {
        const result = NUpLayout.calculate({
          pageCount: 10,
          sheetSize: letterSize,
          pagesPerSheet: 4,
        });

        expect(result.sheetLayouts.length).toBe(3); // ceil(10/4)
        expect(result.sheetLayouts[0].cells.length).toBe(4);
        expect(result.info.columns).toBe(2);
        expect(result.info.rows).toBe(2);
      });
    });
  });
});
