// Define standard categories as a constant array for clarity and type safety.
export const CATEGORIES = [
  'Code Refinement',
  'Error Fixing',
  'Code Generation',
  'Code Review',
  'Documentation',
  'Optimization',
  'Debugging',
  'Feature Implementation',
] as const; // Use 'as const' for a read-only tuple type

// Define a union type from the CATEGORIES array
export type StandardCategory = (typeof CATEGORIES)[number];

export type CustomCategory = typeof CUSTOM_CATEGORY_VALUE;

// You could potentially define a union for *all* possible category keys
export type CategoryKey = StandardCategory | '' | CustomCategory;

// Define a constant for the 'custom' category value used in the Select component state.
export const CUSTOM_CATEGORY_VALUE = 'custom';

// Define default texts based on categories for generating the prompt
// when corresponding user input fields are empty.
export const DEFAULT_PROMPT_TEXTS = {
  '': {
    // Default for initial state or when no standard/custom category is clearly resolved
    defaultContext:
      'Consider the overall context of a software development task.',
    defaultRequest:
      'Provide general AI assistance based on the input provided below.',
  },
  'Code Refinement': {
    defaultContext: 'Consider the context of a code refinement task.',
    defaultRequest:
      'Refine the provided code snippet for better readability, performance, or maintainability based on standard best practices.',
  },
  'Error Fixing': {
    defaultContext:
      'Consider the context of debugging and fixing a specific code error.',
    defaultRequest:
      'Analyze the provided code and error message to identify and fix the issue.',
  },
  'Code Generation': {
    defaultContext:
      'Consider the context of generating new code based on a specific requirement.',
    defaultRequest: 'Generate code based on the requirements described below.',
  },
  'Code Review': {
    defaultContext:
      'Consider the context of reviewing a code snippet for potential issues, improvements, and adherence to standards.',
    defaultRequest:
      'Perform a code review on the provided code snippet, identifying potential bugs, suggesting improvements, and ensuring best practices are followed.',
  },
  Documentation: {
    defaultContext:
      'Consider the context of generating or improving documentation for code or a technical concept.',
    defaultRequest:
      'Generate or improve documentation for the provided code or topic.',
  },
  Optimization: {
    defaultContext:
      'Consider the context of optimizing code for performance, resource usage, or efficiency.',
    defaultRequest:
      'Optimize the provided code snippet for performance and efficiency.',
  },
  Debugging: {
    defaultContext: 'Consider the context of debugging a software issue.',
    defaultRequest: 'Help debug the described problem and provided code.',
  },
  'Feature Implementation': {
    defaultContext:
      'Consider the context of implementing a new software feature.',
    defaultRequest:
      'Assist in implementing the described feature based on the provided details.',
  },
  [CUSTOM_CATEGORY_VALUE]: {
    // Use the constant for the 'custom' key
    defaultContext:
      'Consider the context of the custom category specified below.',
    defaultRequest:
      'Provide assistance based on the custom category and request details provided.',
  },
} as const;

// Constants for section headings (plain text, not markdown)
export const TASK_CATEGORY_HEADING = 'Task Category:';
export const CONTEXT_HEADING = 'Context';
export const REQUEST_HEADING = 'Request';
export const CODE_HEADING = 'Code';

// Map for introduction phrases based on standard category values.
// The 'custom' category value is handled separately in the getIntroductionPhrase function in utils.ts.
export const INTRODUCTION_PHRASES = {
  '': 'I need general code assistance. ',
  'Code Refinement': 'I need assistance with refining existing code. ',
  'Error Fixing':
    'I am encountering an error in my code and require help with debugging. ',
  'Code Generation': 'I need help generating new code. ',
  'Code Review': 'I am requesting a review of the following code. ',
  Documentation: 'I require documentation for the following code or concept. ',
  Optimization:
    'I am looking for ways to optimize the provided code for performance or efficiency. ',
  Debugging: 'I need help debugging an issue. ',
  'Feature Implementation':
    'I am planning to implement a new feature and need guidance. ',
} as const;
