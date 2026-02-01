/**
 * Form Field Calculations
 * Provides calculation support for form fields.
 */

export type CalculationOperator = 'sum' | 'average' | 'min' | 'max' | 'product' | 'custom';

export interface CalculationDefinition {
  /** Type of calculation */
  operator: CalculationOperator;
  /** Field IDs to include in calculation */
  sourceFields: string[];
  /** Custom formula (when operator is 'custom') */
  customFormula?: string;
  /** Number of decimal places */
  decimalPlaces?: number;
  /** Prefix (e.g., '$') */
  prefix?: string;
  /** Suffix (e.g., '%') */
  suffix?: string;
}

export interface CalculationResult {
  value: number;
  formattedValue: string;
  error?: string;
}

/**
 * Execute a calculation based on definition
 */
export function executeCalculation(
  definition: CalculationDefinition,
  values: Record<string, string>
): CalculationResult {
  try {
    const numericValues = getNumericValues(definition.sourceFields, values);

    if (numericValues.length === 0) {
      return {
        value: 0,
        formattedValue: formatResult(0, definition),
      };
    }

    let result: number;

    switch (definition.operator) {
      case 'sum':
        result = sum(numericValues);
        break;
      case 'average':
        result = average(numericValues);
        break;
      case 'min':
        result = Math.min(...numericValues);
        break;
      case 'max':
        result = Math.max(...numericValues);
        break;
      case 'product':
        result = product(numericValues);
        break;
      case 'custom':
        result = executeCustomFormula(definition.customFormula || '', values);
        break;
      default:
        result = 0;
    }

    return {
      value: result,
      formattedValue: formatResult(result, definition),
    };
  } catch (error) {
    return {
      value: 0,
      formattedValue: '',
      error: error instanceof Error ? error.message : 'Calculation error',
    };
  }
}

/**
 * Get numeric values from field values
 */
function getNumericValues(fieldIds: string[], values: Record<string, string>): number[] {
  const result: number[] = [];

  for (const fieldId of fieldIds) {
    const value = values[fieldId];
    if (value !== undefined && value !== '') {
      const numValue = parseFloat(value.replace(/[^0-9.-]/g, ''));
      if (!isNaN(numValue)) {
        result.push(numValue);
      }
    }
  }

  return result;
}

/**
 * Sum values
 */
function sum(values: number[]): number {
  return values.reduce((acc, val) => acc + val, 0);
}

/**
 * Calculate average
 */
function average(values: number[]): number {
  if (values.length === 0) return 0;
  return sum(values) / values.length;
}

/**
 * Calculate product
 */
function product(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((acc, val) => acc * val, 1);
}

/**
 * Execute custom formula
 * Supports basic operations and field references like {field1} + {field2}
 */
function executeCustomFormula(formula: string, values: Record<string, string>): number {
  // Replace field references with values
  let expression = formula;

  // Match {fieldName} patterns
  const fieldPattern = /\{([^}]+)\}/g;
  let match;

  while ((match = fieldPattern.exec(formula)) !== null) {
    const fieldId = match[1]!;
    const fieldValue = values[fieldId];
    const numValue = fieldValue ? parseFloat(fieldValue.replace(/[^0-9.-]/g, '')) : 0;
    expression = expression.replace(match[0], isNaN(numValue) ? '0' : numValue.toString());
  }

  // Sanitize expression - only allow safe characters
  if (!/^[\d\s+\-*/().]+$/.test(expression)) {
    throw new Error('Invalid characters in formula');
  }

  // Evaluate expression safely
  try {
    // Using Function constructor for safer eval
    const fn = new Function(`return (${expression})`);
    const result = fn();

    if (typeof result !== 'number' || isNaN(result) || !isFinite(result)) {
      throw new Error('Invalid result');
    }

    return result;
  } catch {
    throw new Error('Invalid formula');
  }
}

/**
 * Format calculation result
 */
function formatResult(value: number, definition: CalculationDefinition): string {
  const decimals = definition.decimalPlaces ?? 2;
  const prefix = definition.prefix || '';
  const suffix = definition.suffix || '';

  const formattedNumber = value.toFixed(decimals);
  return `${prefix}${formattedNumber}${suffix}`;
}

/**
 * Creates a sum calculation
 */
export function createSumCalculation(
  sourceFields: string[],
  options?: Partial<CalculationDefinition>
): CalculationDefinition {
  return {
    operator: 'sum',
    sourceFields,
    decimalPlaces: 2,
    ...options,
  };
}

/**
 * Creates an average calculation
 */
export function createAverageCalculation(
  sourceFields: string[],
  options?: Partial<CalculationDefinition>
): CalculationDefinition {
  return {
    operator: 'average',
    sourceFields,
    decimalPlaces: 2,
    ...options,
  };
}

/**
 * Creates a min calculation
 */
export function createMinCalculation(
  sourceFields: string[],
  options?: Partial<CalculationDefinition>
): CalculationDefinition {
  return {
    operator: 'min',
    sourceFields,
    decimalPlaces: 2,
    ...options,
  };
}

/**
 * Creates a max calculation
 */
export function createMaxCalculation(
  sourceFields: string[],
  options?: Partial<CalculationDefinition>
): CalculationDefinition {
  return {
    operator: 'max',
    sourceFields,
    decimalPlaces: 2,
    ...options,
  };
}

/**
 * Creates a product calculation
 */
export function createProductCalculation(
  sourceFields: string[],
  options?: Partial<CalculationDefinition>
): CalculationDefinition {
  return {
    operator: 'product',
    sourceFields,
    decimalPlaces: 2,
    ...options,
  };
}

/**
 * Creates a custom formula calculation
 */
export function createCustomCalculation(
  formula: string,
  sourceFields: string[],
  options?: Partial<CalculationDefinition>
): CalculationDefinition {
  return {
    operator: 'custom',
    sourceFields,
    customFormula: formula,
    decimalPlaces: 2,
    ...options,
  };
}

/**
 * Parse formula to extract field references
 */
export function extractFieldReferences(formula: string): string[] {
  const fieldPattern = /\{([^}]+)\}/g;
  const fields: string[] = [];
  let match;

  while ((match = fieldPattern.exec(formula)) !== null) {
    if (match[1] && !fields.includes(match[1])) {
      fields.push(match[1]);
    }
  }

  return fields;
}

/**
 * Validate a calculation formula
 */
export function validateFormula(formula: string): { isValid: boolean; error?: string } {
  try {
    // Replace field references with test values
    const testExpression = formula.replace(/\{[^}]+\}/g, '1');

    // Check for valid characters
    if (!/^[\d\s+\-*/().]+$/.test(testExpression)) {
      return { isValid: false, error: 'Formula contains invalid characters' };
    }

    // Try to evaluate
    const fn = new Function(`return (${testExpression})`);
    const result = fn();

    if (typeof result !== 'number' || isNaN(result)) {
      return { isValid: false, error: 'Formula does not produce a valid number' };
    }

    return { isValid: true };
  } catch (error) {
    return {
      isValid: false,
      error: error instanceof Error ? error.message : 'Invalid formula syntax',
    };
  }
}
