import { describe, it, expect, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { render, screen } from '@testing-library/react';
import { AnnotationLayer } from '@components/annotations/AnnotationLayer';
import { NoteTool } from '@components/annotations/NoteTool';
import { NOTE_COLORS } from '@components/annotations/StickyNote';
import { ImageExportDialog } from '@components/export/ImageExportDialog';
import { CompressDialog } from '@components/export/CompressDialog';
import { PrintDialog } from '@components/print/PrintDialog';
import { useAnnotationStore } from '@stores/annotationStore';

/**
 * Anything that must take a click or a key press over the page has to stack above the PDF.js
 * text layer. `.textLayer` is `position: absolute` with a `z-index` of its own (`src/index.css`),
 * so an overlay or a dialog with no z-index sits under it, and the text layer takes the pointer
 * events. jsdom does not load Tailwind, so these tests read the stacking class from the
 * rendered element and compare its number with the text layer's z-index from the stylesheet.
 */
const css = readFileSync(resolve(process.cwd(), 'src/index.css'), 'utf8');
const textLayerBlock = /\.textLayer\s*\{([^}]*)\}/.exec(css)?.[1] ?? '';
const TEXT_LAYER_Z = Number(/z-index:\s*(\d+)/.exec(textLayerBlock)?.[1]);

/** The number of a Tailwind `z-N` class, or `null` when the element sets none. */
function zOf(el: Element | null): number | null {
  const m = /(?:^|\s)z-(\d+)(?=\s|$)/.exec(el?.getAttribute('class') ?? '');
  return m ? Number(m[1]) : null;
}

describe('layers that take pointer events stack above the PDF text layer', () => {
  it('the stylesheet gives the text layer a z-index to beat', () => {
    expect(Number.isInteger(TEXT_LAYER_Z)).toBe(true);
    expect(TEXT_LAYER_Z).toBeGreaterThan(0);
  });

  describe('NoteTool', () => {
    beforeEach(() => {
      useAnnotationStore.setState({
        annotations: [],
        selectedId: null,
        activeTool: 'note',
        activeColor: NOTE_COLORS.yellow,
        activeOpacity: 1,
      });
    });

    it('places its click overlay above the text layer', () => {
      const { container } = render(
        <NoteTool pageIndex={0} scale={1} pageHeight={792} />
      );
      const overlay = container.firstElementChild;
      expect(overlay).not.toBeNull();
      expect(zOf(overlay), 'the overlay sets no z-N class').not.toBeNull();
      expect(zOf(overlay)).toBeGreaterThan(TEXT_LAYER_Z);
    });
  });

  describe('AnnotationLayer', () => {
    it('stacks above the text layer and below the placement tools', () => {
      useAnnotationStore.setState({
        annotations: [],
        selectedId: null,
        activeTool: 'note',
        activeColor: NOTE_COLORS.yellow,
        activeOpacity: 1,
      });
      const layer = render(
        <AnnotationLayer
          pageIndex={0}
          width={612}
          height={792}
          scale={1}
          pageHeight={792}
        />
      );
      const tool = render(
        <NoteTool pageIndex={0} scale={1} pageHeight={792} />
      );
      const svg = layer.container.querySelector('svg');
      const overlay = tool.container.firstElementChild;
      expect(svg).not.toBeNull();
      expect(zOf(svg), 'the layer sets no z-N class').not.toBeNull();
      // A placed note lives in this layer. Under the text layer it cannot be clicked.
      expect(zOf(svg)).toBeGreaterThan(TEXT_LAYER_Z);
      // A tool must still take the click where an annotation already sits.
      expect(zOf(overlay)).toBeGreaterThan(zOf(svg) as number);
    });
  });

  describe('Highlight', () => {
    it('lets the pointer reach the text under it', () => {
      const now = new Date(0);
      useAnnotationStore.setState({
        annotations: [
          {
            id: 'h1',
            type: 'highlight',
            pageIndex: 0,
            rects: [{ x: 10, y: 10, width: 100, height: 12 }],
            color: '#FEF3C7',
            opacity: 0.5,
            createdAt: now,
            updatedAt: now,
          },
        ],
        selectedId: null,
        activeTool: null,
      });
      const { container } = render(
        <AnnotationLayer
          pageIndex={0}
          width={612}
          height={792}
          scale={1}
          pageHeight={792}
        />
      );
      const rects = container.querySelectorAll(
        '[data-testid="highlight-annotation"] rect'
      );
      expect(rects.length).toBeGreaterThan(0);
      // The annotation layer sits above the text layer. A highlight rect that took the pointer
      // would stop a drag that starts on highlighted text from selecting it.
      for (const rect of rects) {
        expect(rect.getAttribute('class')).toMatch(/(^|\s)pointer-events-none(\s|$)/);
      }
    });
  });

  describe.each([
    ['ImageExportDialog', ImageExportDialog],
    ['CompressDialog', CompressDialog],
    ['PrintDialog', PrintDialog],
  ] as const)('%s', (_name, Dialog) => {
    it('stacks its backdrop and its content above the text layer', () => {
      render(<Dialog isOpen onClose={() => undefined} />);
      const content = screen.getByRole('dialog');
      const backdrop = document.body.querySelector('div.fixed.inset-0');
      expect(backdrop).not.toBeNull();
      expect(zOf(backdrop), 'the backdrop sets no z-N class').not.toBeNull();
      expect(zOf(backdrop)).toBeGreaterThan(TEXT_LAYER_Z);
      expect(zOf(content), 'the content sets no z-N class').not.toBeNull();
      expect(zOf(content)).toBeGreaterThan(TEXT_LAYER_Z);
    });
  });
});
