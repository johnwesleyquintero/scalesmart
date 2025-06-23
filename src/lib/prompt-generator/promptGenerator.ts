/**
 * @module PromptGenerator
 * @description Provides utilities for generating structured prompts based on user input.
 */

// Constants for markdown headings
const TASK_CATEGORY_HEADING = '### Task Category:';
const CONTEXT_HEADING = '#### Context';
const REQUEST_HEADING = '#### Request';
const CODE_HEADING = '#### Code';
const PARENT_TASK_HEADING = '#### Parent Task';
const SUBTASK_HEADING = '#### Subtask';

// Map for introduction phrases based on category
const INTRODUCTION_PHRASES: Map<string, string> = new Map([
  ['Code Refinement', 'I need assistance with refining existing code. '],
  [
    'Error Fixing',
    'I am encountering an error in my code and require help with debugging. ',
  ],
  ['Code Generation', 'I need help generating new code. '],
  ['Code Review', 'I am requesting a review of the following code. '],
  [
    'Documentation',
    'I require documentation for the following code or concept. ',
  ],
  [
    'Optimization',
    'I am looking for ways to optimize the provided code for performance or efficiency. ',
  ],
  ['Debugging', 'I need help debugging an issue. '],
  [
    'Feature Implementation',
    'I am planning to implement a new feature and need guidance. ',
  ],
  // Add more standard categories here as needed
]);

// Type definitions - Ideally imported from a shared types file if one exists.
interface PromptData {
  category: string;
  customCategory: string;
  context: string;
  request: string;
  codeInput: string;
  parentTask?: string;
  subtask?: string;
}

/**
 * Validates the input prompt data.
 * @param {PromptData} data - The prompt data to validate.
 * @returns {string | null} An error message if validation fails, otherwise null.
 */
function validatePromptData(data: PromptData): string | null {
  if (!data.request || !data.request.trim()) {
    return 'The request field is mandatory and cannot be empty.';
  }
  if (
    data.category === 'Custom' &&
    (!data.customCategory || !data.customCategory.trim())
  ) {
    // Assuming 'Custom' is the value used to indicate a custom category
    return 'Custom category cannot be empty when "Custom" is selected.';
  }
  return null;
}

/**
 * Determines the introductory phrase based on the given category.
 * Falls back to a generic phrase if the category is not in the map.
 * @param {string} category - The category of the prompt (expected to be a standard category key).
 * @returns {string} The appropriate introductory phrase.
 */
function getIntroductionPhrase(category: string): string {
  return INTRODUCTION_PHRASES.get(category) || `Regarding ${category}, `;
}

// Define language detection rules as an array for clarity and maintainability
const languageDetectionRules: {
  check: (code: string) => boolean;
  language: string;
}[] = [
  // Order matters - put more common/specific checks first after JSON special case below
  {
    check: (code) =>
      code.includes('import ') ||
      code.includes('function ') ||
      code.includes('const ') ||
      code.includes('let ') ||
      code.includes('class ') ||
      code.includes('interface ') ||
      code.includes('export '),
    language: 'typescript',
  }, // Covers JavaScript/TypeScript keywords
  {
    check: (code) =>
      code.includes('def ') ||
      code.includes('print(') ||
      (code.includes('import ') && code.includes(' as ')),
    language: 'python',
  },
  {
    check: (code) =>
      code.includes('public static void main') ||
      code.includes('System.out.println'),
    language: 'java',
  },
  {
    check: (code) =>
      code.startsWith('<?php') ||
      (code.includes('function ') && code.includes('echo ')),
    language: 'php',
  },
  {
    check: (code) => code.includes('#include <') || code.includes('int main()'),
    language: 'c',
  }, // Basic C/C++ check
  {
    check: (code) =>
      code.includes('SELECT ') ||
      code.includes('FROM ') ||
      code.includes('WHERE '),
    language: 'sql',
  },
  {
    check: (code) =>
      code.startsWith('<') &&
      code.endsWith('>') &&
      (code.includes('<div') ||
        code.includes('<html') ||
        code.includes('<body') ||
        code.includes('<template') ||
        code.includes('</')),
    language: 'html',
  }, // Basic HTML check including common tags/closers
  // Add more rules here
];

