/**
 * Form Field Conditional Logic
 * Provides conditional visibility and behavior for form fields.
 */

export type ComparisonOperator =
  | 'equals'
  | 'notEquals'
  | 'contains'
  | 'notContains'
  | 'startsWith'
  | 'endsWith'
  | 'isEmpty'
  | 'isNotEmpty'
  | 'greaterThan'
  | 'lessThan'
  | 'greaterThanOrEqual'
  | 'lessThanOrEqual';

export type LogicalOperator = 'and' | 'or';

export type ConditionalAction =
  | 'show'
  | 'hide'
  | 'enable'
  | 'disable'
  | 'require'
  | 'unrequire'
  | 'setValue';

export interface Condition {
  /** Field ID to check */
  fieldId: string;
  /** Comparison operator */
  operator: ComparisonOperator;
  /** Value to compare against */
  value: string;
}

export interface ConditionGroup {
  /** Logical operator between conditions */
  logicalOperator: LogicalOperator;
  /** Array of conditions or nested groups */
  conditions: (Condition | ConditionGroup)[];
}

export interface ConditionalRule {
  /** Unique rule ID */
  id: string;
  /** Field ID that this rule affects */
  targetFieldId: string;
  /** When to evaluate: on source field change, focus, or blur */
  trigger: 'onChange' | 'onFocus' | 'onBlur' | 'onLoad';
  /** Condition group to evaluate */
  conditionGroup: ConditionGroup;
  /** Actions to perform when condition is true */
  actionsIfTrue: ActionDefinition[];
  /** Actions to perform when condition is false */
  actionsIfFalse?: ActionDefinition[];
}

export interface ActionDefinition {
  /** Type of action */
  action: ConditionalAction;
  /** Value for setValue action */
  value?: string;
}

export interface ConditionalResult {
  /** Whether the condition evaluated to true */
  conditionMet: boolean;
  /** Field IDs that were affected */
  affectedFields: string[];
  /** State changes to apply */
  stateChanges: FieldStateChange[];
}

export interface FieldStateChange {
  fieldId: string;
  property: 'visible' | 'enabled' | 'required' | 'value';
  value: boolean | string;
}

/**
 * Evaluate a condition against field values
 */
export function evaluateCondition(
  condition: Condition,
  values: Record<string, string>
): boolean {
  const fieldValue = values[condition.fieldId] ?? '';
  const compareValue = condition.value;

  switch (condition.operator) {
    case 'equals':
      return fieldValue === compareValue;

    case 'notEquals':
      return fieldValue !== compareValue;

    case 'contains':
      return fieldValue.toLowerCase().includes(compareValue.toLowerCase());

    case 'notContains':
      return !fieldValue.toLowerCase().includes(compareValue.toLowerCase());

    case 'startsWith':
      return fieldValue.toLowerCase().startsWith(compareValue.toLowerCase());

    case 'endsWith':
      return fieldValue.toLowerCase().endsWith(compareValue.toLowerCase());

    case 'isEmpty':
      return fieldValue.trim() === '';

    case 'isNotEmpty':
      return fieldValue.trim() !== '';

    case 'greaterThan': {
      const numField = parseFloat(fieldValue);
      const numCompare = parseFloat(compareValue);
      return !isNaN(numField) && !isNaN(numCompare) && numField > numCompare;
    }

    case 'lessThan': {
      const numField = parseFloat(fieldValue);
      const numCompare = parseFloat(compareValue);
      return !isNaN(numField) && !isNaN(numCompare) && numField < numCompare;
    }

    case 'greaterThanOrEqual': {
      const numField = parseFloat(fieldValue);
      const numCompare = parseFloat(compareValue);
      return !isNaN(numField) && !isNaN(numCompare) && numField >= numCompare;
    }

    case 'lessThanOrEqual': {
      const numField = parseFloat(fieldValue);
      const numCompare = parseFloat(compareValue);
      return !isNaN(numField) && !isNaN(numCompare) && numField <= numCompare;
    }

    default:
      return false;
  }
}

/**
 * Check if item is a condition group
 */
function isConditionGroup(item: Condition | ConditionGroup): item is ConditionGroup {
  return 'logicalOperator' in item && 'conditions' in item;
}

/**
 * Evaluate a condition group against field values
 */
export function evaluateConditionGroup(
  group: ConditionGroup,
  values: Record<string, string>
): boolean {
  const results: boolean[] = [];

  for (const item of group.conditions) {
    if (isConditionGroup(item)) {
      results.push(evaluateConditionGroup(item, values));
    } else {
      results.push(evaluateCondition(item, values));
    }
  }

  if (group.logicalOperator === 'and') {
    return results.every((r) => r);
  } else {
    return results.some((r) => r);
  }
}

/**
 * Evaluate a conditional rule and return state changes
 */
