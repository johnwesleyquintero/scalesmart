import Dexie, { Table } from 'dexie';
import { INDEXED_DB_ACOS_CALCULATOR_HISTORY_KEY } from './constants';
import { NO_PROJECT_VALUE } from '@/lib/constants/project-management'; // Import NO_PROJECT_VALUE
import { QuizResult, Course } from '@/types'; // Import QuizResult and Course from '@/types'
import {
  Contact,
  CommunicationLog,
  ActivityLog,
  SalesOpportunity,
} from '@/app/crm/types'; // Import CRM types
import {
  Category,
  Note,
  MarkdownNoteVersion,
  AmazonReport,
} from '@/types/indexeddb'; // Import Category, Note, MarkdownNoteVersion, AmazonReport from '@/types/indexeddb'
import {
  ChatMessageRecord,
  ModuleProgressRecord,
  QuizResultRecord,
  TaskComment,
  Task,
  Project,
  Event,
  CalculationData,
} from '@/types/indexeddb'; // Import other types from unified types

export type {
  TaskComment,
  Task,
  Project,
  CalculationData,
  Contact,
  Category,
  CommunicationLog,
  ActivityLog,
  Event,
  ChatMessageRecord,
  ModuleProgressRecord,
  QuizResultRecord,
  Course,
  Note,
  MarkdownNoteVersion,
  AmazonReport,
};

// Define constants for duplicate strings
const ERROR_MESSAGE_PREFIX = 'IndexedDBService';
const DB_OPEN_FAILED = 'Failed to open ScaleSmartDatabase';
const DB_INITIALIZED = 'ScaleSmartDatabase initialized and opened successfully';
const DB_ALREADY_OPEN = 'ScaleSmartDatabase is already open';
const DB_OPERATION_FAILED = 'operation failed';

class ScaleSmartDatabase extends Dexie {
  // Chat Interface
  public chatMessages!: Table<ChatMessageRecord, number>;
  public cache!: Table<{ key: string; value: unknown }, string>;

  // Calendar Events
  public events!: Table<Event, number>;

  // CRM
  public crmContacts!: Table<Contact, string>;
  public crmCategories!: Table<Category, string>;
  public crmCommunicationLogs!: Table<CommunicationLog, string>;
  public crmActivityLogs!: Table<ActivityLog, string>;
  public crmEmailTemplates!: Table<{ id: string; name: string }, string>; // Assuming a simple structure for email templates
  public crmSalesOpportunities!: Table<SalesOpportunity, string>;

  // Project Management
  public tasks!: Table<Task, string>;
  public projects!: Table<Project, string>;
  public taskComments!: Table<TaskComment, string>;

  // Academy
  public courses!: Table<Course, string>;
  public moduleProgress!: Table<ModuleProgressRecord, [string, string, string]>;
  public quizResults!: Table<QuizResultRecord, [string, string]>;

  // Amazon Seller Tools
  public calculations!: Table<CalculationData, string>;
  public amazonReports!: Table<AmazonReport, string>; // New table for Amazon reports

  // Markdown Notepad
  public markdownNotes!: Table<Note, string>;
  public markdownNoteVersions!: Table<MarkdownNoteVersion, number>;

  constructor() {
    super('ScaleSmartDatabase');
    this.version(18).stores({
      // Chat Interface
      chatMessages: '++id, chatSessionId, timestamp, sender',
      cache: 'key',

      // Calendar Events
      events: '++id, date',

      // CRM
      'crm-contacts':
        'id, name, email, phone, company, notes, category, createdAt, updatedAt, lastActivity', // Added lastActivity
      'crm-categories': 'id, name',
      'crm-communication-logs': 'id, customerId, type, date, subject, notes',
      'crm-activity-logs': 'id, contactId, type, date, notes',
      'crm-email-templates': 'id, name',
      'crm-sales-opportunities':
        'id, name, status, amount, closeDate, contactId, createdAt, updatedAt',

      // Project Management
      tasks:
        'id, title, description, status, assignee, dueDate, projectId, createdAt, updatedAt, dependencies, subtasks, priority, order',
      projects: 'id, name, description, createdAt, updatedAt, status', // Added status

      // Academy
      courses:
        'id, title, description, duration, level, metadata.category, metadata.tags, createdAt, updatedAt',
      moduleProgress:
        '[userId+courseId+moduleId], userId, courseId, moduleId, progress, lastUpdated',
      quizResults: '[userId+moduleId], userId, moduleId, result, lastUpdated',

      // Amazon Seller Tools
      calculations: 'id, campaignName, date',
      amazonReports: 'id, fileName, category, uploadDate', // Schema for Amazon reports

      // Markdown Notepad
      markdownNotes: 'id, title, category, createdAt, updatedAt', // Added title
      markdownNoteVersions: '++id, noteId, timestamp', // For version history
      taskComments: 'id, taskId, createdAt, userId',
    });
  }
}

