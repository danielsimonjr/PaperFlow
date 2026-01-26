import { useState, useCallback, useRef, useEffect } from 'react';

interface UseDropZoneOptions {
  onDrop: (files: File[]) => void;
  accept?: string[];
  multiple?: boolean;
  disabled?: boolean;
}

interface UseDropZoneReturn {
  isDragging: boolean;
  isDraggingOver: boolean;
  dragCounter: number;
  rootProps: {
    onDragEnter: (e: React.DragEvent) => void;
    onDragLeave: (e: React.DragEvent) => void;
    onDragOver: (e: React.DragEvent) => void;
    onDrop: (e: React.DragEvent) => void;
  };
  inputProps: {
    type: 'file';
    accept: string;
    multiple: boolean;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    ref: React.RefObject<HTMLInputElement | null>;
  };
  open: () => void;
  error: string | null;
  clearError: () => void;
}

export function useDropZone({
  onDrop,
  accept = ['application/pdf', '.pdf'],
  multiple = false,
  disabled = false,
}: UseDropZoneOptions): UseDropZoneReturn {
  const [isDragging, setIsDragging] = useState(false);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dragCounterRef = useRef(0);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Reset drag counter when disabled changes
  useEffect(() => {
    if (disabled) {
      dragCounterRef.current = 0;
      setIsDragging(false);
      setIsDraggingOver(false);
    }
  }, [disabled]);

  const validateFiles = useCallback(
    (files: FileList | File[]): File[] => {
      const validFiles: File[] = [];
      const fileArray = Array.from(files);

      for (const file of fileArray) {
        const isValidType = accept.some((type) => {
          if (type.startsWith('.')) {
            return file.name.toLowerCase().endsWith(type.toLowerCase());
          }
          return file.type === type;
        });

        if (isValidType) {
          validFiles.push(file);
        }
      }

      return validFiles;
    },
    [accept]
  );

  const handleDragEnter = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (disabled) return;

      dragCounterRef.current++;
      setIsDragging(true);

      if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
        setIsDraggingOver(true);
      }
    },
    [disabled]
  );

  const handleDragLeave = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (disabled) return;

      dragCounterRef.current--;

      if (dragCounterRef.current === 0) {
        setIsDragging(false);
        setIsDraggingOver(false);
      }
    },
    [disabled]
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (disabled) return;

      e.dataTransfer.dropEffect = 'copy';
    },
    [disabled]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (disabled) return;

      dragCounterRef.current = 0;
      setIsDragging(false);
      setIsDraggingOver(false);
      setError(null);

      const files = e.dataTransfer.files;
      if (files && files.length > 0) {
        const validFiles = validateFiles(files);

        if (validFiles.length === 0) {
          setError('Invalid file type. Please drop a PDF file.');
          return;
        }

        const firstFile = validFiles[0];
        if (!firstFile) return;
        const filesToProcess = multiple ? validFiles : [firstFile];
        onDrop(filesToProcess);
      }
    },
    [disabled, validateFiles, multiple, onDrop]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (disabled) return;

      const files = e.target.files;
      if (files && files.length > 0) {
        setError(null);
        const validFiles = validateFiles(files);

        if (validFiles.length === 0) {
          setError('Invalid file type. Please select a PDF file.');
          return;
        }

        const firstFile = validFiles[0];
        if (!firstFile) return;
        const filesToProcess = multiple ? validFiles : [firstFile];
        onDrop(filesToProcess);
      }

      // Reset input value to allow selecting the same file again
      if (inputRef.current) {
        inputRef.current.value = '';
      }
    },
    [disabled, validateFiles, multiple, onDrop]
  );

  const open = useCallback(() => {
    if (!disabled && inputRef.current) {
      inputRef.current.click();
    }
  }, [disabled]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const acceptString = accept
    .map((type) => (type.startsWith('.') ? type : type))
    .join(',');

  return {
    isDragging,
    isDraggingOver,
    dragCounter: dragCounterRef.current,
    rootProps: {
      onDragEnter: handleDragEnter,
      onDragLeave: handleDragLeave,
      onDragOver: handleDragOver,
      onDrop: handleDrop,
    },
    inputProps: {
      type: 'file' as const,
      accept: acceptString,
      multiple,
      onChange: handleInputChange,
      ref: inputRef,
    },
    open,
    error,
    clearError,
  };
}
