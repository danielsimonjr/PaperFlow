import { useCallback, useEffect } from 'react';
import { useFormStore } from '@stores/formStore';
import { useSettingsStore } from '@stores/settingsStore';
import { useDocumentStore } from '@stores/documentStore';

interface UseFormNavigationOptions {
  onPageChange?: (pageIndex: number) => void;
}

/**
 * Hook for managing form field navigation (Tab/Shift+Tab)
 */
export function useFormNavigation(options?: UseFormNavigationOptions) {
  const fields = useFormStore((state) => state.fields);
  const focusedFieldId = useFormStore((state) => state.focusedFieldId);
  const setFocusedField = useFormStore((state) => state.setFocusedField);
  const getNextField = useFormStore((state) => state.getNextField);
  const getPreviousField = useFormStore((state) => state.getPreviousField);

  const formAutoAdvance = useSettingsStore((state) => state.formAutoAdvance);
  const setCurrentPage = useDocumentStore((state) => state.setCurrentPage);

  /**
   * Move to the next form field
   */
  const focusNextField = useCallback(() => {
    if (!focusedFieldId) {
      // No field focused, focus first field
      const firstField = fields[0];
      if (firstField) {
        setFocusedField(firstField.id);
        options?.onPageChange?.(firstField.pageIndex);
        setCurrentPage(firstField.pageIndex + 1);
      }
      return;
    }

    const nextField = getNextField(focusedFieldId);
    if (nextField) {
      setFocusedField(nextField.id);
      // Navigate to the page if different
      const currentField = fields.find((f) => f.id === focusedFieldId);
      if (currentField && nextField.pageIndex !== currentField.pageIndex) {
        options?.onPageChange?.(nextField.pageIndex);
        setCurrentPage(nextField.pageIndex + 1);
      }
    }
  }, [
    focusedFieldId,
    fields,
    getNextField,
    setFocusedField,
    setCurrentPage,
    options,
  ]);

  /**
   * Move to the previous form field
   */
  const focusPreviousField = useCallback(() => {
    if (!focusedFieldId) {
      // No field focused, focus last field
      const lastField = fields[fields.length - 1];
      if (lastField) {
        setFocusedField(lastField.id);
        options?.onPageChange?.(lastField.pageIndex);
        setCurrentPage(lastField.pageIndex + 1);
      }
      return;
    }

    const prevField = getPreviousField(focusedFieldId);
    if (prevField) {
      setFocusedField(prevField.id);
      // Navigate to the page if different
      const currentField = fields.find((f) => f.id === focusedFieldId);
      if (currentField && prevField.pageIndex !== currentField.pageIndex) {
        options?.onPageChange?.(prevField.pageIndex);
        setCurrentPage(prevField.pageIndex + 1);
      }
    }
  }, [
    focusedFieldId,
    fields,
    getPreviousField,
    setFocusedField,
    setCurrentPage,
    options,
  ]);

  /**
   * Focus a specific field by ID
   */
  const focusField = useCallback(
    (fieldId: string) => {
      const field = fields.find((f) => f.id === fieldId);
      if (field) {
        setFocusedField(fieldId);
        options?.onPageChange?.(field.pageIndex);
        setCurrentPage(field.pageIndex + 1);
      }
    },
    [fields, setFocusedField, setCurrentPage, options]
  );

  /**
   * Focus the first empty required field
   */
  const focusFirstEmptyRequired = useCallback(() => {
    const emptyRequired = fields.find((field) => {
      if (!field.required) return false;
      switch (field.type) {
        case 'text':
        case 'dropdown':
          return !field.value || String(field.value).trim() === '';
        case 'checkbox':
          return !field.value;
        case 'radio':
          return !field.value;
        case 'signature':
          return !field.value;
        default:
          return false;
      }
    });

    if (emptyRequired) {
      focusField(emptyRequired.id);
      return emptyRequired;
    }
    return null;
  }, [fields, focusField]);

  /**
   * Handle tab navigation
   */
  const handleTab = useCallback(
    (shiftKey: boolean) => {
      if (shiftKey) {
        focusPreviousField();
      } else {
        focusNextField();
      }
    },
    [focusNextField, focusPreviousField]
  );

  /**
   * Handle auto-advance after field completion
   */
  const handleAutoAdvance = useCallback(() => {
    if (formAutoAdvance) {
      focusNextField();
    }
  }, [formAutoAdvance, focusNextField]);

  // Global keyboard handler for Tab navigation when not in a field
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle Tab when not in an input
      if (e.key !== 'Tab') return;
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return;
      }

      // If we have form fields, handle Tab navigation
      if (fields.length > 0) {
        e.preventDefault();
        handleTab(e.shiftKey);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [fields, handleTab]);

  return {
    focusedFieldId,
    focusNextField,
    focusPreviousField,
    focusField,
    focusFirstEmptyRequired,
    handleTab,
    handleAutoAdvance,
    hasFields: fields.length > 0,
    totalFields: fields.length,
    currentFieldIndex: focusedFieldId
      ? fields.findIndex((f) => f.id === focusedFieldId) + 1
      : 0,
  };
}
