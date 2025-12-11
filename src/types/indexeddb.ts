import { QuizResult } from '../lib/types';
import { Layout } from 'react-grid-layout'; // Import Layout from react-grid-layout

// Define Category interface
//

export interface WidgetConfig {
  id: string;
  // Add other properties of WidgetConfig if they are used in this file
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
  predictionData: unknown;
  synced?: number;
}

// Define ProjectStatus enum
//

// Define TaskStatus enum
//

// Define TaskPriority enum
//

// --- Shared IndexedDB Types ---

//

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

//

// Unified Task interface
//

// Unified Project interface
//

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
//

//

// Define constants for duplicate strings
