// Define standard categories as a constant array for clarity and type safety.
export const CATEGORIES = [
  'General Assistance',
  'Analysis & Research',
  'Content Creation',
  'Technical Problem Solving',
  'Strategic Planning',
  'Email & Communication',
  'Documentation & Writing',
  'Code & Development',
  'Data Processing',
  'Job Applications',
  'Prompt Engineering',
  'Learning & Education',
  'Creative Ideation',
  'Personal Productivity',
] as const; // Use 'as const' for a read-only tuple type

// Define a union type from the CATEGORIES array
export type StandardCategory = (typeof CATEGORIES)[number];

export type CustomCategory = typeof CUSTOM_CATEGORY_VALUE;

// You could potentially define a union for *all* possible category keys
export type CategoryKey = StandardCategory | '' | CustomCategory;

// Define a constant for the 'custom' category value used in the Select component state.
export const CUSTOM_CATEGORY_VALUE = 'custom' as const;

// Define default texts based on categories for generating the prompt
// when corresponding user input fields are empty.
export const DEFAULT_PROMPT_TEXTS = {
  '': {
    // Default for initial state or when no standard/custom category is clearly resolved
    defaultContext: 'Consider the overall context of the task.',
    defaultRequest:
      'Provide general assistance based on the input provided below.',
  },
  'General Assistance': {
    defaultContext: 'Consider the context of a general task or inquiry.',
    defaultRequest:
      'Provide general assistance or information based on the input provided.',
  },
  'Analysis & Research': {
    defaultContext:
      'Consider the context of analyzing information or performing research.',
    defaultRequest:
      'Analyze the provided information and generate insights or a summary based on the requirements.',
  },
  'Content Creation': {
    defaultContext:
      'Consider the context of creating compelling and effective written or creative content.',
    defaultRequest:
      'Generate or refine content, such as marketing copy, articles, or creative pieces.',
  },
  'Technical Problem Solving': {
    defaultContext:
      'Consider the context of solving a technical challenge or debugging an issue.',
    defaultRequest:
      'Analyze the provided details to identify solutions or fix the described problem.',
  },
  'Strategic Planning': {
    defaultContext:
      'Consider the context of developing a strategy or long-term plan.',
    defaultRequest:
      'Help develop a strategic framework or action plan based on the provided goals.',
  },
  'Email & Communication': {
    defaultContext:
      'Consider the context of drafting professional and effective communication.',
    defaultRequest:
      'Draft a communication piece based on the provided details, ensuring clarity and appropriate tone.',
  },
  'Documentation & Writing': {
    defaultContext:
      'Consider the context of writing or improving formal documentation.',
    defaultRequest:
      'Generate or improve documentation for the provided topic or process.',
  },
  'Code & Development': {
    defaultContext: 'Consider the context of a software development task.',
    defaultRequest:
      'Assist with coding, refinement, or technical implementation based on the requirements.',
  },
  'Data Processing': {
    defaultContext: 'Consider the context of processing or transforming data.',
    defaultRequest:
      'Process the provided data and generate the requested output or analysis.',
  },
  'Job Applications': {
    defaultContext:
      'Consider the context of preparing for a professional application.',
    defaultRequest:
      'Provide assistance related to career materials, such as resumes or cover letters.',
  },
  'Prompt Engineering': {
    defaultContext: 'Consider the context of optimizing AI prompts.',
    defaultRequest:
      'Enhance or generate a prompt based on the provided details for better AI performance.',
  },
  'Learning & Education': {
    defaultContext:
      'Consider the context of explaining complex concepts or providing educational assistance.',
    defaultRequest:
      'Explain the provided topic in simple, easy-to-understand terms, using analogies if appropriate.',
  },
  'Creative Ideation': {
    defaultContext:
      'Consider the context of brainstorming and generating creative ideas.',
    defaultRequest:
      'Generate a list of creative and unique ideas based on the provided goals and audience.',
  },
  'Personal Productivity': {
    defaultContext:
      'Consider the context of improving personal organization or productivity.',
    defaultRequest:
      'Provide a structured plan or advice to help manage tasks and improve efficiency.',
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
export const CODE_HEADING = '### Relevant Data/Reference:';

// Object for introduction phrases based on standard category values.
// The 'custom' category value is handled separately in the getIntroductionPhrase function in utils.ts.
export const INTRODUCTION_PHRASES = {
  '': 'I need general assistance. ',
  'General Assistance': 'I need general assistance with a task. ',
  'Analysis & Research': 'I am looking for an analysis of this information. ',
  'Content Creation': 'I need help with writing or refining content. ',
  'Technical Problem Solving': 'I need help solving a technical issue. ',
  'Strategic Planning': 'I need help developing a strategic plan. ',
  'Email & Communication': 'I need assistance with drafting a communication. ',
  'Documentation & Writing':
    'I require documentation or writing assistance for this topic. ',
  'Code & Development': 'I need assistance with a development task. ',
  'Data Processing': 'I need help processing or analyzing this data. ',
  'Job Applications': 'I need assistance with my job application process. ',
  'Prompt Engineering':
    'I need assistance with generating or enhancing prompts. ',
  'Learning & Education': 'I need help explaining or learning about a topic. ',
  'Creative Ideation':
    'I am looking for creative ideas and brainstorming assistance. ',
  'Personal Productivity':
    'I need help with personal organization and productivity. ',
} as const;

// Auto-save constants
export const AUTOSAVE_DEBOUNCE_MS = 1000;
export const AUTOSAVE_KEY = 'promptGeneratorFormState';
export const SAVED_REQUESTS_KEY = 'savedPromptRequests';

// Validation messages
export const REQUIRED_CATEGORY_MESSAGE = "Please select a 'Category'.";
export const REQUIRED_REQUEST_MESSAGE = "The 'Request' field is required.";
export const REQUIRED_CUSTOM_CATEGORY_MESSAGE =
  "Please enter a value for the 'Custom Category'.";
