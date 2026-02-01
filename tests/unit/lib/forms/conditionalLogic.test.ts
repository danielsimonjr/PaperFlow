/**
 * Tests for Form Field Conditional Logic
 */

import { describe, it, expect } from 'vitest';
import {
  evaluateCondition,
  evaluateConditionGroup,
  evaluateRule,
  evaluateAllRules,
  getSourceFields,
  createShowWhenRule,
  createEnableWhenRule,
  createRequireWhenRule,
  type Condition,
  type ConditionGroup,
  type ConditionalRule,
} from '@/lib/forms/conditionalLogic';

describe('Conditional Logic', () => {
  describe('evaluateCondition', () => {
    it('should evaluate equals condition', () => {
      const condition: Condition = {
        fieldId: 'country',
        operator: 'equals',
        value: 'USA',
      };

      expect(evaluateCondition(condition, { country: 'USA' })).toBe(true);
      expect(evaluateCondition(condition, { country: 'Canada' })).toBe(false);
    });

    it('should evaluate notEquals condition', () => {
      const condition: Condition = {
        fieldId: 'country',
        operator: 'notEquals',
        value: 'USA',
      };

      expect(evaluateCondition(condition, { country: 'Canada' })).toBe(true);
      expect(evaluateCondition(condition, { country: 'USA' })).toBe(false);
    });

    it('should evaluate contains condition', () => {
      const condition: Condition = {
        fieldId: 'email',
        operator: 'contains',
        value: '@',
      };

      expect(evaluateCondition(condition, { email: 'test@example.com' })).toBe(true);
      expect(evaluateCondition(condition, { email: 'invalid' })).toBe(false);
    });

    it('should evaluate contains case-insensitively', () => {
      const condition: Condition = {
        fieldId: 'name',
        operator: 'contains',
        value: 'john',
      };

      expect(evaluateCondition(condition, { name: 'John Doe' })).toBe(true);
    });

    it('should evaluate notContains condition', () => {
      const condition: Condition = {
        fieldId: 'description',
        operator: 'notContains',
        value: 'secret',
      };

      expect(evaluateCondition(condition, { description: 'Public info' })).toBe(true);
      expect(evaluateCondition(condition, { description: 'This is secret' })).toBe(false);
    });

    it('should evaluate startsWith condition', () => {
      const condition: Condition = {
        fieldId: 'phone',
        operator: 'startsWith',
        value: '+1',
      };

      expect(evaluateCondition(condition, { phone: '+1555123456' })).toBe(true);
      expect(evaluateCondition(condition, { phone: '+44123456' })).toBe(false);
    });

    it('should evaluate endsWith condition', () => {
      const condition: Condition = {
        fieldId: 'email',
        operator: 'endsWith',
        value: '.com',
      };

      expect(evaluateCondition(condition, { email: 'test@example.com' })).toBe(true);
      expect(evaluateCondition(condition, { email: 'test@example.org' })).toBe(false);
    });

    it('should evaluate isEmpty condition', () => {
      const condition: Condition = {
        fieldId: 'notes',
        operator: 'isEmpty',
        value: '',
      };

      expect(evaluateCondition(condition, { notes: '' })).toBe(true);
      expect(evaluateCondition(condition, { notes: '   ' })).toBe(true);
      expect(evaluateCondition(condition, { notes: 'Some text' })).toBe(false);
    });

    it('should evaluate isNotEmpty condition', () => {
      const condition: Condition = {
        fieldId: 'notes',
        operator: 'isNotEmpty',
        value: '',
      };

      expect(evaluateCondition(condition, { notes: 'Some text' })).toBe(true);
      expect(evaluateCondition(condition, { notes: '' })).toBe(false);
    });

    it('should evaluate greaterThan condition', () => {
      const condition: Condition = {
        fieldId: 'age',
        operator: 'greaterThan',
        value: '18',
      };

      expect(evaluateCondition(condition, { age: '21' })).toBe(true);
      expect(evaluateCondition(condition, { age: '18' })).toBe(false);
      expect(evaluateCondition(condition, { age: '16' })).toBe(false);
    });

    it('should evaluate lessThan condition', () => {
      const condition: Condition = {
        fieldId: 'amount',
        operator: 'lessThan',
        value: '100',
      };

      expect(evaluateCondition(condition, { amount: '50' })).toBe(true);
      expect(evaluateCondition(condition, { amount: '100' })).toBe(false);
      expect(evaluateCondition(condition, { amount: '150' })).toBe(false);
    });

    it('should evaluate greaterThanOrEqual condition', () => {
      const condition: Condition = {
        fieldId: 'quantity',
        operator: 'greaterThanOrEqual',
        value: '10',
      };

      expect(evaluateCondition(condition, { quantity: '15' })).toBe(true);
      expect(evaluateCondition(condition, { quantity: '10' })).toBe(true);
      expect(evaluateCondition(condition, { quantity: '5' })).toBe(false);
    });

    it('should evaluate lessThanOrEqual condition', () => {
      const condition: Condition = {
        fieldId: 'score',
        operator: 'lessThanOrEqual',
        value: '100',
      };

      expect(evaluateCondition(condition, { score: '80' })).toBe(true);
      expect(evaluateCondition(condition, { score: '100' })).toBe(true);
      expect(evaluateCondition(condition, { score: '105' })).toBe(false);
    });

    it('should handle missing field values', () => {
      const condition: Condition = {
        fieldId: 'missing',
        operator: 'equals',
        value: 'test',
      };

      expect(evaluateCondition(condition, {})).toBe(false);
    });
  });

  describe('evaluateConditionGroup', () => {
    it('should evaluate AND group', () => {
      const group: ConditionGroup = {
        logicalOperator: 'and',
        conditions: [
          { fieldId: 'a', operator: 'equals', value: '1' },
          { fieldId: 'b', operator: 'equals', value: '2' },
        ],
      };

      expect(evaluateConditionGroup(group, { a: '1', b: '2' })).toBe(true);
      expect(evaluateConditionGroup(group, { a: '1', b: '3' })).toBe(false);
      expect(evaluateConditionGroup(group, { a: '0', b: '2' })).toBe(false);
    });

    it('should evaluate OR group', () => {
      const group: ConditionGroup = {
        logicalOperator: 'or',
        conditions: [
          { fieldId: 'a', operator: 'equals', value: '1' },
          { fieldId: 'b', operator: 'equals', value: '2' },
        ],
      };

      expect(evaluateConditionGroup(group, { a: '1', b: '0' })).toBe(true);
      expect(evaluateConditionGroup(group, { a: '0', b: '2' })).toBe(true);
      expect(evaluateConditionGroup(group, { a: '0', b: '0' })).toBe(false);
    });

    it('should evaluate nested groups', () => {
      const group: ConditionGroup = {
        logicalOperator: 'and',
        conditions: [
          { fieldId: 'type', operator: 'equals', value: 'premium' },
          {
            logicalOperator: 'or',
            conditions: [
              { fieldId: 'years', operator: 'greaterThan', value: '5' },
              { fieldId: 'referral', operator: 'equals', value: 'yes' },
            ],
          },
        ],
      };

      expect(evaluateConditionGroup(group, { type: 'premium', years: '10', referral: 'no' })).toBe(true);
      expect(evaluateConditionGroup(group, { type: 'premium', years: '2', referral: 'yes' })).toBe(true);
      expect(evaluateConditionGroup(group, { type: 'basic', years: '10', referral: 'yes' })).toBe(false);
    });
  });

  describe('evaluateRule', () => {
    it('should return show action when condition is met', () => {
      const rule = createShowWhenRule('rule1', 'stateField', 'countryField', 'equals', 'USA');
      const values = { countryField: 'USA' };

      const result = evaluateRule(rule, values);

      expect(result.conditionMet).toBe(true);
      expect(result.stateChanges).toContainEqual({
        fieldId: 'stateField',
        property: 'visible',
        value: true,
      });
    });

    it('should return hide action when condition is not met', () => {
      const rule = createShowWhenRule('rule1', 'stateField', 'countryField', 'equals', 'USA');
      const values = { countryField: 'Canada' };

      const result = evaluateRule(rule, values);

      expect(result.conditionMet).toBe(false);
      expect(result.stateChanges).toContainEqual({
        fieldId: 'stateField',
        property: 'visible',
        value: false,
      });
    });

    it('should handle enable/disable rule', () => {
      const rule = createEnableWhenRule('rule2', 'submitBtn', 'termsAccepted', 'equals', 'yes');

      const enableResult = evaluateRule(rule, { termsAccepted: 'yes' });
      expect(enableResult.stateChanges).toContainEqual({
        fieldId: 'submitBtn',
        property: 'enabled',
        value: true,
      });

      const disableResult = evaluateRule(rule, { termsAccepted: 'no' });
      expect(disableResult.stateChanges).toContainEqual({
        fieldId: 'submitBtn',
        property: 'enabled',
        value: false,
      });
    });

    it('should handle require/unrequire rule', () => {
      const rule = createRequireWhenRule('rule3', 'licenseNumber', 'hasLicense', 'equals', 'yes');

      const requireResult = evaluateRule(rule, { hasLicense: 'yes' });
      expect(requireResult.stateChanges).toContainEqual({
        fieldId: 'licenseNumber',
        property: 'required',
        value: true,
      });
    });
  });

  describe('evaluateAllRules', () => {
    it('should evaluate multiple rules', () => {
      const rules: ConditionalRule[] = [
        createShowWhenRule('r1', 'field1', 'trigger', 'equals', 'show'),
        createEnableWhenRule('r2', 'field2', 'trigger', 'equals', 'show'),
      ];

      const changes = evaluateAllRules(rules, { trigger: 'show' });

      expect(changes).toHaveLength(2);
      expect(changes).toContainEqual({
        fieldId: 'field1',
        property: 'visible',
        value: true,
      });
      expect(changes).toContainEqual({
        fieldId: 'field2',
        property: 'enabled',
        value: true,
      });
    });

    it('should filter by trigger type', () => {
      const rules: ConditionalRule[] = [
        { ...createShowWhenRule('r1', 'f1', 's', 'equals', 'x'), trigger: 'onChange' },
        { ...createShowWhenRule('r2', 'f2', 's', 'equals', 'x'), trigger: 'onLoad' },
      ];

      const changes = evaluateAllRules(rules, { s: 'x' }, 'onChange');

      expect(changes).toHaveLength(1);
      expect(changes[0]?.fieldId).toBe('f1');
    });

    it('should deduplicate conflicting changes (last wins)', () => {
      const rules: ConditionalRule[] = [
        createShowWhenRule('r1', 'field', 'a', 'equals', 'show'),
        createShowWhenRule('r2', 'field', 'b', 'equals', 'hide'),
      ];

      // First rule matches (a=show), second rule doesn't match (b != 'hide')
      // Second rule's else action (show: false) should override first rule's show: true
      const changes = evaluateAllRules(rules, { a: 'show', b: 'not-hide' });

      const visibleChange = changes.find((c) => c.property === 'visible');
      expect(visibleChange?.value).toBe(false);
    });
  });

  describe('getSourceFields', () => {
    it('should extract source fields from rule', () => {
      const rule: ConditionalRule = {
        id: 'r1',
        targetFieldId: 'target',
        trigger: 'onChange',
        conditionGroup: {
          logicalOperator: 'and',
          conditions: [
            { fieldId: 'source1', operator: 'equals', value: 'x' },
            { fieldId: 'source2', operator: 'isNotEmpty', value: '' },
          ],
        },
        actionsIfTrue: [{ action: 'show' }],
      };

      const fields = getSourceFields(rule);

      expect(fields).toContain('source1');
      expect(fields).toContain('source2');
      expect(fields).toHaveLength(2);
    });

    it('should extract fields from nested groups', () => {
      const rule: ConditionalRule = {
        id: 'r1',
        targetFieldId: 'target',
        trigger: 'onChange',
        conditionGroup: {
          logicalOperator: 'or',
          conditions: [
            { fieldId: 'a', operator: 'equals', value: 'x' },
            {
              logicalOperator: 'and',
              conditions: [
                { fieldId: 'b', operator: 'equals', value: 'y' },
                { fieldId: 'c', operator: 'equals', value: 'z' },
              ],
            },
          ],
        },
        actionsIfTrue: [{ action: 'show' }],
      };

      const fields = getSourceFields(rule);

      expect(fields).toContain('a');
      expect(fields).toContain('b');
      expect(fields).toContain('c');
      expect(fields).toHaveLength(3);
    });
  });
});
