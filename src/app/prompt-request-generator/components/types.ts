import { PromptData } from '@/lib/prompt-generator/types';

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
