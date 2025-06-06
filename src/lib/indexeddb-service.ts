import Dexie, { Table } from 'dexie';
import { INDEXED_DB_ACOS_CALCULATOR_HISTORY_KEY } from './constants';
import { Contact, Category, CommunicationLog } from '@/app/crm/types'; // Import Category, CommunicationLog
import { Course } from '@/types'; // Import Course

// Interface for chat messages stored in IndexedDB
export interface ChatMessageRecord {
  id?: number; // Auto-incremented primary key by Dexie
  chatSessionId: string; // To group messages by a specific chat session
  sender: 'user' | 'ai' | 'system'; // Sender of the message
  text: string; // Content of the message
  timestamp: number; // Timestamp of when the message was created/received
  metadata?: Record<string, unknown>; // Optional: for any other data like message status, etc.
}

export interface ModuleProgressRecord {
  userId: string;
  courseId: string;
  moduleId: string;
  progress: number; // 0-100
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
  dependencies?: string[]; // Array of task IDs that this task depends on
  subtasks?: string[]; // Array of task IDs that are subtasks of this task
  comments: Comment[];
  priority?: 'low' | 'medium' | 'high'; // Add priority field
  order?: number; // Add order field for sorting within columns
}

export interface Comment {
  id: string;
  text: string;
  author: string;
  createdAt: number;
}

export interface Project {
  id: string; // Unique identifier for the project
  name: string; // Name of the project
  description?: string; // Optional description
  creationTimestamp: number;
  updateTimestamp: number;
}

// Define the Dexie database class
class ChatDatabase extends Dexie {
  // 'chatMessages' is a table in this database.
  // The type parameters are:
  // 1. The interface for the items in the table (ChatMessageRecord)
  // 2. The type of the primary key (number, for auto-incremented id)
  public chatMessages!: Table<ChatMessageRecord, number>;
  public cache!: Table<{ key: string; value: unknown }, string>;
  public events!: Table<Event, number>;
  public contacts!: Table<Contact, string>;
  public tasks!: Table<Task, string>;
  public projects!: Table<Project, string>;
  public categories!: Table<Category, string>; // Add categories table
  public communicationLogs!: Table<CommunicationLog, string>; // Add communicationLogs table
  public courses!: Table<Course, string>; // Add courses table
  public moduleProgress!: Table<ModuleProgressRecord, [string, string, string]>; // Add module progress table

  constructor() {
    super('ChatAppDatabase'); // Name of the IndexedDB database
    this.version(1).stores({
      // Schema definition:
      // '++id': auto-incrementing primary key
      // 'chatSessionId': index for querying by chat session
      // 'timestamp': index for sorting messages by time
      // 'sender': index for filtering by sender
      chatMessages: '++id, chatSessionId, timestamp, sender',
    });
    this.version(2).stores({
      // Add cache table in version 2
      cache: 'key', // Primary key is 'key'
    });
    this.version(3).stores({
      events: '++id, date', // Primary key is 'id', index on 'date'
    });
    this.version(4).stores({
      contacts:
        'id, name, email, phone, company, notes, category, creationTimestamp, updateTimestamp', // Add category to contacts schema
    });
    this.version(5).stores({
      tasks:
        'id, title, description, status, assignee, dueDate, projectId, creationTimestamp, updateTimestamp, dependencies, subtasks, priority', // Add priority to schema
    });
    this.version(6).stores({
      projects: 'id, name, description, creationTimestamp, updateTimestamp',
    });
    this.version(7).stores({
      categories: 'id, name', // Add categories schema
    });
    this.version(8).stores({
      courses:
        'id, title, description, duration, level, metadata.category, metadata.tags, creationTimestamp, updateTimestamp', // Add courses schema
    });
    this.version(9).stores({
      moduleProgress: '[userId+courseId+moduleId], progress, lastUpdated', // Composite primary key
    });
    this.version(10).stores({
      communicationLogs: 'id, customerId, type, date, subject, notes',
    });
    this.version(11).stores({
      tasks:
        'id, title, description, status, assignee, dueDate, projectId, creationTimestamp, updateTimestamp, dependencies, subtasks, priority, order', // Add order to schema
    });
  }
}

// Create a singleton instance of the database
export const db = new ChatDatabase();

