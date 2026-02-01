/**
 * Form Designer Store
 * Manages state for the drag-and-drop form field designer.
 */

import { create } from 'zustand';

export type FieldType =
  | 'textField'
  | 'textArea'
  | 'checkbox'
  | 'radioGroup'
  | 'dropdown'
  | 'datePicker'
  | 'signature'
  | 'button';

export type ButtonAction = 'submit' | 'reset' | 'print';

export interface Point {
  x: number;
  y: number;
}

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface FormFieldAppearance {
  borderColor: string;
  borderWidth: number;
  backgroundColor: string;
  fontFamily: string;
  fontSize: number;
  fontColor: string;
  textAlign: 'left' | 'center' | 'right';
}

export interface FormFieldDefinition {
  id: string;
  type: FieldType;
  name: string;
  pageIndex: number;
  bounds: Rect;
  tooltip: string;
  required: boolean;
  readOnly: boolean;
  defaultValue: string;
  appearance: FormFieldAppearance;
  // Type-specific properties
  maxLength?: number;
  placeholder?: string;
  options?: string[];
  groupName?: string;
  buttonAction?: ButtonAction;
  dateFormat?: string;
}

interface FormDesignerState {
  isDesignMode: boolean;
  selectedFieldId: string | null;
  selectedFieldIds: string[];
  fields: FormFieldDefinition[];
  clipboard: FormFieldDefinition | null;
  snapToGrid: boolean;
  gridSize: number;
  isPreviewMode: boolean;
  isDragging: boolean;
  draggedFieldType: FieldType | null;

  // Actions
  enterDesignMode: () => void;
  exitDesignMode: () => void;
  togglePreviewMode: () => void;
  addField: (type: FieldType, position: Point, pageIndex: number) => string;
  updateField: (id: string, updates: Partial<FormFieldDefinition>) => void;
  deleteField: (id: string) => void;
  deleteSelectedFields: () => void;
  duplicateField: (id: string) => string;
  selectField: (id: string | null) => void;
  addToSelection: (id: string) => void;
  selectFields: (ids: string[]) => void;
  clearSelection: () => void;
  copyField: () => void;
  pasteField: (position: Point, pageIndex: number) => string | null;
  cutField: () => void;
  moveField: (id: string, position: Point) => void;
  resizeField: (id: string, bounds: Rect) => void;
  setSnapToGrid: (enabled: boolean) => void;
  setGridSize: (size: number) => void;
  setDragging: (dragging: boolean, fieldType?: FieldType | null) => void;
  getFieldsByPage: (pageIndex: number) => FormFieldDefinition[];
  clearAllFields: () => void;
  importFields: (fields: FormFieldDefinition[]) => void;
}

const DEFAULT_APPEARANCE: FormFieldAppearance = {
  borderColor: '#000000',
  borderWidth: 1,
  backgroundColor: '#ffffff',
  fontFamily: 'Helvetica',
  fontSize: 12,
  fontColor: '#000000',
  textAlign: 'left',
};

const FIELD_DEFAULTS: Record<FieldType, Partial<FormFieldDefinition>> = {
  textField: {
    maxLength: 100,
    placeholder: '',
  },
  textArea: {
    maxLength: 1000,
    placeholder: '',
  },
  checkbox: {
    defaultValue: 'off',
  },
  radioGroup: {
    options: ['Option 1', 'Option 2'],
    groupName: 'radioGroup1',
  },
  dropdown: {
    options: ['Option 1', 'Option 2', 'Option 3'],
  },
  datePicker: {
    dateFormat: 'MM/DD/YYYY',
  },
  signature: {},
  button: {
    buttonAction: 'submit',
    defaultValue: 'Submit',
  },
};

const FIELD_SIZES: Record<FieldType, { width: number; height: number }> = {
  textField: { width: 200, height: 24 },
  textArea: { width: 200, height: 80 },
  checkbox: { width: 16, height: 16 },
  radioGroup: { width: 200, height: 60 },
  dropdown: { width: 200, height: 24 },
  datePicker: { width: 150, height: 24 },
  signature: { width: 200, height: 60 },
  button: { width: 100, height: 30 },
};

let fieldIdCounter = 0;

function generateFieldId(): string {
  return `field_${++fieldIdCounter}_${Date.now()}`;
}

function generateFieldName(type: FieldType): string {
  return `${type}_${++fieldIdCounter}`;
}

function snapToGridValue(value: number, gridSize: number, enabled: boolean): number {
  if (!enabled) return value;
  return Math.round(value / gridSize) * gridSize;
}

