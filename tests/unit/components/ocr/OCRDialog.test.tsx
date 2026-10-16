import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { OCRDialog } from '@components/ocr/OCRDialog';
import { useOCRStore } from '@stores/ocrStore';
import { useDocumentStore } from '@stores/documentStore';
import { useUIStore } from '@stores/uiStore';
import type { PreprocessingOptions } from '@/lib/ocr/types';

const engine = vi.hoisted(() => ({
  initialize: vi.fn(),
  recognize: vi.fn(),
  terminate: vi.fn(),
}));
const preprocessor = vi.hoisted(() => ({
  preprocessImage: vi.fn(),
  renderPageToCanvas: vi.fn(),
}));

vi.mock('@/lib/ocr/ocrEngine', () => ({
  OCREngine: class {
    initialize = engine.initialize;
    recognize = engine.recognize;
    terminate = engine.terminate;
  },
}));
vi.mock('@/lib/ocr/imagePreprocessor', () => preprocessor);

const recognized = { text: 'word', words: [], confidence: 0.9 };

describe('OCRDialog run', () => {
  const getPage = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    useOCRStore.getState().reset();
    useUIStore.setState({ activeDialog: 'ocr' });
    getPage.mockResolvedValue({ page: 'pdf-page' });
    // The renderer is the PDF.js wrapper. getPage takes a 1-based page number.
    useDocumentStore.setState({
      currentPage: 2,
      pageCount: 3,
      renderer: { getPage } as never,
    });
    engine.initialize.mockResolvedValue(undefined);
    engine.recognize.mockResolvedValue(recognized);
    engine.terminate.mockResolvedValue(undefined);
    preprocessor.renderPageToCanvas.mockResolvedValue({ canvas: 'rendered' });
    preprocessor.preprocessImage.mockReturnValue({ canvas: 'processed' });
  });

  async function runOcr(buttonName: RegExp) {
    render(<OCRDialog />);
    fireEvent.click(screen.getByRole('button', { name: buttonName }));
    await waitFor(() => expect(engine.terminate).toHaveBeenCalled());
  }

  it('recognizes the page the user is on', async () => {
    await runOcr(/Start OCR \(1 page\)/);

    expect(getPage).toHaveBeenCalledTimes(1);
    expect(getPage).toHaveBeenCalledWith(2);
    expect(useOCRStore.getState().results.has(1)).toBe(true);
    expect(useOCRStore.getState().results.has(2)).toBe(false);
  });

  it('applies the chosen image scale once', async () => {
    const chosen = useOCRStore.getState().preprocessingOptions.scale ?? 1;
    await runOcr(/Start OCR \(1 page\)/);

    const renderScale = preprocessor.renderPageToCanvas.mock.calls[0]?.[1] as number;
    const options = preprocessor.preprocessImage.mock.calls[0]?.[1] as PreprocessingOptions;
    expect(renderScale * (options.scale ?? 1)).toBe(chosen);
  });

  it('keeps the other preprocessing options when it renders at the chosen scale', async () => {
    useOCRStore.getState().setPreprocessingOptions({ grayscale: false, binarize: true, scale: 3 });
    await runOcr(/Start OCR \(1 page\)/);

    const options = preprocessor.preprocessImage.mock.calls[0]?.[1] as PreprocessingOptions;
    expect(options.grayscale).toBe(false);
    expect(options.binarize).toBe(true);
  });

  it('leaves the progress idle after a cancel, not complete', async () => {
    engine.recognize.mockImplementationOnce(async () => {
      useOCRStore.getState().cancelOCR();
      return recognized;
    });
    render(<OCRDialog />);
    fireEvent.click(screen.getByLabelText('All pages (3)'));
    fireEvent.click(screen.getByRole('button', { name: /Start OCR \(3 pages\)/ }));
    await waitFor(() => expect(engine.terminate).toHaveBeenCalled());

    expect(engine.recognize).toHaveBeenCalledTimes(1);
    expect(useOCRStore.getState().progress?.status).toBe('idle');
    expect(useOCRStore.getState().isProcessing).toBe(false);
  });

  it('marks the run complete when every page finishes', async () => {
    render(<OCRDialog />);
    fireEvent.click(screen.getByLabelText('All pages (3)'));
    fireEvent.click(screen.getByRole('button', { name: /Start OCR \(3 pages\)/ }));
    await waitFor(() => expect(engine.terminate).toHaveBeenCalled());

    expect(engine.recognize).toHaveBeenCalledTimes(3);
    expect(useOCRStore.getState().progress?.status).toBe('complete');
  });
});