export interface Event {
  id?: number;
  date: string;
  title: string;
  description?: string;
}

/**
 * Initializes the IndexedDB database.
 * Ensures the database is open and ready for operations.
 * Dexie opens the database lazily on the first operation, but calling this
 * explicitly can be useful for early error detection or specific setup logic.
 */
export const initializeDB = async (): Promise<void> => {
  try {
    if (!db.isOpen()) {
      try {
        await db.open();
        console.log('ChatAppDatabase initialized and opened successfully.');
      } catch (openError) {
        console.error('Failed to open ChatAppDatabase:', openError);
        // Re-throw the error so the caller can handle it
        throw openError;
      }
    } else {
      console.log('ChatAppDatabase is already open.');
    }
  } catch (error) {
    console.error('Failed to initialize ChatAppDatabase:', error);
    // Re-throw the error so the caller can handle it
    throw error;
  }
};

/**
 * Adds a new item (chat message) to the IndexedDB.
 * @param messageData - The chat message data to store.
 *                      'id' is auto-generated and 'timestamp' will be set.
 * @returns The ID of the newly added message, or undefined if an error occurs.
 */

/**
 * Retrieves chat messages for a specific chat session, sorted by timestamp.
 * @remarks Used by the general Chat functionality.
 * @param chatSessionId - The ID of the chat session.
 * @returns A promise that resolves to an array of chat messages.
 */
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
      `Failed to get messages for session ${chatSessionId}:`,
      error,
    );
    return []; // Return empty array on error or re-throw
  }
};

function logError(error: unknown, message: string, component: string) {
  console.error(`${component}: ${message}`, error);
}

/**
 * Retrieves an item from the IndexedDB cache.
 * @remarks General cache utility.
 * @param key - The key of the item to retrieve.
 */
/**
 * Retrieves an item from a specified IndexedDB store (table).
 * @remarks General cache utility.
 * @param key - The key of the item to retrieve.
 * @param storeName - The name of the store (table) to retrieve from. Defaults to 'cache'.
 * @returns A promise that resolves to the retrieved item or `undefined` if not found or an error occurs.
 */
export async function getItem<T>(
  key: string,
  storeName: string = 'cache',
): Promise<T | undefined> {
  if (!db) {
    await initializeDB();
  }
  try {
    // Dynamically select the store based on storeName
    const store = db.table(storeName) as Table<
      { key: string; value: unknown },
      string
    >;
    return (await store.get(key).then((item) => item?.value)) as T | undefined;
  } catch (error) {
    console.error(
      `IndexedDBService: Error getting item from store "${storeName}" with key "${key}":`,
      error,
    );
    return undefined;
  }
}

/**
 * Saves calculation data (e.g., ACoS) to IndexedDB.
 * @remarks Used by WesTools (ACoS Calculator).
 * @param data - The calculation data to save.
 */
export async function saveCalculation(data: CalculationData): Promise<void> {
  if (!db) {
    await initializeDB();
  }

  try {
    // Use the 'cache' store for calculation history
    await db.transaction('rw', db.cache, async () => {
      await db.cache.put({
        key: `${INDEXED_DB_ACOS_CALCULATOR_HISTORY_KEY}-${data.campaignName}-${data.date}`,
        value: data,
      });
      console.log('Calculation saved to IndexedDB:', data);
    });
  } catch (error) {
    console.error(
      `IndexedDBService: Error saving calculation to IndexedDB for campaign "${data.campaignName}":`,
      error,
    );
  }
}

/**
 * Sets an item in a specified IndexedDB store (table).
 * @remarks General cache utility.
 * @param key - The key of the item to set.
 * @param value - The value of the item to set.
 * @param storeName - The name of the store (table) to set the item in. Defaults to 'cache'.
 * @returns A promise that resolves when the item is successfully set.
 */
export async function setItem<T>(
  key: string,
  value: T,
  storeName: string = 'cache',
): Promise<void> {
  if (!db) {
    await initializeDB();
  }
  try {
    // Dynamically select the store based on storeName
    const store = db.table(storeName) as Table<
      { key: string; value: unknown },
      string
    >;
    await store.put({ key: key, value: value });
  } catch (error) {
    console.error(
      `IndexedDBService: Error setting item in store "${storeName}" with key "${key}":`,
      error,
    );
  }
}

