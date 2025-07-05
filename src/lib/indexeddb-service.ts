import Dexie, { Table, IndexableType } from 'dexie';
import { NO_PROJECT_VALUE } from '@/lib/constants/project-management';

// --- Type Definitions ---
// Consolidate imports for better organization
import {
  Contact,
  CommunicationLog,
  ActivityLog,
  SalesOpportunity,
} from '@/app/crm/types';
import {
  Category,
  Note,
  MarkdownNoteVersion,
  AmazonReport,
  ChatMessageRecord,
  ModuleProgressRecord,
  QuizResultRecord,
  TaskComment,
  Task,
  Project,
  Event,
  CalculationData,
  ProjectStatus, // Assuming ProjectStatus is a type needed
  TaskStatus,
} from '@/types/indexeddb';

export type {
  TaskStatus,
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
  Note,
  MarkdownNoteVersion,
  AmazonReport,
  ProjectStatus,
  SalesOpportunity,
  ModuleProgressRecord,
  QuizResultRecord,
};

// --- Constants ---

const DB_NAME = 'ScaleSmartDatabase';
const SERVICE_NAME = 'IndexedDBService';

// Store Names (matching class properties where possible, or schema names)
// Using constants helps avoid magic strings and potential typos.
const STORE_CHAT_MESSAGES = 'chatMessages';
const STORE_MODULE_PROGRESS = 'moduleProgress';
const STORE_QUIZ_RESULTS = 'quizResults';
const STORE_CACHE = 'cache';
const STORE_EVENTS = 'events';
const STORE_CRM_CONTACTS = 'crmContacts'; // matches property name
const STORE_CRM_CATEGORIES = 'crmCategories'; // matches property name
const STORE_CRM_COMMUNICATION_LOGS = 'crmCommunicationLogs'; // matches property name
const STORE_CRM_ACTIVITY_LOGS = 'crmActivityLogs'; // matches property name
const STORE_CRM_EMAIL_TEMPLATES = 'crmEmailTemplates'; // matches property name
const STORE_CRM_SALES_OPPORTUNITIES = 'crmSalesOpportunities'; // matches property name
const STORE_TASKS = 'tasks'; // matches property name
const STORE_PROJECTS = 'projects'; // matches property name
const STORE_TASK_COMMENTS = 'taskComments'; // matches property name
const STORE_CALCULATIONS = 'calculations'; // matches property name
const STORE_AMAZON_REPORTS = 'amazonReports'; // matches property name
const STORE_MARKDOWN_NOTES = 'markdownNotes'; // matches property name
const STORE_MARKDOWN_NOTE_VERSIONS = 'markdownNoteVersions'; // matches property name

// --- Database Class Definition ---

class ScaleSmartDatabase extends Dexie {
  // Define table properties using store name constants or descriptive names
  public readonly [STORE_CHAT_MESSAGES]!: Table<ChatMessageRecord, number>;
  public readonly [STORE_MODULE_PROGRESS]!: Table<
    ModuleProgressRecord,
    [string, string, string]
  >;
  public readonly [STORE_QUIZ_RESULTS]!: Table<
    QuizResultRecord,
    [string, string]
  >;
  public readonly [STORE_CACHE]!: Table<
    { key: string; value: unknown },
    string
  >;

  public readonly [STORE_EVENTS]!: Table<Event, number>;

  public readonly [STORE_CRM_CONTACTS]!: Table<Contact, string>;
  public readonly [STORE_CRM_CATEGORIES]!: Table<Category, string>;
  public readonly [STORE_CRM_COMMUNICATION_LOGS]!: Table<
    CommunicationLog,
    string
  >;
  public readonly [STORE_CRM_ACTIVITY_LOGS]!: Table<ActivityLog, string>;
  public readonly [STORE_CRM_EMAIL_TEMPLATES]!: Table<
    { id: string; name: string },
    string
  >;
  public readonly [STORE_CRM_SALES_OPPORTUNITIES]!: Table<
    SalesOpportunity,
    string
  >;

  public readonly [STORE_TASKS]!: Table<Task, string>;
  public readonly [STORE_PROJECTS]!: Table<Project, string>;
  public readonly [STORE_TASK_COMMENTS]!: Table<TaskComment, string>;

