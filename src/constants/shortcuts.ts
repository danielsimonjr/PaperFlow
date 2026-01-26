export interface KeyboardShortcut {
  key: string;
  modifiers: ('ctrl' | 'shift' | 'alt' | 'meta')[];
  action: string;
  description: string;
}

export const KEYBOARD_SHORTCUTS: KeyboardShortcut[] = [
  // File operations
  { key: 'o', modifiers: ['ctrl'], action: 'file.open', description: 'Open file' },
  { key: 's', modifiers: ['ctrl'], action: 'file.save', description: 'Save' },
  { key: 's', modifiers: ['ctrl', 'shift'], action: 'file.saveAs', description: 'Save As' },
  { key: 'p', modifiers: ['ctrl'], action: 'file.print', description: 'Print' },

  // Edit operations
  { key: 'z', modifiers: ['ctrl'], action: 'edit.undo', description: 'Undo' },
  { key: 'z', modifiers: ['ctrl', 'shift'], action: 'edit.redo', description: 'Redo' },
  { key: 'y', modifiers: ['ctrl'], action: 'edit.redo', description: 'Redo' },
  { key: 'a', modifiers: ['ctrl'], action: 'edit.selectAll', description: 'Select all' },
  { key: 'c', modifiers: ['ctrl'], action: 'edit.copy', description: 'Copy' },
  { key: 'v', modifiers: ['ctrl'], action: 'edit.paste', description: 'Paste' },
  { key: 'x', modifiers: ['ctrl'], action: 'edit.cut', description: 'Cut' },
  { key: 'Delete', modifiers: [], action: 'edit.delete', description: 'Delete' },

  // Navigation
  { key: 'f', modifiers: ['ctrl'], action: 'nav.find', description: 'Find' },
  { key: 'g', modifiers: ['ctrl'], action: 'nav.goToPage', description: 'Go to page' },
  { key: 'ArrowRight', modifiers: [], action: 'nav.nextPage', description: 'Next page' },
  { key: 'ArrowLeft', modifiers: [], action: 'nav.prevPage', description: 'Previous page' },
  { key: 'PageDown', modifiers: [], action: 'nav.nextPage', description: 'Next page' },
  { key: 'PageUp', modifiers: [], action: 'nav.prevPage', description: 'Previous page' },
  { key: 'Home', modifiers: ['ctrl'], action: 'nav.firstPage', description: 'First page' },
  { key: 'End', modifiers: ['ctrl'], action: 'nav.lastPage', description: 'Last page' },

  // Zoom
  { key: '=', modifiers: ['ctrl'], action: 'zoom.in', description: 'Zoom in' },
  { key: '+', modifiers: ['ctrl'], action: 'zoom.in', description: 'Zoom in' },
  { key: '-', modifiers: ['ctrl'], action: 'zoom.out', description: 'Zoom out' },
  { key: '0', modifiers: ['ctrl'], action: 'zoom.reset', description: 'Reset zoom' },

  // Tools
  { key: 'v', modifiers: [], action: 'tool.select', description: 'Select tool' },
  { key: 'h', modifiers: [], action: 'tool.hand', description: 'Hand tool' },
  { key: 't', modifiers: [], action: 'tool.text', description: 'Text tool' },
  { key: 'l', modifiers: [], action: 'tool.highlight', description: 'Highlight' },
  { key: 'n', modifiers: [], action: 'tool.note', description: 'Sticky note' },
  { key: 'd', modifiers: [], action: 'tool.draw', description: 'Draw' },

  // View
  { key: 'Escape', modifiers: [], action: 'view.escape', description: 'Cancel/Deselect' },
];

export function matchShortcut(
  event: KeyboardEvent,
  shortcut: KeyboardShortcut
): boolean {
  const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase();
  const ctrlMatch = shortcut.modifiers.includes('ctrl') === (event.ctrlKey || event.metaKey);
  const shiftMatch = shortcut.modifiers.includes('shift') === event.shiftKey;
  const altMatch = shortcut.modifiers.includes('alt') === event.altKey;

  return keyMatch && ctrlMatch && shiftMatch && altMatch;
}
