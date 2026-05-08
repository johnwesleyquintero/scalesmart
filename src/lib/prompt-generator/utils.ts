import {
  CATEGORIES,
  CUSTOM_CATEGORY_VALUE,
  DEFAULT_PROMPT_TEXTS,
  TASK_CATEGORY_HEADING,
  CONTEXT_HEADING,
  REQUEST_HEADING,
  PARENT_TASK_HEADING,
  SUBTASK_HEADING,
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
  // HTML/XML check: Looks for common tag structures and angle brackets.
  if (
    trimmedCode.startsWith('<') &&
    trimmedCode.endsWith('>') &&
    /<\/?\w+>/.test(trimmedCode)
  ) {
    return 'html';
  }
  // JSON check: Looks for curly or square brackets at start/end and attempts parsing.
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
  // TypeScript/JavaScript check: Looks for common keywords like import, export, function, const, class, async, await.
  if (
    /\b(import|export|function|const|let|class|interface|async|await)\b/.test(
      trimmedCode,
    )
  ) {
    return 'typescript';
  }
  // Python check: Looks for 'def', 'print', 'import' followed by colon or variable assignment without semicolon.
  if (
    /\b(def|print|import)\b.*:/.test(trimmedCode) ||
    (/^\s*\w+\s*=/.test(trimmedCode) && !trimmedCode.includes(';'))
  ) {
    return 'python';
  }
  // Java check: Looks for access modifiers, class/interface keywords, or main method signature.
  if (
    /\b(public|private|protected)\b.*\b(class|interface)\b/.test(trimmedCode) ||
    /\b(static|void|String)\b.*main\s*\(/.test(trimmedCode)
  ) {
    return 'java';
  }
  // PHP check: Looks for '<?php' start tag or common keywords followed by semicolon.
  if (
    trimmedCode.startsWith('<?php') ||
    /\b(function|echo|namespace)\b.*;/.test(trimmedCode)
  ) {
    return 'php';
  }
  // C/C++ check: Looks for include directives or main function signature.
  if (
    /#include\s*<.*>/.test(trimmedCode) ||
    /\b(int|void)\s*main\s*\(.*\)\s*\{/.test(trimmedCode)
  ) {
    return 'c';
  }
  // SQL check: Looks for common SQL keywords like SELECT, FROM, WHERE, INSERT, UPDATE, DELETE (case-insensitive).
  if (/\b(SELECT|FROM|WHERE|INSERT|UPDATE|DELETE)\b/i.test(trimmedCode)) {
    return 'sql';
  }

  return 'plaintext'; // Default fallback
}

/**
 * Prepares the prompt data by applying defaults for empty fields and trimming values.
 * @param {PromptData} data - The raw input data.
 * @returns {PromptData} The prepared prompt data with defaults applied.
 */
export function preparePromptData(data: PromptData): PromptData {
  const defaults =
    DEFAULT_PROMPT_TEXTS[data.category as keyof typeof DEFAULT_PROMPT_TEXTS] ||
    DEFAULT_PROMPT_TEXTS[''];

  return {
    ...data,
    context:
      data.context.trim() === ''
        ? defaults.defaultContext
        : data.context.trim(),
    request:
      data.request.trim() === ''
        ? defaults.defaultRequest
        : data.request.trim(),
    parentTask: data.parentTask.trim(),
    subtask: data.subtask.trim(),
    customCategory: data.customCategory?.trim() || '',
    code: data.code?.trim() || '',
    outputFormat: data.outputFormat?.trim() || '',
    constraints: data.constraints?.trim() || '',
    examples: data.examples?.trim() || '',
    tone: data.tone?.trim() || '',
    additionalInfo: data.additionalInfo?.trim() || '',
  };
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
  // Destructure the relevant data from the input object.
  // This ensures we are only using the data provided by the component's state.
  const {
    category,
    customCategory,
    context,
    request,
    parentTask,
    subtask,
    code,
  } = data;
  let prompt = '';

  // Determine the category name for the heading based on the selected category value.
  // Use the trimmed custom category text if 'custom' is selected, otherwise use the trimmed standard category.
  // Determine the category name for the heading based on the selected category value.
  // If 'custom' is selected, use the trimmed custom category text, defaulting to 'Custom' if empty.
  // Otherwise, use the trimmed standard category name.
  const categoryName =
    category === CUSTOM_CATEGORY_VALUE
      ? customCategory?.trim() || 'Custom'
      : category.trim();

  // Add category heading and an introductory phrase if a category name is determined.
  // The introduction phrase is based on the selected category value.
  if (categoryName) {
    prompt += `${TASK_CATEGORY_HEADING} ${categoryName}\n${getIntroductionPhrase(category as CategoryValue, customCategory || '')}\n\n`;
  }

  // Add context section if provided and not just whitespace.
  // Explicitly use the 'context' from the input data.
  if (context && context.trim()) {
    prompt += `${CONTEXT_HEADING}\n${context.trim()}\n\n`;
  }

  // Add request section. This is assumed mandatory and non-empty based on UI validation in the component.
  // Explicitly use the 'request' from the input data.
  prompt += `${REQUEST_HEADING}\n${request.trim()}\n\n`;

  // Add parent task section if provided and not just whitespace.
  if (parentTask && parentTask.trim()) {
    prompt += `${PARENT_TASK_HEADING}\n${parentTask.trim()}\n\n`;
  }

  // Add subtask section if provided and not just whitespace.
  if (subtask && subtask.trim()) {
    prompt += `${SUBTASK_HEADING}\n${subtask.trim()}\n\n`;
  }

  // Add code input section if provided and not just whitespace.
  // Detect the programming language for syntax highlighting in the Markdown code block.
  // Explicitly use the 'code' from the input data.
  if (code && code.trim()) {
    const language = detectLanguage(code);
    prompt += `${CODE_HEADING}\n\`\`\`${language}\n${code.trim()}\n\`\`\`\n\n`;
  }

  // Add a polite closing statement to the prompt.
  prompt += '\nThank you for your assistance!';

  return prompt;
}
