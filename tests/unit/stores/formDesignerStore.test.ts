/**
 * Tests for Form Designer Store
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { useFormDesignerStore } from '@/stores/formDesignerStore';

describe('Form Designer Store', () => {
  beforeEach(() => {
    // Reset store state before each test
    useFormDesignerStore.setState({
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
    });
  });

  describe('design mode', () => {
    it('should enter design mode', () => {
      const store = useFormDesignerStore.getState();
      store.enterDesignMode();

      expect(useFormDesignerStore.getState().isDesignMode).toBe(true);
      expect(useFormDesignerStore.getState().isPreviewMode).toBe(false);
    });

    it('should exit design mode and clear selection', () => {
      const store = useFormDesignerStore.getState();
      store.enterDesignMode();
      store.addField('textField', { x: 100, y: 100 }, 0);

      store.exitDesignMode();

      expect(useFormDesignerStore.getState().isDesignMode).toBe(false);
      expect(useFormDesignerStore.getState().selectedFieldId).toBeNull();
      expect(useFormDesignerStore.getState().selectedFieldIds).toHaveLength(0);
    });

    it('should toggle preview mode', () => {
      const store = useFormDesignerStore.getState();
      store.enterDesignMode();

      store.togglePreviewMode();
      expect(useFormDesignerStore.getState().isPreviewMode).toBe(true);

      store.togglePreviewMode();
      expect(useFormDesignerStore.getState().isPreviewMode).toBe(false);
    });
  });

  describe('field management', () => {
    it('should add a field', () => {
      const store = useFormDesignerStore.getState();
      const id = store.addField('textField', { x: 100, y: 200 }, 0);

      const state = useFormDesignerStore.getState();
      expect(state.fields).toHaveLength(1);
      expect(state.fields[0]?.id).toBe(id);
      expect(state.fields[0]?.type).toBe('textField');
      expect(state.fields[0]?.pageIndex).toBe(0);
      expect(state.selectedFieldId).toBe(id);
    });

    it('should add field with snapped position when snapToGrid is enabled', () => {
      const store = useFormDesignerStore.getState();
      store.setGridSize(10);
      store.setSnapToGrid(true);

      store.addField('textField', { x: 103, y: 207 }, 0);

      const state = useFormDesignerStore.getState();
      expect(state.fields[0]?.bounds.x).toBe(100);
      expect(state.fields[0]?.bounds.y).toBe(210);
    });

    it('should not snap position when snapToGrid is disabled', () => {
      const store = useFormDesignerStore.getState();
      store.setSnapToGrid(false);

      store.addField('textField', { x: 103, y: 207 }, 0);

      const state = useFormDesignerStore.getState();
      expect(state.fields[0]?.bounds.x).toBe(103);
      expect(state.fields[0]?.bounds.y).toBe(207);
    });

    it('should update a field', () => {
      const store = useFormDesignerStore.getState();
      const id = store.addField('textField', { x: 100, y: 100 }, 0);

      store.updateField(id, { name: 'myField', required: true });

      const state = useFormDesignerStore.getState();
      expect(state.fields[0]?.name).toBe('myField');
      expect(state.fields[0]?.required).toBe(true);
    });

    it('should delete a field', () => {
      const store = useFormDesignerStore.getState();
      const id = store.addField('textField', { x: 100, y: 100 }, 0);

      store.deleteField(id);

      expect(useFormDesignerStore.getState().fields).toHaveLength(0);
    });

    it('should clear selection when deleting selected field', () => {
      const store = useFormDesignerStore.getState();
      const id = store.addField('textField', { x: 100, y: 100 }, 0);
      store.selectField(id);

      store.deleteField(id);

      expect(useFormDesignerStore.getState().selectedFieldId).toBeNull();
    });

    it('should duplicate a field', () => {
      const store = useFormDesignerStore.getState();
      const id = store.addField('textField', { x: 100, y: 100 }, 0);
      store.updateField(id, { name: 'original', required: true });

      const duplicateId = store.duplicateField(id);

      const state = useFormDesignerStore.getState();
      expect(state.fields).toHaveLength(2);
      expect(duplicateId).not.toBe(id);
      expect(state.fields[1]?.type).toBe('textField');
      expect(state.fields[1]?.required).toBe(true);
      // Duplicate should be offset
      expect(state.fields[1]?.bounds.x).not.toBe(state.fields[0]?.bounds.x);
    });

    it('should return empty string when duplicating non-existent field', () => {
      const store = useFormDesignerStore.getState();
      const result = store.duplicateField('non-existent');
      expect(result).toBe('');
    });
  });

  describe('field selection', () => {
    it('should select a field', () => {
      const store = useFormDesignerStore.getState();
      const id = store.addField('textField', { x: 100, y: 100 }, 0);
      store.clearSelection();

      store.selectField(id);

      const state = useFormDesignerStore.getState();
      expect(state.selectedFieldId).toBe(id);
      expect(state.selectedFieldIds).toEqual([id]);
    });

    it('should add to selection', () => {
      const store = useFormDesignerStore.getState();
      const id1 = store.addField('textField', { x: 100, y: 100 }, 0);
      const id2 = store.addField('checkbox', { x: 200, y: 100 }, 0);

      store.selectField(id1);
      store.addToSelection(id2);

      const state = useFormDesignerStore.getState();
      expect(state.selectedFieldIds).toContain(id1);
      expect(state.selectedFieldIds).toContain(id2);
    });

    it('should remove from selection when adding already selected field', () => {
      const store = useFormDesignerStore.getState();
      const id1 = store.addField('textField', { x: 100, y: 100 }, 0);
      const id2 = store.addField('checkbox', { x: 200, y: 100 }, 0);

      store.selectFields([id1, id2]);
      store.addToSelection(id1);

      const state = useFormDesignerStore.getState();
      expect(state.selectedFieldIds).not.toContain(id1);
      expect(state.selectedFieldIds).toContain(id2);
    });

    it('should clear selection', () => {
      const store = useFormDesignerStore.getState();
      const id = store.addField('textField', { x: 100, y: 100 }, 0);
      store.selectField(id);

      store.clearSelection();

      const state = useFormDesignerStore.getState();
      expect(state.selectedFieldId).toBeNull();
      expect(state.selectedFieldIds).toHaveLength(0);
    });

    it('should delete selected fields', () => {
      const store = useFormDesignerStore.getState();
      const id1 = store.addField('textField', { x: 100, y: 100 }, 0);
      const id2 = store.addField('checkbox', { x: 200, y: 100 }, 0);
      store.addField('dropdown', { x: 300, y: 100 }, 0);

      store.selectFields([id1, id2]);
      store.deleteSelectedFields();

      const state = useFormDesignerStore.getState();
      expect(state.fields).toHaveLength(1);
      expect(state.fields[0]?.type).toBe('dropdown');
    });
  });

  describe('clipboard operations', () => {
    it('should copy a field to clipboard', () => {
      const store = useFormDesignerStore.getState();
      const id = store.addField('textField', { x: 100, y: 100 }, 0);
      store.selectField(id);

      store.copyField();

      const state = useFormDesignerStore.getState();
      expect(state.clipboard).not.toBeNull();
      expect(state.clipboard?.type).toBe('textField');
    });

    it('should paste a field from clipboard', () => {
      const store = useFormDesignerStore.getState();
      const id = store.addField('textField', { x: 100, y: 100 }, 0);
      store.selectField(id);
      store.copyField();

      const pastedId = store.pasteField({ x: 200, y: 200 }, 0);

      const state = useFormDesignerStore.getState();
      expect(state.fields).toHaveLength(2);
      expect(pastedId).not.toBe(id);
      expect(state.fields[1]?.bounds.x).toBe(200);
    });

    it('should return null when pasting without clipboard', () => {
      const store = useFormDesignerStore.getState();
      const result = store.pasteField({ x: 100, y: 100 }, 0);
      expect(result).toBeNull();
    });

    it('should cut a field', () => {
      const store = useFormDesignerStore.getState();
      const id = store.addField('textField', { x: 100, y: 100 }, 0);
      store.selectField(id);

      store.cutField();

      const state = useFormDesignerStore.getState();
      expect(state.fields).toHaveLength(0);
      expect(state.clipboard).not.toBeNull();
      expect(state.selectedFieldId).toBeNull();
    });
  });

  describe('field movement and resizing', () => {
    it('should move a field', () => {
      const store = useFormDesignerStore.getState();
      store.setSnapToGrid(false);
      const id = store.addField('textField', { x: 100, y: 100 }, 0);

      store.moveField(id, { x: 150, y: 200 });

      const state = useFormDesignerStore.getState();
      expect(state.fields[0]?.bounds.x).toBe(150);
      expect(state.fields[0]?.bounds.y).toBe(200);
    });

    it('should move field with snapping', () => {
      const store = useFormDesignerStore.getState();
      store.setSnapToGrid(true);
      store.setGridSize(10);
      const id = store.addField('textField', { x: 100, y: 100 }, 0);

      store.moveField(id, { x: 153, y: 207 });

      const state = useFormDesignerStore.getState();
      expect(state.fields[0]?.bounds.x).toBe(150);
      expect(state.fields[0]?.bounds.y).toBe(210);
    });

    it('should resize a field', () => {
      const store = useFormDesignerStore.getState();
      store.setSnapToGrid(false);
      const id = store.addField('textField', { x: 100, y: 100 }, 0);

      store.resizeField(id, { x: 100, y: 100, width: 300, height: 50 });

      const state = useFormDesignerStore.getState();
      expect(state.fields[0]?.bounds.width).toBe(300);
      expect(state.fields[0]?.bounds.height).toBe(50);
    });

    it('should enforce minimum dimensions when resizing', () => {
      const store = useFormDesignerStore.getState();
      store.setSnapToGrid(false);
      const id = store.addField('textField', { x: 100, y: 100 }, 0);

      store.resizeField(id, { x: 100, y: 100, width: 5, height: 5 });

      const state = useFormDesignerStore.getState();
      expect(state.fields[0]?.bounds.width).toBeGreaterThanOrEqual(20);
      expect(state.fields[0]?.bounds.height).toBeGreaterThanOrEqual(16);
    });
  });

  describe('grid settings', () => {
    it('should enable/disable snap to grid', () => {
      const store = useFormDesignerStore.getState();

      store.setSnapToGrid(false);
      expect(useFormDesignerStore.getState().snapToGrid).toBe(false);

      store.setSnapToGrid(true);
      expect(useFormDesignerStore.getState().snapToGrid).toBe(true);
    });

    it('should set grid size within bounds', () => {
      const store = useFormDesignerStore.getState();

      store.setGridSize(25);
      expect(useFormDesignerStore.getState().gridSize).toBe(25);

      store.setGridSize(1);
      expect(useFormDesignerStore.getState().gridSize).toBe(5);

      store.setGridSize(100);
      expect(useFormDesignerStore.getState().gridSize).toBe(50);
    });
  });

  describe('drag state', () => {
    it('should set dragging state', () => {
      const store = useFormDesignerStore.getState();

      store.setDragging(true, 'textField');

      const state = useFormDesignerStore.getState();
      expect(state.isDragging).toBe(true);
      expect(state.draggedFieldType).toBe('textField');
    });

    it('should clear dragging state', () => {
      const store = useFormDesignerStore.getState();
      store.setDragging(true, 'checkbox');

      store.setDragging(false);

      const state = useFormDesignerStore.getState();
      expect(state.isDragging).toBe(false);
      expect(state.draggedFieldType).toBeNull();
    });
  });

  describe('page filtering', () => {
    it('should get fields by page', () => {
      const store = useFormDesignerStore.getState();
      store.addField('textField', { x: 100, y: 100 }, 0);
      store.addField('checkbox', { x: 100, y: 100 }, 1);
      store.addField('dropdown', { x: 200, y: 100 }, 0);

      const page0Fields = store.getFieldsByPage(0);
      const page1Fields = store.getFieldsByPage(1);

      expect(page0Fields).toHaveLength(2);
      expect(page1Fields).toHaveLength(1);
      expect(page1Fields[0]?.type).toBe('checkbox');
    });
  });

  describe('field types', () => {
    it('should create textField with correct defaults', () => {
      const store = useFormDesignerStore.getState();
      store.addField('textField', { x: 100, y: 100 }, 0);

      const field = useFormDesignerStore.getState().fields[0];
      expect(field?.maxLength).toBe(100);
      expect(field?.placeholder).toBe('');
    });

    it('should create checkbox with correct defaults', () => {
      const store = useFormDesignerStore.getState();
      store.addField('checkbox', { x: 100, y: 100 }, 0);

      const field = useFormDesignerStore.getState().fields[0];
      expect(field?.defaultValue).toBe('off');
    });

    it('should create radioGroup with correct defaults', () => {
      const store = useFormDesignerStore.getState();
      store.addField('radioGroup', { x: 100, y: 100 }, 0);

      const field = useFormDesignerStore.getState().fields[0];
      expect(field?.options).toEqual(['Option 1', 'Option 2']);
      expect(field?.groupName).toBe('radioGroup1');
    });

    it('should create dropdown with correct defaults', () => {
      const store = useFormDesignerStore.getState();
      store.addField('dropdown', { x: 100, y: 100 }, 0);

      const field = useFormDesignerStore.getState().fields[0];
      expect(field?.options).toHaveLength(3);
    });

    it('should create datePicker with correct defaults', () => {
      const store = useFormDesignerStore.getState();
      store.addField('datePicker', { x: 100, y: 100 }, 0);

      const field = useFormDesignerStore.getState().fields[0];
      expect(field?.dateFormat).toBe('MM/DD/YYYY');
    });

    it('should create button with correct defaults', () => {
      const store = useFormDesignerStore.getState();
      store.addField('button', { x: 100, y: 100 }, 0);

      const field = useFormDesignerStore.getState().fields[0];
      expect(field?.buttonAction).toBe('submit');
      expect(field?.defaultValue).toBe('Submit');
    });
  });

  describe('clear and import', () => {
    it('should clear all fields', () => {
      const store = useFormDesignerStore.getState();
      store.addField('textField', { x: 100, y: 100 }, 0);
      store.addField('checkbox', { x: 200, y: 100 }, 0);

      store.clearAllFields();

      const state = useFormDesignerStore.getState();
      expect(state.fields).toHaveLength(0);
      expect(state.clipboard).toBeNull();
    });

    it('should import fields', () => {
      const store = useFormDesignerStore.getState();
      store.addField('textField', { x: 100, y: 100 }, 0);

      const importedFields = [
        {
          id: 'imported1',
          type: 'checkbox' as const,
          name: 'imported',
          pageIndex: 0,
          bounds: { x: 200, y: 200, width: 16, height: 16 },
          tooltip: '',
          required: false,
          readOnly: false,
          defaultValue: 'off',
          appearance: {
            borderColor: '#000000',
            borderWidth: 1,
            backgroundColor: '#ffffff',
            fontFamily: 'Helvetica',
            fontSize: 12,
            fontColor: '#000000',
            textAlign: 'left' as const,
          },
        },
      ];

      store.importFields(importedFields);

      const state = useFormDesignerStore.getState();
      expect(state.fields).toHaveLength(2);
      expect(state.fields[1]?.id).toBe('imported1');
    });
  });
});