export const db = new ScaleSmartDatabase();

export const initializeDB = async (): Promise<void> => {
  try {
    if (!db.isOpen()) {
      try {
        await db.open();
        console.log(DB_INITIALIZED);
      } catch (openError) {
        logError(openError, DB_OPEN_FAILED, ERROR_MESSAGE_PREFIX);
        throw openError;
      }
    } else {
      console.log(DB_ALREADY_OPEN);
    }
  } catch (error) {
    logError(
      error,
      `Failed to initialize ScaleSmartDatabase`,
      ERROR_MESSAGE_PREFIX,
    );
    throw error;
  }
};

function logError(error: unknown, message: string, component: string) {
  console.error(`${component}: ${message}`, error);
}

// --- Generic CRUD Operations ---

export async function setItem<T>(
  storeName: string,
  key: string,
  value: T,
): Promise<void> {
  try {
    const table = db.table(storeName);
    // For chatMessages, the primary key is 'id' within the object itself.
    // For other stores, 'key' might be used as the primary key.
    if (storeName === 'chatMessages') {
      await table.put(value);
    } else {
      // Ensure the value object contains the key, especially for stores with in-line keys
      const valueWithKey = { ...value, id: key };
      await table.put(valueWithKey);
    }
  } catch (error) {
    logError(
      error,
      `Error setting item in store "${storeName}" with key "${key}"`,
      ERROR_MESSAGE_PREFIX,
    );
    throw error; // Re-throw to allow specific services to handle
  }
}

export async function getItem<T>(
  storeName: string,
  key: string,
): Promise<T | undefined> {
  try {
    const table = db.table(storeName);
    return await table.get(key);
  } catch (error) {
    logError(
      error,
      `Error getting item from store "${storeName}" with key "${key}"`,
      ERROR_MESSAGE_PREFIX,
    );
    throw error; // Re-throw
  }
}

export async function bulkSetItems<T>(
  storeName: string,
  items: T[],
): Promise<void> {
  try {
    const table = db.table(storeName);
    await table.bulkPut(items);
  } catch (error) {
    logError(
      error,
      `Error bulk setting items in store "${storeName}"`,
      ERROR_MESSAGE_PREFIX,
    );
    throw error;
  }
}

export async function deleteItem(
  storeName: string,
  key: string,
): Promise<void> {
  try {
    const table = db.table(storeName);
    await table.delete(key);
  } catch (error) {
    logError(
      error,
      `Error deleting item from store "${storeName}" with key "${key}"`,
      ERROR_MESSAGE_PREFIX,
    );
    throw error; // Re-throw
  }
}

export async function getNoteCountsByCategory(): Promise<Map<string, number>> {
  try {
    const notes = await db.tasks.toArray();
    const counts = new Map<string, number>();

    for (const note of notes) {
      const category = note.category || 'Uncategorized'; // Assuming 'category' field exists in Task
      counts.set(category, (counts.get(category) || 0) + 1);
    }
    return counts;
  } catch (error) {
    logError(
      error,
      `Error getting note counts by category`,
      ERROR_MESSAGE_PREFIX,
    );
    throw error; // Re-throw
  }
}

/**
 * Fetches courses from the server API.
 * @returns A promise resolving to an array of Course objects from the server.
 * @throws Error if the network request fails or the server responds with an error status.
 */