  public readonly [STORE_CALCULATIONS]!: Table<CalculationData, string>;
  public readonly [STORE_AMAZON_REPORTS]!: Table<AmazonReport, string>;

  public readonly [STORE_MARKDOWN_NOTES]!: Table<Note, string>;
  public readonly [STORE_MARKDOWN_NOTE_VERSIONS]!: Table<
    MarkdownNoteVersion,
    number
  >;

  constructor() {
    super(DB_NAME);

    // Define schema strings inline or as constants for clarity,
    // but avoid overly complex strings if the structure is simple (like id, name).
    // Ensure store names here match the constants and property names.
    this.version(18).stores({
      [STORE_CHAT_MESSAGES]: '++id, chatSessionId, timestamp, sender',
      [STORE_CACHE]: 'key',
      [STORE_EVENTS]: '++id, date', // Assuming 'id' is auto-incrementing or unique
      [STORE_CRM_CONTACTS]:
        'id, name, email, phone, company, notes, category, createdAt, updatedAt, lastActivity',
      [STORE_CRM_CATEGORIES]: 'id, name',
      [STORE_CRM_COMMUNICATION_LOGS]:
        'id, customerId, type, date, subject, notes',
      [STORE_CRM_ACTIVITY_LOGS]: 'id, contactId, type, date, notes',
      [STORE_CRM_EMAIL_TEMPLATES]: 'id, name',
      [STORE_CRM_SALES_OPPORTUNITIES]:
        'id, name, status, amount, closeDate, contactId, createdAt, updatedAt',
      [STORE_TASKS]:
        'id, title, description, status, assignee, dueDate, projectId, createdAt, updatedAt, dependencies, subtasks, priority, order',
      [STORE_PROJECTS]: 'id, name, description, createdAt, updatedAt, status',
      [STORE_CALCULATIONS]: 'id, campaignName, date',
      [STORE_AMAZON_REPORTS]: 'id, fileName, category, uploadDate',
      [STORE_MARKDOWN_NOTES]: 'id, title, category, createdAt, updatedAt',
      [STORE_MARKDOWN_NOTE_VERSIONS]: '++id, noteId, timestamp', // ++id for auto-increment
      [STORE_TASK_COMMENTS]: 'id, taskId, createdAt, userId',
    });

    // Chain version upgrades sequentially.
    // The original code had duplicate version(19) blocks, which is incorrect.
    // Combine the schema definitions and upgrade logic for version 19 into one block.
    this.version(19)
      .stores({
        // Re-declare all schemas for this version. Add new stores/indexes or modify existing ones.
        // Existing schemas must be compatible with previous versions or handle migration in 'upgrade'.
        [STORE_CHAT_MESSAGES]: '++id, chatSessionId, timestamp, sender',
        [STORE_MODULE_PROGRESS]: '[userId+moduleId+progressKey]', // Assuming composite key
        [STORE_QUIZ_RESULTS]: '[userId+moduleId]',
        [STORE_CACHE]: 'key',

        [STORE_EVENTS]: '++id, date',
        [STORE_CRM_CONTACTS]:
          'id, name, email, phone, company, notes, category, createdAt, updatedAt, lastActivity',
        [STORE_CRM_CATEGORIES]: 'id, name',
        [STORE_CRM_COMMUNICATION_LOGS]:
          'id, customerId, type, date, subject, notes',
        [STORE_CRM_ACTIVITY_LOGS]: 'id, contactId, type, date, notes',
        [STORE_CRM_EMAIL_TEMPLATES]: 'id, name',
        [STORE_CRM_SALES_OPPORTUNITIES]:
          'id, name, status, amount, closeDate, contactId, createdAt, updatedAt',
        [STORE_TASKS]:
          'id, title, description, status, assignee, dueDate, projectId, createdAt, updatedAt, dependencies, subtasks, priority, order',
        [STORE_PROJECTS]: 'id, name, description, createdAt, updatedAt, status',
        [STORE_CALCULATIONS]: 'id, campaignName, date',
        [STORE_AMAZON_REPORTS]: 'id, fileName, category, uploadDate',
        [STORE_MARKDOWN_NOTES]: 'id, title, category, createdAt, updatedAt',
        [STORE_MARKDOWN_NOTE_VERSIONS]: '++id, noteId, timestamp',
        [STORE_TASK_COMMENTS]: 'id, taskId, createdAt, userId',
      })
      .upgrade(async (trans) => {
        // Migration logic from version 18 to 19 goes here.
        console.log(`Upgrading ${DB_NAME} from version 18 to 19`);

        // Example: if moduleProgress and quizResults were added in v19,
        // there's no data migration needed for them, just schema definition.
        // If fields were added, you might need a modify operation:
        // await trans.table(STORE_CRM_CONTACTS).toCollection().modify(contact => {
        //   if (contact.newField === undefined) contact.newField = 'defaultValue';
        // });
      });

    // Add further versions as needed, chained sequentially.
    // this.version(20).stores({...}).upgrade(...);

    this.on('versionchange', (event) => {
      console.warn(
        `${SERVICE_NAME}: Database version change detected. Old version: ${event.oldVersion}, New version: ${event.newVersion}`,
      );
      // Optional: Handle specific version change scenarios, like prompting user to refresh
    });
  }
}

