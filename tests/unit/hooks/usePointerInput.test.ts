import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePointerInput } from '@/hooks/usePointerInput';

describe('usePointerInput', () => {
  const createPointerEvent = (
    type: string,
    options: Partial<{
      clientX: number;
      clientY: number;
      pressure: number;
      pointerId: number;
      pointerType: string;
      width: number;
      height: number;
      timeStamp: number;
    }> = {}
  ): React.PointerEvent => {
    const target = document.createElement('div');

    // Mock getBoundingClientRect
    vi.spyOn(target, 'getBoundingClientRect').mockReturnValue({
      left: 0,
      top: 0,
      width: 800,
      height: 600,
      right: 800,
      bottom: 600,
      x: 0,
      y: 0,
      toJSON: () => {},
    });

    // Mock setPointerCapture and releasePointerCapture
    target.setPointerCapture = vi.fn();
    target.releasePointerCapture = vi.fn();

    return {
      type,
      clientX: options.clientX ?? 100,
      clientY: options.clientY ?? 100,
      pressure: options.pressure ?? 0.5,
      pointerId: options.pointerId ?? 1,
      pointerType: options.pointerType ?? 'mouse',
      width: options.width ?? 1,
      height: options.height ?? 1,
      timeStamp: options.timeStamp ?? Date.now(),
      target,
      preventDefault: vi.fn(),
      stopPropagation: vi.fn(),
    } as unknown as React.PointerEvent;
  };

  it('initializes with empty points and not drawing', () => {
    const { result } = renderHook(() => usePointerInput());

    expect(result.current.points).toHaveLength(0);
    expect(result.current.isDrawing).toBe(false);
  });

  it('starts drawing on pointer down', () => {
    const { result } = renderHook(() => usePointerInput());

    act(() => {
      result.current.handlePointerDown(
        createPointerEvent('pointerdown', { clientX: 50, clientY: 50 })
      );
    });

    expect(result.current.isDrawing).toBe(true);
    expect(result.current.points).toHaveLength(1);
    expect(result.current.points[0].x).toBe(50);
    expect(result.current.points[0].y).toBe(50);
  });

  it('adds points on pointer move while drawing', () => {
    const { result } = renderHook(() => usePointerInput());

    act(() => {
      result.current.handlePointerDown(
        createPointerEvent('pointerdown', { clientX: 50, clientY: 50, pointerId: 1 })
      );
    });

    act(() => {
      result.current.handlePointerMove(
        createPointerEvent('pointermove', { clientX: 60, clientY: 60, pointerId: 1 })
      );
    });

    act(() => {
      result.current.handlePointerMove(
        createPointerEvent('pointermove', { clientX: 70, clientY: 70, pointerId: 1 })
      );
    });

    expect(result.current.points.length).toBeGreaterThan(1);
  });

  it('stops drawing on pointer up', () => {
    const { result } = renderHook(() => usePointerInput());

    act(() => {
      result.current.handlePointerDown(
        createPointerEvent('pointerdown', { clientX: 50, clientY: 50, pointerId: 1 })
      );
    });

    act(() => {
      result.current.handlePointerUp(
        createPointerEvent('pointerup', { pointerId: 1 })
      );
    });

    expect(result.current.isDrawing).toBe(false);
  });

  it('captures pressure data when enabled', () => {
    const { result } = renderHook(() =>
      usePointerInput({ pressureSensitivity: true })
    );

    act(() => {
      result.current.handlePointerDown(
        createPointerEvent('pointerdown', {
          clientX: 50,
          clientY: 50,
          pressure: 0.7,
        })
      );
    });

    expect(result.current.points[0].pressure).toBe(0.7);
  });

  it('uses default pressure when disabled', () => {
    const { result } = renderHook(() =>
      usePointerInput({ pressureSensitivity: false })
    );

    act(() => {
      result.current.handlePointerDown(
        createPointerEvent('pointerdown', {
          clientX: 50,
          clientY: 50,
          pressure: 0.7,
        })
      );
    });

    expect(result.current.points[0].pressure).toBe(0.5);
  });

  it('rejects palm touches', () => {
    const { result } = renderHook(() =>
      usePointerInput({ palmRejectionSize: 30 })
    );

    act(() => {
      result.current.handlePointerDown(
        createPointerEvent('pointerdown', {
          clientX: 50,
          clientY: 50,
          pointerType: 'touch',
          width: 50, // Larger than palmRejectionSize
          height: 50,
        })
      );
    });

    expect(result.current.isDrawing).toBe(false);
    expect(result.current.points).toHaveLength(0);
  });

  it('clears points on cancel', () => {
    const { result } = renderHook(() => usePointerInput());

    act(() => {
      result.current.handlePointerDown(
        createPointerEvent('pointerdown', { clientX: 50, clientY: 50 })
      );
    });

    act(() => {
      result.current.handlePointerCancel();
    });

    expect(result.current.isDrawing).toBe(false);
    expect(result.current.points).toHaveLength(0);
  });

  it('clears points with clearPoints', () => {
    const { result } = renderHook(() => usePointerInput());

    act(() => {
      result.current.handlePointerDown(
        createPointerEvent('pointerdown', { clientX: 50, clientY: 50 })
      );
    });

    expect(result.current.points.length).toBeGreaterThan(0);

    act(() => {
      result.current.clearPoints();
    });

    expect(result.current.points).toHaveLength(0);
  });

  it('respects minimum distance between points', () => {
    const { result } = renderHook(() =>
      usePointerInput({ minDistance: 10 })
    );

    act(() => {
      result.current.handlePointerDown(
        createPointerEvent('pointerdown', { clientX: 50, clientY: 50, pointerId: 1 })
      );
    });

    // Move less than minDistance
    act(() => {
      result.current.handlePointerMove(
        createPointerEvent('pointermove', { clientX: 52, clientY: 52, pointerId: 1 })
      );
    });

    expect(result.current.points).toHaveLength(1);

    // Move more than minDistance
    act(() => {
      result.current.handlePointerMove(
        createPointerEvent('pointermove', { clientX: 65, clientY: 65, pointerId: 1 })
      );
    });

    expect(result.current.points.length).toBeGreaterThan(1);
  });
});
