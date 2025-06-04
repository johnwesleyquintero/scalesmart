// --- Constants for improved readability and maintainability ---

export const STORAGE_KEY = 'currentWorkflow';

// Node Labels (assuming these are defaults or fallback labels)
export const NODE_LABEL_START = 'Start Node';
export const NODE_LABEL_LOG = 'Log Node';
export const NODE_LABEL_END = 'End Node';
export const NODE_MESSAGE_HELLO = 'Hello, world!'; // Example default data for log node

// Toast Messages & Titles
export const TOAST_TITLE_SAVE_SUCCESS = 'Workflow Saved';
export const TOAST_DESC_SAVE_SUCCESS =
  'Your workflow has been successfully saved!';
export const TOAST_TITLE_SAVE_FAILED = 'Save Failed';
export const TOAST_DESC_SAVE_FAILED =
  'Failed to save workflow. Please check the console.';

export const TOAST_TITLE_LOAD_SUCCESS = 'Workflow Loaded';
export const TOAST_DESC_LOAD_SUCCESS =
  'Your workflow has been successfully loaded!';
export const TOAST_TITLE_LOAD_FAILED = 'Load Failed';
export const TOAST_DESC_LOAD_FAILED_PARSE =
  'Saved workflow data is corrupted. Cannot parse.';
export const TOAST_DESC_LOAD_FAILED_INVALID =
  'Loaded data structure is invalid. Please check the console.';
export const TOAST_DESC_LOAD_FAILED_UNEXPECTED =
  'Saved data is in an unexpected format.';
export const TOAST_TITLE_NO_WORKFLOW = 'No Workflow Found';
export const TOAST_DESC_NO_WORKFLOW = 'No saved workflow found in storage.';

export const TOAST_TITLE_EXECUTION_INITIATED = 'Execution Initiated';
export const TOAST_DESC_EXECUTION_INITIATED = 'Workflow execution started.';
export const TOAST_TITLE_EXECUTION_FAILED = 'Execution Failed';
export const TOAST_DESC_EXECUTION_FAILED_ENGINE =
  'Workflow engine not properly initialized.';
export const TOAST_DESC_EXECUTION_FAILED_GENERAL =
  'Could not execute workflow. Check console for details.';

// Toast Variants (Assuming ShadCN variants)
export const TOAST_VARIANT_SUCCESS = 'success';
export const TOAST_VARIANT_DESTRUCTIVE = 'destructive';
export const TOAST_VARIANT_INFO = 'info';
