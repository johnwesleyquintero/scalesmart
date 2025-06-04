import {
  CATEGORIES,
  CUSTOM_CATEGORY_VALUE,
  DEFAULT_PROMPT_TEXTS,
  TASK_CATEGORY_HEADING,
  CONTEXT_HEADING,
  REQUEST_HEADING,
  CODE_HEADING,
  INTRODUCTION_PHRASES,
} from './constants';
import { CategoryValue, PromptData } from './types';

/**
 * Determines the introductory phrase based on the given category value.
 * Uses specific phrases for standard categories and a generic one for custom.
 * @param {CategoryValue} categoryValue - The value selected in the category dropdown.
 * @param {string} customCategoryText - The text entered for the custom category.
 * @returns {string} The appropriate introductory phrase.
 */
function getIntroductionPhrase(
  categoryValue: CategoryValue,
  customCategoryText: string,
): string {
  if (categoryValue === CUSTOM_CATEGORY_VALUE) {
    // Use the custom category text for the phrase if 'custom' is selected
    return `Regarding the "${customCategoryText.trim() || 'Custom'}" category, `;
  }
  // Use specific phrases for standard categories, fallback to generic if categoryValue is ''
  return INTRODUCTION_PHRASES[categoryValue] || INTRODUCTION_PHRASES[''];
}

/**
 * Attempts to detect the programming language of the provided code input using basic heuristics.
 * Note: This detection is not exhaustive or perfectly accurate.
 * @param {string} codeInput - The code string to analyze.
 * @returns {string} The detected language (e.g., 'typescript', 'html', 'json'), or 'plaintext' as a fallback.
 */
function detectLanguage(codeInput: string): string {
  const trimmedCode = codeInput.trim();
  if (!trimmedCode) {
    return 'plaintext'; // No code means no language to detect
  }

  // Basic heuristics - order matters for some cases
  // HTML/XML check
  if (
    trimmedCode.startsWith('<') &&
    trimmedCode.endsWith('>') &&
    /<\/?\w+>/.test(trimmedCode)
  ) {
    return 'html';
  }
  // JSON check
  if (
    (trimmedCode.startsWith('{') && trimmedCode.endsWith('}')) ||
    (trimmedCode.startsWith('[') && trimmedCode.endsWith(']'))
  ) {
    try {
      JSON.parse(trimmedCode);
      return 'json';
    } catch (e) {
      // Not valid JSON, continue
    }
  }
  // TypeScript/JavaScript check
  if (
    /\b(import|export|function|const|let|class|interface|async|await)\b/.test(
      trimmedCode,
    )
  ) {
    return 'typescript';
  }
  // Python check
  if (
    /\b(def|print|import)\b.*:/.test(trimmedCode) ||
    (/^\s*\w+\s*=/.test(trimmedCode) && !trimmedCode.includes(';'))
  ) {
    return 'python';
  }
  // Java check
  if (
    /\b(public|private|protected)\b.*\b(class|interface)\b/.test(trimmedCode) ||
    /\b(static|void|String)\b.*main\s*\(/.test(trimmedCode)
  ) {
    return 'java';
  }
  // PHP check
  if (
    trimmedCode.startsWith('<?php') ||
    /\b(function|echo|namespace)\b.*;/.test(trimmedCode)
  ) {
    return 'php';
  }
  // C/C++ check
  if (
    /#include\s*<.*>/.test(trimmedCode) ||
    /\b(int|void)\s*main\s*\(.*\)\s*\{/.test(trimmedCode)
  ) {
    return 'c';
  }
  // SQL check
  if (/\b(SELECT|FROM|WHERE|INSERT|UPDATE|DELETE)\b/i.test(trimmedCode)) {
    return 'sql';
  }

  return 'plaintext'; // Default fallback
}

/**
 * Generates a structured prompt based on the provided data.
 * Includes sections for category, context, request, and code input.
 * Assumes the input data has been validated before calling.
 *
 * @param {PromptData} data - The input data for prompt generation.
 * @returns {string} The generated structured prompt.
 */
export function generatePrompt(data: PromptData): string {
  const { category, customCategory, context, request, codeInput } = data;
  let prompt = '';

  // Determine the category name for the heading based on the selected category value
  const categoryName =
    category === CUSTOM_CATEGORY_VALUE
      ? customCategory.trim()
      : category.trim();

  // Add category heading and an introductory phrase if a category is present
  if (categoryName) {
    prompt += `${TASK_CATEGORY_HEADING} ${categoryName}\n\n${getIntroductionPhrase(category, customCategory)}`;
  }

  // Add context section if provided (and not just whitespace)
  if (context && context.trim()) {
    prompt += `${CONTEXT_HEADING}\n\n${context.trim()}\n\n`;
  }

  // Add request section - assumed mandatory and non-empty based on UI validation
  prompt += `${REQUEST_HEADING}\n\n${request.trim()}\n\n`;

  // Add code input section if provided (and not just whitespace), with language placeholder
  if (codeInput && codeInput.trim()) {
    const language = detectLanguage(codeInput);
    prompt += `${CODE_HEADING}\n\n\`\`\`${language}\n${codeInput.trim()}\n\`\`\`\n`;
  }

  // Add a polite closing statement
  prompt += '\nThank you for your assistance!';

  return prompt;
}