export const db = new ScaleSmartDatabase();

// --- Helper Functions ---

function logError(
  error: unknown,
  message: string,
  component: string = SERVICE_NAME,
): void {
  console.error(`${component}: ${message}`, error);
  // Consider integrating with a logging service (e.g., Sentry, LogRocket)
}

// Function to initialize the database connection
export const initializeDB = async (): Promise<void> => {
  if (db.isOpen()) {
    console.log(`${SERVICE_NAME}: ${DB_NAME} is already open.`);
    return;
  }

  try {
    await db.open();
    console.log(
      `${SERVICE_NAME}: ${DB_NAME} initialized and opened successfully.`,
    );
  } catch (error) {
    logError(error, `Failed to open ${DB_NAME}`);
    throw error; // Re-throw to signal failure
  }
};

// --- Generic CRUD Operations ---
// These functions assume the primary key is part of the `value` object
// (e.g., an `id` field for string keys, or `++id` for number keys).
// They also assume getItem/deleteItem are called with the primary key value.

/**
 * Adds or updates an item in a specified store.
 * Assumes the item object contains the primary key property as defined in the schema.
 * @param storeName The name of the store.
 * @param value The item object to add or update.
 * @returns A promise resolving to the primary key of the added/updated item.
 */
export async function setItem<T>(
  storeName: string,
  value: T,
): Promise<IndexableType> {
  try {
    const table = db.table(storeName);
    const key = await table.put(value);
    // Log success might be noisy, enable for debugging if needed.
    // console.log(`${SERVICE_NAME}: Item set in "${storeName}"`, value);
    return key;
  } catch (error) {
    logError(error, `Error setting item in store "${storeName}"`, SERVICE_NAME);
    throw error; // Re-throw to allow specific services to handle
  }
}

/**
 * Retrieves an item from a specified store by its primary key.
 * @param storeName The name of the store.
 * @param key The primary key of the item.
 * @returns A promise resolving to the item, or undefined if not found.
 */
export async function getItem<T>(
  storeName: string,
  key: IndexableType,
): Promise<T | undefined> {
  try {
    const table = db.table(storeName);
    const item = await table.get(key);
    // Log success might be noisy.
    // console.log(`${SERVICE_NAME}: Item retrieved from "${storeName}" with key "${key}"`, item);
    return item;
  } catch (error) {
    logError(
      error,
      `Error getting item from store "${storeName}" with key "${key}"`,
      SERVICE_NAME,
    );
    throw error; // Re-throw
  }
}

/**
 * Deletes an item from a specified store by its primary key.
 * @param storeName The name of the store.
 * @param key The primary key of the item.
 * @returns A promise that resolves when the item is deleted.
 */
export async function deleteItem(
  storeName: string,
  key: IndexableType,
): Promise<void> {
  try {
    const table = db.table(storeName);
    await table.delete(key);
    console.log(
      `${SERVICE_NAME}: Item deleted from "${storeName}" with key "${key}"`,
    );
  } catch (error) {
    logError(
      error,
      `Error deleting item from store "${storeName}" with key "${key}"`,
      SERVICE_NAME,
    );
    throw error; // Re-throw
  }
}

