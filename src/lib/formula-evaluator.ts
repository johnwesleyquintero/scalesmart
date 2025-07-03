import { create, all } from 'mathjs';

const math = create(all);

export const validateFormula = (
  formula: string,
  availableFields?: string[],
): string | null => {
  if (!formula || formula.trim() === '') {
    return 'Formula cannot be empty.';
  }
  try {
    const node = math.parse(formula);

    if (availableFields) {
      const symbols = new Set<string>();
      node.traverse((currentNode) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if ((currentNode as any).isSymbolNode) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          symbols.add((currentNode as any).name);
        }
      });

      const undefinedVariables = [...symbols].filter(
        (variable) => !availableFields.includes(variable),
      );

      if (undefinedVariables.length > 0) {
        return `Undefined variables in formula: ${undefinedVariables.join(
          ', ',
        )}. Available fields are: ${availableFields.join(', ')}.`;
      }
    }

    return null;
  } catch (error) {
    return `Syntax Error: ${
      error instanceof Error ? error.message : 'Invalid formula syntax'
    }`;
  }
};

export const evaluateFormula = (
  formula: string,
  data: Record<string, unknown>,
): unknown => {
  const validationError = validateFormula(formula, Object.keys(data));
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
    const result = math.evaluate(formula, data);
    console.log(
      'Formula evaluation successful:',
      formula,
      'with data:',
      data,
      'Result:',
      result,
    );
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
    return `Evaluation Error: ${
      error instanceof Error
        ? error.message
        : 'An error occurred during formula evaluation'
    }`;
  }
};