export const fetchServerCourses = async (): Promise<Course[]> => {
  const serverResponse = await fetch('/api/academy/courses');
  if (!serverResponse.ok) {
    const errorText = await serverResponse
      .text()
      .catch(() => 'Unknown error body');
    throw new Error(
      `HTTP error! status: ${serverResponse.status} from /api/academy/courses. Details: ${errorText}`,
    );
  }
  return serverResponse.json();
};

/**
 * Syncs local IndexedDB courses with server courses.
 * Deletes courses present locally but not on the server, and updates/adds courses from the server.
 * @param indexedDBCourses - Courses currently stored in IndexedDB.
 * @param serverCourses - Courses fetched from the server.
 */
export const syncLocalCourses = async (
  indexedDBCourses: Course[],
  serverCourses: Course[],
): Promise<void> => {
  const serverCourseIds = new Set(serverCourses.map((c) => c.id));
  const coursesToDelete = indexedDBCourses.filter(
    (c) => !serverCourseIds.has(c.id),
  );

  if (coursesToDelete.length > 0) {
    await deleteCoursesByIds(coursesToDelete.map((c) => c.id));
  }

  const updatePromises = serverCourses.map(async (serverCourse) => {
    const existingCourse = indexedDBCourses.find(
      (c) => c.id === serverCourse.id,
    );
    const serverTimestamp = serverCourse.updatedAt
      ? new Date(serverCourse.updatedAt).getTime()
      : 0;
    const existingTimestamp = existingCourse?.updatedAt
      ? new Date(existingCourse.updatedAt).getTime()
      : 0;

    if (!existingCourse || serverTimestamp > existingTimestamp) {
      await updateCourse(serverCourse);
    }
  });

  await Promise.all(updatePromises);
};

/**
 * Fetches courses from the server and syncs them with IndexedDB.
 * Handles updates and deletions to keep local data consistent with the server.
 * @returns A promise resolving to an array of Course objects from IndexedDB.
 * @throws Error if fetching or syncing fails.
 */
export const fetchAndSyncCourses = async (): Promise<Course[]> => {
  try {
    const [indexedDBCourses, serverCourses] = await Promise.all([
      getAllCourses(),
      fetchServerCourses(),
    ]);

    await syncLocalCourses(indexedDBCourses, serverCourses);

    // Re-fetch from local DB to ensure data is current after sync operations
    return await getAllCourses();
  } catch (error: unknown) {
    console.error('Error fetching and syncing courses:', error);
    if (error instanceof Error) {
      console.error('Error details:', error.message, error.stack);
      throw error;
    } else {
      console.error('Unknown error:', error);
      throw new Error(
        `An unknown error occurred during course sync: ${String(error)}`,
      );
    }
  }
};

export async function getAllItemsFromStore<T>(storeName: string): Promise<T[]> {
  try {
    const table = db.table(storeName);
    return await table.toArray();
  } catch (error) {
    logError(
      error,
      `Error getting all items from store "${storeName}"`,
      ERROR_MESSAGE_PREFIX,
    );
    throw error; // Re-throw
  }
}

// --- Specific Service Functions (using generic CRUD) ---

// Note: Many specific functions below were already using direct Dexie calls (e.g., db.contacts.put).
// We will keep those for now as they are already working, but the generic functions are now available
// for other modules (chat-db, crm-db, project-management-db) to use.
// If there's a need to refactor these specific functions to use the generic ones, that can be a separate step.

export const getChatMessagesBySession = async (
  chatSessionId: string,
): Promise<ChatMessageRecord[]> => {
  console.log(
    'indexeddb-service: getChatMessagesBySession called for session:',
    chatSessionId,
  );
  try {
    const messages = await db.chatMessages
      .where('chatSessionId')
      .equals(chatSessionId)
      .sortBy('timestamp');
    console.log(
      'indexeddb-service: getChatMessagesBySession result:',
      messages,
    );
    return messages;
  } catch (error) {
    logError(
      error,
      `Failed to get messages for session ${chatSessionId}`,
      ERROR_MESSAGE_PREFIX,
    );
    console.error(
      'indexeddb-service: Error in getChatMessagesBySession:',
      error,
    );
    return [];
  }
};