/**
 * Attempts to detect the programming language of the provided code input using basic heuristics.
 * Note: This detection is not exhaustive, perfectly accurate, or robust. It's a simple guesser.
 * @param {string} codeInput - The code string to analyze.
 * @returns {string} The detected language (e.g., 'typescript', 'html', 'json'), or 'plaintext' as a fallback.
 */
function detectLanguage(codeInput: string): string {
  const trimmedCode = codeInput.trim();
  if (!trimmedCode) {
    return 'plaintext'; // No code means no language to detect
  }

  // Special case for JSON - attempt parsing for accuracy as it's more reliable than heuristics
  if (
    (trimmedCode.startsWith('{') && trimmedCode.endsWith('}')) ||
    (trimmedCode.startsWith('[') && trimmedCode.endsWith(']'))
  ) {
    try {
      JSON.parse(trimmedCode);
      return 'json';
    } catch (e) {
      // Not valid JSON, continue with heuristic checks
    }
  }

  // Iterate through defined rules and return the first match
  for (const rule of languageDetectionRules) {
    if (rule.check(trimmedCode)) {
      return rule.language;
    }
  }

  return 'plaintext'; // Default fallback
}

/**
 * Generates a structured prompt based on the provided data.
 * Includes sections for category, context, request, and code input.
 * Performs basic validation before generation.
 * Throws an error if validation fails.
 *
 * @param {PromptData} data - The input data for prompt generation.
 * @returns {string} The generated structured prompt.
 * @throws {Error} If validation fails.
 */
export function generatePrompt(data: PromptData): string {
  const validationError = validatePromptData(data);
  if (validationError) {
    throw new Error(validationError);
  }

  const {
    category,
    customCategory,
    context,
    request,
    codeInput,
    parentTask,
    subtask,
  } = data;
  const promptParts: string[] = [];

  // Determine the category name to display (use custom if provided, otherwise standard, default to 'General')
  const displayCategory =
    customCategory?.trim() || category?.trim() || 'General';
  // Determine the category key for looking up the intro phrase (always use the standard category if available, default to 'General' for fallback phrase)
  const lookupCategory = category?.trim() || 'General';

  // Add category heading and introductory phrase
  const introPhrase = getIntroductionPhrase(lookupCategory);
  promptParts.push(
    `${TASK_CATEGORY_HEADING} ${displayCategory}\n\n${introPhrase.trim()}`,
  );

  // Add context section if provided
  const trimmedContext = context?.trim();
  if (trimmedContext) {
    promptParts.push(`${CONTEXT_HEADING}\n\n${trimmedContext}`);
  }

  const trimmedParentTask = parentTask?.trim();
  if (trimmedParentTask) {
    promptParts.push(`${PARENT_TASK_HEADING}\n\n${trimmedParentTask}`);
  }

  const trimmedSubtask = subtask?.trim();
  if (trimmedSubtask) {
    promptParts.push(`${SUBTASK_HEADING}\n\n${trimmedSubtask}`);
  }

  // Add request section - mandatory, validated earlier
  const trimmedRequest = request.trim();
  promptParts.push(`${REQUEST_HEADING}\n\n${trimmedRequest}`);

  // Add code input section if provided, with language placeholder for clarity
  const trimmedCodeInput = codeInput?.trim();
  if (trimmedCodeInput) {
    const language = detectLanguage(trimmedCodeInput);
    promptParts.push(
      `${CODE_HEADING}\n\n\`\`\`${language}\n${trimmedCodeInput}\n\`\`\``,
    );
  }

  // Add a polite closing statement as a final part
  promptParts.push('Thank you for your assistance!');

  // Join all parts with double newlines to create the final prompt string
  return promptParts.join('\n\n');
}