/**
 * Clears all items from a specified store.
 * @param storeName The name of the store.
 * @returns A promise that resolves when the store is cleared.
 */
export async function clearStore(storeName: string): Promise<void> {
  try {
    const table = db.table(storeName);
    await table.clear();
    console.log(`${SERVICE_NAME}: Store "${storeName}" cleared`);
  } catch (error) {
    logError(error, `Error clearing store "${storeName}"`, SERVICE_NAME);
    throw error; // Re-throw
  }
}

/**
 * Retrieves all items from a specified store.
 * @param storeName The name of the store.
 * @returns A promise resolving to an array of all items.
 */
export async function getAllItems<T>(storeName: string): Promise<T[]> {
  try {
    const table = db.table(storeName);
    const items = await table.toArray();
    // Log success might be noisy.
    // console.log(`${SERVICE_NAME}: All items retrieved from "${storeName}" (${items.length})`);
    return items;
  } catch (error) {
    logError(
      error,
      `Error getting all items from store "${storeName}"`,
      SERVICE_NAME,
    );
    throw error; // Re-throw
  }
}

/**
 * Adds or updates multiple items in a specified store in a single transaction.
 * This is more efficient than calling setItem multiple times.
 * @param storeName The name of the store.
 * @param items An array of items to add or update.
 * @returns A promise that resolves when the operation is complete.
 */
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
      SERVICE_NAME,
    );
    throw error;
  }
}

/**
 * Retrieves all items from a specified store.
 * @param storeName The name of the store.
 * @returns A promise resolving to an array of all items.
 * @deprecated Use `getAllItems` instead for clarity.
 */
export const getAllItemsFromStore = getAllItems;

// --- Specific Service Functions ---
// These functions leverage the generic CRUD or use direct Dexie methods for complex queries.

export const getChatMessagesBySession = async (
  chatSessionId: string,
): Promise<ChatMessageRecord[]> => {
  try {
    const messages = await db[STORE_CHAT_MESSAGES].where('chatSessionId')
      .equals(chatSessionId)
      .sortBy('timestamp');
    return messages;
  } catch (error) {
    logError(
      error,
      `Failed to get messages for session ${chatSessionId}`,
      SERVICE_NAME,
    );
    throw error; // Re-throw for consistency
  }
};

export const getAllChatSessionIds = async (): Promise<string[]> => {
  try {
    const sessionIds =
      await db[STORE_CHAT_MESSAGES].orderBy('timestamp').uniqueKeys();
    return sessionIds.map((id) => String(id));
  } catch (error) {
    logError(error, `Failed to get all chat session IDs`, SERVICE_NAME);
    throw error;
  }
};

export const clearChatMessagesBySession = async (
  sessionId: string,
): Promise<void> => {
  try {
    await db[STORE_CHAT_MESSAGES].where('chatSessionId')
      .equals(sessionId)
      .delete();
  } catch (error) {
    logError(
      error,
      `Failed to clear messages for session ${sessionId}`,
      SERVICE_NAME,
    );
    throw error;
  }
};

export async function getCacheItem<T>(key: string): Promise<T | undefined> {
  const item = await getItem<{ key: string; value: T }>(STORE_CACHE, key);
  return item?.value;
}

export async function setCacheItem<T>(key: string, value: T): Promise<string> {
  // The cache store uses 'key' as its primary key
  const itemToStore = { key: key, value: value };
  const resultKey = await setItem<{ key: string; value: T }>(
    STORE_CACHE,
    itemToStore,
  );
  return resultKey as string; // Primary key for cache is string 'key'
}

export async function removeCacheItem(key: string): Promise<void> {
  await deleteItem(STORE_CACHE, key);
}

export const addEvent = async (event: Omit<Event, 'id'>): Promise<number> => {
  try {
    // Assuming 'id' is auto-incrementing (++id) for events
    const id = await db[STORE_EVENTS].add(event as Event); // Dexie generates ++id
    console.log(`${SERVICE_NAME}: Event added`, event);
    return id;
  } catch (error) {
    logError(
      error,
      `Error adding event: ${'title' in event ? event.title : 'Untitled Event'}`,
      SERVICE_NAME,
    );
    throw error;
  }
};