export function evaluateRule(
  rule: ConditionalRule,
  values: Record<string, string>
): ConditionalResult {
  const conditionMet = evaluateConditionGroup(rule.conditionGroup, values);
  const actions = conditionMet ? rule.actionsIfTrue : (rule.actionsIfFalse || []);
  const stateChanges: FieldStateChange[] = [];
  const affectedFields = new Set<string>();

  for (const actionDef of actions) {
    affectedFields.add(rule.targetFieldId);

    switch (actionDef.action) {
      case 'show':
        stateChanges.push({
          fieldId: rule.targetFieldId,
          property: 'visible',
          value: true,
        });
        break;

      case 'hide':
        stateChanges.push({
          fieldId: rule.targetFieldId,
          property: 'visible',
          value: false,
        });
        break;

      case 'enable':
        stateChanges.push({
          fieldId: rule.targetFieldId,
          property: 'enabled',
          value: true,
        });
        break;

      case 'disable':
        stateChanges.push({
          fieldId: rule.targetFieldId,
          property: 'enabled',
          value: false,
        });
        break;

      case 'require':
        stateChanges.push({
          fieldId: rule.targetFieldId,
          property: 'required',
          value: true,
        });
        break;

      case 'unrequire':
        stateChanges.push({
          fieldId: rule.targetFieldId,
          property: 'required',
          value: false,
        });
        break;

      case 'setValue':
        stateChanges.push({
          fieldId: rule.targetFieldId,
          property: 'value',
          value: actionDef.value || '',
        });
        break;
    }
  }

  return {
    conditionMet,
    affectedFields: Array.from(affectedFields),
    stateChanges,
  };
}

/**
 * Evaluate all rules for a form
 */
export function evaluateAllRules(
  rules: ConditionalRule[],
  values: Record<string, string>,
  trigger?: 'onChange' | 'onFocus' | 'onBlur' | 'onLoad'
): FieldStateChange[] {
  const allChanges: FieldStateChange[] = [];

  for (const rule of rules) {
    // Filter by trigger if specified
    if (trigger && rule.trigger !== trigger) {
      continue;
    }

    const result = evaluateRule(rule, values);
    allChanges.push(...result.stateChanges);
  }

  // Deduplicate changes (later changes override earlier ones)
  const changeMap = new Map<string, FieldStateChange>();
  for (const change of allChanges) {
    const key = `${change.fieldId}:${change.property}`;
    changeMap.set(key, change);
  }

  return Array.from(changeMap.values());
}

/**
 * Get source field IDs from a conditional rule
 */
export function getSourceFields(rule: ConditionalRule): string[] {
  const fields = new Set<string>();

  function extractFromGroup(group: ConditionGroup) {
    for (const item of group.conditions) {
      if (isConditionGroup(item)) {
        extractFromGroup(item);
      } else {
        fields.add(item.fieldId);
      }
    }
  }

  extractFromGroup(rule.conditionGroup);
  return Array.from(fields);
}

/**
 * Create a simple show/hide rule
 */
export function createShowWhenRule(
  id: string,
  targetFieldId: string,
  sourceFieldId: string,
  operator: ComparisonOperator,
  value: string
): ConditionalRule {
  return {
    id,
    targetFieldId,
    trigger: 'onChange',
    conditionGroup: {
      logicalOperator: 'and',
      conditions: [
        {
          fieldId: sourceFieldId,
          operator,
          value,
        },
      ],
    },
    actionsIfTrue: [{ action: 'show' }],
    actionsIfFalse: [{ action: 'hide' }],
  };
}

/**
 * Create a simple enable/disable rule
 */
export function createEnableWhenRule(
  id: string,
  targetFieldId: string,
  sourceFieldId: string,
  operator: ComparisonOperator,
  value: string
): ConditionalRule {
  return {
    id,
    targetFieldId,
    trigger: 'onChange',
    conditionGroup: {
      logicalOperator: 'and',
      conditions: [
        {
          fieldId: sourceFieldId,
          operator,
          value,
        },
      ],
    },
    actionsIfTrue: [{ action: 'enable' }],
    actionsIfFalse: [{ action: 'disable' }],
  };
}

/**
 * Create a require when rule
 */
export function createRequireWhenRule(
  id: string,
  targetFieldId: string,
  sourceFieldId: string,
  operator: ComparisonOperator,
  value: string
): ConditionalRule {
  return {
    id,
    targetFieldId,
    trigger: 'onChange',
    conditionGroup: {
      logicalOperator: 'and',
      conditions: [
        {
          fieldId: sourceFieldId,
          operator,
          value,
        },
      ],
    },
    actionsIfTrue: [{ action: 'require' }],
    actionsIfFalse: [{ action: 'unrequire' }],
  };
}