/**
 * Adds an event to IndexedDB.
 * @remarks General event utility.
 * @param event - The event data to add.
 */
export const addEvent = async (event: Event): Promise<number | undefined> => {
  if (!db) {
    await initializeDB();
  }
  try {
    const id = await db.events.add(event);
    console.log('Event added to IndexedDB:', event);
    return id;
  } catch (error) {
    logError(
      error,
      `Error adding event to IndexedDB: ${event.title}`,
      'IndexedDBService',
    );
    return undefined;
  }
};

/**
 * Retrieves all calculation data (e.g., ACoS history) from IndexedDB.
 * @remarks Used by WesTools (ACoS Calculator).
 */
export async function getCalculations(): Promise<CalculationData[]> {
  if (!db) {
    await initializeDB();
  }

  try {
    const calculations: CalculationData[] = [];
    await db.cache.each((item) => {
      if (item.key.startsWith(INDEXED_DB_ACOS_CALCULATOR_HISTORY_KEY)) {
        calculations.push(item.value as CalculationData);
      }
    });
    console.log('getCalculations returning:', calculations);
    return calculations;
  } catch (error) {
    logError(
      error,
      `Error getting calculations from IndexedDB`,
      'IndexedDBService',
    );
    return [];
  }
}

export interface CalculationData {
  id?: number;
  campaignName: string;
  adSpend: number;
  sales: number;
  acos: number;
  roas: number;
  date: Date;
}

// CRM Contact methods

/**
 * Creates a new contact in IndexedDB.
 * @remarks Used by WesCRM.
 * @param contact - The contact data to create.
 */
export const createContact = async (
  contact: Contact,
): Promise<string | undefined> => {
  if (!db) {
    await initializeDB();
  }
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
      'IndexedDBService',
    );
    return undefined;
  }
};

/**
 * Retrieves a contact by ID from IndexedDB.
 * @remarks Used by WesCRM.
 * @param id - The ID of the contact to retrieve.
 */
export const getContact = async (id: string): Promise<Contact | undefined> => {
  if (!db) {
    await initializeDB();
  }
  try {
    const contact = await db.contacts.get(id);
    console.log('Contact retrieved from IndexedDB:', contact);
    return contact;
  } catch (error) {
    logError(
      error,
      `Error getting contact from IndexedDB: ${id}`,
      'IndexedDBService',
    );
    return undefined;
  }
};

/**
 * Updates an existing contact in IndexedDB.
 * @remarks Used by WesCRM.
 * @param contact - The contact data to update.
 */
export const updateContact = async (contact: Contact): Promise<void> => {
  if (!db) {
    await initializeDB();
  }
  try {
    const updateTimestamp = Date.now();
    const contactToStore = { ...contact, updateTimestamp };
    await db.contacts.put(contactToStore);
    console.log('Contact updated in IndexedDB:', contact);
  } catch (error) {
    logError(
      error,
      `Error updating contact in IndexedDB: ${contact.name}`,
      'IndexedDBService',
    );
  }
};

/**
 * Deletes a contact by ID from IndexedDB.
 * @remarks Used by WesCRM.
 * @param id - The ID of the contact to delete.
 */
export const deleteContact = async (id: string): Promise<void> => {
  if (!db) {
    await initializeDB();
  }
  try {
    await db.contacts.delete(id);
    console.log('Contact deleted from IndexedDB:', id);
  } catch (error) {
    logError(
      error,
      `Error deleting contact from IndexedDB: ${id}`,
      'IndexedDBService',
    );
  }
};

// Project Board Task methods

/**
 * Creates a new task in IndexedDB.
 * @remarks Used by Project Board.
 * @param task - The task data to create.
 */
export const createTask = async (
  taskData: Omit<
    Task,
    'id' | 'creationTimestamp' | 'updateTimestamp' | 'comments'
  >, // Omit comments as they are managed separately
): Promise<Task | undefined> => {
  // Change return type to Task | undefined
  if (!db) {
    await initializeDB();
  }
  try {
    const id = crypto.randomUUID();
    const now = Date.now();
    const taskToStore: Task = {
      ...taskData,
      id,
      creationTimestamp: now,
      updateTimestamp: now,
      comments: [], // Initialize comments as an empty array for new tasks
    };
    await db.tasks.put(taskToStore);
    console.log('Task added to IndexedDB:', taskToStore);
    return taskToStore; // Return the full task object
  } catch (error) {
    logError(
      error,
      `Error adding task to IndexedDB: ${taskData.title}`,
      'IndexedDBService',
    );
    return undefined;
  }
};

