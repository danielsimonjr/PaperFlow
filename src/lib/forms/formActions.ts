/**
 * Form Actions
 * Implements form field actions and scripting support.
 */

/**
 * Action trigger types
 */
export type ActionTrigger =
  | 'onFocus'
  | 'onBlur'
  | 'onChange'
  | 'onKeystroke'
  | 'onCalculate'
  | 'onValidate'
  | 'onFormat'
  | 'onClick'
  | 'onMouseEnter'
  | 'onMouseExit';

/**
 * Built-in action types
 */
export type BuiltInActionType =
  | 'showField'
  | 'hideField'
  | 'enableField'
  | 'disableField'
  | 'setFieldValue'
  | 'clearFieldValue'
  | 'setFieldRequired'
  | 'navigateToPage'
  | 'openURL'
  | 'submitForm'
  | 'resetForm'
  | 'printForm'
  | 'runScript';

/**
 * Form action definition
 */
export interface FormAction {
  id: string;
  trigger: ActionTrigger;
  type: BuiltInActionType;
  targetFieldId?: string;
  value?: string | number | boolean;
  url?: string;
  pageNumber?: number;
  script?: string;
  enabled: boolean;
}

/**
 * Action execution context
 */
export interface ActionContext {
  fieldId: string;
  fieldValue: unknown;
  allFieldValues: Record<string, unknown>;
  pageIndex: number;
  documentName: string;
}

/**
 * Action execution result
 */
export interface ActionResult {
  success: boolean;
  error?: string;
  changes?: FieldChange[];
  navigation?: { type: 'page' | 'url'; target: string | number };
  formAction?: 'submit' | 'reset' | 'print';
}

/**
 * Field change from action
 */
export interface FieldChange {
  fieldId: string;
  property: 'value' | 'visible' | 'enabled' | 'required';
  newValue: unknown;
}

/**
 * Generate unique ID for action
 */
function generateActionId(): string {
  return `action_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Create a new form action
 */
export function createFormAction(
  trigger: ActionTrigger,
  type: BuiltInActionType,
  options: Partial<Omit<FormAction, 'id' | 'trigger' | 'type'>> = {}
): FormAction {
  return {
    id: generateActionId(),
    trigger,
    type,
    enabled: true,
    ...options,
  };
}

/**
 * Create show field action
 */
export function createShowFieldAction(
  trigger: ActionTrigger,
  targetFieldId: string
): FormAction {
  return createFormAction(trigger, 'showField', { targetFieldId });
}

/**
 * Create hide field action
 */
export function createHideFieldAction(
  trigger: ActionTrigger,
  targetFieldId: string
): FormAction {
  return createFormAction(trigger, 'hideField', { targetFieldId });
}

/**
 * Create enable field action
 */
export function createEnableFieldAction(
  trigger: ActionTrigger,
  targetFieldId: string
): FormAction {
  return createFormAction(trigger, 'enableField', { targetFieldId });
}

/**
 * Create disable field action
 */
export function createDisableFieldAction(
  trigger: ActionTrigger,
  targetFieldId: string
): FormAction {
  return createFormAction(trigger, 'disableField', { targetFieldId });
}

/**
 * Create set field value action
 */
export function createSetValueAction(
  trigger: ActionTrigger,
  targetFieldId: string,
  value: string | number | boolean
): FormAction {
  return createFormAction(trigger, 'setFieldValue', { targetFieldId, value });
}

/**
 * Create navigate to page action
 */
export function createNavigateToPageAction(
  trigger: ActionTrigger,
  pageNumber: number
): FormAction {
  return createFormAction(trigger, 'navigateToPage', { pageNumber });
}

/**
 * Create open URL action
 */
export function createOpenURLAction(trigger: ActionTrigger, url: string): FormAction {
  return createFormAction(trigger, 'openURL', { url });
}

/**
 * Create run script action
 */
export function createRunScriptAction(trigger: ActionTrigger, script: string): FormAction {
  return createFormAction(trigger, 'runScript', { script });
}

/**
 * Execute a form action
 */
export function executeAction(
  action: FormAction,
  context: ActionContext
): ActionResult {
  if (!action.enabled) {
    return { success: true };
  }

  try {
    switch (action.type) {
      case 'showField':
        return {
          success: true,
          changes: [
            {
              fieldId: action.targetFieldId!,
              property: 'visible',
              newValue: true,
            },
          ],
        };

      case 'hideField':
        return {
          success: true,
          changes: [
            {
              fieldId: action.targetFieldId!,
              property: 'visible',
              newValue: false,
            },
          ],
        };

      case 'enableField':
        return {
          success: true,
          changes: [
            {
              fieldId: action.targetFieldId!,
              property: 'enabled',
              newValue: true,
            },
          ],
        };

      case 'disableField':
        return {
          success: true,
          changes: [
            {
              fieldId: action.targetFieldId!,
              property: 'enabled',
              newValue: false,
            },
          ],
        };

      case 'setFieldValue':
        return {
          success: true,
          changes: [
            {
              fieldId: action.targetFieldId!,
              property: 'value',
              newValue: action.value,
            },
          ],
        };

      case 'clearFieldValue':
        return {
          success: true,
          changes: [
            {
              fieldId: action.targetFieldId!,
              property: 'value',
              newValue: '',
            },
          ],
        };

      case 'setFieldRequired':
        return {
          success: true,
          changes: [
            {
              fieldId: action.targetFieldId!,
              property: 'required',
              newValue: action.value,
            },
          ],
        };

      case 'navigateToPage':
        return {
          success: true,
          navigation: { type: 'page', target: action.pageNumber! },
        };

      case 'openURL':
        return {
          success: true,
          navigation: { type: 'url', target: action.url! },
        };

      case 'submitForm':
        return {
          success: true,
          formAction: 'submit',
        };

      case 'resetForm':
        return {
          success: true,
          formAction: 'reset',
        };

      case 'printForm':
        return {
          success: true,
          formAction: 'print',
        };

      case 'runScript':
        return executeScript(action.script!, context);

      default:
        return {
          success: false,
          error: `Unknown action type: ${action.type}`,
        };
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Action execution failed',
    };
  }
}

/**
 * Execute a script (sandboxed)
 * Note: In production, this should use a proper sandbox like quickjs-emscripten
 */
export function executeScript(script: string, context: ActionContext): ActionResult {
  // This is a simplified implementation
  // In production, use a proper JavaScript sandbox for security
  try {
    const changes: FieldChange[] = [];

    // Create a minimal API for the script
    const api = {
      getField: (fieldId: string) => ({
        get value() {
          return context.allFieldValues[fieldId];
        },
        set value(v: unknown) {
          changes.push({ fieldId, property: 'value', newValue: v });
        },
        get visible() {
          return true; // Placeholder
        },
        set visible(v: boolean) {
          changes.push({ fieldId, property: 'visible', newValue: v });
        },
        get enabled() {
          return true; // Placeholder
        },
        set enabled(v: boolean) {
          changes.push({ fieldId, property: 'enabled', newValue: v });
        },
      }),
      fieldId: context.fieldId,
      fieldValue: context.fieldValue,
    };

    // Execute in a limited context
    // Note: This is NOT safe for untrusted scripts - use proper sandbox in production
    const scriptFunc = new Function('api', `
      const getField = api.getField;
      const field = { value: api.fieldValue };
      ${script}
    `);

    scriptFunc(api);

    return { success: true, changes };
  } catch (error) {
    return {
      success: false,
      error: `Script error: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Validate script syntax without executing
 */
export function validateScriptSyntax(script: string): { valid: boolean; error?: string } {
  try {
    new Function(script);
    return { valid: true };
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Invalid syntax',
    };
  }
}

