import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useAnnotationShortcuts } from '@hooks/useAnnotationShortcuts';
import { useHistoryStore } from '@stores/historyStore';

/**
 * A browser reports the SHIFTED character in `KeyboardEvent.key`: Ctrl+Shift+Z
 * arrives as key "Z", not "z". These tests dispatch what a real keyboard sends.
 */
function press(init: KeyboardEventInit): KeyboardEvent {
  const event = new KeyboardEvent('keydown', { bubbles: true, cancelable: true, ...init });
  window.dispatchEvent(event);
  return event;
}

describe('useAnnotationShortcuts undo and redo', () => {
  const undo = vi.fn();
  const redo = vi.fn();
  const original = useHistoryStore.getState();

  beforeEach(() => {
    undo.mockReset();
    redo.mockReset();
    useHistoryStore.setState({
      undo,
      redo,
      canUndo: () => true,
      canRedo: () => true,
    });
  });

  afterEach(() => {
    useHistoryStore.setState({
      undo: original.undo,
      redo: original.redo,
      canUndo: original.canUndo,
      canRedo: original.canRedo,
    });
  });

  it('undoes on Ctrl+Z', () => {
    renderHook(() => useAnnotationShortcuts());
    press({ key: 'z', ctrlKey: true });
    expect(undo).toHaveBeenCalledTimes(1);
    expect(redo).not.toHaveBeenCalled();
  });

  it('undoes on Cmd+Z', () => {
    renderHook(() => useAnnotationShortcuts());
    press({ key: 'z', metaKey: true });
    expect(undo).toHaveBeenCalledTimes(1);
  });

  it('redoes on Ctrl+Shift+Z as a real keyboard sends it (key "Z")', () => {
    renderHook(() => useAnnotationShortcuts());
    const event = press({ key: 'Z', ctrlKey: true, shiftKey: true });
    expect(redo).toHaveBeenCalledTimes(1);
    expect(undo).not.toHaveBeenCalled();
    expect(event.defaultPrevented).toBe(true);
  });

  it('redoes on Cmd+Shift+Z as a real keyboard sends it (key "Z")', () => {
    renderHook(() => useAnnotationShortcuts());
    press({ key: 'Z', metaKey: true, shiftKey: true });
    expect(redo).toHaveBeenCalledTimes(1);
  });

  it('redoes on Ctrl+Shift+Z when the sender reports the unshifted key (key "z")', () => {
    renderHook(() => useAnnotationShortcuts());
    press({ key: 'z', ctrlKey: true, shiftKey: true });
    expect(redo).toHaveBeenCalledTimes(1);
  });

  it('redoes on Ctrl+Y, with Caps Lock on or off', () => {
    renderHook(() => useAnnotationShortcuts());
    press({ key: 'y', ctrlKey: true });
    press({ key: 'Y', ctrlKey: true });
    expect(redo).toHaveBeenCalledTimes(2);
  });

  it('undoes on Ctrl+Z with Caps Lock on (key "Z", no Shift)', () => {
    renderHook(() => useAnnotationShortcuts());
    press({ key: 'Z', ctrlKey: true });
    expect(undo).toHaveBeenCalledTimes(1);
    expect(redo).not.toHaveBeenCalled();
  });

  it('does nothing on z, Z or y without Ctrl or Cmd', () => {
    renderHook(() => useAnnotationShortcuts());
    press({ key: 'z' });
    press({ key: 'Z', shiftKey: true });
    press({ key: 'y' });
    press({ key: 'Y', shiftKey: true });
    expect(undo).not.toHaveBeenCalled();
    expect(redo).not.toHaveBeenCalled();
  });

  it('does nothing when the history cannot move', () => {
    useHistoryStore.setState({ canUndo: () => false, canRedo: () => false });
    renderHook(() => useAnnotationShortcuts());
    press({ key: 'z', ctrlKey: true });
    press({ key: 'Z', ctrlKey: true, shiftKey: true });
    expect(undo).not.toHaveBeenCalled();
    expect(redo).not.toHaveBeenCalled();
  });
});