export async function getCacheItem<T>(key: string): Promise<T | undefined> {
  try {
    return (await db.cache.get(key).then((item) => item?.value)) as
      | T
      | undefined;
  } catch (error) {
    logError(
      error,
      `Error getting item from cache with key "${key}"`,
      ERROR_MESSAGE_PREFIX,
    );
    return undefined;
  }
}

export async function saveCalculation(data: CalculationData): Promise<void> {
  try {
    await db.transaction('rw', db.calculations, async () => {
      await db.calculations.put({
        ...data,
        id: crypto.randomUUID(),
        date: data.date,
      });
    });
  } catch (error) {
    logError(
      error,
      `Error saving calculation to IndexedDB for campaign "${data.campaignName}"`,
      ERROR_MESSAGE_PREFIX,
    );
  }
}

export async function setCacheItem<T>(key: string, value: T): Promise<void> {
  try {
    await db.cache.put({ key: key, value: value });
  } catch (error) {
    logError(
      error,
      `Error setting item in cache with key "${key}"`,
      ERROR_MESSAGE_PREFIX,
    );
  }
}

export const addEvent = async (event: Event): Promise<number | undefined> => {
  try {
    const id = await db.events.add(event);
    console.log('Event added to IndexedDB:', event);
    return id;
  } catch (error) {
    logError(
      error,
      `Error adding event to IndexedDB: ${event.title}`,
      ERROR_MESSAGE_PREFIX,
    );
    return undefined;
  }
};

export async function getCalculations(): Promise<CalculationData[]> {
  try {
    const calculations = await db.calculations.toArray();
    return calculations;
  } catch (error) {
    logError(
      error,
      `Error getting calculations from IndexedDB`,
      ERROR_MESSAGE_PREFIX,
    );
    return [];
  }
}

export const createContact = async (
  contact: Omit<Contact, 'id' | 'createdAt' | 'updatedAt'>,
): Promise<string | undefined> => {
  try {
    const id = crypto.randomUUID();
    const now = Date.now();
    const contactToStore: Contact = {
      ...contact,
      id,
      createdAt: now,
      updatedAt: now,
    };
    await setItem('contacts', id, contactToStore);
    return id;
  } catch (error) {
    logError(
      error,
      `Error adding contact to IndexedDB: ${contact.name}`,
      ERROR_MESSAGE_PREFIX,
    );
    return undefined;
  }
};

export const getContact = async (id: string): Promise<Contact | undefined> => {
  try {
    const contact = await getItem<Contact>('contacts', id);
    return contact;
  } catch (error) {
    logError(
      error,
      `Error getting contact from IndexedDB: ${id}`,
      ERROR_MESSAGE_PREFIX,
    );
    return undefined;
  }
};

export const updateContact = async (contact: Contact): Promise<void> => {
  try {
    const updatedAt = Date.now();
    const contactToStore = { ...contact, updatedAt };
    await setItem('contacts', contactToStore.id, contactToStore);
  } catch (error) {
    logError(
      error,
      `Error updating contact in IndexedDB: ${contact.name}`,
      ERROR_MESSAGE_PREFIX,
    );
  }
};

export const deleteContact = async (id: string): Promise<void> => {
  try {
    await deleteItem('contacts', id);
  } catch (error) {
    logError(
      error,
      `Error deleting contact from IndexedDB: ${id}`,
      ERROR_MESSAGE_PREFIX,
    );
  }
};

export const createTask = async (
  taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'comments'>,
): Promise<Task | undefined> => {
  try {
    const id = crypto.randomUUID();
    const now = Date.now();
    const taskToStore: Task = {
      ...taskData,
      id,
      createdAt: now,
      updatedAt: now,
      comments: [],
    };
    await setItem('tasks', id, taskToStore);
    return taskToStore;
  } catch (error) {
    logError(
      error,
      `Error adding task to IndexedDB: ${taskData.title}`,
      ERROR_MESSAGE_PREFIX,
    );
    return undefined;
  }
};

export const getTask = async (id: string): Promise<Task | undefined> => {
  try {
    const task = await getItem<Task>('tasks', id);
    return task;
  } catch (error) {
    logError(
      error,
      `Error getting task from IndexedDB: ${id}`,
      ERROR_MESSAGE_PREFIX,
    );
    return undefined;
  }
};