/**
 * Get actions for a specific trigger
 */
export function getActionsForTrigger(
  actions: FormAction[],
  trigger: ActionTrigger
): FormAction[] {
  return actions.filter((action) => action.trigger === trigger && action.enabled);
}

/**
 * Execute all actions for a trigger
 */
export function executeActionsForTrigger(
  actions: FormAction[],
  trigger: ActionTrigger,
  context: ActionContext
): ActionResult[] {
  const triggerActions = getActionsForTrigger(actions, trigger);
  return triggerActions.map((action) => executeAction(action, context));
}

/**
 * Merge multiple action results
 */
export function mergeActionResults(results: ActionResult[]): ActionResult {
  const allChanges: FieldChange[] = [];
  let navigation: ActionResult['navigation'];
  let formAction: ActionResult['formAction'];
  const errors: string[] = [];

  for (const result of results) {
    if (!result.success && result.error) {
      errors.push(result.error);
    }

    if (result.changes) {
      allChanges.push(...result.changes);
    }

    if (result.navigation) {
      navigation = result.navigation;
    }

    if (result.formAction) {
      formAction = result.formAction;
    }
  }

  return {
    success: errors.length === 0,
    error: errors.length > 0 ? errors.join('; ') : undefined,
    changes: allChanges.length > 0 ? allChanges : undefined,
    navigation,
    formAction,
  };
}

/**
 * Built-in script templates
 */
export const SCRIPT_TEMPLATES = {
  sumFields: `
// Sum the values of multiple fields
const total = getField('field1').value + getField('field2').value;
getField('total').value = total;
`,
  copyFieldValue: `
// Copy value from one field to another
getField('targetField').value = getField('sourceField').value;
`,
  conditionalVisibility: `
// Show/hide field based on another field's value
if (getField('triggerField').value === 'show') {
  getField('targetField').visible = true;
} else {
  getField('targetField').visible = false;
}
`,
  formatPhoneNumber: `
// Format a phone number as (XXX) XXX-XXXX
const digits = String(field.value).replace(/\\D/g, '');
if (digits.length === 10) {
  field.value = \`(\${digits.slice(0,3)}) \${digits.slice(3,6)}-\${digits.slice(6)}\`;
}
`,
  validateEmailFormat: `
// Validate email format
const email = String(field.value);
const emailPattern = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;
if (!emailPattern.test(email)) {
  throw new Error('Invalid email format');
}
`,
};
