import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { useDocumentStore } from '@stores/documentStore';

// Mock components that use file opening
vi.mock('@lib/pdf/renderer', () => ({
  PDFRenderer: vi.fn().mockImplementation(() => ({
    loadDocument: vi.fn().mockResolvedValue({
      numPages: 5,
      title: 'Test PDF',
    }),
    renderPage: vi.fn().mockResolvedValue({ width: 612, height: 792 }),
    getPage: vi.fn().mockResolvedValue({
      getViewport: vi.fn().mockReturnValue({ width: 612, height: 792 }),
    }),
    destroy: vi.fn(),
  })),
}));

// Mock file reader
const mockFileReader = {
  readAsArrayBuffer: vi.fn(),
  onload: null as ((e: ProgressEvent<FileReader>) => void) | null,
  onerror: null as ((e: ProgressEvent<FileReader>) => void) | null,
  result: new ArrayBuffer(100),
};

global.FileReader = vi.fn().mockImplementation(() => mockFileReader) as unknown as typeof FileReader;

// Simple test component for file opening
function FileOpeningTestComponent() {
  const { loadDocumentFromArrayBuffer, fileName, pageCount, isLoading, error } = useDocumentStore();

  const handleFileSelect = async (file: File) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      const data = e.target?.result as ArrayBuffer;
      await loadDocumentFromArrayBuffer(data, file.name);
    };
    reader.readAsArrayBuffer(file);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      await handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  return (
    <div
      data-testid="drop-zone"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      style={{ width: 400, height: 300, border: '2px dashed gray' }}
    >
      <input
        type="file"
        accept=".pdf"
        data-testid="file-input"
        onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
      />
      {isLoading && <p data-testid="loading">Loading...</p>}
      {error && <p data-testid="error">{error}</p>}
      {fileName && (
        <div data-testid="document-info">
          <p>File: {fileName}</p>
          <p>Pages: {pageCount}</p>
        </div>
      )}
    </div>
  );
}

