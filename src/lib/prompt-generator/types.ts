export interface PromptData {
  category: CategoryValue;
  customCategory?: string;
  request: string;
  context: string;
  code: string;
  parentTask: string;
  subtask: string;
  outputFormat: string;
  constraints: string;
  examples: string;
  tone: string;
  additionalInfo: string;
}

import { INTRODUCTION_PHRASES, CUSTOM_CATEGORY_VALUE } from './constants';

export type CategoryValue =
  | keyof typeof INTRODUCTION_PHRASES
  | typeof CUSTOM_CATEGORY_VALUE;

export interface SavedRequest {
  id: string;
  name: string;
  data: PromptData;
  timestamp: number; // Added timestamp for saving
}

export type PromptDataKey =
  | 'customCategory'
  | 'context'
  | 'request'
  | 'code'
  | 'parentTask'
  | 'subtask'
  | 'outputFormat'
  | 'constraints'
  | 'examples'
  | 'tone'
  | 'additionalInfo';