/**
 * Retrieves a task by ID from IndexedDB.
 * @remarks Used by Project Board.
 * @param id - The ID of the task to retrieve.
 */
export const getTask = async (id: string): Promise<Task | undefined> => {
  if (!db) {
    await initializeDB();
  }
  try {
    const task = await db.tasks.get(id);
    console.log('Task retrieved from IndexedDB:', task);
    return task;
  } catch (error) {
    logError(
      error,
      `Error getting task from IndexedDB: ${id}`,
      'IndexedDBService',
    );
    return undefined;
  }
};

/**
 * Updates an existing task in IndexedDB.
 * @remarks Used by Project Board.
 * @param task - The task data to update.
 */
export const updateTask = async (task: Task): Promise<void> => {
  if (!db) {
    await initializeDB();
  }
  try {
    const updateTimestamp = Date.now();
    // Ensure comments is an array before storing
    const taskToStore = {
      ...task,
      updateTimestamp,
      comments: Array.isArray(task.comments) ? task.comments : [],
    };
    console.log('IndexedDBService: Attempting to update task:', taskToStore);
    await db.tasks.put(taskToStore);
    console.log(
      'IndexedDBService: Task successfully updated in IndexedDB:',
      taskToStore,
    );
  } catch (error) {
    logError(
      error,
      `Error updating task in IndexedDB: ${task.title}`,
      'IndexedDBService',
    );
  }
};

/**
 * Deletes a task by ID from IndexedDB.
 * @remarks Used by Project Board.
 * @param id - The ID of the task to delete.
 */
export const deleteTask = async (id: string): Promise<void> => {
  if (!db) {
    await initializeDB();
  }
  try {
    await db.tasks.delete(id);
    console.log('Task deleted from IndexedDB:', id);
  } catch (error) {
    logError(
      error,
      `Error deleting task from IndexedDB: ${id}`,
      'IndexedDBService',
    );
  }
};

// Project Board Project CRUD operations

/**
 * Creates a new project in IndexedDB.
 * @remarks Used by Project Board.
 * @param projectData - The project data to create.
 */
export const createProject = async (
  projectData: Omit<Project, 'id' | 'creationTimestamp' | 'updateTimestamp'>,
): Promise<string | undefined> => {
  if (!db) {
    await initializeDB();
  }
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
      'IndexedDBService',
    );
    return undefined;
  }
};

/**
 * Retrieves a project by ID from IndexedDB.
 * @remarks Used by Project Board.
 * @param id - The ID of the project to retrieve.
 */
export const getProject = async (id: string): Promise<Project | undefined> => {
  if (!db) {
    await initializeDB();
  }
  try {
    const project = await db.projects.get(id);
    console.log('Project retrieved from IndexedDB:', project);
    return project;
  } catch (error) {
    logError(
      error,
      `Error getting project from IndexedDB: ${id}`,
      'IndexedDBService',
    );
    return undefined;
  }
};

/**
 * Retrieves all projects from IndexedDB.
 * @remarks Used by Project Board.
 */
export const getAllProjects = async (): Promise<Project[]> => {
  if (!db) {
    await initializeDB();
  }
  try {
    const projects = await db.projects.toArray();
    console.log('All projects retrieved from IndexedDB:', projects);
    return projects;
  } catch (error) {
    logError(
      error,
      `Error getting all projects from IndexedDB`,
      'IndexedDBService',
    );
    return [];
  }
};

/**
 * Updates an existing project in IndexedDB.
 * @remarks Used by Project Board.
 * @param project - The project data to update.
 */
export const updateProject = async (project: Project): Promise<void> => {
  if (!db) {
    await initializeDB();
  }
  try {
    const projectToStore = { ...project, updateTimestamp: Date.now() };
    await db.projects.put(projectToStore); // put will update if id exists
    console.log('Project updated in IndexedDB:', projectToStore);
  } catch (error) {
    logError(
      error,
      `Error updating project in IndexedDB: ${project.name}`,
      'IndexedDBService',
    );
  }
};

