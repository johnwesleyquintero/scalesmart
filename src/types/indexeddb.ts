import { Contact, CommunicationLog } from '../app/crm/types';
import {
  ProductResearchData,
  KeywordTrackingData,
  ListingOptimizationData,
  AnalyticsData,
  CompetitorMonitoringData, // Added
  InventoryData, // Added
  CustomerReviewData, // Added
} from './amazon-tools';
import { QuizResult } from '../lib/types';
import { WidgetConfig } from '../app/dashboard-studio/widget-types'; // Import WidgetConfig
import { Layout } from 'react-grid-layout'; // Import Layout from react-grid-layout

// Define Category interface
export interface Category {
  id: string;
  name: string;
  synced?: number; // New property to track sync status (0 for unsynced, 1 for synced)
}

export interface Dashboard {
  id: string;
  name: string;
  widgets: WidgetConfig[];
  layout: Layout;
  refreshInterval?: number;
  synced?: number;
}

export interface Prediction {
  id: string;
  timestamp: number;
  predictionData: unknown; // This can be more specific later if needed
  synced?: number;
}

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
  id?: number | string; // Reverted to optional
  chatSessionId: string;
  sender: 'user' | 'ai' | 'system';
  text: string;
  timestamp: number;
  metadata?: Record<string, unknown>;
  synced?: number; // New property to track sync status (0 for unsynced, 1 for synced)
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
  category: string;
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
  synced?: number; // New property to track sync status (0 for unsynced, 1 for synced)
}

// Unified Project interface
export interface Project {
  id: string;
  name: string;
  description?: string;
  createdAt: number;
  updatedAt: number;
  status: ProjectStatus; // Use imported enum
  synced?: number; // New property to track sync status (0 for unsynced, 1 for synced)
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
export interface Note {
  id: string;
  title: string; // Add title field for better tab organization
  markdown: string;
  category: string;
  createdAt: number;
  updatedAt: number;
  synced: number; // New property to track sync status (0 for unsynced, 1 for synced)
}

export interface MarkdownNoteVersion {
  id?: number; // IndexedDB key
  noteId: string;
  markdown: string;
  timestamp: number; // When this version was saved
}

// Define constants for duplicate strings

/**
 * Defines the structure for an Amazon report stored in IndexedDB.
 */
export interface AmazonReport {
  id: string; // Made non-optional
  fileName: string;
  category: string;
  uploadDate: number; // Timestamp
  parsedData: (
    | ProductResearchData
    | KeywordTrackingData
    | ListingOptimizationData
    | AnalyticsData
    | CompetitorMonitoringData // Added
    | InventoryData // Added
    | CustomerReviewData // Added
  )[]; // Array of parsed rows
  synced?: number; // New property to track sync status (0 for unsynced, 1 for synced)
}
