import { useCallback } from 'react';
import { useFormStore } from '@stores/formStore';
import { useFormNavigation } from '@hooks/useFormNavigation';
import { FormFieldRenderer } from './FormFieldRenderer';

interface FormLayerProps {
  pageIndex: number;
  width: number;
  height: number;
  scale: number;
  pageHeight: number;
}

/**
 * FormLayer renders all form fields for a single page
 */
export function FormLayer({
  pageIndex,
  width,
  height,
  scale,
  pageHeight,
}: FormLayerProps) {
  const getFieldsForPage = useFormStore((state) => state.getFieldsForPage);
  const fields = getFieldsForPage(pageIndex);

  const { handleTab, handleAutoAdvance } = useFormNavigation();

  const handleFieldFocus = useCallback(() => {
    // Field focus handling is done in individual components
  }, []);

  const handleFieldBlur = useCallback(() => {
    // Field blur handling is done in individual components
  }, []);

  const handleValueChange = useCallback(() => {
    handleAutoAdvance();
  }, [handleAutoAdvance]);

  if (fields.length === 0) {
    return null;
  }

  return (
    <div
      className="absolute inset-0 pointer-events-none"
      style={{
        width,
        height,
      }}
    >
      {/* Form fields layer - enable pointer events for fields */}
      <div className="absolute inset-0">
        {fields.map((field) => (
          <div key={field.id} className="pointer-events-auto">
            <FormFieldRenderer
              field={field}
              scale={scale}
              pageHeight={pageHeight}
              onFocus={handleFieldFocus}
              onBlur={handleFieldBlur}
              onTab={handleTab}
              onValueChange={handleValueChange}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
