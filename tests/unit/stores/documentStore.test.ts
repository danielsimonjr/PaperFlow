import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useDocumentStore } from '@stores/documentStore';

// Mock PDFRenderer
vi.mock('@lib/pdf/renderer', () => ({
  PDFRenderer: vi.fn().mockImplementation(() => ({
    loadDocument: vi.fn().mockResolvedValue({
      numPages: 5,
      title: 'Test Document',
    }),
    renderPage: vi.fn().mockResolvedValue({ width: 612, height: 792 }),
    destroy: vi.fn(),
  })),
}));

describe('documentStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    useDocumentStore.setState({
      fileName: null,
      fileData: null,
      documentInfo: null,
      pageCount: 0,
      currentPage: 1,
      zoom: 100,
      viewMode: 'single',
      isModified: false,
      isLoading: false,
      error: null,
      renderer: null,
    });
  });

  describe('initial state', () => {
    it('should have correct initial values', () => {
      const state = useDocumentStore.getState();

      expect(state.fileName).toBeNull();
      expect(state.fileData).toBeNull();
      expect(state.pageCount).toBe(0);
      expect(state.currentPage).toBe(1);
      expect(state.zoom).toBe(100);
      expect(state.viewMode).toBe('single');
      expect(state.isModified).toBe(false);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });
  });

  describe('page navigation', () => {
    beforeEach(() => {
      useDocumentStore.setState({ pageCount: 10, currentPage: 5 });
    });

    it('should go to next page', () => {
      useDocumentStore.getState().nextPage();
      expect(useDocumentStore.getState().currentPage).toBe(6);
    });

    it('should go to previous page', () => {
      useDocumentStore.getState().prevPage();
      expect(useDocumentStore.getState().currentPage).toBe(4);
    });

    it('should not go past last page', () => {
      useDocumentStore.setState({ currentPage: 10 });
      useDocumentStore.getState().nextPage();
      expect(useDocumentStore.getState().currentPage).toBe(10);
    });

    it('should not go before first page', () => {
      useDocumentStore.setState({ currentPage: 1 });
      useDocumentStore.getState().prevPage();
      expect(useDocumentStore.getState().currentPage).toBe(1);
    });

    it('should set current page within bounds', () => {
      useDocumentStore.getState().setCurrentPage(7);
      expect(useDocumentStore.getState().currentPage).toBe(7);
    });

    it('should not set page outside bounds', () => {
      useDocumentStore.getState().setCurrentPage(15);
      expect(useDocumentStore.getState().currentPage).toBe(5); // unchanged
    });
  });

  describe('zoom controls', () => {
    it('should zoom in by 25%', () => {
      useDocumentStore.getState().zoomIn();
      expect(useDocumentStore.getState().zoom).toBe(125);
    });

    it('should zoom out by 25%', () => {
      useDocumentStore.getState().zoomOut();
      expect(useDocumentStore.getState().zoom).toBe(75);
    });

    it('should not zoom above 400%', () => {
      useDocumentStore.setState({ zoom: 400 });
      useDocumentStore.getState().zoomIn();
      expect(useDocumentStore.getState().zoom).toBe(400);
    });

    it('should not zoom below 10%', () => {
      useDocumentStore.setState({ zoom: 10 });
      useDocumentStore.getState().zoomOut();
      expect(useDocumentStore.getState().zoom).toBe(10);
    });

    it('should set zoom within bounds', () => {
      useDocumentStore.getState().setZoom(150);
      expect(useDocumentStore.getState().zoom).toBe(150);
    });

    it('should clamp zoom to minimum', () => {
      useDocumentStore.getState().setZoom(5);
      expect(useDocumentStore.getState().zoom).toBe(10);
    });

    it('should clamp zoom to maximum', () => {
      useDocumentStore.getState().setZoom(500);
      expect(useDocumentStore.getState().zoom).toBe(400);
    });

    it('should reset zoom to 100%', () => {
      useDocumentStore.setState({ zoom: 200 });
      useDocumentStore.getState().resetZoom();
      expect(useDocumentStore.getState().zoom).toBe(100);
    });
  });

  describe('view mode', () => {
    it('should set view mode to continuous', () => {
      useDocumentStore.getState().setViewMode('continuous');
      expect(useDocumentStore.getState().viewMode).toBe('continuous');
    });

    it('should set view mode to spread', () => {
      useDocumentStore.getState().setViewMode('spread');
      expect(useDocumentStore.getState().viewMode).toBe('spread');
    });
  });

  describe('modified state', () => {
    it('should set modified state', () => {
      useDocumentStore.getState().setModified(true);
      expect(useDocumentStore.getState().isModified).toBe(true);
    });
  });

  describe('close document', () => {
    it('should reset state when closing document', () => {
      useDocumentStore.setState({
        fileName: 'test.pdf',
        pageCount: 10,
        currentPage: 5,
        isModified: true,
      });

      useDocumentStore.getState().closeDocument();

      const state = useDocumentStore.getState();
      expect(state.fileName).toBeNull();
      expect(state.pageCount).toBe(0);
      expect(state.currentPage).toBe(1);
      expect(state.isModified).toBe(false);
    });
  });
});
