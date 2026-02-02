/**
 * Unsaved Changes Hook
 *
 * Tracks document modifications and handles close/quit confirmation dialogs.
 * Integrates with Electron's native close/quit events.
 */

import { useEffect, useCallback, useRef } from 'react';
import { useDocumentStore } from '@stores/documentStore';
import { isElectron } from '@lib/electron/platform';

interface UseUnsavedChangesOptions {
  /**
   * Enable browser beforeunload warning
   * @default true
   */
  browserWarning?: boolean;

  /**
   * Custom save handler called before close
   * Should return true if save was successful or user chose to discard
   */
  onSave?: () => Promise<boolean>;

  /**
   * Custom message for the confirmation dialog
   */
  message?: string;
}

/**
 * Hook to manage unsaved changes detection and confirmation
 */
export function useUnsavedChanges(options: UseUnsavedChangesOptions = {}) {
  const {
    browserWarning = true,
    onSave,
    message = 'You have unsaved changes. Do you want to save before closing?',
  } = options;

  const isModified = useDocumentStore((state) => state.isModified);
  const fileName = useDocumentStore((state) => state.fileName);
  const setModified = useDocumentStore((state) => state.setModified);

  // Track if we're in the process of closing
  const isClosingRef = useRef(false);

  /**
   * Show confirmation dialog and handle response
   */
  const confirmClose = useCallback(async (): Promise<boolean> => {
    if (!isModified) {
      return true;
    }

    if (isElectron() && window.electron) {
      const result = await window.electron.showMessageDialog({
        type: 'question',
        title: 'Unsaved Changes',
        message,
        detail: fileName ? `File: ${fileName}` : undefined,
        buttons: ['Save', "Don't Save", 'Cancel'],
        defaultId: 0,
        cancelId: 2,
      });

      if (result.response === 0) {
        // Save
        if (onSave) {
          const saved = await onSave();
          return saved;
        }
        return false;
      } else if (result.response === 1) {
        // Don't Save
        setModified(false);
        return true;
      } else {
        // Cancel
        return false;
      }
    } else {
      // Browser fallback
      const confirmed = window.confirm(
        `${message}\n\nClick OK to close without saving, or Cancel to go back.`
      );
      if (confirmed) {
        setModified(false);
      }
      return confirmed;
    }
  }, [isModified, fileName, message, onSave, setModified]);

  /**
   * Handle window close request from Electron
   */
  useEffect(() => {
    if (!isElectron() || !window.electron) {
      return;
    }

    const unsubscribe = window.electron.onCloseRequested(async () => {
      if (isClosingRef.current) {
        return true;
      }

      const canClose = await confirmClose();
      if (canClose) {
        isClosingRef.current = true;
      }
      return canClose;
    });

    return unsubscribe;
  }, [confirmClose]);

  /**
   * Handle app quit request from Electron
   */
  useEffect(() => {
    if (!isElectron() || !window.electron) {
      return;
    }

    const unsubscribe = window.electron.onBeforeQuit(async () => {
      if (isClosingRef.current) {
        return true;
      }

      const canQuit = await confirmClose();
      if (canQuit) {
        isClosingRef.current = true;
      }
      return canQuit;
    });

    return unsubscribe;
  }, [confirmClose]);

  /**
   * Handle browser beforeunload event
   */
  useEffect(() => {
    if (!browserWarning || isElectron()) {
      return;
    }

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (isModified) {
        event.preventDefault();
        event.returnValue = message;
        return message;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isModified, browserWarning, message]);

  /**
   * Update window title indicator (macOS document edited dot)
   */
  useEffect(() => {
    if (isElectron() && window.electron) {
      window.electron.setDocumentEdited(isModified);
    }
  }, [isModified]);

  /**
   * Update window title with unsaved indicator
   */
  useEffect(() => {
    if (isElectron() && window.electron && fileName) {
      const title = isModified ? `${fileName} *` : fileName;
      window.electron.setWindowTitle(`${title} - PaperFlow`);
    }
  }, [fileName, isModified]);

  return {
    isModified,
    confirmClose,
    markAsModified: () => setModified(true),
    markAsSaved: () => setModified(false),
  };
}

/**
 * Hook to track if the document has been modified since last save
 */
export function useDocumentModified() {
  const isModified = useDocumentStore((state) => state.isModified);
  const setModified = useDocumentStore((state) => state.setModified);

  return {
    isModified,
    markModified: useCallback(() => setModified(true), [setModified]),
    markSaved: useCallback(() => setModified(false), [setModified]),
  };
}
