// --- IndexedDB Store Names for Project Management Data ---
export const PROJECT_STORE = 'projects';
export const TASK_STORE = 'tasks';
export const TASK_COMMENT_STORE = 'task-comments';

import { TaskStatus } from '@/types/indexeddb';

export const TASK_STATUSES = [
  { id: TaskStatus.Open, title: 'To Do' },
  { id: TaskStatus.InProgress, title: 'In Progress' },
  { id: TaskStatus.Completed, title: 'Completed' },
] as const;
export const NO_PROJECT_VALUE = 'no-project';