/**
 * Deletes a project by ID from IndexedDB.
 * @remarks Used by Project Board.
 * @param id - The ID of the project to delete.
 */
export const deleteProject = async (id: string): Promise<void> => {
  // Note: Consider how to handle tasks associated with a deleted project.
  // For now, we'll just delete the project.
  // Future enhancement: orphan tasks or prompt user.
  await db.projects.delete(id);
  console.log('Project deleted from IndexedDB:', id);
};

/**
 * Retrieves all tasks from IndexedDB.
 * @remarks Used by Project Board.
 */
export const getAllTasks = async (): Promise<Task[]> => {
  if (!db) {
    await initializeDB();
  }
  try {
    const tasks = await db.tasks.toArray();
    console.log('All tasks retrieved from IndexedDB:', tasks);
    return tasks;
  } catch (error) {
    logError(
      error,
      `Error getting all tasks from IndexedDB`,
      'IndexedDBService',
    );
    return [];
  }
};

/**
 * Retrieves all contacts from IndexedDB.
 * @remarks Used by WesCRM.
 */
export const getAllContacts = async (): Promise<Contact[]> => {
  if (!db) {
    await initializeDB();
  }
  try {
    const contacts = await db.contacts.toArray();
    console.log('All contacts retrieved from IndexedDB:', contacts);
    return contacts;
  } catch (error) {
    logError(
      error,
      `Error getting all contacts from IndexedDB`,
      'IndexedDBService',
    );
    return [];
  }
};

// Communication Log methods

/**
 * Creates a new communication log entry in IndexedDB.
 * @remarks Used by WesCRM.
 * @param log - The communication log data to create.
 */
export const createCommunicationLog = async (
  log: Omit<CommunicationLog, 'id'>,
): Promise<string | undefined> => {
  if (!db) {
    await initializeDB();
  }
  try {
    const id = crypto.randomUUID();
    const logToStore = { ...log, id, date: Date.now() }; // Automatically set current timestamp
    await db.communicationLogs.put(logToStore);

    // Also update the customer's communication logs
    const customer = await db.contacts.get(log.customerId);
    if (customer) {
      const updatedLogs = [...(customer.communicationLogs || []), logToStore];
      // Update the customer in the database directly. Dexie allows partial updates
      // for objects already retrieved or by passing an UpdateSpec.
      await db.contacts.update(log.customerId, {
        communicationLogs: updatedLogs,
      });
    }

    console.log('Communication log added to IndexedDB:', logToStore);
    return id;
  } catch (error) {
    logError(
      error,
      `Error adding communication log to IndexedDB for customer ${log.customerId}`,
      'IndexedDBService',
    );
    return undefined;
  }
};

/**
 * Retrieves all communication logs for a specific customer from IndexedDB, sorted by date.
 * @remarks Used by WesCRM.
 * @param customerId - The ID of the customer whose logs to retrieve.
 */
export const getCommunicationLogsByCustomerId = async (
  customerId: string,
): Promise<CommunicationLog[]> => {
  if (!db) {
    await initializeDB();
  }
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
      'IndexedDBService',
    );
    return [];
  }
};

/**
 * Updates an existing communication log entry in IndexedDB.
 * @remarks Used by WesCRM.
 * @param log - The communication log data to update.
 */
export const updateCommunicationLog = async (
  log: CommunicationLog,
): Promise<void> => {
  if (!db) {
    await initializeDB();
  }
  try {
    const updatedLog = { ...log, date: Date.now() }; // Update timestamp
    await db.communicationLogs.put(updatedLog);

    // Also update the customer's communication logs array
    const customer = await db.contacts.get(log.customerId);
    if (customer) {
      const updatedLogs = (customer.communicationLogs || []).map(
        (existingLog) =>
          existingLog.id === updatedLog.id ? updatedLog : existingLog,
      );
      await db.contacts.update(log.customerId, {
        communicationLogs: updatedLogs,
      });
    }

    console.log('Communication log updated in IndexedDB:', updatedLog);
  } catch (error) {
    logError(
      error,
      `Error updating communication log in IndexedDB: ${log.id}`,
      'IndexedDBService',
    );
  }
};