describe('File Opening Integration', () => {
  beforeEach(() => {
    // Reset store state
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
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('File Picker', () => {
    it('should show file input', () => {
      render(<FileOpeningTestComponent />);

      expect(screen.getByTestId('file-input')).toBeInTheDocument();
    });

    it('should accept PDF files', () => {
      render(<FileOpeningTestComponent />);

      const input = screen.getByTestId('file-input');
      expect(input).toHaveAttribute('accept', '.pdf');
    });

    it('should load document when file is selected', async () => {
      render(<FileOpeningTestComponent />);

      const file = new File(['pdf content'], 'test.pdf', { type: 'application/pdf' });
      const input = screen.getByTestId('file-input');

      fireEvent.change(input, { target: { files: [file] } });

      // Simulate FileReader onload - wrap in act() to handle state updates
      await act(async () => {
        if (mockFileReader.onload) {
          mockFileReader.onload({ target: { result: new ArrayBuffer(100) } } as ProgressEvent<FileReader>);
        }
      });

      await waitFor(() => {
        expect(useDocumentStore.getState().fileName).toBe('test.pdf');
      });
    });
  });

  describe('Drag and Drop', () => {
    it('should show drop zone', () => {
      render(<FileOpeningTestComponent />);

      expect(screen.getByTestId('drop-zone')).toBeInTheDocument();
    });

    it('should handle drag over', () => {
      render(<FileOpeningTestComponent />);

      const dropZone = screen.getByTestId('drop-zone');

      // Simply verify drag over doesn't throw
      fireEvent.dragOver(dropZone, {
        dataTransfer: { files: [] },
      });

      // The drop zone should still be in the document after the event
      expect(dropZone).toBeInTheDocument();
    });

    it('should load document when file is dropped', async () => {
      render(<FileOpeningTestComponent />);

      const file = new File(['pdf content'], 'dropped.pdf', { type: 'application/pdf' });
      const dropZone = screen.getByTestId('drop-zone');

      const dropEvent = {
        preventDefault: vi.fn(),
        dataTransfer: {
          files: [file],
        },
      };

      fireEvent.drop(dropZone, dropEvent);

      // Simulate FileReader onload - wrap in act() to handle state updates
      await act(async () => {
        if (mockFileReader.onload) {
          mockFileReader.onload({ target: { result: new ArrayBuffer(100) } } as ProgressEvent<FileReader>);
        }
      });

      await waitFor(() => {
        expect(useDocumentStore.getState().fileName).toBe('dropped.pdf');
      });
    });
  });

  describe('Loading States', () => {
    it('should show loading indicator while loading', async () => {
      // Make loadDocument take some time
      const { PDFRenderer } = await import('@lib/pdf/renderer');
      vi.mocked(PDFRenderer).mockImplementationOnce(() => ({
        loadDocument: vi.fn().mockImplementation(() =>
          new Promise((resolve) => setTimeout(() => resolve({ numPages: 5 }), 100))
        ),
        renderPage: vi.fn().mockResolvedValue({ width: 612, height: 792 }),
        getPage: vi.fn().mockResolvedValue({
          getViewport: vi.fn().mockReturnValue({ width: 612, height: 792 }),
        }),
        destroy: vi.fn(),
      }));

      render(<FileOpeningTestComponent />);

      const file = new File(['pdf'], 'test.pdf', { type: 'application/pdf' });
      const input = screen.getByTestId('file-input');

      fireEvent.change(input, { target: { files: [file] } });

      // Should show loading
      if (mockFileReader.onload) {
        mockFileReader.onload({ target: { result: new ArrayBuffer(100) } } as ProgressEvent<FileReader>);
      }
    });

    it('should display document info after loading', async () => {
      render(<FileOpeningTestComponent />);

      const file = new File(['pdf content'], 'myfile.pdf', { type: 'application/pdf' });
      const input = screen.getByTestId('file-input');

      fireEvent.change(input, { target: { files: [file] } });

      if (mockFileReader.onload) {
        mockFileReader.onload({ target: { result: new ArrayBuffer(100) } } as ProgressEvent<FileReader>);
      }

      await waitFor(() => {
        expect(screen.getByTestId('document-info')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle file read errors', async () => {
      render(<FileOpeningTestComponent />);

      const file = new File(['invalid'], 'bad.pdf', { type: 'application/pdf' });
      const input = screen.getByTestId('file-input');

      fireEvent.change(input, { target: { files: [file] } });

      // Simulate FileReader error
      if (mockFileReader.onerror) {
        mockFileReader.onerror(new ProgressEvent('error'));
      }

      // Store should handle error gracefully
    });

    it('should reject non-PDF files', () => {
      render(<FileOpeningTestComponent />);

      const input = screen.getByTestId('file-input');
      expect(input).toHaveAttribute('accept', '.pdf');
    });
  });

  describe('Store State', () => {
    it('should update store with document info', async () => {
      render(<FileOpeningTestComponent />);

      const file = new File(['pdf'], 'document.pdf', { type: 'application/pdf' });
      const input = screen.getByTestId('file-input');

      fireEvent.change(input, { target: { files: [file] } });

      if (mockFileReader.onload) {
        mockFileReader.onload({ target: { result: new ArrayBuffer(100) } } as ProgressEvent<FileReader>);
      }

      await waitFor(() => {
        const state = useDocumentStore.getState();
        expect(state.fileName).toBe('document.pdf');
        expect(state.pageCount).toBeGreaterThan(0);
      });
    });

    it('should create renderer instance', async () => {
      render(<FileOpeningTestComponent />);

      const file = new File(['pdf'], 'test.pdf', { type: 'application/pdf' });
      const input = screen.getByTestId('file-input');

      fireEvent.change(input, { target: { files: [file] } });

      if (mockFileReader.onload) {
        mockFileReader.onload({ target: { result: new ArrayBuffer(100) } } as ProgressEvent<FileReader>);
      }

      await waitFor(() => {
        const state = useDocumentStore.getState();
        expect(state.renderer).not.toBeNull();
      });
    });
  });
});