// Example using direct Dexie query for calculations
export async function getCalculations(): Promise<CalculationData[]> {
  try {
    const calculations = await db[STORE_CALCULATIONS].toArray();
    return calculations;
  } catch (error) {
    logError(error, `Error getting all calculations`, SERVICE_NAME);
    throw error;
  }
}

// Example using direct Dexie query for calculations by campaign
export async function getCalculationsByCampaignName(
  campaignName: string,
): Promise<CalculationData[]> {
  try {
    const calculations = await db[STORE_CALCULATIONS].where('campaignName')
      .equals(campaignName)
      .sortBy('date');
    return calculations;
  } catch (error) {
    logError(
      error,
      `Error getting calculations for campaign ${campaignName}`,
      SERVICE_NAME,
    );
    throw error;
  }
}

// Example using setItem for adding, assuming UUID is generated before calling setItem
export const createContact = async (
  contactData: Omit<Contact, 'id' | 'createdAt' | 'updatedAt'>,
): Promise<string> => {
  try {
    const id = crypto.randomUUID();
    const now = Date.now();
    const contactToStore: Contact = {
      ...contactData,
      id,
      createdAt: now,
      updatedAt: now,
    };
    await setItem<Contact>(STORE_CRM_CONTACTS, contactToStore);
    console.log(`${SERVICE_NAME}: Contact created`, contactToStore);
    return id;
  } catch (error) {
    logError(
      error,
      `Error creating contact: ${contactData.name}`,
      SERVICE_NAME,
    );
    throw error;
  }
};

export const getContact = async (id: string): Promise<Contact | undefined> => {
  try {
    return await getItem<Contact>(STORE_CRM_CONTACTS, id);
  } catch (error) {
    logError(error, `Error getting contact with id: ${id}`, SERVICE_NAME);
    throw error;
  }
};

export const getAllContacts = async (): Promise<Contact[]> => {
  try {
    return await getAllItems<Contact>(STORE_CRM_CONTACTS);
  } catch (error) {
    logError(error, `Error getting all contacts`, SERVICE_NAME);
    throw error;
  }
};

export const updateContact = async (contact: Contact): Promise<void> => {
  try {
    const contactToStore = { ...contact, updatedAt: Date.now() };
    await setItem<Contact>(STORE_CRM_CONTACTS, contactToStore);
    console.log(`${SERVICE_NAME}: Contact updated`, contactToStore);
  } catch (error) {
    logError(
      error,
      `Error updating contact with id: ${contact.id}`,
      SERVICE_NAME,
    );
    throw error;
  }
};

export const deleteContact = async (id: string): Promise<void> => {
  try {
    await deleteItem(STORE_CRM_CONTACTS, id);
    console.log(`${SERVICE_NAME}: Contact deleted with id: ${id}`);
  } catch (error) {
    logError(error, `Error deleting contact with id: ${id}`, SERVICE_NAME);
    throw error;
  }
};

// Project Management Functions (using correct store names and generic/direct methods)

export const createTask = async (
  taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>,
): Promise<Task> => {
  try {
    const id = crypto.randomUUID();
    const now = Date.now();
    const taskToStore: Task = {
      ...taskData,
      id,
      createdAt: now,
      updatedAt: now,
    };
    await setItem<Task>(STORE_TASKS, taskToStore);
    console.log(`${SERVICE_NAME}: Task created`, taskToStore);
    return taskToStore;
  } catch (error) {
    logError(error, `Error creating task: ${taskData.title}`, SERVICE_NAME);
    throw error;
  }
};

export const getTask = async (id: string): Promise<Task | undefined> => {
  try {
    return await getItem<Task>(STORE_TASKS, id);
  } catch (error) {
    logError(error, `Error getting task with id: ${id}`, SERVICE_NAME);
    throw error;
  }
};

export const getAllTasks = async (): Promise<Task[]> => {
  try {
    return await getAllItems<Task>(STORE_TASKS);
  } catch (error) {
    logError(error, `Error getting all tasks`, SERVICE_NAME);
    throw error;
  }
};