/**
 * Deletes a communication log entry by ID from IndexedDB.
 * @remarks Used by WesCRM.
 * @param id - The ID of the communication log to delete.
 * @param customerId - The ID of the customer the log belongs to.
 */
export const deleteCommunicationLog = async (
  id: string,
  customerId: string,
): Promise<void> => {
  if (!db) {
    await initializeDB();
  }
  try {
    await db.communicationLogs.delete(id);

    // Also remove the log from the customer's communication logs array
    const customer = await db.contacts.get(customerId);
    if (customer) {
      const updatedLogs = (customer.communicationLogs || []).filter(
        (logEntry) => logEntry.id !== id,
      );
      await db.contacts.update(customerId, {
        communicationLogs: updatedLogs,
      });
    }

    console.log('Communication log deleted from IndexedDB:', id);
  } catch (error) {
    logError(
      error,
      `Error deleting communication log from IndexedDB: ${id}`,
      'IndexedDBService',
    );
  }
};

// Academy Course methods

/**
 * Creates a new course in IndexedDB.
 * @remarks Used by Academy.
 * @param courseData - The course data to create.
 */
export const createCourse = async (
  courseData: Omit<Course, 'creationTimestamp' | 'updateTimestamp'>,
): Promise<string | undefined> => {
  if (!db) {
    await initializeDB();
  }
  try {
    const id = courseData.id || crypto.randomUUID(); // Use existing ID if available, otherwise generate
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
      'IndexedDBService',
    );
    return undefined;
  }
};

/**
 * Updates the progress of a specific module for a user.
 * @remarks Used by Academy.
 * @param userId - The ID of the user.
 * @param courseId - The ID of the course.
 * @param moduleId - The ID of the module.
 * @param progress - The progress percentage (0-100).
 */
export const updateModuleProgress = async (
  userId: string,
  courseId: string,
  moduleId: string,
  progress: number,
): Promise<void> => {
  if (!db) {
    await initializeDB();
  }
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
      'IndexedDBService',
    );
  }
};

/**
 * Retrieves the progress of a specific module for a user.
 * @remarks Used by Academy.
 * @param userId - The ID of the user.
 * @param courseId - The ID of the course.
 * @param moduleId - The ID of the module.
 * @returns The progress percentage (0-100) or 0 if not found.
 */
export const getModuleProgress = async (
  userId: string,
  courseId: string,
  moduleId: string,
): Promise<number> => {
  if (!db) {
    await initializeDB();
  }
  try {
    const record = await db.moduleProgress.get([userId, courseId, moduleId]);
    return record?.progress || 0;
  } catch (error) {
    logError(
      error,
      `Error getting module progress for user ${userId}, course ${courseId}, module ${moduleId}`,
      'IndexedDBService',
    );
    return 0;
  }
};

/**
 * Retrieves all module progress records for a given user and course.
 * @remarks Used by Academy.
 * @param userId - The ID of the user.
 * @param courseId - The ID of the course.
 * @returns An array of ModuleProgressRecord.
 */
export const getCourseModuleProgress = async (
  userId: string,
  courseId: string,
): Promise<ModuleProgressRecord[]> => {
  if (!db) {
    await initializeDB();
  }
  try {
    return await db.moduleProgress
      .where({ userId: userId, courseId: courseId })
      .toArray();
  } catch (error) {
    logError(
      error,
      `Error getting course module progress for user ${userId}, course ${courseId}`,
      'IndexedDBService',
    );
    return [];
  }
};

/**
 * Retrieves a course by ID from IndexedDB.
 * @remarks Used by Academy.
 * @param id - The ID of the course to retrieve.
 */
export const getCourse = async (id: string): Promise<Course | undefined> => {
  if (!db) {
    await initializeDB();
  }
  try {
    const course = await db.courses.get(id);
    console.log('Course retrieved from IndexedDB:', course);
    return course;
  } catch (error) {
    logError(
      error,
      `Error getting course from IndexedDB: ${id}`,
      'IndexedDBService',
    );
    return undefined;
  }
};

/**
 * Retrieves all courses from IndexedDB.
 * @remarks Used by Academy.
 */
