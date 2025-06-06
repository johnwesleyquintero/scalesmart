import Dexie, { Table } from 'dexie';
import { INDEXED_DB_ACOS_CALCULATOR_HISTORY_KEY } from './constants';
import { Contact, Category, CommunicationLog } from '@/app/crm/types';
import { Course, QuizResult } from '@/types';

// Define constants for duplicate strings
const ERROR_MESSAGE_PREFIX = 'IndexedDBService';
const DB_OPEN_FAILED = 'Failed to open ChatAppDatabase';
const DB_INITIALIZED = 'ChatAppDatabase initialized and opened successfully';
const DB_ALREADY_OPEN = 'ChatAppDatabase is already open';
const DB_OPERATION_FAILED = 'operation failed';

// Interface for chat messages stored in IndexedDB
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

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: string;
  assignee?: string;
  dueDate?: number;
  projectId?: string;
  creationTimestamp: number;
  updateTimestamp: number;
  dependencies?: string[];
  subtasks?: string[];
  comments: TaskComment[];
  priority?: 'low' | 'medium' | 'high';
  order?: number;
}

export interface TaskComment {
  id: string;
  text: string;
  author: string;
  createdAt: number;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  creationTimestamp: number;
  updateTimestamp: number;
}

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
        'id, name, email, phone, company, notes, category, creationTimestamp, updateTimestamp',
    });
    this.version(5).stores({
      tasks:
        'id, title, description, status, assignee, dueDate, projectId, creationTimestamp, updateTimestamp, dependencies, subtasks, priority',
    });
    this.version(6).stores({
      projects: 'id, name, description, creationTimestamp, updateTimestamp',
    });
    this.version(7).stores({
      categories: 'id, name',
    });
    this.version(8).stores({
      courses:
        'id, title, description, duration, level, metadata.category, metadata.tags, creationTimestamp, updateTimestamp',
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
        'id, title, description, status, assignee, dueDate, projectId, creationTimestamp, updateTimestamp, dependencies, subtasks, priority, order',
    });
    this.version(12).stores({
      quizResults: '[userId+moduleId], userId, moduleId, result, lastUpdated',
    });
    this.version(13).stores({
      calculations: 'id, campaignName, date',
    });
    this.version(14).stores({});
  }
}

export const db = new ChatDatabase();

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
}

export const initializeDB = async (): Promise<void> => {
  try {
    if (!db.isOpen()) {
      try {
        await db.open();
        console.log(DB_INITIALIZED);
      } catch (openError) {
        console.error(DB_OPEN_FAILED, openError);
        throw openError;
      }
    } else {
      console.log(DB_ALREADY_OPEN);
    }
  } catch (error) {
    console.error(
      `${ERROR_MESSAGE_PREFIX}: Failed to initialize ChatAppDatabase`,
      error,
    );
    throw error;
  }
};

export const getChatMessagesBySession = async (
  chatSessionId: string,
): Promise<ChatMessageRecord[]> => {
  try {
    return await db.chatMessages
      .where('chatSessionId')
      .equals(chatSessionId)
      .sortBy('timestamp');
  } catch (error) {
    console.error(
      `${ERROR_MESSAGE_PREFIX}: Failed to get messages for session ${chatSessionId}`,
      error,
    );
    return [];
  }
};

function logError(error: unknown, message: string, component: string) {
  console.error(`${component}: ${message}`, error);
}

export async function getCacheItem<T>(key: string): Promise<T | undefined> {
  try {
    return (await db.cache.get(key).then((item) => item?.value)) as
      | T
      | undefined;
  } catch (error) {
    console.error(
      `${ERROR_MESSAGE_PREFIX}: Error getting item from cache with key "${key}"`,
      error,
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
      console.log('Calculation saved to IndexedDB:', data);
    });
  } catch (error) {
    console.error(
      `${ERROR_MESSAGE_PREFIX}: Error saving calculation to IndexedDB for campaign "${data.campaignName}"`,
      error,
    );
  }
}

