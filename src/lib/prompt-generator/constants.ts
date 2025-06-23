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
  'Job Applications',
  'Copy Writing',
  'Email Drafting',
  'Document Writing',
  'General Assistance',
  'Prompt Generation',
  'Data Analysis',
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
  'Job Applications': {
    defaultContext:
      'Consider the context of preparing for a job application, including resumes, cover letters, and interview preparation.',
    defaultRequest:
      'Provide assistance related to job applications, such as optimizing a resume, drafting a cover letter, or preparing for an interview.',
  },
  'Copy Writing': {
    defaultContext:
      'Consider the context of creating compelling and effective written content for various purposes.',
    defaultRequest:
      'Generate or refine written content, such as marketing copy, articles, or creative writing pieces.',
  },
  'Email Drafting': {
    defaultContext:
      'Consider the context of drafting professional and effective emails for various purposes.',
    defaultRequest:
      'Draft an email based on the provided details, ensuring clarity, conciseness, and appropriate tone.',
  },
  'Document Writing': {
    defaultContext:
      'Consider the context of writing comprehensive documents such as executive summaries, reports, or proposals.',
    defaultRequest:
      'Write or refine a document, such as an executive summary, report, or proposal, based on the provided information.',
  },
  'General Assistance': {
    defaultContext:
      'Consider the context of a general task or request that does not fit into other specific categories.',
    defaultRequest:
      'Provide general assistance or information based on the input provided.',
  },
  'Prompt Generation': {
    defaultContext:
      'Consider the context of generating or enhancing prompts for AI models.',
    defaultRequest:
      'Generate a new prompt or enhance an existing prompt based on the provided details.',
  },
  'Data Analysis': {
    defaultContext:
      'Consider the context of analyzing data, extracting insights, or generating reports.',
    defaultRequest:
      'Analyze the provided data and generate insights or a report based on the requirements.',
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
export const TASK_CATEGORY_HEADING = '### Task Category:';
export const CONTEXT_HEADING = '### Context:';
export const REQUEST_HEADING = '### Request:';
export const PARENT_TASK_HEADING = '### Parent Task:';
export const SUBTASK_HEADING = '### Subtask:';
export const CODE_HEADING = '### Code:';

// Object for introduction phrases based on standard category values.
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
  'Job Applications': 'I need assistance with my job application process. ',
  'Copy Writing': 'I need help with writing or refining content. ',
  'Email Drafting': 'I need assistance with drafting an email. ',
  'Document Writing': 'I need help with writing or refining a document. ',
  'General Assistance': 'I need general assistance with a task. ',
  'Prompt Generation':
    'I need assistance with generating or enhancing prompts. ',
  'Data Analysis': 'I need assistance with data analysis. ',
} as const;
