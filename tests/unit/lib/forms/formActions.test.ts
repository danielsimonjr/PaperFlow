/**
 * Tests for Form Actions Module
 */

import { describe, it, expect } from 'vitest';
import {
  createFormAction,
  createShowFieldAction,
  createHideFieldAction,
  createEnableFieldAction,
  createDisableFieldAction,
  createSetValueAction,
  createNavigateToPageAction,
  createOpenURLAction,
  createRunScriptAction,
  executeAction,
  executeScript,
  validateScriptSyntax,
  getActionsForTrigger,
  executeActionsForTrigger,
  mergeActionResults,
  SCRIPT_TEMPLATES,
} from '@/lib/forms/formActions';
import type { FormAction, ActionContext, ActionResult } from '@/lib/forms/formActions';

describe('Form Actions Module', () => {
  const createTestContext = (): ActionContext => ({
    fieldId: 'testField',
    fieldValue: 'test value',
    allFieldValues: {
      testField: 'test value',
      field1: 100,
      field2: 200,
      total: 0,
    },
    pageIndex: 0,
    documentName: 'test.pdf',
  });

  describe('createFormAction', () => {
    it('should create a form action with defaults', () => {
      const action = createFormAction('onClick', 'showField');

      expect(action.id).toBeDefined();
      expect(action.trigger).toBe('onClick');
      expect(action.type).toBe('showField');
      expect(action.enabled).toBe(true);
    });

    it('should create action with custom options', () => {
      const action = createFormAction('onChange', 'setFieldValue', {
        targetFieldId: 'target1',
        value: 'new value',
      });

      expect(action.targetFieldId).toBe('target1');
      expect(action.value).toBe('new value');
    });

    it('should generate unique IDs', () => {
      const action1 = createFormAction('onClick', 'showField');
      const action2 = createFormAction('onClick', 'showField');

      expect(action1.id).not.toBe(action2.id);
    });
  });

  describe('helper creation functions', () => {
    it('should create showField action', () => {
      const action = createShowFieldAction('onClick', 'field1');

      expect(action.type).toBe('showField');
      expect(action.trigger).toBe('onClick');
      expect(action.targetFieldId).toBe('field1');
    });

    it('should create hideField action', () => {
      const action = createHideFieldAction('onClick', 'field1');

      expect(action.type).toBe('hideField');
      expect(action.targetFieldId).toBe('field1');
    });

    it('should create enableField action', () => {
      const action = createEnableFieldAction('onChange', 'field1');

      expect(action.type).toBe('enableField');
      expect(action.trigger).toBe('onChange');
    });

    it('should create disableField action', () => {
      const action = createDisableFieldAction('onChange', 'field1');

      expect(action.type).toBe('disableField');
    });

    it('should create setValue action', () => {
      const action = createSetValueAction('onBlur', 'field1', 'test value');

      expect(action.type).toBe('setFieldValue');
      expect(action.value).toBe('test value');
    });

    it('should create navigateToPage action', () => {
      const action = createNavigateToPageAction('onClick', 5);

      expect(action.type).toBe('navigateToPage');
      expect(action.pageNumber).toBe(5);
    });

    it('should create openURL action', () => {
      const action = createOpenURLAction('onClick', 'https://example.com');

      expect(action.type).toBe('openURL');
      expect(action.url).toBe('https://example.com');
    });

    it('should create runScript action', () => {
      const script = 'getField("total").value = 100;';
      const action = createRunScriptAction('onCalculate', script);

      expect(action.type).toBe('runScript');
      expect(action.script).toBe(script);
    });
  });

  describe('executeAction', () => {
    it('should not execute disabled action', () => {
      const action = createShowFieldAction('onClick', 'field1');
      action.enabled = false;

      const result = executeAction(action, createTestContext());

      expect(result.success).toBe(true);
      expect(result.changes).toBeUndefined();
    });

    it('should execute showField action', () => {
      const action = createShowFieldAction('onClick', 'field1');
      const result = executeAction(action, createTestContext());

      expect(result.success).toBe(true);
      expect(result.changes).toHaveLength(1);
      expect(result.changes![0]).toEqual({
        fieldId: 'field1',
        property: 'visible',
        newValue: true,
      });
    });

    it('should execute hideField action', () => {
      const action = createHideFieldAction('onClick', 'field1');
      const result = executeAction(action, createTestContext());

      expect(result.success).toBe(true);
      expect(result.changes![0].newValue).toBe(false);
    });

    it('should execute enableField action', () => {
      const action = createEnableFieldAction('onClick', 'field1');
      const result = executeAction(action, createTestContext());

      expect(result.changes![0]).toEqual({
        fieldId: 'field1',
        property: 'enabled',
        newValue: true,
      });
    });

    it('should execute disableField action', () => {
      const action = createDisableFieldAction('onClick', 'field1');
      const result = executeAction(action, createTestContext());

      expect(result.changes![0].newValue).toBe(false);
    });

    it('should execute setFieldValue action', () => {
      const action = createSetValueAction('onClick', 'field1', 'new value');
      const result = executeAction(action, createTestContext());

      expect(result.changes![0]).toEqual({
        fieldId: 'field1',
        property: 'value',
        newValue: 'new value',
      });
    });

    it('should execute clearFieldValue action', () => {
      const action = createFormAction('onClick', 'clearFieldValue', {
        targetFieldId: 'field1',
      });
      const result = executeAction(action, createTestContext());

      expect(result.changes![0].newValue).toBe('');
    });

    it('should execute setFieldRequired action', () => {
      const action = createFormAction('onClick', 'setFieldRequired', {
        targetFieldId: 'field1',
        value: true,
      });
      const result = executeAction(action, createTestContext());

      expect(result.changes![0]).toEqual({
        fieldId: 'field1',
        property: 'required',
        newValue: true,
      });
    });

    it('should execute navigateToPage action', () => {
      const action = createNavigateToPageAction('onClick', 5);
      const result = executeAction(action, createTestContext());

      expect(result.success).toBe(true);
      expect(result.navigation).toEqual({ type: 'page', target: 5 });
    });

    it('should execute openURL action', () => {
      const action = createOpenURLAction('onClick', 'https://example.com');
      const result = executeAction(action, createTestContext());

      expect(result.navigation).toEqual({ type: 'url', target: 'https://example.com' });
    });

    it('should execute submitForm action', () => {
      const action = createFormAction('onClick', 'submitForm');
      const result = executeAction(action, createTestContext());

      expect(result.formAction).toBe('submit');
    });

    it('should execute resetForm action', () => {
      const action = createFormAction('onClick', 'resetForm');
      const result = executeAction(action, createTestContext());

      expect(result.formAction).toBe('reset');
    });

    it('should execute printForm action', () => {
      const action = createFormAction('onClick', 'printForm');
      const result = executeAction(action, createTestContext());

      expect(result.formAction).toBe('print');
    });

    it('should handle unknown action type', () => {
      const action = createFormAction('onClick', 'unknownAction' as any);
      const result = executeAction(action, createTestContext());

      expect(result.success).toBe(false);
      expect(result.error).toContain('Unknown action type');
    });
  });

  describe('executeScript', () => {
    it('should execute simple script', () => {
      const script = 'getField("total").value = 300;';
      const context = createTestContext();

      const result = executeScript(script, context);

      expect(result.success).toBe(true);
      expect(result.changes).toHaveLength(1);
      expect(result.changes![0]).toEqual({
        fieldId: 'total',
        property: 'value',
        newValue: 300,
      });
    });

    it('should handle script visibility changes', () => {
      const script = 'getField("field1").visible = false;';
      const result = executeScript(script, createTestContext());

      expect(result.success).toBe(true);
      expect(result.changes![0]).toEqual({
        fieldId: 'field1',
        property: 'visible',
        newValue: false,
      });
    });

    it('should handle script enabled changes', () => {
      const script = 'getField("field1").enabled = false;';
      const result = executeScript(script, createTestContext());

      expect(result.changes![0]).toEqual({
        fieldId: 'field1',
        property: 'enabled',
        newValue: false,
      });
    });

    it('should handle script errors gracefully', () => {
      const script = 'throw new Error("Test error");';
      const result = executeScript(script, createTestContext());

      expect(result.success).toBe(false);
      expect(result.error).toContain('Script error');
    });

    it('should handle syntax errors', () => {
      const script = 'this is not valid javascript {{{{';
      const result = executeScript(script, createTestContext());

      expect(result.success).toBe(false);
    });
  });

  describe('validateScriptSyntax', () => {
    it('should validate correct syntax', () => {
      const script = 'const x = 1 + 2;';
      const result = validateScriptSyntax(script);

      expect(result.valid).toBe(true);
    });

    it('should reject invalid syntax', () => {
      const script = 'const x = ;';
      const result = validateScriptSyntax(script);

      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should validate script templates', () => {
      const sumScript = SCRIPT_TEMPLATES.sumFields;
      const result = validateScriptSyntax(sumScript);

      expect(result.valid).toBe(true);
    });
  });

  describe('getActionsForTrigger', () => {
    it('should filter actions by trigger', () => {
      const actions: FormAction[] = [
        createShowFieldAction('onClick', 'field1'),
        createHideFieldAction('onBlur', 'field2'),
        createEnableFieldAction('onClick', 'field3'),
      ];

      const clickActions = getActionsForTrigger(actions, 'onClick');

      expect(clickActions).toHaveLength(2);
      expect(clickActions.every((a) => a.trigger === 'onClick')).toBe(true);
    });

    it('should filter out disabled actions', () => {
      const enabledAction = createShowFieldAction('onClick', 'field1');
      const disabledAction = createHideFieldAction('onClick', 'field2');
      disabledAction.enabled = false;

      const actions = getActionsForTrigger([enabledAction, disabledAction], 'onClick');

      expect(actions).toHaveLength(1);
    });

    it('should return empty array when no matches', () => {
      const actions = [createShowFieldAction('onClick', 'field1')];
      const result = getActionsForTrigger(actions, 'onBlur');

      expect(result).toHaveLength(0);
    });
  });

  describe('executeActionsForTrigger', () => {
    it('should execute all matching actions', () => {
      const actions: FormAction[] = [
        createShowFieldAction('onClick', 'field1'),
        createEnableFieldAction('onClick', 'field2'),
      ];

      const results = executeActionsForTrigger(actions, 'onClick', createTestContext());

      expect(results).toHaveLength(2);
      expect(results.every((r) => r.success)).toBe(true);
    });

    it('should return empty array for no matching trigger', () => {
      const actions = [createShowFieldAction('onClick', 'field1')];
      const results = executeActionsForTrigger(actions, 'onBlur', createTestContext());

      expect(results).toHaveLength(0);
    });
  });

  describe('mergeActionResults', () => {
    it('should merge multiple results', () => {
      const results: ActionResult[] = [
        {
          success: true,
          changes: [{ fieldId: 'field1', property: 'visible', newValue: true }],
        },
        {
          success: true,
          changes: [{ fieldId: 'field2', property: 'enabled', newValue: false }],
        },
      ];

      const merged = mergeActionResults(results);

      expect(merged.success).toBe(true);
      expect(merged.changes).toHaveLength(2);
    });

    it('should collect all errors', () => {
      const results: ActionResult[] = [
        { success: false, error: 'Error 1' },
        { success: false, error: 'Error 2' },
        { success: true },
      ];

      const merged = mergeActionResults(results);

      expect(merged.success).toBe(false);
      expect(merged.error).toContain('Error 1');
      expect(merged.error).toContain('Error 2');
    });

    it('should preserve navigation from last action', () => {
      const results: ActionResult[] = [
        { success: true, navigation: { type: 'page', target: 1 } },
        { success: true, navigation: { type: 'page', target: 5 } },
      ];

      const merged = mergeActionResults(results);

      expect(merged.navigation).toEqual({ type: 'page', target: 5 });
    });

    it('should preserve formAction from last action', () => {
      const results: ActionResult[] = [
        { success: true, formAction: 'reset' },
        { success: true, formAction: 'submit' },
      ];

      const merged = mergeActionResults(results);

      expect(merged.formAction).toBe('submit');
    });
  });

  describe('SCRIPT_TEMPLATES', () => {
    it('should have sumFields template', () => {
      expect(SCRIPT_TEMPLATES.sumFields).toBeDefined();
      expect(SCRIPT_TEMPLATES.sumFields).toContain('total');
    });

    it('should have copyFieldValue template', () => {
      expect(SCRIPT_TEMPLATES.copyFieldValue).toBeDefined();
      expect(SCRIPT_TEMPLATES.copyFieldValue).toContain('targetField');
    });

    it('should have conditionalVisibility template', () => {
      expect(SCRIPT_TEMPLATES.conditionalVisibility).toBeDefined();
      expect(SCRIPT_TEMPLATES.conditionalVisibility).toContain('visible');
    });

    it('should have formatPhoneNumber template', () => {
      expect(SCRIPT_TEMPLATES.formatPhoneNumber).toBeDefined();
      expect(SCRIPT_TEMPLATES.formatPhoneNumber).toContain('digits');
    });

    it('should have validateEmailFormat template', () => {
      expect(SCRIPT_TEMPLATES.validateEmailFormat).toBeDefined();
      expect(SCRIPT_TEMPLATES.validateEmailFormat).toContain('email');
    });
  });
});
