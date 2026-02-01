/**
 * Tests for Form Field Calculations
 */

import { describe, it, expect } from 'vitest';
import {
  executeCalculation,
  createSumCalculation,
  createAverageCalculation,
  createMinCalculation,
  createMaxCalculation,
  createProductCalculation,
  createCustomCalculation,
  extractFieldReferences,
  validateFormula,
} from '@/lib/forms/calculations';

describe('Form Calculations', () => {
  describe('executeCalculation', () => {
    it('should calculate sum of fields', () => {
      const definition = createSumCalculation(['field1', 'field2', 'field3']);
      const values = {
        field1: '10',
        field2: '20',
        field3: '30',
      };

      const result = executeCalculation(definition, values);

      expect(result.value).toBe(60);
      expect(result.formattedValue).toBe('60.00');
    });

    it('should calculate average of fields', () => {
      const definition = createAverageCalculation(['field1', 'field2', 'field3']);
      const values = {
        field1: '10',
        field2: '20',
        field3: '30',
      };

      const result = executeCalculation(definition, values);

      expect(result.value).toBe(20);
      expect(result.formattedValue).toBe('20.00');
    });

    it('should calculate minimum value', () => {
      const definition = createMinCalculation(['field1', 'field2', 'field3']);
      const values = {
        field1: '50',
        field2: '10',
        field3: '30',
      };

      const result = executeCalculation(definition, values);

      expect(result.value).toBe(10);
    });

    it('should calculate maximum value', () => {
      const definition = createMaxCalculation(['field1', 'field2', 'field3']);
      const values = {
        field1: '50',
        field2: '10',
        field3: '30',
      };

      const result = executeCalculation(definition, values);

      expect(result.value).toBe(50);
    });

    it('should calculate product of fields', () => {
      const definition = createProductCalculation(['field1', 'field2', 'field3']);
      const values = {
        field1: '2',
        field2: '3',
        field3: '4',
      };

      const result = executeCalculation(definition, values);

      expect(result.value).toBe(24);
    });

    it('should handle empty values', () => {
      const definition = createSumCalculation(['field1', 'field2']);
      const values = {
        field1: '',
        field2: '',
      };

      const result = executeCalculation(definition, values);

      expect(result.value).toBe(0);
    });

    it('should handle currency formatted values', () => {
      const definition = createSumCalculation(['price', 'tax']);
      const values = {
        price: '$100.00',
        tax: '$10.00',
      };

      const result = executeCalculation(definition, values);

      expect(result.value).toBe(110);
    });

    it('should apply prefix and suffix', () => {
      const definition = createSumCalculation(['amount'], {
        prefix: '$',
        suffix: ' USD',
      });
      const values = {
        amount: '100',
      };

      const result = executeCalculation(definition, values);

      expect(result.formattedValue).toBe('$100.00 USD');
    });

    it('should respect decimal places', () => {
      const definition = createAverageCalculation(['a', 'b'], {
        decimalPlaces: 4,
      });
      const values = {
        a: '1',
        b: '3',
      };

      const result = executeCalculation(definition, values);

      expect(result.formattedValue).toBe('2.0000');
    });
  });

  describe('custom calculations', () => {
    it('should execute simple custom formula', () => {
      const definition = createCustomCalculation('{a} + {b} * 2', ['a', 'b']);
      const values = {
        a: '10',
        b: '5',
      };

      const result = executeCalculation(definition, values);

      expect(result.value).toBe(20); // 10 + 5 * 2 = 20
    });

    it('should execute formula with parentheses', () => {
      const definition = createCustomCalculation('({a} + {b}) * 2', ['a', 'b']);
      const values = {
        a: '10',
        b: '5',
      };

      const result = executeCalculation(definition, values);

      expect(result.value).toBe(30); // (10 + 5) * 2 = 30
    });

    it('should handle missing field references as zero', () => {
      const definition = createCustomCalculation('{a} + {b}', ['a', 'b']);
      const values = {
        a: '10',
      };

      const result = executeCalculation(definition, values);

      expect(result.value).toBe(10); // 10 + 0
    });

    it('should return error for invalid formula', () => {
      const definition = createCustomCalculation('{a} + invalid()', ['a']);
      const values = {
        a: '10',
      };

      const result = executeCalculation(definition, values);

      expect(result.error).toBeDefined();
    });
  });

  describe('extractFieldReferences', () => {
    it('should extract field references from formula', () => {
      const formula = '{field1} + {field2} - {field3}';
      const refs = extractFieldReferences(formula);

      expect(refs).toContain('field1');
      expect(refs).toContain('field2');
      expect(refs).toContain('field3');
      expect(refs).toHaveLength(3);
    });

    it('should not duplicate references', () => {
      const formula = '{field1} + {field1} + {field2}';
      const refs = extractFieldReferences(formula);

      expect(refs).toHaveLength(2);
    });

    it('should return empty array for formula without references', () => {
      const formula = '100 + 200';
      const refs = extractFieldReferences(formula);

      expect(refs).toHaveLength(0);
    });
  });

  describe('validateFormula', () => {
    it('should validate correct formula', () => {
      const result = validateFormula('{a} + {b} * 2');
      expect(result.isValid).toBe(true);
    });

    it('should reject formula with invalid characters', () => {
      const result = validateFormula('{a} && {b}');
      expect(result.isValid).toBe(false);
    });

    it('should reject formula with syntax errors', () => {
      // Note: '{a} + + {b}' is actually valid JavaScript (unary plus)
      // Test with actually invalid syntax instead
      const result = validateFormula('{a} +* {b}');
      expect(result.isValid).toBe(false);
    });

    it('should validate formula with parentheses', () => {
      const result = validateFormula('({a} + {b}) / 2');
      expect(result.isValid).toBe(true);
    });
  });
});
