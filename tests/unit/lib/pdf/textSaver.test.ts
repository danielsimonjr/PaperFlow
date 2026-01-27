import { describe, it, expect, vi } from 'vitest';
import {
  exportTextBoxes,
  importTextBoxes,
} from '@lib/pdf/textSaver';
import type { TextBox } from '@/types/text';

// Note: saveTextBoxesToPdf requires actual PDF bytes, so we test
// the helper functions that don't need PDF.js

describe('textSaver', () => {
  const createMockTextBox = (overrides: Partial<TextBox> = {}): TextBox => ({
    id: 'test-id',
    pageIndex: 0,
    bounds: { x: 100, y: 200, width: 150, height: 50 },
    content: 'Test content',
    fontFamily: 'Arial',
    fontSize: 12,
    fontWeight: 'normal',
    fontStyle: 'normal',
    textDecoration: 'none',
    color: '#000000',
    alignment: 'left',
    lineSpacing: 1,
    rotation: 0,
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
    ...overrides,
  });

  describe('exportTextBoxes', () => {
    it('should export text boxes as JSON', () => {
      const textBoxes = [createMockTextBox()];

      const json = exportTextBoxes(textBoxes);
      const parsed = JSON.parse(json);

      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed).toHaveLength(1);
      expect(parsed[0].id).toBe('test-id');
      expect(parsed[0].content).toBe('Test content');
    });

    it('should convert dates to ISO strings', () => {
      const textBoxes = [createMockTextBox()];

      const json = exportTextBoxes(textBoxes);
      const parsed = JSON.parse(json);

      expect(parsed[0].createdAt).toBe('2024-01-01T00:00:00.000Z');
      expect(parsed[0].updatedAt).toBe('2024-01-01T00:00:00.000Z');
    });

    it('should export empty array', () => {
      const json = exportTextBoxes([]);
      const parsed = JSON.parse(json);

      expect(parsed).toEqual([]);
    });

    it('should export multiple text boxes', () => {
      const textBoxes = [
        createMockTextBox({ id: 'tb-1', content: 'First' }),
        createMockTextBox({ id: 'tb-2', content: 'Second' }),
        createMockTextBox({ id: 'tb-3', content: 'Third' }),
      ];

      const json = exportTextBoxes(textBoxes);
      const parsed = JSON.parse(json);

      expect(parsed).toHaveLength(3);
      expect(parsed[0].content).toBe('First');
      expect(parsed[1].content).toBe('Second');
      expect(parsed[2].content).toBe('Third');
    });

    it('should preserve all properties', () => {
      const textBox = createMockTextBox({
        fontFamily: 'Georgia',
        fontSize: 16,
        fontWeight: 'bold',
        fontStyle: 'italic',
        textDecoration: 'underline',
        color: '#FF0000',
        alignment: 'center',
        lineSpacing: 1.5,
        rotation: 45,
      });

      const json = exportTextBoxes([textBox]);
      const parsed = JSON.parse(json);

      expect(parsed[0].fontFamily).toBe('Georgia');
      expect(parsed[0].fontSize).toBe(16);
      expect(parsed[0].fontWeight).toBe('bold');
      expect(parsed[0].fontStyle).toBe('italic');
      expect(parsed[0].textDecoration).toBe('underline');
      expect(parsed[0].color).toBe('#FF0000');
      expect(parsed[0].alignment).toBe('center');
      expect(parsed[0].lineSpacing).toBe(1.5);
      expect(parsed[0].rotation).toBe(45);
    });
  });

  describe('importTextBoxes', () => {
    it('should import text boxes from JSON', () => {
      const json = JSON.stringify([
        {
          id: 'imported-1',
          pageIndex: 0,
          bounds: { x: 100, y: 200, width: 150, height: 50 },
          content: 'Imported text',
          fontFamily: 'Arial',
          fontSize: 12,
          fontWeight: 'normal',
          fontStyle: 'normal',
          textDecoration: 'none',
          color: '#000000',
          alignment: 'left',
          lineSpacing: 1,
          rotation: 0,
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        },
      ]);

      const textBoxes = importTextBoxes(json);

      expect(textBoxes).toHaveLength(1);
      expect(textBoxes[0].id).toBe('imported-1');
      expect(textBoxes[0].content).toBe('Imported text');
    });

    it('should convert date strings to Date objects', () => {
      const json = JSON.stringify([
        {
          id: 'test',
          pageIndex: 0,
          bounds: { x: 0, y: 0, width: 100, height: 50 },
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
          createdAt: '2024-06-15T12:30:00.000Z',
          updatedAt: '2024-06-15T14:45:00.000Z',
        },
      ]);

      const textBoxes = importTextBoxes(json);

      expect(textBoxes[0].createdAt).toBeInstanceOf(Date);
      expect(textBoxes[0].updatedAt).toBeInstanceOf(Date);
      expect(textBoxes[0].createdAt.toISOString()).toBe('2024-06-15T12:30:00.000Z');
    });

    it('should return empty array for invalid JSON', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const textBoxes = importTextBoxes('invalid json');

      expect(textBoxes).toEqual([]);
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it('should import empty array', () => {
      const textBoxes = importTextBoxes('[]');
      expect(textBoxes).toEqual([]);
    });

    it('should import multiple text boxes', () => {
      const json = JSON.stringify([
        {
          id: 'tb-1',
          pageIndex: 0,
          bounds: { x: 0, y: 0, width: 100, height: 50 },
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
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        },
        {
          id: 'tb-2',
          pageIndex: 1,
          bounds: { x: 50, y: 100, width: 200, height: 75 },
          content: 'Second',
          fontFamily: 'Georgia',
          fontSize: 14,
          fontWeight: 'bold',
          fontStyle: 'normal',
          textDecoration: 'none',
          color: '#FF0000',
          alignment: 'center',
          lineSpacing: 1.5,
          rotation: 0,
          createdAt: '2024-01-02T00:00:00.000Z',
          updatedAt: '2024-01-02T00:00:00.000Z',
        },
      ]);

      const textBoxes = importTextBoxes(json);

      expect(textBoxes).toHaveLength(2);
      expect(textBoxes[0].content).toBe('First');
      expect(textBoxes[1].content).toBe('Second');
      expect(textBoxes[1].fontFamily).toBe('Georgia');
    });
  });

  describe('roundtrip', () => {
    it('should preserve data through export/import cycle', () => {
      const original = [
        createMockTextBox({
          id: 'roundtrip-1',
          content: 'Test roundtrip',
          fontFamily: 'Georgia',
          fontSize: 18,
          fontWeight: 'bold',
          color: '#0000FF',
        }),
      ];

      const json = exportTextBoxes(original);
      const imported = importTextBoxes(json);

      expect(imported[0].id).toBe(original[0].id);
      expect(imported[0].content).toBe(original[0].content);
      expect(imported[0].fontFamily).toBe(original[0].fontFamily);
      expect(imported[0].fontSize).toBe(original[0].fontSize);
      expect(imported[0].fontWeight).toBe(original[0].fontWeight);
      expect(imported[0].color).toBe(original[0].color);
      expect(imported[0].bounds).toEqual(original[0].bounds);
    });
  });
});
