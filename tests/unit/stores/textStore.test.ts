import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useTextStore } from '@stores/textStore';

// Mock history store
vi.mock('@stores/historyStore', () => ({
  useHistoryStore: {
    getState: vi.fn(() => ({
      push: vi.fn(),
    })),
  },
}));

describe('textStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    useTextStore.setState({
      textBoxes: [],
      selectedId: null,
      activeTool: null,
      editingId: null,
      defaultProperties: {
        fontFamily: 'Arial',
        fontSize: 12,
        fontWeight: 'normal',
        fontStyle: 'normal',
        textDecoration: 'none',
        color: '#000000',
        alignment: 'left',
        lineSpacing: 1,
      },
    });
  });

  describe('initial state', () => {
    it('should have empty text boxes', () => {
      const state = useTextStore.getState();
      expect(state.textBoxes).toEqual([]);
      expect(state.selectedId).toBeNull();
      expect(state.activeTool).toBeNull();
    });

    it('should have default properties', () => {
      const state = useTextStore.getState();
      expect(state.defaultProperties.fontFamily).toBe('Arial');
      expect(state.defaultProperties.fontSize).toBe(12);
      expect(state.defaultProperties.color).toBe('#000000');
    });
  });

  describe('addTextBox', () => {
    it('should add text box with generated id and timestamps', () => {
      const textBoxData = {
        pageIndex: 0,
        bounds: { x: 100, y: 200, width: 150, height: 50 },
        content: 'Test text',
        fontFamily: 'Arial',
        fontSize: 12,
        fontWeight: 'normal' as const,
        fontStyle: 'normal' as const,
        textDecoration: 'none' as const,
        color: '#000000',
        alignment: 'left' as const,
        lineSpacing: 1,
        rotation: 0,
      };

      const id = useTextStore.getState().addTextBox(textBoxData);

      const state = useTextStore.getState();
      expect(state.textBoxes).toHaveLength(1);
      expect(state.textBoxes[0]?.id).toBe(id);
      expect(state.textBoxes[0]?.content).toBe('Test text');
      expect(state.textBoxes[0]?.createdAt).toBeInstanceOf(Date);
      expect(state.textBoxes[0]?.updatedAt).toBeInstanceOf(Date);
    });

    it('should select newly added text box', () => {
      const id = useTextStore.getState().addTextBox({
        pageIndex: 0,
        bounds: { x: 100, y: 200, width: 150, height: 50 },
        content: 'Test',
        fontFamily: 'Arial',
        fontSize: 12,
        fontWeight: 'normal',
        fontStyle: 'normal',
        textDecoration: 'none',
        color: '#000000',
        alignment: 'left',
        lineSpacing: 1,
        rotation: 0,
      });

      expect(useTextStore.getState().selectedId).toBe(id);
    });

    it('should add multiple text boxes', () => {
      useTextStore.getState().addTextBox({
        pageIndex: 0,
        bounds: { x: 100, y: 200, width: 150, height: 50 },
        content: 'First',
        fontFamily: 'Arial',
        fontSize: 12,
        fontWeight: 'normal',
        fontStyle: 'normal',
        textDecoration: 'none',
        color: '#000000',
        alignment: 'left',
        lineSpacing: 1,
        rotation: 0,
      });

      useTextStore.getState().addTextBox({
        pageIndex: 1,
        bounds: { x: 200, y: 300, width: 150, height: 50 },
        content: 'Second',
        fontFamily: 'Times New Roman',
        fontSize: 14,
        fontWeight: 'bold',
        fontStyle: 'italic',
        textDecoration: 'underline',
        color: '#FF0000',
        alignment: 'center',
        lineSpacing: 1.5,
        rotation: 0,
      });

      expect(useTextStore.getState().textBoxes).toHaveLength(2);
    });
  });

  describe('updateTextBox', () => {
    it('should update text box content', () => {
      const id = useTextStore.getState().addTextBox({
        pageIndex: 0,
        bounds: { x: 100, y: 200, width: 150, height: 50 },
        content: 'Original',
        fontFamily: 'Arial',
        fontSize: 12,
        fontWeight: 'normal',
        fontStyle: 'normal',
        textDecoration: 'none',
        color: '#000000',
        alignment: 'left',
        lineSpacing: 1,
        rotation: 0,
      });

      useTextStore.getState().updateTextBox(id, { content: 'Updated' });

      const state = useTextStore.getState();
      expect(state.textBoxes[0]?.content).toBe('Updated');
    });

    it('should update multiple properties', () => {
      const id = useTextStore.getState().addTextBox({
        pageIndex: 0,
        bounds: { x: 100, y: 200, width: 150, height: 50 },
        content: 'Test',
        fontFamily: 'Arial',
        fontSize: 12,
        fontWeight: 'normal',
        fontStyle: 'normal',
        textDecoration: 'none',
        color: '#000000',
        alignment: 'left',
        lineSpacing: 1,
        rotation: 0,
      });

      useTextStore.getState().updateTextBox(id, {
        fontFamily: 'Georgia',
        fontSize: 16,
        fontWeight: 'bold',
        color: '#FF0000',
      });

      const textBox = useTextStore.getState().textBoxes[0];
      expect(textBox?.fontFamily).toBe('Georgia');
      expect(textBox?.fontSize).toBe(16);
      expect(textBox?.fontWeight).toBe('bold');
      expect(textBox?.color).toBe('#FF0000');
    });

    it('should update updatedAt timestamp', () => {
      const id = useTextStore.getState().addTextBox({
        pageIndex: 0,
        bounds: { x: 100, y: 200, width: 150, height: 50 },
        content: 'Test',
        fontFamily: 'Arial',
        fontSize: 12,
        fontWeight: 'normal',
        fontStyle: 'normal',
        textDecoration: 'none',
        color: '#000000',
        alignment: 'left',
        lineSpacing: 1,
        rotation: 0,
      });

      const originalDate = useTextStore.getState().textBoxes[0]?.updatedAt;

      // Small delay
      useTextStore.getState().updateTextBox(id, { content: 'Updated' });

      const newDate = useTextStore.getState().textBoxes[0]?.updatedAt;
      expect(newDate!.getTime()).toBeGreaterThanOrEqual(originalDate!.getTime());
    });
  });

  describe('deleteTextBox', () => {
    it('should remove text box by id', () => {
      const id = useTextStore.getState().addTextBox({
        pageIndex: 0,
        bounds: { x: 100, y: 200, width: 150, height: 50 },
        content: 'Test',
        fontFamily: 'Arial',
        fontSize: 12,
        fontWeight: 'normal',
        fontStyle: 'normal',
        textDecoration: 'none',
        color: '#000000',
        alignment: 'left',
        lineSpacing: 1,
        rotation: 0,
      });

      useTextStore.getState().deleteTextBox(id);

      expect(useTextStore.getState().textBoxes).toHaveLength(0);
    });

    it('should clear selection if deleted text box was selected', () => {
      const id = useTextStore.getState().addTextBox({
        pageIndex: 0,
        bounds: { x: 100, y: 200, width: 150, height: 50 },
        content: 'Test',
        fontFamily: 'Arial',
        fontSize: 12,
        fontWeight: 'normal',
        fontStyle: 'normal',
        textDecoration: 'none',
        color: '#000000',
        alignment: 'left',
        lineSpacing: 1,
        rotation: 0,
      });

      expect(useTextStore.getState().selectedId).toBe(id);

      useTextStore.getState().deleteTextBox(id);

      expect(useTextStore.getState().selectedId).toBeNull();
    });

    it('should clear editing if deleted text box was being edited', () => {
      const id = useTextStore.getState().addTextBox({
        pageIndex: 0,
        bounds: { x: 100, y: 200, width: 150, height: 50 },
        content: 'Test',
        fontFamily: 'Arial',
        fontSize: 12,
        fontWeight: 'normal',
        fontStyle: 'normal',
        textDecoration: 'none',
        color: '#000000',
        alignment: 'left',
        lineSpacing: 1,
        rotation: 0,
      });

      useTextStore.getState().setEditingId(id);
      expect(useTextStore.getState().editingId).toBe(id);

      useTextStore.getState().deleteTextBox(id);

      expect(useTextStore.getState().editingId).toBeNull();
    });
  });

  describe('selectTextBox', () => {
    it('should select text box by id', () => {
      const id = useTextStore.getState().addTextBox({
        pageIndex: 0,
        bounds: { x: 100, y: 200, width: 150, height: 50 },
        content: 'Test',
        fontFamily: 'Arial',
        fontSize: 12,
        fontWeight: 'normal',
        fontStyle: 'normal',
        textDecoration: 'none',
        color: '#000000',
        alignment: 'left',
        lineSpacing: 1,
        rotation: 0,
      });

      useTextStore.getState().selectTextBox(null);
      useTextStore.getState().selectTextBox(id);

      expect(useTextStore.getState().selectedId).toBe(id);
    });

    it('should deselect when passing null', () => {
      const id = useTextStore.getState().addTextBox({
        pageIndex: 0,
        bounds: { x: 100, y: 200, width: 150, height: 50 },
        content: 'Test',
        fontFamily: 'Arial',
        fontSize: 12,
        fontWeight: 'normal',
        fontStyle: 'normal',
        textDecoration: 'none',
        color: '#000000',
        alignment: 'left',
        lineSpacing: 1,
        rotation: 0,
      });

      useTextStore.getState().selectTextBox(id);
      useTextStore.getState().selectTextBox(null);

      expect(useTextStore.getState().selectedId).toBeNull();
    });
  });

  describe('setActiveTool', () => {
    it('should set active tool', () => {
      useTextStore.getState().setActiveTool('textbox');
      expect(useTextStore.getState().activeTool).toBe('textbox');

      useTextStore.getState().setActiveTool('select');
      expect(useTextStore.getState().activeTool).toBe('select');

      useTextStore.getState().setActiveTool(null);
      expect(useTextStore.getState().activeTool).toBeNull();
    });
  });

  describe('setDefaultProperties', () => {
    it('should update default properties', () => {
      useTextStore.getState().setDefaultProperties({
        fontFamily: 'Georgia',
        fontSize: 16,
        color: '#FF0000',
      });

      const state = useTextStore.getState();
      expect(state.defaultProperties.fontFamily).toBe('Georgia');
      expect(state.defaultProperties.fontSize).toBe(16);
      expect(state.defaultProperties.color).toBe('#FF0000');
      // Other properties should remain unchanged
      expect(state.defaultProperties.fontWeight).toBe('normal');
    });
  });

  describe('getPageTextBoxes', () => {
    it('should return text boxes for specific page', () => {
      useTextStore.getState().addTextBox({
        pageIndex: 0,
        bounds: { x: 100, y: 200, width: 150, height: 50 },
        content: 'Page 0 - 1',
        fontFamily: 'Arial',
        fontSize: 12,
        fontWeight: 'normal',
        fontStyle: 'normal',
        textDecoration: 'none',
        color: '#000000',
        alignment: 'left',
        lineSpacing: 1,
        rotation: 0,
      });

      useTextStore.getState().addTextBox({
        pageIndex: 1,
        bounds: { x: 200, y: 300, width: 150, height: 50 },
        content: 'Page 1',
        fontFamily: 'Arial',
        fontSize: 12,
        fontWeight: 'normal',
        fontStyle: 'normal',
        textDecoration: 'none',
        color: '#000000',
        alignment: 'left',
        lineSpacing: 1,
        rotation: 0,
      });

      useTextStore.getState().addTextBox({
        pageIndex: 0,
        bounds: { x: 300, y: 400, width: 150, height: 50 },
        content: 'Page 0 - 2',
        fontFamily: 'Arial',
        fontSize: 12,
        fontWeight: 'normal',
        fontStyle: 'normal',
        textDecoration: 'none',
        color: '#000000',
        alignment: 'left',
        lineSpacing: 1,
        rotation: 0,
      });

      const page0TextBoxes = useTextStore.getState().getPageTextBoxes(0);
      const page1TextBoxes = useTextStore.getState().getPageTextBoxes(1);

      expect(page0TextBoxes).toHaveLength(2);
      expect(page1TextBoxes).toHaveLength(1);
    });
  });

  describe('export/import', () => {
    it('should export text boxes as JSON', () => {
      useTextStore.getState().addTextBox({
        pageIndex: 0,
        bounds: { x: 100, y: 200, width: 150, height: 50 },
        content: 'Test',
        fontFamily: 'Arial',
        fontSize: 12,
        fontWeight: 'normal',
        fontStyle: 'normal',
        textDecoration: 'none',
        color: '#000000',
        alignment: 'left',
        lineSpacing: 1,
        rotation: 0,
      });

      const json = useTextStore.getState().exportTextBoxes();
      const parsed = JSON.parse(json);

      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed).toHaveLength(1);
      expect(parsed[0].content).toBe('Test');
    });

    it('should import text boxes from JSON', () => {
      const textBoxesJson = JSON.stringify([
        {
          id: 'test-id-1',
          pageIndex: 0,
          bounds: { x: 100, y: 200, width: 150, height: 50 },
          content: 'Imported',
          fontFamily: 'Arial',
          fontSize: 12,
          fontWeight: 'normal',
          fontStyle: 'normal',
          textDecoration: 'none',
          color: '#000000',
          alignment: 'left',
          lineSpacing: 1,
          rotation: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ]);

      useTextStore.getState().importTextBoxes(textBoxesJson);

      expect(useTextStore.getState().textBoxes).toHaveLength(1);
      expect(useTextStore.getState().textBoxes[0]?.content).toBe('Imported');
    });
  });

  describe('clearTextBoxes', () => {
    it('should remove all text boxes and clear selection', () => {
      const id = useTextStore.getState().addTextBox({
        pageIndex: 0,
        bounds: { x: 100, y: 200, width: 150, height: 50 },
        content: 'Test 1',
        fontFamily: 'Arial',
        fontSize: 12,
        fontWeight: 'normal',
        fontStyle: 'normal',
        textDecoration: 'none',
        color: '#000000',
        alignment: 'left',
        lineSpacing: 1,
        rotation: 0,
      });

      useTextStore.getState().addTextBox({
        pageIndex: 1,
        bounds: { x: 200, y: 300, width: 150, height: 50 },
        content: 'Test 2',
        fontFamily: 'Arial',
        fontSize: 12,
        fontWeight: 'normal',
        fontStyle: 'normal',
        textDecoration: 'none',
        color: '#000000',
        alignment: 'left',
        lineSpacing: 1,
        rotation: 0,
      });

      useTextStore.getState().selectTextBox(id);
      useTextStore.getState().setEditingId(id);

      useTextStore.getState().clearTextBoxes();

      expect(useTextStore.getState().textBoxes).toHaveLength(0);
      expect(useTextStore.getState().selectedId).toBeNull();
      expect(useTextStore.getState().editingId).toBeNull();
    });
  });
});
