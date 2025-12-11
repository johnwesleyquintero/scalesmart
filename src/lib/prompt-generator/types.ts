export type AIModel =
  | 'gpt-4'
  | 'gpt-4-turbo'
  | 'gpt-3.5-turbo'
  | 'claude-3-opus'
  | 'claude-3-sonnet'
  | 'claude-3-haiku';

export interface PromptData {
  category: CategoryValue;
  customCategory?: string;
  request: string;
  context: string;
  codeInput: string;
  parentTask: string;
  subtask: string;
  outputFormat: string;
  constraints: string;
  examples: string;
  tone: string;
  additionalInfo: string;
  aiModel?: AIModel;
  temperature?: number;
}

import { INTRODUCTION_PHRASES, CUSTOM_CATEGORY_VALUE } from './constants';

export type CategoryValue =
  | keyof typeof INTRODUCTION_PHRASES
  | typeof CUSTOM_CATEGORY_VALUE;

export interface SavedRequest {
  id: string;
  name: string;
  data: PromptData;
}

export type PromptDataKey =
  | 'customCategory'
  | 'context'
  | 'request'
  | 'codeInput'
  | 'parentTask'
  | 'subtask'
  | 'outputFormat'
  | 'constraints'
  | 'examples'
  | 'tone'
  | 'additionalInfo'
  | 'aiModel'
  | 'temperature';