export const updateTask = async (task: Task): Promise<void> => {
  try {
    const updatedAt = Date.now();
    const taskToStore = {
      ...task,
      updatedAt,
      comments: Array.isArray(task.comments) ? task.comments : [],
    };
    await setItem('tasks', taskToStore.id, taskToStore);
  } catch (error) {
    logError(
      error,
      `Error updating task in IndexedDB: ${task.title}`,
      ERROR_MESSAGE_PREFIX,
    );
  }
};

export const deleteTask = async (id: string): Promise<void> => {
  try {
    await deleteItem('tasks', id);
  } catch (error) {
    logError(
      error,
      `Error deleting task from IndexedDB: ${id}`,
      ERROR_MESSAGE_PREFIX,
    );
  }
};

export const createProject = async (
  projectData: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>,
): Promise<string | undefined> => {
  try {
    const id = crypto.randomUUID();
    const now = Date.now();
    const projectToStore: Project = {
      ...projectData,
      id,
      createdAt: now,
      updatedAt: now,
    };
    await setItem('projects', id, projectToStore);
    return id;
  } catch (error) {
    logError(
      error,
      `Error adding project to IndexedDB: ${projectData.name}`,
      ERROR_MESSAGE_PREFIX,
    );
    return undefined;
  }
};

export const getProject = async (id: string): Promise<Project | undefined> => {
  try {
    const project = await getItem<Project>('projects', id);
    return project;
  } catch (error) {
    logError(
      error,
      `Error getting project from IndexedDB: ${id}`,
      ERROR_MESSAGE_PREFIX,
    );
    return undefined;
  }
};

export const getAllProjects = async (): Promise<Project[]> => {
  try {
    const projects = await getAllItemsFromStore<Project>('projects');
    return projects;
  } catch (error) {
    logError(
      error,
      `Error getting all projects from IndexedDB`,
      ERROR_MESSAGE_PREFIX,
    );
    return [];
  }
};

export const updateProject = async (project: Project): Promise<void> => {
  try {
    const projectToStore = { ...project, updatedAt: Date.now() };
    await setItem('projects', projectToStore.id, projectToStore);
  } catch (error) {
    logError(
      error,
      `Error updating project in IndexedDB: ${project.name}`,
      ERROR_MESSAGE_PREFIX,
    );
  }
};

export const deleteProject = async (id: string): Promise<void> => {
  try {
    // Find all tasks associated with the project being deleted
    const tasksToUpdate = await db.tasks
      .where('projectId')
      .equals(id)
      .toArray();

    // Update these tasks to have no projectId
    const updatedTasks = tasksToUpdate.map((task) => ({
      ...task,
      projectId: NO_PROJECT_VALUE, // Use the constant for 'no project'
      updatedAt: Date.now(),
    }));

    // Perform a bulk update for the tasks
    if (updatedTasks.length > 0) {
      await db.tasks.bulkPut(updatedTasks);
      console.log(
        `Updated ${updatedTasks.length} tasks to '${NO_PROJECT_VALUE}' after project deletion.`,
      );
    }

    // Finally, delete the project
    await db.projects.delete(id);
  } catch (error) {
    logError(
      error,
      `Error deleting project from IndexedDB: ${id}`,
      ERROR_MESSAGE_PREFIX,
    );
    throw error; // Re-throw to allow calling function to handle optimistic update revert
  }
};

export const getAllTasks = async (): Promise<Task[]> => {
  try {
    const tasks = await getAllItemsFromStore<Task>('tasks');
    return tasks;
  } catch (error) {
    logError(
      error,
      `Error getting all tasks from IndexedDB`,
      ERROR_MESSAGE_PREFIX,
    );
    return [];
  }
};

export const getAllContacts = async (): Promise<Contact[]> => {
  try {
    const contacts = await getAllItemsFromStore<Contact>('contacts');
    return contacts;
  } catch (error) {
    logError(
      error,
      `Error getting all contacts from IndexedDB`,
      ERROR_MESSAGE_PREFIX,
    );
    return [];
  }
};

