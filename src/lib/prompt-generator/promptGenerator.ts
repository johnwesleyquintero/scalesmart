/**
 * @module PromptGenerator
 * @description Provides utilities for generating structured prompts based on user input.
 */

// Type definitions - duplicated here for clarity, consider importing from a shared types file if exists.
interface PromptData {
  category: string;
  customCategory: string;
  context: string;
  request: string;
  codeInput: string;
}

/**
 * Validates the input prompt data.
 * @param {PromptData} data - The prompt data to validate.
 * @returns {string | null} An error message if validation fails, otherwise null.
 */
function validatePromptData(data: PromptData): string | null {
  if (!data.request.trim()) {
    return 'The request field is mandatory and cannot be empty.';
  }
  if (data.category === 'custom' && !data.customCategory.trim()) {
    return 'Custom category cannot be empty when "Custom" is selected.';
  }
  return null;
}

/**
 * Determines the introductory phrase based on the given category.
 * @param {string} category - The category of the prompt.
 * @returns {string} The appropriate introductory phrase.
 */
function getIntroductionPhrase(category: string): string {
  switch (category) {
    case 'Code Refinement':
      return 'I need assistance with refining existing code. ';
    case 'Error Fixing':
      return 'I am encountering an error in my code and require help with debugging. ';
    case 'Code Generation':
      return 'I need help generating new code. ';
    case 'Code Review':
      return 'I am requesting a review of the following code. ';
    case 'Documentation':
      return 'I require documentation for the following code or concept. ';
    case 'Optimization':
      return 'I am looking for ways to optimize the provided code for performance or efficiency. ';
    case 'Debugging':
      return 'I need help debugging an issue. ';
    case 'Feature Implementation':
      return 'I am planning to implement a new feature and need guidance. ';
    default:
      return `Regarding ${category}, `;
  }
}

/**
 * Attempts to detect the programming language of the provided code input.
 * @param {string} codeInput - The code string to analyze.
 * @param {string} currentCategory - The current selected category, used for better guessing.
 * @returns {string} The detected language (e.g., 'typescript', 'html', 'json'), or 'plaintext' as a fallback.
 */
function detectLanguage(codeInput: string, currentCategory: string): string {
  let language = 'plaintext'; // Default to plaintext
  if (currentCategory.includes('Code') || currentCategory.includes('Script')) {
    // Basic heuristics for language detection
    if (codeInput.includes('<div') || codeInput.includes('<html')) {
      language = 'html';
    } else if (
      codeInput.includes('{') &&
      codeInput.includes('}') &&
      !codeInput.includes('import ') &&
      !codeInput.includes('function ')
    ) {
      language = 'json';
    } else if (
      codeInput.includes('import ') ||
      codeInput.includes('function ') ||
      codeInput.includes('const ') ||
      codeInput.includes('let ') ||
      codeInput.includes('class ') ||
      codeInput.includes('interface ')
    ) {
      language = 'typescript';
    } else if (
      codeInput.includes('def ') ||
      (codeInput.includes('import ') && codeInput.includes(' as '))
    ) {
      // python style imports
      language = 'python';
    } else if (codeInput.includes('public static void main')) {
      language = 'java';
    }
    // Add more language heuristics as needed
  }
  return language;
}

/**
 * Generates a sophisticated prompt based on the provided data.
 * Enhancements include:
 * - More structured category headings.
 * - Dynamic introductory remarks based on category.
 * - Improved handling of code input with language suggestions (if relevant to category).
 * - Error handling for invalid or missing required inputs.
 * - Ensures robust output even with partial inputs.
 *
 * @param {PromptData} data - The input data for prompt generation.
 * @returns {string} The generated structured prompt.
 */
export function generatePrompt(data: PromptData): string {
  const validationError = validatePromptData(data);
  if (validationError) {
    throw new Error(validationError);
  }

  const { category, customCategory, context, request, codeInput } = data;
  let prompt = '';
  const currentCategory = customCategory || category;

  // Add category and a dynamic introductory phrase
  if (currentCategory) {
    prompt += `### Task Category: ${currentCategory}\n\n${getIntroductionPhrase(currentCategory)}`;
  }

  // Add context section if provided
  if (context.trim()) {
    prompt += `#### Context\n\n${context.trim()}\n\n`;
  }

  // Add request section - mandatory
  prompt += `#### Request\n\n${request.trim()}\n\n`;

  // Add code input section if provided, with language placeholder for clarity
  if (codeInput.trim()) {
    const language = detectLanguage(codeInput, currentCategory);
    prompt += `#### Code\n\n\`\`\`${language}\n${codeInput.trim()}\n\`\`\`\n`;
  }

  // Add a polite closing statement
  prompt += '\nThank you for your assistance!';

  return prompt;
}