export const getAllCourses = async (): Promise<Course[]> => {
  if (!db) {
    await initializeDB();
  }
  try {
    const courses = await db.courses.toArray();
    console.log('All courses retrieved from IndexedDB:', courses);
    return courses;
  } catch (error) {
    logError(
      error,
      `Error getting all courses from IndexedDB`,
      'IndexedDBService',
    );
    return [];
  }
};

/**
 * Updates an existing course in IndexedDB.
 * @remarks Used by Academy.
 * @param course - The course data to update.
 */
export const updateCourse = async (course: Course): Promise<void> => {
  if (!db) {
    await initializeDB();
  }
  try {
    const courseToStore = { ...course, updateTimestamp: Date.now() };
    await db.courses.put(courseToStore); // put will update if id exists
    console.log('Course updated in IndexedDB:', courseToStore);
  } catch (error) {
    logError(
      error,
      `Error updating course in IndexedDB: ${course.title}`,
      'IndexedDBService',
    );
  }
};

/**
 * Deletes a course by ID from IndexedDB.
 * @remarks Used by Academy.
 * @param id - The ID of the course to delete.
 */
export const deleteCourse = async (id: string): Promise<void> => {
  if (!db) {
    await initializeDB();
  }
  try {
    await db.courses.delete(id);
    console.log('Course deleted from IndexedDB:', id);
  } catch (error) {
    logError(
      error,
      `Error deleting course from IndexedDB: ${id}`,
      'IndexedDBService',
    );
  }
};

/**
 * Deletes multiple courses by their IDs from IndexedDB.
 * @remarks Used by Academy for synchronization.
 * @param ids - An array of course IDs to delete.
 */
export const deleteCoursesByIds = async (ids: string[]): Promise<void> => {
  if (!db) {
    await initializeDB();
  }
  try {
    await db.courses.bulkDelete(ids);
    console.log('Courses deleted from IndexedDB:', ids);
  } catch (error) {
    logError(
      error,
      `Error deleting multiple courses from IndexedDB: ${ids.join(', ')}`,
      'IndexedDBService',
    );
  }
};

// Category methods

/**
 * Adds a new category to IndexedDB.
 * @remarks Used by WesCRM.
 * @param category - The category data to create.
 */
export const addCategory = async (
  category: Category,
): Promise<string | undefined> => {
  if (!db) {
    await initializeDB();
  }
  try {
    const id = crypto.randomUUID(); // Generate a UUID for the category ID
    const categoryToStore = { ...category, id };
    await db.categories.put(categoryToStore);
    console.log('Category added to IndexedDB:', categoryToStore);
    return id;
  } catch (error) {
    logError(
      error,
      `Error adding category to IndexedDB: ${category.name}`,
      'IndexedDBService',
    );
    return undefined;
  }
};

/**
 * Retrieves all categories from IndexedDB.
 * @remarks Used by WesCRM.
 */
export const getAllCategories = async (): Promise<Category[]> => {
  if (!db) {
    await initializeDB();
  }
  try {
    const categories = await db.categories.toArray();
    console.log('All categories retrieved from IndexedDB:', categories);
    return categories;
  } catch (error) {
    logError(
      error,
      `Error getting all categories from IndexedDB`,
      'IndexedDBService',
    );
    return [];
  }
};

/**
 * Updates an existing category in IndexedDB.
 * @remarks Used by WesCRM.
 * @param category - The category data to update.
 */
export const updateCategory = async (category: Category): Promise<void> => {
  if (!db) {
    await initializeDB();
  }
  try {
    await db.categories.put(category);
    console.log('Category updated in IndexedDB:', category);
  } catch (error) {
    logError(
      error,
      `Error updating category in IndexedDB: ${category.name}`,
      'IndexedDBService',
    );
  }
};

/**
 * Deletes a category by ID from IndexedDB.
 * @remarks Used by WesCRM.
 * @param id - The ID of the category to delete.
 */
export const deleteCategory = async (id: string): Promise<void> => {
  if (!db) {
    await initializeDB();
  }
  try {
    await db.categories.delete(id);
    console.log('Category deleted from IndexedDB:', id);
  } catch (error) {
    logError(
      error,
      `Error deleting category from IndexedDB: ${id}`,
      'IndexedDBService',
    );
  }
};
