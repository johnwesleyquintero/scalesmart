import { QuizResult } from './index'; // Assuming QuizResult is in index.ts
import { Contact, Category, CommunicationLog } from '@/app/crm/types'; // Import CRM types

// Define ProjectStatus enum
export enum ProjectStatus {
  Active = 'Active',
  Completed = 'Completed',
  OnHold = 'OnHold',
  Cancelled = 'Cancelled',
}

// Define TaskStatus enum
export enum TaskStatus {
  Open = 'Open',
  InProgress = 'InProgress',
  Blocked = 'Blocked',
  Completed = 'Completed',
  Cancelled = 'Cancelled',
}

// Define TaskPriority enum
export enum TaskPriority {
  Low = 'Low',
  Medium = 'Medium',
  High = 'High',
  Urgent = 'Urgent',
}

// --- Shared IndexedDB Types ---

export interface ChatMessageRecord {
  id?: number;
  chatSessionId: string;
  sender: 'user' | 'ai' | 'system';
  text: string;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

export interface ModuleProgressRecord {
  userId: string;
  courseId: string;
  moduleId: string;
  progress: number;
  lastUpdated: number;
}

export interface QuizResultRecord {
  userId: string;
  moduleId: string;
  result: QuizResult;
  lastUpdated: number;
}

export interface TaskComment {
  id: string;
  taskId: string;
  userId: string;
  content: string;
  createdAt: number;
}

// Unified Task interface
export interface Task {
  id: string;
  projectId: string; // Assuming a task must belong to a project
  title: string;
  description?: string;
  status: TaskStatus; // Use imported enum
  priority?: TaskPriority; // Use imported enum
  dueDate?: number; // Timestamp
  assigneeId?: string; // Using assigneeId instead of assignee string
  dependencies?: string[]; // Array of task IDs
  subtaskIds?: string[]; // Array of task IDs, renamed for clarity
  order?: number; // Property for sorting tasks within a list
  createdAt: number;
  updatedAt: number;
  comments: TaskComment[];
}

// Unified Project interface
export interface Project {
  id: string;
  name: string;
  description?: string;
  createdAt: number;
  updatedAt: number;
  status: ProjectStatus; // Use imported enum
}

export interface Event {
  id?: number;
  date: string;
  title: string;
  description?: string;
}

export interface CalculationData {
  id?: string;
  campaignName: string;
  adSpend: number;
  sales: number;
  acos: number;
  roas: number;
  date: number;
  currencySymbol: string;
}

// Re-export CRM types for convenience if needed elsewhere
export type { Contact, Category, CommunicationLog };
