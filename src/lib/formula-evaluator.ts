import { Parser } from 'expr-eval';

// Implement a formula evaluator for custom calculations and dimensions.
// This file should contain logic to parse and evaluate spreadsheet-like formulas
// based on the available data sources and their fields.

const formulaFunctions: Record<string, (...args: unknown[]) => unknown> = {
  // Basic arithmetic functions
  ADD: ((a: number, b: number) => Number(a) + Number(b)) as (
    ...args: unknown[]
  ) => unknown,
  SUBTRACT: ((a: number, b: number) => Number(a) - Number(b)) as (
    ...args: unknown[]
  ) => unknown,
  MULTIPLY: ((a: number, b: number) => Number(a) * Number(b)) as (
    ...args: unknown[]
  ) => unknown,
  DIVIDE: ((a: number, b: number) =>
    Number(b) === 0 ? NaN : Number(a) / Number(b)) as (
    ...args: unknown[]
  ) => unknown, // Handle division by zero

  // Example conditional function
  IF: ((condition: unknown, trueValue: unknown, falseValue: unknown) =>
    condition ? trueValue : falseValue) as (...args: unknown[]) => unknown,

  // Add other functions as needed
  ROUND: ((num: number, decimals: number = 0) =>
    Number(num).toFixed(decimals)) as (...args: unknown[]) => unknown,
  CEIL: ((num: number) => Math.ceil(Number(num))) as (
    ...args: unknown[]
  ) => unknown,
  FLOOR: ((num: number) => Math.floor(Number(num))) as (
    ...args: unknown[]
  ) => unknown,
  ABS: ((num: number) => Math.abs(Number(num))) as (
    ...args: unknown[]
  ) => unknown,
  SQRT: ((num: number) => Math.sqrt(Number(num))) as (
    ...args: unknown[]
  ) => unknown,
};

export const validateFormula = (
  formula: string,
  availableFields?: string[],
): string | null => {
  if (!formula || formula.trim() === '') {
    return 'Formula cannot be empty.';
  }
  try {
    const parser = new Parser();
    Object.assign(parser.functions, formulaFunctions);
    const expression = parser.parse(formula);

    // Check for undefined variables if availableFields are provided
    if (availableFields) {
      const variables = expression.variables();
      const undefinedVariables = variables.filter(
        (variable) => !availableFields.includes(variable),
      );
      if (undefinedVariables.length > 0) {
        return `Undefined variables in formula: ${undefinedVariables.join(', ')}. Available fields are: ${availableFields.join(', ')}.`;
      }
    }

    // Basic syntax check passed
    return null; // No error
  } catch (error) {
    // Return specific error message from expr-eval
    return `Syntax Error: ${error instanceof Error ? error.message : 'Invalid formula syntax'}`;
  }
};

export const evaluateFormula = (
  formula: string,
  data: Record<string, unknown>,
): unknown => {
  // First, validate the formula
  const validationError = validateFormula(formula);
  if (validationError) {
    console.error(
      'Formula validation failed:',
      formula,
      'Error:',
      validationError,
    );
    return `Error: ${validationError}`;
  }

  try {
    const parser = new Parser();
    Object.assign(parser.functions, formulaFunctions);
    // Allow access to properties within the data object
    // The evaluate method is called on the parsed expression, not the parser itself.
    // The override below is not needed and can cause type issues.
    const expression = parser.parse(formula);
    // Evaluate the expression with the provided data context. expr-eval expects a Record<string, unknown> for the context.
    // The expr-eval library's evaluate method has complex type definitions.
    const result = expression.evaluate(data as { [key: string]: number });
    console.log(
      'Formula evaluation successful:',
      formula,
      'with data:',
      data,
      'Result:',
      result,
    );
    // Check for NaN or Infinity results which might indicate issues
    if (typeof result === 'number' && !Number.isFinite(result)) {
      return `Evaluation Error: Result is not a finite number (${result}). Check inputs.`;
    }
    return result;
  } catch (error) {
    console.error(
      'Error evaluating formula:',
      formula,
      'with data:',
      data,
      'Error:',
      error,
    );
    // Return a more specific error message
    return `Evaluation Error: ${error instanceof Error ? error.message : 'An error occurred during formula evaluation'}`;
  }
};
