import { Parser } from 'expr-eval';
// TODO: Implement a formula evaluator for custom calculations and dimensions.
// This file should contain logic to parse and evaluate spreadsheet-like formulas
// based on the available data sources and their fields.
// Consider using a library for parsing and evaluating expressions.

export const evaluateFormula = (
  formula: string,
  data: Record<string, number | string>,
): unknown => {
  try {
    const parser = new Parser();

    // Add custom functions to the parser
    parser.functions.PERCENTAGE = (value: number, total: number) => {
      if (total === 0) {
        return 0; // Avoid division by zero
      }
      return (value / total) * 100;
    };

    // Make data properties available as variables in the formula
    const expression = parser.parse(formula);
    return expression.evaluate(data);
  } catch (error) {
    console.error('Error evaluating formula:', formula, error);
    if (error instanceof Error) {
      return `Error evaluating formula: ${error.message}`;
    } else {
      return `Error evaluating formula: An unknown error occurred`;
    }
  }
};

/**
 * Validates a formula string using the expr-eval parser.
 * @param formula The formula string to validate.
 * @returns True if the formula is syntactically valid, false otherwise.
 */
export const validateFormula = (formula: string): boolean => {
  try {
    // Attempt to parse the formula. If it succeeds, the syntax is likely valid.
    new Parser().parse(formula);
    return true;
  } catch (error) {
    // If parsing fails, the formula is invalid.
    console.error('Formula validation failed for:', formula, error);
    return false;
  }
};

/**
 * Extracts variable names (identifiers) from a formula string.
 * @param formula The formula string.
 * @returns An array of variable names found in the formula.
 */
export const getFormulaVariables = (formula: string): string[] => {
  try {
    const parser = new Parser();
    const expression = parser.parse(formula);
    // getVariables() returns an array of variable names used in the expression
    return expression.variables();
  } catch (error) {
    console.error('Error extracting variables from formula:', formula, error);
    return [];
  }
};

/**
 * Checks if a formula is valid and if all variables used in the formula are present in the provided data keys.
 * @param formula The formula string.
 * @param dataKeys An array of available data keys.
 * @returns True if the formula is valid and all variables are present, false otherwise.
 */
export const isFormulaValidWithData = (
  formula: string,
  dataKeys: string[],
): boolean => {
  if (!validateFormula(formula)) {
    return false;
  }

  const requiredVariables = getFormulaVariables(formula);
  // Check if all required variables exist in the provided data keys
  return requiredVariables.every((variable) => dataKeys.includes(variable));
};
