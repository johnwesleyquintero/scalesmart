import { CATEGORIES, CUSTOM_CATEGORY_VALUE } from './constants';

// Define the type for valid category values, including 'custom' and an empty string for the initial state.
export type CategoryValue =
  | (typeof CATEGORIES)[number]
  | typeof CUSTOM_CATEGORY_VALUE
  | '';

// Type definition for prompt data fields used in the component state
// and expected by the generatePromptUtility function.
export interface PromptData {
  category: CategoryValue; // Holds the selected standard category value or 'custom'
  customCategory: string; // Holds the user-defined custom category text (only relevant if category is 'custom')
  context: string; // Background information
  request: string; // The core request description (required)
  parentTask: string; // Optional parent task for task-related prompts
  subtask: string; // Optional subtask for task-related prompts
  codeInput: string; // Relevant code snippet (optional)
}