export async function getTasksByProjectId(projectId: string): Promise<Task[]> {
  try {
    // Handle tasks not linked to any project if NO_PROJECT_VALUE is used
    if (projectId === NO_PROJECT_VALUE) {
      return await db[STORE_TASKS].where('projectId')
        .equals(projectId)
        .or('projectId') // Also include tasks where projectId is explicitly null/undefined if that's a possibility
        .equals(NO_PROJECT_VALUE) // Use the constant for 'no project' tasks
        .sortBy('order');
    }
    const tasks = await db[STORE_TASKS].where('projectId')
      .equals(projectId)
      .sortBy('order');
    return tasks;
  } catch (error) {
    logError(
      error,
      `Error getting tasks for project ${projectId}`,
      SERVICE_NAME,
    );
    throw error;
  }
}

export const updateTask = async (task: Task): Promise<void> => {
  try {
    // Ensure comments is always an array before storing
    const taskToStore = {
      ...task,
      updatedAt: Date.now(),
    };
    await setItem<Task>(STORE_TASKS, taskToStore);
    console.log(`${SERVICE_NAME}: Task updated`, taskToStore);
  } catch (error) {
    logError(error, `Error updating task with id: ${task.id}`, SERVICE_NAME);
    throw error;
  }
};

export const deleteTask = async (id: string): Promise<void> => {
  try {
    await deleteItem(STORE_TASKS, id);
    console.log(`${SERVICE_NAME}: Task deleted with id: ${id}`);
  } catch (error) {
    logError(error, `Error deleting task with id: ${id}`, SERVICE_NAME);
    throw error;
  }
};

export const createProject = async (
  projectData: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>,
): Promise<string> => {
  try {
    const id = crypto.randomUUID();
    const now = Date.now();
    const projectToStore: Project = {
      ...projectData,
      id,
      createdAt: now,
      updatedAt: now,
    };
    await setItem<Project>(STORE_PROJECTS, projectToStore);
    console.log(`${SERVICE_NAME}: Project created`, projectToStore);
    return id;
  } catch (error) {
    logError(
      error,
      `Error creating project: ${projectData.name}`,
      SERVICE_NAME,
    );
    throw error;
  }
};

export const getProject = async (id: string): Promise<Project | undefined> => {
  try {
    return await getItem<Project>(STORE_PROJECTS, id);
  } catch (error) {
    logError(error, `Error getting project with id: ${id}`, SERVICE_NAME);
    throw error;
  }
};

export const getAllProjects = async (): Promise<Project[]> => {
  try {
    return await getAllItems<Project>(STORE_PROJECTS);
  } catch (error) {
    logError(error, `Error getting all projects`, SERVICE_NAME);
    throw error;
  }
};

export const updateProject = async (project: Project): Promise<void> => {
  try {
    const projectToStore = { ...project, updatedAt: Date.now() };
    await setItem<Project>(STORE_PROJECTS, projectToStore);
    console.log(`${SERVICE_NAME}: Project updated`, projectToStore);
  } catch (error) {
    logError(
      error,
      `Error updating project with id: ${project.id}`,
      SERVICE_NAME,
    );
    throw error;
  }
};

export const deleteProject = async (id: string): Promise<void> => {
  try {
    // Use a transaction for atomicity
    await db.transaction(
      'rw',
      db[STORE_TASKS],
      db[STORE_PROJECTS],
      async () => {
        // Find and update tasks associated with the project being deleted
        const tasksToUpdate = await db[STORE_TASKS].where('projectId')
          .equals(id)
          .toArray();

        const updatedTasks = tasksToUpdate.map((task) => ({
          ...task,
          projectId: NO_PROJECT_VALUE, // Use the constant for 'no project'
          updatedAt: Date.now(),
        }));

        // Perform a bulk update for the tasks
        if (updatedTasks.length > 0) {
          await db[STORE_TASKS].bulkPut(updatedTasks);
          console.log(
            `${SERVICE_NAME}: Updated ${updatedTasks.length} tasks to '${NO_PROJECT_VALUE}' after project deletion.`,
          );
        }

        // Finally, delete the project
        await db[STORE_PROJECTS].delete(id);
        console.log(`${SERVICE_NAME}: Project deleted with id: ${id}`);
      },
    );
  } catch (error) {
    logError(error, `Error deleting project with id: ${id}`, SERVICE_NAME);
    throw error; // Re-throw to allow calling function to handle optimistic update revert
  }
};