export const useFormDesignerStore = create<FormDesignerState>((set, get) => ({
  isDesignMode: false,
  selectedFieldId: null,
  selectedFieldIds: [],
  fields: [],
  clipboard: null,
  snapToGrid: true,
  gridSize: 10,
  isPreviewMode: false,
  isDragging: false,
  draggedFieldType: null,

  enterDesignMode: () => set({ isDesignMode: true, isPreviewMode: false }),

  exitDesignMode: () =>
    set({
      isDesignMode: false,
      isPreviewMode: false,
      selectedFieldId: null,
      selectedFieldIds: [],
    }),

  togglePreviewMode: () =>
    set((state) => ({
      isPreviewMode: !state.isPreviewMode,
      selectedFieldId: null,
      selectedFieldIds: [],
    })),

  addField: (type, position, pageIndex) => {
    const { snapToGrid, gridSize } = get();
    const size = FIELD_SIZES[type];
    const id = generateFieldId();

    const newField: FormFieldDefinition = {
      id,
      type,
      name: generateFieldName(type),
      pageIndex,
      bounds: {
        x: snapToGridValue(position.x, gridSize, snapToGrid),
        y: snapToGridValue(position.y, gridSize, snapToGrid),
        width: size.width,
        height: size.height,
      },
      tooltip: '',
      required: false,
      readOnly: false,
      defaultValue: '',
      appearance: { ...DEFAULT_APPEARANCE },
      ...FIELD_DEFAULTS[type],
    };

    set((state) => ({
      fields: [...state.fields, newField],
      selectedFieldId: id,
      selectedFieldIds: [id],
    }));

    return id;
  },

  updateField: (id, updates) =>
    set((state) => ({
      fields: state.fields.map((field) =>
        field.id === id ? { ...field, ...updates } : field
      ),
    })),

  deleteField: (id) =>
    set((state) => ({
      fields: state.fields.filter((field) => field.id !== id),
      selectedFieldId: state.selectedFieldId === id ? null : state.selectedFieldId,
      selectedFieldIds: state.selectedFieldIds.filter((fid) => fid !== id),
    })),

  deleteSelectedFields: () =>
    set((state) => ({
      fields: state.fields.filter((field) => !state.selectedFieldIds.includes(field.id)),
      selectedFieldId: null,
      selectedFieldIds: [],
    })),

  duplicateField: (id) => {
    const { fields, snapToGrid, gridSize } = get();
    const original = fields.find((f) => f.id === id);
    if (!original) return '';

    const newId = generateFieldId();
    const offset = 20;

    const duplicate: FormFieldDefinition = {
      ...original,
      id: newId,
      name: generateFieldName(original.type),
      bounds: {
        ...original.bounds,
        x: snapToGridValue(original.bounds.x + offset, gridSize, snapToGrid),
        y: snapToGridValue(original.bounds.y + offset, gridSize, snapToGrid),
      },
    };

    set((state) => ({
      fields: [...state.fields, duplicate],
      selectedFieldId: newId,
      selectedFieldIds: [newId],
    }));

    return newId;
  },

  selectField: (id) =>
    set({
      selectedFieldId: id,
      selectedFieldIds: id ? [id] : [],
    }),

  addToSelection: (id) =>
    set((state) => {
      if (state.selectedFieldIds.includes(id)) {
        const newSelection = state.selectedFieldIds.filter((fid) => fid !== id);
        return {
          selectedFieldIds: newSelection,
          selectedFieldId: newSelection[0] || null,
        };
      }
      return {
        selectedFieldIds: [...state.selectedFieldIds, id],
        selectedFieldId: id,
      };
    }),

  selectFields: (ids) =>
    set({
      selectedFieldIds: ids,
      selectedFieldId: ids[0] || null,
    }),

  clearSelection: () =>
    set({
      selectedFieldId: null,
      selectedFieldIds: [],
    }),

  copyField: () => {
    const { selectedFieldId, fields } = get();
    if (!selectedFieldId) return;

    const field = fields.find((f) => f.id === selectedFieldId);
    if (field) {
      set({ clipboard: { ...field } });
    }
  },

  pasteField: (position, pageIndex) => {
    const { clipboard, snapToGrid, gridSize } = get();
    if (!clipboard) return null;

    const newId = generateFieldId();
    const pasted: FormFieldDefinition = {
      ...clipboard,
      id: newId,
      name: generateFieldName(clipboard.type),
      pageIndex,
      bounds: {
        ...clipboard.bounds,
        x: snapToGridValue(position.x, gridSize, snapToGrid),
        y: snapToGridValue(position.y, gridSize, snapToGrid),
      },
    };

    set((state) => ({
      fields: [...state.fields, pasted],
      selectedFieldId: newId,
      selectedFieldIds: [newId],
    }));

    return newId;
  },

  cutField: () => {
    const { selectedFieldId, fields } = get();
    if (!selectedFieldId) return;

    const field = fields.find((f) => f.id === selectedFieldId);
    if (field) {
      set((state) => ({
        clipboard: { ...field },
        fields: state.fields.filter((f) => f.id !== selectedFieldId),
        selectedFieldId: null,
        selectedFieldIds: [],
      }));
    }
  },

  moveField: (id, position) => {
    const { snapToGrid, gridSize } = get();
    set((state) => ({
      fields: state.fields.map((field) =>
        field.id === id
          ? {
              ...field,
              bounds: {
                ...field.bounds,
                x: snapToGridValue(position.x, gridSize, snapToGrid),
                y: snapToGridValue(position.y, gridSize, snapToGrid),
              },
            }
          : field
      ),
    }));
  },

  resizeField: (id, bounds) => {
    const { snapToGrid, gridSize } = get();
    set((state) => ({
      fields: state.fields.map((field) =>
        field.id === id
          ? {
              ...field,
              bounds: {
                x: snapToGridValue(bounds.x, gridSize, snapToGrid),
                y: snapToGridValue(bounds.y, gridSize, snapToGrid),
                width: Math.max(20, snapToGridValue(bounds.width, gridSize, snapToGrid)),
                height: Math.max(16, snapToGridValue(bounds.height, gridSize, snapToGrid)),
              },
            }
          : field
      ),
    }));
  },

  setSnapToGrid: (enabled) => set({ snapToGrid: enabled }),

  setGridSize: (size) => set({ gridSize: Math.max(5, Math.min(50, size)) }),

  setDragging: (dragging, fieldType = null) =>
    set({
      isDragging: dragging,
      draggedFieldType: fieldType,
    }),

  getFieldsByPage: (pageIndex) => {
    return get().fields.filter((field) => field.pageIndex === pageIndex);
  },

  clearAllFields: () =>
    set({
      fields: [],
      selectedFieldId: null,
      selectedFieldIds: [],
      clipboard: null,
    }),

  importFields: (fields) =>
    set((state) => ({
      fields: [...state.fields, ...fields],
    })),
}));