export const createCommunicationLog = async (
  log: Omit<CommunicationLog, 'id'>,
): Promise<string | undefined> => {
  try {
    const id = crypto.randomUUID();
    const logToStore = { ...log, id, date: Date.now() };
    await setItem('communicationLogs', id, logToStore);
    return id;
  } catch (error) {
    logError(
      error,
      `Error adding communication log to IndexedDB for customer ${log.customerId}`,
      ERROR_MESSAGE_PREFIX,
    );
    return undefined;
  }
};

export const getCommunicationLogsByCustomerId = async (
  customerId: string,
): Promise<CommunicationLog[]> => {
  try {
    const logs = await db.crmCommunicationLogs
      .where('customerId')
      .equals(customerId)
      .sortBy('date');
    return logs;
  } catch (error) {
    logError(
      error,
      `Error getting communication logs for customer ${customerId} from IndexedDB`,
      ERROR_MESSAGE_PREFIX,
    );
    return [];
  }
};

export const updateCommunicationLog = async (
  log: CommunicationLog,
): Promise<void> => {
  try {
    const updatedLog = { ...log, date: Date.now() };
    await setItem('communicationLogs', updatedLog.id, updatedLog);
  } catch (error) {
    logError(
      error,
      `Error updating communication log in IndexedDB: ${log.id}`,
      ERROR_MESSAGE_PREFIX,
    );
  }
};

export const deleteCommunicationLog = async (
  id: string,
  customerId: string,
): Promise<void> => {
  try {
    await deleteItem('communicationLogs', id);
  } catch (error) {
    logError(
      error,
      `Error deleting communication log from IndexedDB: ${id}`,
      ERROR_MESSAGE_PREFIX,
    );
  }
};

export const createCourse = async (
  courseData: Omit<Course, 'id' | 'createdAt' | 'updatedAt'>,
): Promise<string | undefined> => {
  try {
    const id = crypto.randomUUID();
    const now = Date.now();
    const courseToStore: Course = {
      ...courseData,
      id,
      createdAt: now,
      updatedAt: now,
    };
    await setItem('courses', id, courseToStore);
    return id;
  } catch (error) {
    logError(
      error,
      `Error adding course to IndexedDB: ${courseData.title}`,
      ERROR_MESSAGE_PREFIX,
    );
    return undefined;
  }
};

export const updateModuleProgress = async (
  userId: string,
  courseId: string,
  moduleId: string,
  progress: number,
): Promise<void> => {
  try {
    const record: ModuleProgressRecord = {
      userId,
      courseId,
      moduleId,
      progress,
      lastUpdated: Date.now(),
    };
    console.log('DEBUG: Attempting to put moduleProgress record:', record);
    await db.moduleProgress.put(record);
  } catch (error) {
    logError(
      error,
      `Error updating module progress for user ${userId}, course ${courseId}, module ${moduleId}`,
      ERROR_MESSAGE_PREFIX,
    );
  }
};

export const getModuleProgress = async (
  userId: string,
  courseId: string,
  moduleId: string,
): Promise<number> => {
  try {
    const record = await db.moduleProgress.get([userId, courseId, moduleId]);
    return record?.progress || 0;
  } catch (error) {
    logError(
      error,
      `Error getting module progress for user ${userId}, course ${courseId}, module ${moduleId}`,
      ERROR_MESSAGE_PREFIX,
    );
    return 0;
  }
};

export const updateQuizResult = async (
  userId: string,
  moduleId: string,
  result: QuizResult,
): Promise<void> => {
  try {
    const record: QuizResultRecord = {
      userId,
      moduleId,
      result,
      lastUpdated: Date.now(),
    };
    console.log('DEBUG: Attempting to put quizResults record:', record);
    await db.quizResults.put(record);
  } catch (error) {
    logError(
      error,
      `Error updating quiz result for user ${userId}, module ${moduleId}`,
      ERROR_MESSAGE_PREFIX,
    );
  }
};

export const getQuizResult = async (
  userId: string,
  moduleId: string,
): Promise<QuizResultRecord | undefined> => {
  try {
    const record = await db.quizResults.get([userId, moduleId]);
    return record;
  } catch (error) {
    logError(
      error,
      `Error getting quiz result for user ${userId}, module ${moduleId}`,
      ERROR_MESSAGE_PREFIX,
    );
    return undefined;
  }
};

