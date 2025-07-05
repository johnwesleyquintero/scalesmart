import {
  setItem,
  getItem,
  deleteItem,
  getAllItems,
  db,
} from 'lib/indexeddb-service.ts';

import {
  PROJECT_STORE,
  TASK_STORE,
  TASK_COMMENT_STORE,
} from '@/lib/constants/project-management';

import {
  Project,
  Task,
  TaskComment,
  ProjectStatus,
  TaskStatus,
  TaskPriority,
} from '@/types/indexeddb';

// --- Project Management-specific IndexedDB Operations ---

/**
 * Creates a new project.
 * @param project The project object to create.
 * @returns A promise that resolves with the created project.
 */
export async function createProject(project: Project): Promise<Project> {
  try {
    await db.projects.put(project);
    return project;
  } catch (error) {
    console.error('Error creating project:', error);
    throw error;
  }
}

/**
 * Updates an existing project.
 * @param project The project object to update.
 * @returns A promise that resolves with the updated project.
 */
export async function updateProject(project: Project): Promise<Project> {
  try {
    await db.projects.put(project);
    return project;
  } catch (error) {
    console.error('Error updating project:', error);
    throw error;
  }
}

/**
 * Deletes a project by its ID.
 * @param projectId The ID of the project to delete.
 * @returns A promise that resolves when the project is deleted.
 */
export async function deleteProject(projectId: string): Promise<void> {
  await deleteItem(PROJECT_STORE, projectId);
}

/**
 * Gets a project by its ID.
 * @param projectId The ID of the project.
 * @returns A promise that resolves with the project object, or undefined if not found.
 */
export async function getProject(
  projectId: string,
): Promise<Project | undefined> {
  try {
    return await db.projects.get(projectId);
  } catch (error) {
    console.error('Error getting project:', error);
    throw error;
  }
}

/**
 * Gets all projects.
 * @returns A promise that resolves with an array of Project objects.
 */
export async function getAllProjects(): Promise<Project[]> {
  try {
    return await db.projects.toArray();
  } catch (error) {
    console.error('Error getting all projects:', error);
    throw error;
  }
}

/**
 * Creates a new task.
 * @param task The task object to create.
 * @returns A promise that resolves with the created task.
 */
export async function createTask(task: Task): Promise<Task> {
  try {
    await db.tasks.put(task);
    return task;
  } catch (error) {
    console.error('Error creating task:', error);
    throw error;
  }
}

/**
 * Updates an existing task.
 * @param task The task object to update.
 * @returns A promise that resolves with the updated task.
 */
export async function updateTask(task: Task): Promise<Task> {
  try {
    await db.tasks.put(task);
    return task;
  } catch (error) {
    console.error('Error updating task:', error);
    throw error;
  }
}

/**
 * Deletes a task by its ID.
 * @param taskId The ID of the task to delete.
 * @returns A promise that resolves when the task is deleted.
 */
export async function deleteTask(taskId: string): Promise<void> {
  try {
    await db.tasks.delete(taskId);
  } catch (error) {
    console.error('Error deleting task:', error);
    throw error;
  }
}

/**
 * Gets a task by its ID.
 * @param taskId The ID of the task.
 * @returns A promise that resolves with the task object, or undefined if not found.
 */
export async function getTask(taskId: string): Promise<Task | undefined> {
  try {
    return await db.tasks.get(taskId);
  } catch (error) {
    console.error('Error getting task:', error);
    throw error;
  }
}

/**
 * Gets all tasks.
 * @returns A promise that resolves with an array of Task objects.
 */
export async function getAllTasks(): Promise<Task[]> {
  try {
    return await db.tasks.toArray();
  } catch (error) {
    console.error('Error getting all tasks:', error);
    throw error;
  }
}

/**
 * Creates a new task comment.
 * @param comment The task comment object to create.
 * @returns A promise that resolves when the comment is created.
 */
export async function createTaskComment(comment: TaskComment): Promise<void> {
  try {
    await db.taskComments.put(comment);
  } catch (error) {
    console.error('Error creating task comment:', error);
    throw error;
  }
}

/**
 * Gets all comments for a specific task.
 * Note: This fetches all comments and filters. For large numbers of comments,
 * consider adding an index on `taskId` in your IndexedDB service and using
 * a query method if available.
 * @param taskId The ID of the task.
 * @returns A promise that resolves with an array of TaskComment objects for the given task.
 */
export async function getTaskCommentsByTaskId(
  taskId: string,
): Promise<TaskComment[]> {
  const allComments = await getAllItems<TaskComment>(TASK_COMMENT_STORE);
  return allComments.filter(
    (comment: TaskComment) => comment.taskId === taskId,
  );
}