export async function getProjectsByStatus(
  status: ProjectStatus,
): Promise<Project[]> {
  try {
    const projects = await db[STORE_PROJECTS].where('status')
      .equals(status)
      .sortBy('createdAt');
    return projects;
  } catch (error) {
    logError(error, `Error getting projects by status ${status}`, SERVICE_NAME);
    throw error;
  }
}

// CRM Specific Functions

export const createCommunicationLog = async (
  logData: Omit<CommunicationLog, 'id' | 'date'>,
): Promise<string> => {
  try {
    const id = crypto.randomUUID();
    const logToStore: CommunicationLog = { ...logData, id, date: Date.now() };
    await setItem<CommunicationLog>(STORE_CRM_COMMUNICATION_LOGS, logToStore);
    console.log(`${SERVICE_NAME}: Communication log created`, logToStore);
    return id;
  } catch (error) {
    logError(
      error,
      `Error creating communication log for customer ${logData.customerId}`,
      SERVICE_NAME,
    );
    throw error;
  }
};

export const getCommunicationLogsByCustomerId = async (
  customerId: string,
): Promise<CommunicationLog[]> => {
  try {
    const logs = await db[STORE_CRM_COMMUNICATION_LOGS].where('customerId')
      .equals(customerId)
      .sortBy('date');
    return logs;
  } catch (error) {
    logError(
      error,
      `Error getting communication logs for customer ${customerId}`,
      SERVICE_NAME,
    );
    throw error;
  }
};

export const updateCommunicationLog = async (
  log: CommunicationLog,
): Promise<void> => {
  try {
    const updatedLog = { ...log, date: Date.now() };
    await setItem<CommunicationLog>(STORE_CRM_COMMUNICATION_LOGS, updatedLog);
    console.log(`${SERVICE_NAME}: Communication log updated`, updatedLog);
  } catch (error) {
    logError(
      error,
      `Error updating communication log with id: ${log.id}`,
      SERVICE_NAME,
    );
    throw error;
  }
};

export const deleteCommunicationLog = async (id: string): Promise<void> => {
  try {
    await deleteItem(STORE_CRM_COMMUNICATION_LOGS, id);
    console.log(`${SERVICE_NAME}: Communication log deleted with id: ${id}`);
  } catch (error) {
    logError(
      error,
      `Error deleting communication log with id: ${id}`,
      SERVICE_NAME,
    );
    throw error;
  }
};

export const addCategory = async (
  categoryData: Omit<Category, 'id'>,
): Promise<string> => {
  try {
    const id = crypto.randomUUID();
    const categoryToStore: Category = { ...categoryData, id };
    await setItem<Category>(STORE_CRM_CATEGORIES, categoryToStore);
    console.log(`${SERVICE_NAME}: Category added`, categoryToStore);
    return id;
  } catch (error) {
    logError(
      error,
      `Error adding category: ${categoryData.name}`,
      SERVICE_NAME,
    );
    throw error;
  }
};

export const getAllCategories = async (): Promise<Category[]> => {
  try {
    return await getAllItems<Category>(STORE_CRM_CATEGORIES);
  } catch (error) {
    logError(error, `Error getting all categories`, SERVICE_NAME);
    throw error;
  }
};

export const updateCategory = async (category: Category): Promise<void> => {
  try {
    await setItem<Category>(STORE_CRM_CATEGORIES, category);
    console.log(`${SERVICE_NAME}: Category updated`, category);
  } catch (error) {
    logError(
      error,
      `Error updating category with id: ${category.id}`,
      SERVICE_NAME,
    );
    throw error;
  }
};

export const deleteCategory = async (id: string): Promise<void> => {
  try {
    await deleteItem(STORE_CRM_CATEGORIES, id);
    console.log(`${SERVICE_NAME}: Category deleted with id: ${id}`);
  } catch (error) {
    logError(error, `Error deleting category with id: ${id}`, SERVICE_NAME);
    throw error;
  }
};

export async function getContactsByCategory(
  category: string,
): Promise<Contact[]> {
  try {
    const contacts = await db[STORE_CRM_CONTACTS].where('category')
      .equals(category)
      .sortBy('name');
    return contacts;
  } catch (error) {
    logError(
      error,
      `Error getting contacts for category ${category}`,
      SERVICE_NAME,
    );
    throw error;
  }
}

