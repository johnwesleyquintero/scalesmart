import Dexie, { Table } from 'dexie';
import { INDEXED_DB_ACOS_CALCULATOR_HISTORY_KEY } from './constants';
import { NO_PROJECT_VALUE } from '@/lib/constants/project-management'; // Import NO_PROJECT_VALUE
import { QuizResult } from '@/types'; // Keep QuizResult from '@/types' for now
import {
  ChatMessageRecord,
  ModuleProgressRecord,
  QuizResultRecord,
  TaskComment,
  Task,
  Project,
  Event,
  CalculationData,
  Contact,
  Category,
  CommunicationLog,
  Course, // Import Course from unified types
} from '@/types/indexeddb'; // Import unified types

export type {
  TaskComment,
  Task,
  Project,
  CalculationData,
  Contact,
  Category,
  CommunicationLog,
  Event,
  ChatMessageRecord,
  ModuleProgressRecord,
  QuizResultRecord,
};

// Define constants for duplicate strings
const ERROR_MESSAGE_PREFIX = 'IndexedDBService';
const DB_OPEN_FAILED = 'Failed to open ChatAppDatabase';
const DB_INITIALIZED = 'ChatAppDatabase initialized and opened successfully';
const DB_ALREADY_OPEN = 'ChatAppDatabase is already open';
const DB_OPERATION_FAILED = 'operation failed';

class ChatDatabase extends Dexie {
  public chatMessages!: Table<ChatMessageRecord, number>;
  public cache!: Table<{ key: string; value: unknown }, string>;
  public events!: Table<Event, number>;
  public contacts!: Table<Contact, string>;
  public tasks!: Table<Task, string>;
  public projects!: Table<Project, string>;
  public categories!: Table<Category, string>;
  public communicationLogs!: Table<CommunicationLog, string>;
  public courses!: Table<Course, string>;
  public moduleProgress!: Table<ModuleProgressRecord, [string, string, string]>;
  public quizResults!: Table<QuizResultRecord, [string, string]>;
  public calculations!: Table<CalculationData, string>;
  public taskComments!: Table<TaskComment, string>;

  constructor() {
    super('ChatAppDatabase');
    this.version(1).stores({
      chatMessages: '++id, chatSessionId, timestamp, sender',
    });
    this.version(2).stores({
      cache: 'key',
    });
    this.version(3).stores({
      events: '++id, date',
    });
    this.version(4).stores({
      contacts:
        'id, name, email, phone, company, notes, category, createdAt, updatedAt',
    });
    this.version(5).stores({
      tasks:
        'id, title, description, status, assignee, dueDate, projectId, createdAt, updatedAt, dependencies, subtasks, priority',
    });
    this.version(6).stores({
      projects: 'id, name, description, createdAt, updatedAt',
    });
    this.version(7).stores({
      categories: 'id, name',
    });
    this.version(8).stores({
      courses:
        'id, title, description, duration, level, metadata.category, metadata.tags, createdAt, updatedAt',
    });
    this.version(9).stores({
      moduleProgress:
        '[userId+courseId+moduleId], userId, courseId, moduleId, progress, lastUpdated',
    });
    this.version(10).stores({
      communicationLogs: 'id, customerId, type, date, subject, notes',
    });
    this.version(11).stores({
      tasks:
        'id, title, description, status, assignee, dueDate, projectId, createdAt, updatedAt, dependencies, subtasks, priority, order',
    });
    this.version(12).stores({
      quizResults: '[userId+moduleId], userId, moduleId, result, lastUpdated',
    });
    this.version(13).stores({
      calculations: 'id, campaignName, date',
    });
    this.version(14).stores({});
    this.version(15).stores({
      taskComments: 'id, taskId, createdAt, userId', // Changed index to improve query performance
    });
  }
}

export const db = new ChatDatabase();

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
      `Failed to initialize ChatAppDatabase`,
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
    // Use the correct table based on storeName
    const table = db.table(storeName);
    await table.put(value, key);
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
  try {
    return await db.chatMessages
      .where('chatSessionId')
      .equals(chatSessionId)
      .sortBy('timestamp');
  } catch (error) {
    logError(
      error,
      `Failed to get messages for session ${chatSessionId}`,
      ERROR_MESSAGE_PREFIX,
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
      creationTimestamp: now, // Use correct property name
      updateTimestamp: now, // Use correct property name
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
    const updateTimestamp = Date.now(); // Use correct property name
    const contactToStore = { ...contact, updateTimestamp }; // Use correct property name
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
    const logs = await db.communicationLogs
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
      creationTimestamp: now, // Use correct property name
      updateTimestamp: now, // Use correct property name
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
    const courseToStore = { ...course, updateTimestamp: Date.now() }; // Use correct property name
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
    const categories = await getAllItemsFromStore<Category>('categories');
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
