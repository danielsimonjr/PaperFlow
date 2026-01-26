import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDropZone } from '@hooks/useDropZone';

describe('useDropZone', () => {
  const mockOnDrop = vi.fn();

  beforeEach(() => {
    mockOnDrop.mockClear();
  });

  it('initializes with default state', () => {
    const { result } = renderHook(() =>
      useDropZone({ onDrop: mockOnDrop })
    );

    expect(result.current.isDragging).toBe(false);
    expect(result.current.isDraggingOver).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('validates PDF files by default', () => {
    const { result } = renderHook(() =>
      useDropZone({ onDrop: mockOnDrop })
    );

    // Create mock PDF file
    const pdfFile = new File([''], 'test.pdf', { type: 'application/pdf' });

    // Create mock DataTransfer
    const mockEvent = {
      preventDefault: vi.fn(),
      stopPropagation: vi.fn(),
      dataTransfer: {
        files: [pdfFile],
      },
    } as unknown as React.DragEvent;

    act(() => {
      result.current.rootProps.onDrop(mockEvent);
    });

    expect(mockOnDrop).toHaveBeenCalledWith([pdfFile]);
  });

  it('shows error for invalid file types', () => {
    const { result } = renderHook(() =>
      useDropZone({ onDrop: mockOnDrop })
    );

    const textFile = new File([''], 'test.txt', { type: 'text/plain' });

    const mockEvent = {
      preventDefault: vi.fn(),
      stopPropagation: vi.fn(),
      dataTransfer: {
        files: [textFile],
      },
    } as unknown as React.DragEvent;

    act(() => {
      result.current.rootProps.onDrop(mockEvent);
    });

    expect(mockOnDrop).not.toHaveBeenCalled();
    expect(result.current.error).toBe('Invalid file type. Please drop a PDF file.');
  });

  it('clears error when requested', () => {
    const { result } = renderHook(() =>
      useDropZone({ onDrop: mockOnDrop })
    );

    // Trigger error
    const textFile = new File([''], 'test.txt', { type: 'text/plain' });
    const mockEvent = {
      preventDefault: vi.fn(),
      stopPropagation: vi.fn(),
      dataTransfer: {
        files: [textFile],
      },
    } as unknown as React.DragEvent;

    act(() => {
      result.current.rootProps.onDrop(mockEvent);
    });

    expect(result.current.error).not.toBeNull();

    act(() => {
      result.current.clearError();
    });

    expect(result.current.error).toBeNull();
  });

  it('does not process files when disabled', () => {
    const { result } = renderHook(() =>
      useDropZone({ onDrop: mockOnDrop, disabled: true })
    );

    const pdfFile = new File([''], 'test.pdf', { type: 'application/pdf' });
    const mockEvent = {
      preventDefault: vi.fn(),
      stopPropagation: vi.fn(),
      dataTransfer: {
        files: [pdfFile],
      },
    } as unknown as React.DragEvent;

    act(() => {
      result.current.rootProps.onDrop(mockEvent);
    });

    expect(mockOnDrop).not.toHaveBeenCalled();
  });

  it('handles multiple files when allowed', () => {
    const { result } = renderHook(() =>
      useDropZone({ onDrop: mockOnDrop, multiple: true })
    );

    const pdfFile1 = new File([''], 'test1.pdf', { type: 'application/pdf' });
    const pdfFile2 = new File([''], 'test2.pdf', { type: 'application/pdf' });

    const mockEvent = {
      preventDefault: vi.fn(),
      stopPropagation: vi.fn(),
      dataTransfer: {
        files: [pdfFile1, pdfFile2],
      },
    } as unknown as React.DragEvent;

    act(() => {
      result.current.rootProps.onDrop(mockEvent);
    });

    expect(mockOnDrop).toHaveBeenCalledWith([pdfFile1, pdfFile2]);
  });

  it('handles only first file when multiple is false', () => {
    const { result } = renderHook(() =>
      useDropZone({ onDrop: mockOnDrop, multiple: false })
    );

    const pdfFile1 = new File([''], 'test1.pdf', { type: 'application/pdf' });
    const pdfFile2 = new File([''], 'test2.pdf', { type: 'application/pdf' });

    const mockEvent = {
      preventDefault: vi.fn(),
      stopPropagation: vi.fn(),
      dataTransfer: {
        files: [pdfFile1, pdfFile2],
      },
    } as unknown as React.DragEvent;

    act(() => {
      result.current.rootProps.onDrop(mockEvent);
    });

    expect(mockOnDrop).toHaveBeenCalledWith([pdfFile1]);
  });

  it('accepts custom file types', () => {
    const { result } = renderHook(() =>
      useDropZone({ onDrop: mockOnDrop, accept: ['.txt', 'text/plain'] })
    );

    const textFile = new File([''], 'test.txt', { type: 'text/plain' });

    const mockEvent = {
      preventDefault: vi.fn(),
      stopPropagation: vi.fn(),
      dataTransfer: {
        files: [textFile],
      },
    } as unknown as React.DragEvent;

    act(() => {
      result.current.rootProps.onDrop(mockEvent);
    });

    expect(mockOnDrop).toHaveBeenCalledWith([textFile]);
  });
});