export async function getActivityLogsByContactId(
  contactId: string,
): Promise<ActivityLog[]> {
  try {
    const logs = await db[STORE_CRM_ACTIVITY_LOGS].where('contactId')
      .equals(contactId)
      .sortBy('date');
    return logs;
  } catch (error) {
    logError(
      error,
      `Error getting activity logs for contact ${contactId}`,
      SERVICE_NAME,
    );
    throw error;
  }
}

export async function getSalesOpportunitiesByStatus(
  status: string,
): Promise<SalesOpportunity[]> {
  try {
    const opportunities = await db[STORE_CRM_SALES_OPPORTUNITIES].where(
      'status',
    )
      .equals(status)
      .sortBy('closeDate');
    return opportunities;
  } catch (error) {
    logError(
      error,
      `Error getting sales opportunities by status ${status}`,
      SERVICE_NAME,
    );
    throw error;
  }
}

export async function getEmailTemplates(): Promise<
  { id: string; name: string }[]
> {
  const templates = await db[STORE_CRM_EMAIL_TEMPLATES].toArray();
  return templates;
}

// Amazon Seller Tools Specific Functions

export async function getAmazonReportsByCategory(
  category: string,
): Promise<AmazonReport[]> {
  try {
    const reports = await db[STORE_AMAZON_REPORTS].where('category')
      .equals(category)
      .sortBy('uploadDate');
    return reports;
  } catch (error) {
    logError(
      error,
      `Error getting Amazon reports for category ${category}`,
      SERVICE_NAME,
    );
    throw error;
  }
}

// Markdown Notepad Specific Functions

export async function getNotesByCategory(category: string): Promise<Note[]> {
  try {
    const notes = await db[STORE_MARKDOWN_NOTES].where('category')
      .equals(category)
      .sortBy('createdAt');
    return notes;
  } catch (error) {
    logError(
      error,
      `Error getting notes for category ${category}`,
      SERVICE_NAME,
    );
    throw error;
  }
}

export async function getNoteVersionsByNoteId(
  noteId: string,
): Promise<MarkdownNoteVersion[]> {
  try {
    const versions = await db[STORE_MARKDOWN_NOTE_VERSIONS].where('noteId')
      .equals(noteId)
      .sortBy('timestamp');
    return versions;
  } catch (error) {
    logError(
      error,
      `Error getting note versions for note ${noteId}`,
      SERVICE_NAME,
    );
    throw error;
  }
}

// Task Comments Specific Functions

export async function getTaskCommentsByTaskId(
  taskId: string,
): Promise<TaskComment[]> {
  try {
    const comments = await db[STORE_TASK_COMMENTS].where('taskId')
      .equals(taskId)
      .sortBy('createdAt');
    return comments;
  } catch (error) {
    logError(
      error,
      `Error getting task comments for task ${taskId}`,
      SERVICE_NAME,
    );
    throw error;
  }
}

// Calendar Events Specific Functions

export async function getEventsByDate(date: string): Promise<Event[]> {
  try {
    const events = await db[STORE_EVENTS].where('date').equals(date).toArray();
    return events;
  } catch (error) {
    logError(error, `Error getting events for date ${date}`, SERVICE_NAME);
    throw error;
  }
}

// Chat Interface Specific Functions

export async function getQuizResultsByUserIdAndModuleId(
  userId: string,
  moduleId: string,
): Promise<QuizResultRecord[]> {
  try {
    const results = await db[STORE_QUIZ_RESULTS].where('[userId+moduleId]')
      .equals([userId, moduleId])
      .toArray();
    return results;
  } catch (error) {
    logError(
      error,
      `Error getting quiz results for user ${userId} and module ${moduleId}`,
      SERVICE_NAME,
    );
    throw error;
  }
}

export async function getModuleProgressByUserId(
  userId: string,
): Promise<ModuleProgressRecord[]> {
  try {
    // Assuming moduleProgress has 'userId' index or is part of composite key
    const progress = await db[STORE_MODULE_PROGRESS].where('userId')
      .equals(userId)
      .toArray();
    return progress;
  } catch (error) {
    logError(
      error,
      `Error getting module progress for user ${userId}`,
      SERVICE_NAME,
    );
    throw error;
  }
}
