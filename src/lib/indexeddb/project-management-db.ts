import {
  setItem,
  getItem,
  deleteItem,
  getAllItemsFromStore,
} from '@/lib/indexeddb-service';

// --- IndexedDB Store Names for Project Management Data ---
const PROJECT_STORE = 'projects';
const TASK_STORE = 'tasks';
const TASK_COMMENT_STORE = 'task-comments';

// --- Types for Project Management IndexedDB Records ---
export interface Project {
  id: string;
  name: string;
  description?: string;
  createdAt: number;
  updatedAt: number;
  status: 'active' | 'completed' | 'archived';
}

export interface Task {
  id: string;
  projectId?: string; // Made projectId optional
  title: string;
  description?: string;
  status: 'to-do' | 'in-progress' | 'completed'; // Aligned with TaskStatus enum
  priority?: 'low' | 'medium' | 'high'; // Made priority optional
  dueDate?: number; // Timestamp
  assignee?: string; // Added assignee
  dependencies?: string[]; // Added dependencies
  subtasks?: string[]; // Added subtasks
  comments?: TaskComment[]; // Added comments
  order?: number; // Added order property for sorting
  createdAt: number;
  updatedAt: number;
}

export interface TaskComment {
  id: string;
  taskId: string;
  userId: string;
  content: string;
  createdAt: number;
}

// --- Project Management-specific IndexedDB Operations ---

/**
 * Creates a new project.
 * @param project The project object to create.
 */
export async function createProject(project: Project): Promise<Project> {
  await setItem(PROJECT_STORE, project.id, project);
  return project;
}

/**
 * Updates an existing project.
 * @param project The project object to update.
 * @returns The updated project.
 */
export async function updateProject(project: Project): Promise<Project> {
  await setItem(PROJECT_STORE, project.id, project);
  return project;
}

/**
 * Deletes a project by its ID.
 * @param projectId The ID of the project to delete.
 */
export async function deleteProject(projectId: string): Promise<void> {
  await deleteItem(PROJECT_STORE, projectId);
}

/**
 * Gets a project by its ID.
 * @param projectId The ID of the project.
 * @returns The project object, or undefined if not found.
 */
export async function getProject(
  projectId: string,
): Promise<Project | undefined> {
  return getItem<Project>(`${PROJECT_STORE}-${projectId}`);
}

/**
 * Gets all projects.
 * @returns An array of Project objects.
 */
export async function getAllProjects(): Promise<Project[]> {
  return getAllItemsFromStore<Project>(PROJECT_STORE);
}

/**
 * Creates a new task.
 * @param task The task object to create.
 */
export async function createTask(task: Task): Promise<Task> {
  await setItem(TASK_STORE, task.id, task);
  return task;
}

/**
 * Updates an existing task.
 * @param task The task object to update.
 * @returns The updated task.
 */
export async function updateTask(task: Task): Promise<Task> {
  await setItem(TASK_STORE, task.id, task);
  return task;
}

/**
 * Deletes a task by its ID.
 * @param taskId The ID of the task to delete.
 */
export async function deleteTask(taskId: string): Promise<void> {
  await deleteItem(TASK_STORE, taskId);
}

/**
 * Gets a task by its ID.
 * @param taskId The ID of the task.
 * @returns The task object, or undefined if not found.
 */
export async function getTask(taskId: string): Promise<Task | undefined> {
  return getItem<Task>(`${TASK_STORE}-${taskId}`);
}

/**
 * Gets all tasks.
 * @returns An array of Task objects.
 */
export async function getAllTasks(): Promise<Task[]> {
  return getAllItemsFromStore<Task>(TASK_STORE);
}

/**
 * Creates a new task comment.
 * @param comment The task comment object to create.
 */
export async function createTaskComment(comment: TaskComment): Promise<void> {
  await setItem(TASK_COMMENT_STORE, comment.id, comment);
}

/**
 * Gets all comments for a specific task.
 * @param taskId The ID of the task.
 * @returns An array of TaskComment objects.
 */
export async function getTaskCommentsByTaskId(
  taskId: string,
): Promise<TaskComment[]> {
  const allComments =
    await getAllItemsFromStore<TaskComment>(TASK_COMMENT_STORE);
  return allComments.filter((comment) => comment.taskId === taskId);
}