export const getCourseModuleProgress = async (
  userId: string,
  courseId: string,
): Promise<ModuleProgressRecord[]> => {
  try {
    if (courseId) {
      return await db.moduleProgress
        .where({ userId: userId, courseId: courseId })
        .toArray();
    } else {
      return await db.moduleProgress.where('userId').equals(userId).toArray();
    }
  } catch (error) {
    logError(
      error,
      `Error getting course module progress for user ${userId}, course ${courseId}`,
      ERROR_MESSAGE_PREFIX,
    );
    return [];
  }
};

export const getAllQuizResultsForUser = async (
  userId: string,
): Promise<QuizResultRecord[]> => {
  try {
    return await db.quizResults.where('userId').equals(userId).toArray();
  } catch (error) {
    logError(
      error,
      `Error getting all quiz results for user ${userId}`,
      ERROR_MESSAGE_PREFIX,
    );
    return [];
  }
};

export const getCourse = async (id: string): Promise<Course | undefined> => {
  try {
    const course = await getItem<Course>('courses', id);
    return course;
  } catch (error) {
    logError(
      error,
      `Error getting course from IndexedDB: ${id}`,
      ERROR_MESSAGE_PREFIX,
    );
    return undefined;
  }
};

export const getAllCourses = async (): Promise<Course[]> => {
  try {
    const courses = await getAllItemsFromStore<Course>('courses');
    return courses;
  } catch (error) {
    logError(
      error,
      `Error getting all courses from IndexedDB`,
      ERROR_MESSAGE_PREFIX,
    );
    return [];
  }
};

export const updateCourse = async (course: Course): Promise<void> => {
  try {
    const courseToStore = { ...course, updatedAt: Date.now() };
    await setItem('courses', courseToStore.id, courseToStore);
  } catch (error) {
    logError(
      error,
      `Error updating course in IndexedDB: ${course.title}`,
      ERROR_MESSAGE_PREFIX,
    );
  }
};

export const deleteCourse = async (id: string): Promise<void> => {
  try {
    await deleteItem('courses', id);
  } catch (error) {
    logError(
      error,
      `Error deleting course from IndexedDB: ${id}`,
      ERROR_MESSAGE_PREFIX,
    );
  }
};

export const deleteCoursesByIds = async (ids: string[]): Promise<void> => {
  try {
    await db.courses.bulkDelete(ids);
  } catch (error) {
    logError(
      error,
      `Error deleting multiple courses from IndexedDB: ${ids.join(', ')}`,
      ERROR_MESSAGE_PREFIX,
    );
  }
};

export const addCategory = async (
  category: Omit<Category, 'id'>, // Update type to omit 'id'
): Promise<string | undefined> => {
  try {
    const id = crypto.randomUUID();
    const categoryToStore = { ...category, id };
    await setItem('categories', id, categoryToStore);
    return id;
  } catch (error) {
    logError(
      error,
      `Error adding category to IndexedDB: ${category.name}`,
      ERROR_MESSAGE_PREFIX,
    );
    return undefined;
  }
};

export const getAllCategories = async (): Promise<Category[]> => {
  try {
    const categories = await getAllItemsFromStore<Category>('crm-categories');
    return categories;
  } catch (error) {
    logError(
      error,
      `Error getting all categories from IndexedDB`,
      ERROR_MESSAGE_PREFIX,
    );
    return [];
  }
};

export const updateCategory = async (category: Category): Promise<void> => {
  try {
    await setItem('categories', category.id, category);
  } catch (error) {
    logError(
      error,
      `Error updating category in IndexedDB: ${category.name}`,
      ERROR_MESSAGE_PREFIX,
    );
  }
};

export const deleteCategory = async (id: string): Promise<void> => {
  try {
    await deleteItem('categories', id);
  } catch (error) {
    logError(
      error,
      `Error deleting category from IndexedDB: ${id}`,
      ERROR_MESSAGE_PREFIX,
    );
  }
};

export async function removeCacheItem(key: string): Promise<void> {
  try {
    await deleteItem('cache', key);
  } catch (error) {
    logError(
      error,
      `Error removing item from cache with key "${key}"`,
      ERROR_MESSAGE_PREFIX,
    );
  }
}
