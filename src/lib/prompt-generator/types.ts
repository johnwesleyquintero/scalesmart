export interface PromptData {
  category: string;
  customCategory: string;
  context: string;
  request: string;
  parentTask: string;
  subtask: string;
  codeInput: string;
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
  | 'parentTask'
  | 'subtask'
  | 'codeInput';
