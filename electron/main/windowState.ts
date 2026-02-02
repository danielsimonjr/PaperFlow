/**
 * Window State Persistence
 *
 * Handles saving and loading window state (position, size, maximized)
 * to persist user preferences between sessions.
 */

import { app } from 'electron';
import fs from 'fs';
import path from 'path';

export interface WindowState {
  x?: number;
  y?: number;
  width: number;
  height: number;
  isMaximized: boolean;
  isMinimized: boolean;
}

// Default window state
const DEFAULT_STATE: WindowState = {
  width: 1200,
  height: 800,
  isMaximized: false,
  isMinimized: false,
};

/**
 * Get the path to the window state file
 */
function getStatePath(): string {
  const userDataPath = app.getPath('userData');
  return path.join(userDataPath, 'window-state.json');
}

/**
 * Load all window states from disk
 */
function loadAllStates(): Record<string, WindowState> {
  try {
    const statePath = getStatePath();
    if (fs.existsSync(statePath)) {
      const data = fs.readFileSync(statePath, 'utf-8');
      const parsed = JSON.parse(data) as unknown;

      // Validate that parsed data is an object
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return parsed as Record<string, WindowState>;
      }
    }
  } catch (error) {
    console.warn('Failed to load window states:', error);
  }
  return {};
}

/**
 * Save all window states to disk
 */
function saveAllStates(states: Record<string, WindowState>): void {
  try {
    const statePath = getStatePath();
    const dirPath = path.dirname(statePath);

    // Ensure directory exists
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }

    fs.writeFileSync(statePath, JSON.stringify(states, null, 2), 'utf-8');
  } catch (error) {
    console.warn('Failed to save window states:', error);
  }
}

/**
 * Load window state for a specific window ID
 */
export function loadWindowState(windowId: string): WindowState | null {
  const states = loadAllStates();
  const state = states[windowId];

  if (state) {
    // Validate the loaded state
    return validateState(state);
  }

  return null;
}

/**
 * Save window state for a specific window ID
 */
export function saveWindowState(windowId: string, state: WindowState): void {
  const states = loadAllStates();
  states[windowId] = {
    x: state.x,
    y: state.y,
    width: state.width,
    height: state.height,
    isMaximized: state.isMaximized,
    isMinimized: state.isMinimized,
  };
  saveAllStates(states);
}

/**
 * Clear window state for a specific window ID
 */
export function clearWindowState(windowId: string): void {
  const states = loadAllStates();
  delete states[windowId];
  saveAllStates(states);
}

/**
 * Clear all window states
 */
export function clearAllWindowStates(): void {
  try {
    const statePath = getStatePath();
    if (fs.existsSync(statePath)) {
      fs.unlinkSync(statePath);
    }
  } catch (error) {
    console.warn('Failed to clear window states:', error);
  }
}

/**
 * Validate a window state object
 */
function validateState(state: Partial<WindowState>): WindowState {
  return {
    x: typeof state.x === 'number' ? state.x : undefined,
    y: typeof state.y === 'number' ? state.y : undefined,
    width: typeof state.width === 'number' && state.width > 0 ? state.width : DEFAULT_STATE.width,
    height: typeof state.height === 'number' && state.height > 0 ? state.height : DEFAULT_STATE.height,
    isMaximized: typeof state.isMaximized === 'boolean' ? state.isMaximized : DEFAULT_STATE.isMaximized,
    isMinimized: typeof state.isMinimized === 'boolean' ? state.isMinimized : DEFAULT_STATE.isMinimized,
  };
}

/**
 * Get the default window state
 */
export function getDefaultWindowState(): WindowState {
  return { ...DEFAULT_STATE };
}
