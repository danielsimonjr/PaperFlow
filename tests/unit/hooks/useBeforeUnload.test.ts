import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useBeforeUnload, useBeforeUnloadCallback } from '@hooks/useBeforeUnload';

describe('useBeforeUnload', () => {
  let addEventListenerSpy: ReturnType<typeof vi.spyOn>;
  let removeEventListenerSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    addEventListenerSpy = vi.spyOn(window, 'addEventListener');
    removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');
  });

  afterEach(() => {
    addEventListenerSpy.mockRestore();
    removeEventListenerSpy.mockRestore();
  });

  it('adds event listener when shouldWarn is true', () => {
    renderHook(() => useBeforeUnload(true));

    expect(addEventListenerSpy).toHaveBeenCalledWith(
      'beforeunload',
      expect.any(Function)
    );
  });

  it('removes event listener on unmount', () => {
    const { unmount } = renderHook(() => useBeforeUnload(true));

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      'beforeunload',
      expect.any(Function)
    );
  });

  it('calls preventDefault and sets returnValue when shouldWarn is true', () => {
    renderHook(() => useBeforeUnload(true));

    const handler = addEventListenerSpy.mock.calls.find(
      (call) => call[0] === 'beforeunload'
    )?.[1] as (e: BeforeUnloadEvent) => void;

    const mockEvent = {
      preventDefault: vi.fn(),
      returnValue: '',
    } as unknown as BeforeUnloadEvent;

    handler(mockEvent);

    expect(mockEvent.preventDefault).toHaveBeenCalled();
    expect(mockEvent.returnValue).toBe(
      'You have unsaved changes. Are you sure you want to leave?'
    );
  });

  it('does not prevent default when shouldWarn is false', () => {
    renderHook(() => useBeforeUnload(false));

    const handler = addEventListenerSpy.mock.calls.find(
      (call) => call[0] === 'beforeunload'
    )?.[1] as (e: BeforeUnloadEvent) => void;

    const mockEvent = {
      preventDefault: vi.fn(),
      returnValue: '',
    } as unknown as BeforeUnloadEvent;

    handler(mockEvent);

    expect(mockEvent.preventDefault).not.toHaveBeenCalled();
  });

  it('uses custom message when provided', () => {
    const customMessage = 'Custom warning message';
    renderHook(() => useBeforeUnload(true, customMessage));

    const handler = addEventListenerSpy.mock.calls.find(
      (call) => call[0] === 'beforeunload'
    )?.[1] as (e: BeforeUnloadEvent) => void;

    const mockEvent = {
      preventDefault: vi.fn(),
      returnValue: '',
    } as unknown as BeforeUnloadEvent;

    handler(mockEvent);

    expect(mockEvent.returnValue).toBe(customMessage);
  });
});

describe('useBeforeUnloadCallback', () => {
  let addEventListenerSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    addEventListenerSpy = vi.spyOn(window, 'addEventListener');
  });

  afterEach(() => {
    addEventListenerSpy.mockRestore();
  });

  it('calls shouldWarnFn to determine if warning should show', () => {
    const shouldWarnFn = vi.fn(() => true);
    renderHook(() => useBeforeUnloadCallback(shouldWarnFn));

    const handler = addEventListenerSpy.mock.calls.find(
      (call) => call[0] === 'beforeunload'
    )?.[1] as (e: BeforeUnloadEvent) => void;

    const mockEvent = {
      preventDefault: vi.fn(),
      returnValue: '',
    } as unknown as BeforeUnloadEvent;

    handler(mockEvent);

    expect(shouldWarnFn).toHaveBeenCalled();
    expect(mockEvent.preventDefault).toHaveBeenCalled();
  });

  it('does not warn when shouldWarnFn returns false', () => {
    const shouldWarnFn = vi.fn(() => false);
    renderHook(() => useBeforeUnloadCallback(shouldWarnFn));

    const handler = addEventListenerSpy.mock.calls.find(
      (call) => call[0] === 'beforeunload'
    )?.[1] as (e: BeforeUnloadEvent) => void;

    const mockEvent = {
      preventDefault: vi.fn(),
      returnValue: '',
    } as unknown as BeforeUnloadEvent;

    handler(mockEvent);

    expect(shouldWarnFn).toHaveBeenCalled();
    expect(mockEvent.preventDefault).not.toHaveBeenCalled();
  });
});
