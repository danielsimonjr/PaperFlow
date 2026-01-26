import { useEffect, useCallback } from 'react';
import { useDocumentStore } from '@stores/documentStore';
import { useFormStore } from '@stores/formStore';
import { useSettingsStore } from '@stores/settingsStore';
import { extractPageFormFields, sortFieldsByTabOrder } from '@lib/forms/formParser';
import { loadFormData, saveFormData } from '@lib/storage/formStorage';
import type { FormField } from '@/types/forms';

/**
 * Hook to extract and manage form fields from the loaded PDF document
 */
export function useFormFields() {
  const renderer = useDocumentStore((state) => state.renderer);
  const pageCount = useDocumentStore((state) => state.pageCount);
  const fileName = useDocumentStore((state) => state.fileName);

  const setFields = useFormStore((state) => state.setFields);
  const importFormData = useFormStore((state) => state.importFormData);
  const fields = useFormStore((state) => state.fields);
  const isDirty = useFormStore((state) => state.isDirty);
  const setLoading = useFormStore((state) => state.setLoading);

  const formAutoSave = useSettingsStore((state) => state.formAutoSave);

  // Extract form fields when document loads
  useEffect(() => {
    if (!renderer || pageCount === 0) {
      setFields([]);
      return;
    }

    const extractFields = async () => {
      setLoading(true);

      try {
        const allFields: FormField[] = [];

        // Extract fields from all pages
        for (let pageNum = 1; pageNum <= pageCount; pageNum++) {
          const page = await renderer.getPage(pageNum);
          const pageFields = await extractPageFormFields(page, pageNum - 1);
          allFields.push(...pageFields);
        }

        // Sort by tab order
        const sortedFields = sortFieldsByTabOrder(allFields);
        setFields(sortedFields);

        // Try to restore saved form data
        if (fileName && sortedFields.length > 0) {
          const documentId = `form-${fileName}`;
          const savedData = await loadFormData(documentId);
          if (savedData) {
            importFormData(savedData);
          }
        }
      } catch (error) {
        console.error('Error extracting form fields:', error);
        setFields([]);
      } finally {
        setLoading(false);
      }
    };

    extractFields();
  }, [renderer, pageCount, fileName, setFields, importFormData, setLoading]);

  // Auto-save form data when fields change
  useEffect(() => {
    if (!formAutoSave || !fileName || fields.length === 0 || !isDirty) {
      return;
    }

    const documentId = `form-${fileName}`;

    // Debounce auto-save
    const timeoutId = setTimeout(() => {
      saveFormData(documentId, fields).catch((error) => {
        console.error('Error auto-saving form data:', error);
      });
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [formAutoSave, fileName, fields, isDirty]);

  // Manual save function
  const saveProgress = useCallback(async () => {
    if (!fileName || fields.length === 0) return;

    const documentId = `form-${fileName}`;
    await saveFormData(documentId, fields);
  }, [fileName, fields]);

  return {
    fields,
    hasFields: fields.length > 0,
    saveProgress,
  };
}
