import React, { useState, useCallback, useEffect } from 'react';
import { getSocket } from '@/lib/socket';
import { SOCKET_EVENTS } from '@/lib/constants/socket-events';
import {
  Task,
  Project,
  updateTask,
  createTask,
  deleteTask,
  createProject,
  updateProject,
  deleteProject,
} from '@/lib/indexeddb-service';
import { TaskStatus } from '@/types/indexeddb';
import { toast } from 'sonner';
import { useTaskManagementData } from './use-task-management-data';
import { useTaskDragAndDrop } from './use-task-drag-and-drop';

/**
 * @interface UseTaskManagementReturn
 * @brief Return type for the `useTaskManagement` hook.
 * @property {Task[]} tasks - Array of all tasks currently in the state.
 * @property {React.Dispatch<React.SetStateAction<Task[]>>} setTasks - Setter function for the tasks state.
 * @property {Project[]} projects - Array of all projects currently in the state.
 * @property {React.Dispatch<React.SetStateAction<Project[]>>} setProjects - Setter function for the projects state.
 * @property {boolean} isLoading - Indicates if initial data is currently being loaded from IndexedDB.
 * @property {string | null} error - Stores any error message that occurred during initial data loading or persistence operations.
 * @property {(updatedTask: Task) => Promise<void>} handleUpdateTask - Handler function to update an existing task in state and persist changes to IndexedDB.
 * @property {(event: DragEndEvent) => Promise<void>} handleDragEnd - Handler function for the Dnd-kit `onDragEnd` event, managing task status changes and reordering.
 * @property {(taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'comments'>) => Promise<Task | undefined>} handleCreateTask - Handler function to create a new task, add it to state optimistically, and persist it to IndexedDB. Returns the created task with its final ID.
 * @property {(id: string) => Promise<void>} handleDeleteTask - Handler function to delete a task from state optimistically and persist the deletion to IndexedDB.
 * @property {(projectData: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string | undefined>} handleCreateProject - Handler function to create a new project, add it to state optimistically, and persist it to IndexedDB. Returns the created project's final ID.
 * @property {(project: Project) => Promise<void>} handleUpdateProject - Handler function to update an existing project in state and persist changes to IndexedDB.
 * @property {(id: string) => Promise<void>} handleDeleteProject - Handler function to delete a project from state optimistically and persist the deletion to IndexedDB. Also removes associated tasks.
 */

/**
 * @function useTaskManagement
 * @brief A custom React hook for managing tasks and projects, including IndexedDB persistence and Dnd-kit integration.
 *
 * This hook centralizes the state management and business logic for the project management
 * dashboard. It handles fetching initial data, optimistic updates for tasks and projects,
 * persistence to IndexedDB, and drag-and-drop operations for tasks. It provides handlers
 * for CRUD operations on both tasks and projects.
 *
 * @returns {UseTaskManagementReturn} An object containing tasks, projects, loading state, error state, and various handler functions.
 */
