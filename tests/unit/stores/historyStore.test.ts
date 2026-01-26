import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useHistoryStore } from '@stores/historyStore';

describe('historyStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    useHistoryStore.setState({
      past: [],
      future: [],
      maxHistory: 50,
    });
  });

  describe('initial state', () => {
    it('should have empty history', () => {
      const state = useHistoryStore.getState();

      expect(state.past).toEqual([]);
      expect(state.future).toEqual([]);
      expect(state.maxHistory).toBe(50);
    });

    it('should not be able to undo initially', () => {
      expect(useHistoryStore.getState().canUndo()).toBe(false);
    });

    it('should not be able to redo initially', () => {
      expect(useHistoryStore.getState().canRedo()).toBe(false);
    });
  });

  describe('push', () => {
    it('should add entry to history', () => {
      const undoFn = vi.fn();
      const redoFn = vi.fn();

      useHistoryStore.getState().push({
        action: 'test action',
        undo: undoFn,
        redo: redoFn,
      });

      expect(useHistoryStore.getState().past).toHaveLength(1);
      expect(useHistoryStore.getState().past[0]?.action).toBe('test action');
      expect(useHistoryStore.getState().canUndo()).toBe(true);
    });

    it('should clear future on new push', () => {
      const undoFn = vi.fn();
      const redoFn = vi.fn();

      // Add entry and undo to create future
      useHistoryStore.getState().push({ action: 'action 1', undo: undoFn, redo: redoFn });
      useHistoryStore.getState().undo();
      expect(useHistoryStore.getState().future).toHaveLength(1);

      // Push new entry should clear future
      useHistoryStore.getState().push({ action: 'action 2', undo: undoFn, redo: redoFn });
      expect(useHistoryStore.getState().future).toHaveLength(0);
    });

    it('should limit history to maxHistory entries', () => {
      const undoFn = vi.fn();
      const redoFn = vi.fn();

      // Set lower limit for testing
      useHistoryStore.setState({ maxHistory: 5 });

      // Push more entries than the limit
      for (let i = 0; i < 10; i++) {
        useHistoryStore.getState().push({
          action: `action ${i}`,
          undo: undoFn,
          redo: redoFn,
        });
      }

      expect(useHistoryStore.getState().past).toHaveLength(5);
    });
  });

  describe('undo', () => {
    it('should call undo function and move entry to future', () => {
      const undoFn = vi.fn();
      const redoFn = vi.fn();

      useHistoryStore.getState().push({ action: 'test', undo: undoFn, redo: redoFn });
      useHistoryStore.getState().undo();

      expect(undoFn).toHaveBeenCalledTimes(1);
      expect(useHistoryStore.getState().past).toHaveLength(0);
      expect(useHistoryStore.getState().future).toHaveLength(1);
      expect(useHistoryStore.getState().canRedo()).toBe(true);
    });

    it('should do nothing when history is empty', () => {
      useHistoryStore.getState().undo();
      expect(useHistoryStore.getState().past).toHaveLength(0);
      expect(useHistoryStore.getState().future).toHaveLength(0);
    });
  });

  describe('redo', () => {
    it('should call redo function and move entry to past', () => {
      const undoFn = vi.fn();
      const redoFn = vi.fn();

      useHistoryStore.getState().push({ action: 'test', undo: undoFn, redo: redoFn });
      useHistoryStore.getState().undo();
      useHistoryStore.getState().redo();

      expect(redoFn).toHaveBeenCalledTimes(1);
      expect(useHistoryStore.getState().past).toHaveLength(1);
      expect(useHistoryStore.getState().future).toHaveLength(0);
    });

    it('should do nothing when future is empty', () => {
      useHistoryStore.getState().redo();
      expect(useHistoryStore.getState().past).toHaveLength(0);
      expect(useHistoryStore.getState().future).toHaveLength(0);
    });
  });

  describe('clear', () => {
    it('should clear all history', () => {
      const undoFn = vi.fn();
      const redoFn = vi.fn();

      // Add some history
      useHistoryStore.getState().push({ action: 'action 1', undo: undoFn, redo: redoFn });
      useHistoryStore.getState().push({ action: 'action 2', undo: undoFn, redo: redoFn });
      useHistoryStore.getState().undo();

      // Clear
      useHistoryStore.getState().clear();

      expect(useHistoryStore.getState().past).toHaveLength(0);
      expect(useHistoryStore.getState().future).toHaveLength(0);
      expect(useHistoryStore.getState().canUndo()).toBe(false);
      expect(useHistoryStore.getState().canRedo()).toBe(false);
    });
  });

  describe('complex scenarios', () => {
    it('should handle multiple undo/redo operations', () => {
      const actions: string[] = [];

      // Create 3 entries
      for (let i = 1; i <= 3; i++) {
        useHistoryStore.getState().push({
          action: `action ${i}`,
          undo: () => actions.push(`undo ${i}`),
          redo: () => actions.push(`redo ${i}`),
        });
      }

      // Undo twice
      useHistoryStore.getState().undo();
      useHistoryStore.getState().undo();

      expect(actions).toEqual(['undo 3', 'undo 2']);
      expect(useHistoryStore.getState().past).toHaveLength(1);
      expect(useHistoryStore.getState().future).toHaveLength(2);

      // Redo once
      useHistoryStore.getState().redo();

      expect(actions).toEqual(['undo 3', 'undo 2', 'redo 2']);
      expect(useHistoryStore.getState().past).toHaveLength(2);
      expect(useHistoryStore.getState().future).toHaveLength(1);
    });
  });
});