export async function setCacheItem<T>(key: string, value: T): Promise<void> {
  try {
    await db.cache.put({ key: key, value: value });
  } catch (error) {
    console.error(
      `${ERROR_MESSAGE_PREFIX}: Error setting item in cache with key "${key}"`,
      error,
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
    console.log('getCalculations returning:', calculations);
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
  contact: Contact,
): Promise<string | undefined> => {
  try {
    const id = crypto.randomUUID();
    const creationTimestamp = Date.now();
    const updateTimestamp = Date.now();
    const contactToStore = {
      ...contact,
      id,
      creationTimestamp,
      updateTimestamp,
    };
    await db.contacts.put(contactToStore);
    console.log('Contact added to IndexedDB:', contact);
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
    const contact = await db.contacts.get(id);
    console.log('Contact retrieved from IndexedDB:', contact);
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
    const updateTimestamp = Date.now();
    const contactToStore = { ...contact, updateTimestamp };
    await db.contacts.put(contactToStore);
    console.log('Contact updated in IndexedDB:', contact);
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
    await db.contacts.delete(id);
    console.log('Contact deleted from IndexedDB:', id);
  } catch (error) {
    logError(
      error,
      `Error deleting contact from IndexedDB: ${id}`,
      ERROR_MESSAGE_PREFIX,
    );
  }
};

export const createTask = async (
  taskData: Omit<
    Task,
    'id' | 'creationTimestamp' | 'updateTimestamp' | 'comments'
  >,
): Promise<Task | undefined> => {
  try {
    const id = crypto.randomUUID();
    const now = Date.now();
    const taskToStore: Task = {
      ...taskData,
      id,
      creationTimestamp: now,
      updateTimestamp: now,
      comments: [],
    };
    await db.tasks.put(taskToStore);
    console.log('Task added to IndexedDB:', taskToStore);
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
    const task = await db.tasks.get(id);
    console.log('Task retrieved from IndexedDB:', task);
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
    const updateTimestamp = Date.now();
    const taskToStore = {
      ...task,
      updateTimestamp,
      comments: Array.isArray(task.comments) ? task.comments : [],
    };
    console.log('Attempting to update task:', taskToStore);
    await db.tasks.put(taskToStore);
    console.log('Task successfully updated in IndexedDB:', taskToStore);
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
    await db.tasks.delete(id);
    console.log('Task deleted from IndexedDB:', id);
  } catch (error) {
    logError(
      error,
      `Error deleting task from IndexedDB: ${id}`,
      ERROR_MESSAGE_PREFIX,
    );
  }
};

export const createProject = async (
  projectData: Omit<Project, 'id' | 'creationTimestamp' | 'updateTimestamp'>,
): Promise<string | undefined> => {
  try {
    const id = crypto.randomUUID();
    const now = Date.now();
    const projectToStore: Project = {
      ...projectData,
      id,
      creationTimestamp: now,
      updateTimestamp: now,
    };
    await db.projects.put(projectToStore);
    console.log('Project added to IndexedDB:', projectToStore);
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
    const project = await db.projects.get(id);
    console.log('Project retrieved from IndexedDB:', project);
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
    const projects = await db.projects.toArray();
    console.log('All projects retrieved from IndexedDB:', projects);
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
    const projectToStore = { ...project, updateTimestamp: Date.now() };
    await db.projects.put(projectToStore);
    console.log('Project updated in IndexedDB:', projectToStore);
  } catch (error) {
    logError(
      error,
      `Error updating project in IndexedDB: ${project.name}`,
      ERROR_MESSAGE_PREFIX,
    );
  }
};

export const deleteProject = async (id: string): Promise<void> => {
  await db.projects.delete(id);
  console.log('Project deleted from IndexedDB:', id);
};

export const getAllTasks = async (): Promise<Task[]> => {
  try {
    const tasks = await db.tasks.toArray();
    console.log('All tasks retrieved from IndexedDB:', tasks);
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
    const contacts = await db.contacts.toArray();
    console.log('All contacts retrieved from IndexedDB:', contacts);
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
    await db.communicationLogs.put(logToStore);
    console.log('Communication log added to IndexedDB:', logToStore);
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
    console.log(
      `Communication logs retrieved for customer ${customerId}:`,
      logs,
    );
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
    await db.communicationLogs.put(updatedLog);
    console.log('Communication log updated in IndexedDB:', updatedLog);
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
    await db.communicationLogs.delete(id);
    console.log('Communication log deleted from IndexedDB:', id);
  } catch (error) {
    logError(
      error,
      `Error deleting communication log from IndexedDB: ${id}`,
      ERROR_MESSAGE_PREFIX,
    );
  }
};

export const createCourse = async (
  courseData: Omit<Course, 'id' | 'creationTimestamp' | 'updateTimestamp'>,
): Promise<string | undefined> => {
  try {
    const id = crypto.randomUUID();
    const now = Date.now();
    const courseToStore: Course = {
      ...courseData,
      id,
      creationTimestamp: now,
      updateTimestamp: now,
    };
    await db.courses.put(courseToStore);
    console.log('Course added to IndexedDB:', courseToStore);
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
    console.log('Module progress updated:', record);
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
    console.log('Quiz result updated:', record);
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
    const course = await db.courses.get(id);
    console.log('Course retrieved from IndexedDB:', course);
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
    const courses = await db.courses.toArray();
    console.log('All courses retrieved from IndexedDB:', courses);
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
    const courseToStore = { ...course, updateTimestamp: Date.now() };
    await db.courses.put(courseToStore);
    console.log('Course updated in IndexedDB:', courseToStore);
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
    await db.courses.delete(id);
    console.log('Course deleted from IndexedDB:', id);
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
    console.log('Courses deleted from IndexedDB:', ids);
  } catch (error) {
    logError(
      error,
      `Error deleting multiple courses from IndexedDB: ${ids.join(', ')}`,
      ERROR_MESSAGE_PREFIX,
    );
  }
};

export const addCategory = async (
  category: Category,
): Promise<string | undefined> => {
  try {
    const id = crypto.randomUUID();
    const categoryToStore = { ...category, id };
    await db.categories.put(categoryToStore);
    console.log('Category added to IndexedDB:', categoryToStore);
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
    const categories = await db.categories.toArray();
    console.log('All categories retrieved from IndexedDB:', categories);
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
    await db.categories.put(category);
    console.log('Category updated in IndexedDB:', category);
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
    await db.categories.delete(id);
    console.log('Category deleted from IndexedDB:', id);
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
    await db.cache.delete(key);
  } catch (error) {
    console.error(
      `${ERROR_MESSAGE_PREFIX}: Error removing item from cache with key "${key}"`,
      error,
    );
  }
}

export {
  getCacheItem as getItem,
  setCacheItem as setItem,
  removeCacheItem as removeItem,
};