export const useTaskManagement = () => {
  const { tasks, setTasks, projects, setProjects, isLoading, error } =
    useTaskManagementData();

  useEffect(() => {
    const socket = getSocket();

    const onTaskUpdate = (updatedTask: Task) => {
      setTasks((prevTasks) =>
        prevTasks.map((task) =>
          task.id === updatedTask.id ? updatedTask : task,
        ),
      );
    };

    const onTaskCreate = (newTask: Task) => {
      setTasks((prevTasks) => [...prevTasks, newTask]);
    };

    const onTaskDelete = (deletedTaskId: string) => {
      setTasks((prevTasks) =>
        prevTasks.filter((task) => task.id !== deletedTaskId),
      );
    };

    socket.on(SOCKET_EVENTS.TASK_UPDATE, onTaskUpdate);
    socket.on(SOCKET_EVENTS.TASK_CREATE, onTaskCreate);
    socket.on(SOCKET_EVENTS.TASK_DELETE, onTaskDelete);

    return () => {
      socket.off(SOCKET_EVENTS.TASK_UPDATE, onTaskUpdate);
      socket.off(SOCKET_EVENTS.TASK_CREATE, onTaskCreate);
      socket.off(SOCKET_EVENTS.TASK_DELETE, onTaskDelete);
    };
  }, [setTasks]);

  /**
   * @brief A generic helper function to perform optimistic updates and handle persistence.
   *
   * This function applies an immediate state update (optimistic update) and then
   * attempts to persist the change to IndexedDB. If persistence fails, the state
   * is reverted to its original state. It also handles success/error toasts.
   *
   * @template T The type of the items in the state array (e.g., Task, Project).
   * @template R The return type of the persistence logic function.
   * @param {function(T[]): T[]} updateLogic A function that takes the current state array and returns the new state array after the optimistic update.
   * @param {function(): Promise<R>} persistenceLogic An async function that performs the actual IndexedDB persistence operation. It should return a Promise resolving with the result of the persistence (e.g., the created item with its final ID).
   * @param {string} successMessage The message to display as a toast notification on successful persistence.
   * @param {string} errorMessage The message to display as a toast notification on failed persistence.
   * @param {T[]} originalState The state array before the optimistic update, used for reverting on error.
   * @param {React.Dispatch<React.SetStateAction<T[]>>} setStateFunction The React state setter function (e.g., setTasks, setProjects) for the state being updated.
   * @param {function(R, T[]): T[]} [onPersistenceSuccess] An optional function that takes the result of the persistence logic and the current optimistic state, and returns the final state to set after successful persistence. Useful for updating temporary IDs with real ones or performing secondary state updates (like removing associated tasks when a project is deleted).
   * @returns {Promise<R>} A Promise that resolves with the result of the persistence logic on success, or rejects on failure.
   */
  const performOptimisticUpdate = useCallback(
    async <T, R = void>(
      updateLogic: (prevState: T[]) => T[],
      persistenceLogic: () => Promise<R>,
      successMessage: string,
      errorMessage: string,
      originalState: T[],
      setStateFunction: React.Dispatch<React.SetStateAction<T[]>>,
      onPersistenceSuccess?: (result: R, optimisticState: T[]) => T[],
      eventName?:
        | typeof SOCKET_EVENTS.TASK_UPDATE
        | typeof SOCKET_EVENTS.TASK_CREATE
        | typeof SOCKET_EVENTS.TASK_DELETE,
      getEventPayload?: (result: R) => Task | string,
    ): Promise<R> => {
      // Apply optimistic update immediately
      setStateFunction(updateLogic);

      try {
        // Attempt to persist the change
        const persistenceResult = await persistenceLogic();
        // If persistence is successful and a success handler is provided, apply the final state update
        if (onPersistenceSuccess) {
          setStateFunction((prev: T[]) =>
            onPersistenceSuccess(persistenceResult, prev as T[]),
          );
        }

        if (eventName && getEventPayload) {
          const socket = getSocket();
          socket.emit(eventName, getEventPayload(persistenceResult));
        }

        toast.success(successMessage); // Show success toast only after successful persistence
        return persistenceResult; // Return the result of the persistence logic
      } catch (error) {
        // If persistence fails, revert the state and show an error toast
        console.error('Persistence failed:', error); // Log the error for debugging
        setStateFunction(originalState); // Revert state on error
        toast.error(`${errorMessage}: ${(error as Error).message}`); // Show error toast
        throw error; // Re-throw the error to be caught by specific handlers if needed
      }
    },
    [],
  );

  const { handleDragEnd } = useTaskDragAndDrop({
    tasks,
    setTasks,
    performOptimisticUpdate,
  });

  /**
   * @brief Updates an existing task in state and IndexedDB.
   *
   * This function is typically called when a task's properties (title, description,
   * assignee, etc.) are modified, not when its status/order changes via drag-and-drop.
   * It performs an optimistic update and persists the changes.
   *
   * @param {Task} updatedTask The task object with updated properties.
   * @returns {Promise<void>} A Promise that resolves when the optimistic update and persistence attempt are complete.
   */
  const handleUpdateTask = useCallback(
    async (updatedTask: Task) => {
      const originalTasks = [...tasks]; // Capture current state for potential revert
      await performOptimisticUpdate(
        (prevTasks) =>
          // Map over the previous tasks and replace the task with the matching ID
          prevTasks.map((task) =>
            task.id === updatedTask.id ? updatedTask : task,
          ),
        async () => await updateTask(updatedTask), // Persistence logic: update the task in IndexedDB
        `Task "${updatedTask.title}" updated successfully!`, // Success message
        `Failed to update task "${updatedTask.title}". Please try again.`, // Error message
        originalTasks, // Original state for revert
        setTasks, // State setter function
        undefined,
        SOCKET_EVENTS.TASK_UPDATE,
        () => updatedTask,
      );
    },
    [tasks, performOptimisticUpdate, setTasks],
  );

  /**
   * @brief Creates a new task and persists it to IndexedDB.
   *
   * This function adds a new task to the state optimistically with a temporary ID,
   * then persists the task to IndexedDB. Upon successful persistence, it updates
   * the task in the state with the real ID generated by the database.
   *
   * @param {Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'comments'>} taskData The data for the new task, excluding generated fields and comments (comments are initialized as empty).
   * @returns {Promise<Task | undefined>} A Promise that resolves with the created task object (including its real ID and timestamps) on success, or undefined on failure.
   */
  const handleCreateTask = useCallback(
    async (
      taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'comments'>,
    ): Promise<Task | undefined> => {
      const originalTasks = [...tasks]; // Capture current state for potential revert
      const tempId = `temp-${Date.now()}-${Math.random()}`; // Generate a temporary ID for the optimistic update
      let finalCreatedTask: Task | undefined; // Variable to store the final created task

      try {
        const createdTask = await performOptimisticUpdate(
          (prevTasks) => {
            // Create an optimistic task object with the temporary ID and current timestamps
            const optimisticTask: Task = {
              ...taskData,
              id: tempId,
              createdAt: Date.now(),
              updatedAt: Date.now(),
              comments: [], // Initialize comments as an empty array for new tasks
              order: prevTasks.filter((t) => t.status === taskData.status)
                .length, // Assign an initial order at the end of the target column
            };
            finalCreatedTask = optimisticTask; // Store the optimistic task initially
            return [...prevTasks, optimisticTask]; // Add the optimistic task to the state
          },
          async () => {
            // Persistence logic: create the task in IndexedDB
            const newTask = await createTask({ ...taskData, comments: [] });
            if (!newTask) {
              throw new Error('Failed to create task in database.');
            }
            return newTask; // Return the task created in the database (includes real ID)
          },
          `Task "${taskData.title}" created successfully!`, // Success message
          `Failed to create task "${taskData.title}". Please try again.`, // Error message
          originalTasks, // Original state for revert
          setTasks, // State setter function
          (newTaskFromDb: Task, optimisticState: Task[]) => {
            // onPersistenceSuccess handler: replace the optimistic task with the real one from the database
            finalCreatedTask = newTaskFromDb; // Update with the real task from the database
            return optimisticState.map(
              (task) => (task.id === tempId ? newTaskFromDb : task), // Replace the task with the temporary ID
            );
          },
          SOCKET_EVENTS.TASK_CREATE,
          (newTask) => newTask,
        );
        return createdTask; // Return the final created task on success
      } catch (error) {
        // Error is already handled and logged by performOptimisticUpdate
        return undefined; // Return undefined on failure
      }
    },
    [tasks, performOptimisticUpdate, setTasks],
  );

  /**
   * @brief Deletes a task from state and IndexedDB.
   *
   * This function removes the task from the state optimistically and then
   * persists the deletion to IndexedDB.
   *
   * @param {string} id The ID of the task to delete.
   * @returns {Promise<void>} A Promise that resolves when the optimistic update and persistence attempt are complete.
   */
  const handleDeleteTask = useCallback(
    async (id: string) => {
      const originalTasks = [...tasks]; // Capture current state for potential revert
      await performOptimisticUpdate(
        (prevTasks) => prevTasks.filter((task) => task.id !== id), // Update logic: remove the task from the state
        async () => await deleteTask(id), // Persistence logic: delete the task from IndexedDB
        'Task deleted successfully.', // Success message
        'Failed to delete task. Please try again.', // Error message
        originalTasks, // Original state for revert
        setTasks, // State setter function
        undefined,
        SOCKET_EVENTS.TASK_DELETE,
        () => id,
      );
    },
    [tasks, performOptimisticUpdate, setTasks],
  );

  /**
   * @brief Creates a new project and persists it to IndexedDB.
   *
   * This function adds a new project to the state optimistically with a temporary ID,
   * then persists the project to IndexedDB. Upon successful persistence, it updates
   * the project in the state with the real ID generated by the database.
   *
   * @param {Omit<Project, 'id' | 'createdAt' | 'updatedAt'>} projectData The data for the new project, excluding generated fields.
   * @returns {Promise<string | undefined>} A Promise that resolves with the created project's ID on success, or undefined on failure.
   */
  const handleCreateProject = useCallback(
    async (
      projectData: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>,
    ): Promise<string | undefined> => {
      const originalProjects = [...projects]; // Capture current state for potential revert
      const tempId = `temp-${Date.now()}-${Math.random()}`; // Generate a temporary ID for the optimistic update
      let finalCreatedProjectId: string | undefined; // Variable to store the final created project ID

      try {
        await performOptimisticUpdate(
          (prevProjects) => {
            // Create an optimistic project object with the temporary ID and current timestamps
            const optimisticProject: Project = {
              ...projectData,
              id: tempId,
              createdAt: Date.now(),
              updatedAt: Date.now(),
              status: projectData.status, // Include status from projectData
            };
            finalCreatedProjectId = optimisticProject.id; // Store the optimistic ID initially
            return [...prevProjects, optimisticProject]; // Add the optimistic project to the state
          },
          async () => {
            // Persistence logic: create the project in IndexedDB
            const realProjectId = await createProject(projectData);
            if (!realProjectId) {
              throw new Error('Failed to create project in database.');
            }
            return realProjectId; // Return the real project ID from the database
          },
          `Project "${projectData.name}" created successfully!`, // Success message
          `Failed to create project "${projectData.name}". Please try again.`, // Error message
          originalProjects, // Original state for revert
          setProjects, // Projects state setter function
          (realProjectIdFromDb: string, optimisticState: Project[]) => {
            // onPersistenceSuccess handler: replace the optimistic project ID with the real one
            finalCreatedProjectId = realProjectIdFromDb; // Update with the real ID from the database
            return optimisticState.map((project) =>
              project.id === tempId
                ? { ...project, id: realProjectIdFromDb } // Replace the temporary ID with the real one
                : project,
            );
          },
        );
        return finalCreatedProjectId; // Return the final created project ID on success
      } catch (error) {
        // Error is already handled and logged by performOptimisticUpdate
        return undefined; // Return undefined on failure
      }
    },
    [projects, performOptimisticUpdate, setProjects],
  );

  /**
   * @brief Deletes a project from state and IndexedDB.
   *
   * This function removes the project from the state optimistically and then
   * persists the deletion to IndexedDB. It also removes any tasks associated
   * with the deleted project from the tasks state.
   *
   * @param {string} id The ID of the project to delete.
   * @returns {Promise<void>} A Promise that resolves when the optimistic update and persistence attempt are complete.
   */
  const handleDeleteProject = useCallback(
    async (id: string) => {
      const originalProjects = [...projects]; // Capture current projects state for potential revert
      const originalTasks = [...tasks]; // Capture original tasks state for potential revert

      try {
        await performOptimisticUpdate(
          (prevProjects: Project[]) =>
            prevProjects.filter((project) => project.id !== id), // Optimistic update: remove the project from the state
          async () => {
            await deleteProject(id); // Persistence logic: delete the project from IndexedDB
            return id; // Return the ID of the deleted project for onPersistenceSuccess
          },
          'Project deleted successfully.', // Success message
          'Failed to delete project. Please try again.', // Error message
          originalProjects, // Original projects state for revert
          setProjects, // Projects state setter function
          (deletedProjectId: string, optimisticProjects: Project[]) => {
            // onPersistenceSuccess handler: filter out tasks associated with the deleted project
            setTasks((prevTasks) =>
              prevTasks.filter((task) => task.projectId !== deletedProjectId),
            );
            // Return the updated projects state for the primary setStateFunction (setProjects)
            return optimisticProjects.filter(
              (project) => project.id !== deletedProjectId,
            );
          },
        );
      } catch (error) {
        // Error is already handled and logged by performOptimisticUpdate
        // Revert tasks state as well if project deletion failed
        setTasks(originalTasks);
      }
    },
    [projects, tasks, setTasks, performOptimisticUpdate, setProjects],
  );

  /**
   * @brief Updates an existing project in state and IndexedDB.
   *
   * This function updates the project in the state optimistically and then
   * persists the changes to IndexedDB.
   *
   * @param {Project} updatedProject The project object with updated properties.
   * @returns {Promise<void>} A Promise that resolves when the optimistic update and persistence attempt are complete.
   */
  const handleUpdateProject = useCallback(
    async (updatedProject: Project) => {
      const originalProjects = [...projects]; // Capture current state for potential revert
      await performOptimisticUpdate(
        (prevProjects) =>
          // Map over the previous projects and replace the project with the matching ID
          prevProjects.map((project) =>
            project.id === updatedProject.id ? updatedProject : project,
          ),
        async () => await updateProject(updatedProject), // Persistence logic: update the project in IndexedDB
        `Project "${updatedProject.name}" updated successfully!`, // Success message
        `Failed to update project "${updatedProject.name}". Please try again.`, // Error message
        originalProjects, // Original state for revert
        setProjects, // State setter function
      );
    },
    [projects, performOptimisticUpdate, setProjects],
  );

  return {
    tasks,
    setTasks, // Expose setTasks if needed by parent components (e.g., for initial sorting)
    projects,
    setProjects, // Expose setProjects if needed by parent components
    isLoading,
    error,
    handleUpdateTask,
    handleDragEnd,
    handleCreateTask,
    handleDeleteTask,
    handleCreateProject,
    handleUpdateProject,
    handleDeleteProject,
  };
};
