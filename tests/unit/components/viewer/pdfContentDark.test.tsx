import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PageCanvas } from '@components/viewer/PageCanvas';
import { useUIStore } from '@stores/uiStore';
import type { PDFRenderer } from '@lib/pdf/renderer';
import { PDF_CONTENT_DARK_CLASS } from '@/lib/pdf/contentDarkMode';

function renderer(): PDFRenderer {
  return {
    renderPage: vi.fn().mockResolvedValue({ width: 100, height: 120 }),
    cancelRender: vi.fn(),
    getPageInfo: vi.fn().mockResolvedValue({ height: 792, width: 612 }),
  } as unknown as PDFRenderer;
}

describe('PageCanvas PDF dark mode', () => {
  beforeEach(() => {
    useUIStore.setState({ darkMode: false });
  });

  it('adds the invert class only in dark mode', () => {
    const { rerender } = render(
      <PageCanvas renderer={renderer()} pageNumber={1} scale={100} />
    );
    expect(screen.getByTestId('pdf-page').className).not.toContain(PDF_CONTENT_DARK_CLASS);

    useUIStore.setState({ darkMode: true });
    rerender(<PageCanvas renderer={renderer()} pageNumber={1} scale={100} />);
    expect(screen.getByTestId('pdf-page').className).toContain(PDF_CONTENT_DARK_CLASS);
  });
});
