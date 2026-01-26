import { useEffect, useRef, useCallback } from 'react';
import { storage } from '@lib/storage/indexeddb';
import { useDocumentStore } from '@stores/documentStore';
import { useSettingsStore } from '@stores/settingsStore';
import { savePdf } from '@lib/pdf/saver';

interface UseAutoSaveOptions {
  enabled?: boolean;
  intervalMs?: number;
  onAutoSave?: () => void;
  onAutoSaveError?: (error: Error) => void;
}

interface UseAutoSaveReturn {
  lastAutoSaveTime: Date | null;
  isAutoSaving: boolean;
  triggerAutoSave: () => Promise<void>;
}

export function useAutoSave({
  enabled = true,
  intervalMs,
  onAutoSave,
  onAutoSaveError,
}: UseAutoSaveOptions = {}): UseAutoSaveReturn {
  const lastAutoSaveTimeRef = useRef<Date | null>(null);
  const isAutoSavingRef = useRef(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fileName = useDocumentStore((state) => state.fileName);
  const fileData = useDocumentStore((state) => state.fileData);
  const isModified = useDocumentStore((state) => state.isModified);

  // Get auto-save settings from settings store
  const autoSaveEnabled = useSettingsStore((state) => state.autoSave);
  const autoSaveInterval = useSettingsStore((state) => state.autoSaveInterval);

  // Use provided interval or fall back to settings
  const effectiveIntervalMs = intervalMs ?? autoSaveInterval * 1000;
  const effectiveEnabled = enabled && autoSaveEnabled;

  const performAutoSave = useCallback(async () => {
    if (!fileData || !fileName || !isModified || isAutoSavingRef.current) {
      return;
    }

    isAutoSavingRef.current = true;

    try {
      // Generate PDF bytes
      const pdfBytes = await savePdf(fileData);

      // Generate a document ID from the filename
      const documentId = fileName.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();

      // Save to IndexedDB
      await storage.saveAutoSave({
        id: `${documentId}_${Date.now()}`,
        documentId,
        fileName,
        data: pdfBytes.buffer.slice(pdfBytes.byteOffset, pdfBytes.byteOffset + pdfBytes.byteLength) as ArrayBuffer,
        savedAt: new Date(),
      });

      lastAutoSaveTimeRef.current = new Date();

      // Cleanup old auto-saves
      await storage.cleanupOldAutoSaves(5);

      onAutoSave?.();
    } catch (error) {
      console.error('Auto-save failed:', error);
      onAutoSaveError?.(error instanceof Error ? error : new Error('Auto-save failed'));
    } finally {
      isAutoSavingRef.current = false;
    }
  }, [fileData, fileName, isModified, onAutoSave, onAutoSaveError]);

  // Set up auto-save interval
  useEffect(() => {
    if (!effectiveEnabled || !fileName) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    intervalRef.current = setInterval(() => {
      performAutoSave();
    }, effectiveIntervalMs);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [effectiveEnabled, effectiveIntervalMs, fileName, performAutoSave]);

  return {
    lastAutoSaveTime: lastAutoSaveTimeRef.current,
    isAutoSaving: isAutoSavingRef.current,
    triggerAutoSave: performAutoSave,
  };
}

/**
 * Hook to check for and recover auto-saved documents
 */
export function useAutoSaveRecovery() {
  const loadDocumentFromArrayBuffer = useDocumentStore(
    (state) => state.loadDocumentFromArrayBuffer
  );

  const checkForRecovery = useCallback(
    async (documentId: string): Promise<boolean> => {
      try {
        const autoSave = await storage.getAutoSave(documentId);
        if (autoSave) {
          return true;
        }
        return false;
      } catch {
        return false;
      }
    },
    []
  );

  const recoverDocument = useCallback(
    async (documentId: string): Promise<boolean> => {
      try {
        const autoSave = await storage.getAutoSave(documentId);
        if (autoSave) {
          await loadDocumentFromArrayBuffer(autoSave.data, autoSave.fileName);
          return true;
        }
        return false;
      } catch (error) {
        console.error('Failed to recover document:', error);
        return false;
      }
    },
    [loadDocumentFromArrayBuffer]
  );

  const clearRecoveryData = useCallback(async (documentId: string) => {
    try {
      const autoSave = await storage.getAutoSave(documentId);
      if (autoSave) {
        await storage.removeAutoSave(autoSave.id);
      }
    } catch (error) {
      console.error('Failed to clear recovery data:', error);
    }
  }, []);

  return {
    checkForRecovery,
    recoverDocument,
    clearRecoveryData,
  };
}
