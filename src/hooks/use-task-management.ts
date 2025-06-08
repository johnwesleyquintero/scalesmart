'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Task,
  Project,
  getAllTasks,
  getAllProjects,
  updateTask,
  createTask,
  deleteTask,
  createProject,
  updateProject,
  deleteProject,
} from '@/lib/indexeddb-service';
import { TaskStatus } from '@/types/indexeddb'; // Import TaskStatus
import { toast } from 'sonner';
import { DragEndEvent } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';

/**
 * @interface UseTaskManagementReturn
 * @brief Return type for the `useTaskManagement` hook.
 * @property {Task[]} tasks - Array of all tasks.
 * @property {React.Dispatch<React.SetStateAction<Task[]>>} setTasks - Setter for tasks state.
 * @property {Project[]} projects - Array of all projects.
 * @property {React.Dispatch<React.SetStateAction<Project[]>>} setProjects - Setter for projects state.
 * @property {boolean} isLoading - Indicates if data is currently being loaded.
 * @property {string | null} error - Stores any error message that occurred during data loading or persistence.
 * @property {(updatedTask: Task) => Promise<void>} handleUpdateTask - Handler to update an existing task and persist it.
 * @property {(event: DragEndEvent) => Promise<void>} handleDragEnd - Handler for Dnd-kit drag end event.
 * @property {(taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'comments'>) => Promise<Task | undefined>} handleCreateTask - Handler to create a new task.
 * @property {(id: string) => Promise<void>} handleDeleteTask - Handler to delete a task.
 * @property {(projectData: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string | undefined>} handleCreateProject - Handler to create a new project.
 * @property {(project: Project) => Promise<void>} handleUpdateProject - Handler to update an existing project.
 * @property {(id: string) => Promise<void>} handleDeleteProject - Handler to delete a project.
 */

/**
 * @function useTaskManagement
 * @brief A custom React hook for managing tasks and projects, including IndexedDB persistence and Dnd-kit integration.
 *
 * This hook centralizes the state management and business logic for the project management
 * dashboard. It handles fetching initial data, optimistic updates for tasks and projects,
 * persistence to IndexedDB, and drag-and-drop operations for tasks.
 *
 * @returns {UseTaskManagementReturn} An object containing tasks, projects, and various handlers.
 */
export const useTaskManagement = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Effect to load initial tasks and projects data from IndexedDB on component mount.
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const loadedTasks = await getAllTasks();
        const loadedProjects = await getAllProjects();
        setTasks(loadedTasks.sort((a, b) => (a.order || 0) - (b.order || 0))); // Sort by order
        setProjects(loadedProjects);
      } catch (err) {
        setError('Failed to load data. Please refresh the page.');
        toast.error('Failed to load project management data.');
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  /**
   * @brief A generic helper function to perform optimistic updates and handle persistence.
   * @param updateLogic A function that takes the current state and returns the new state for optimistic update.
   * @param persistenceLogic An async function that performs the actual IndexedDB persistence.
   * @param successMessage The message to display on successful persistence.
   * @param errorMessage The message to display on failed persistence.
   * @param originalState The state before the optimistic update, used for reverting on error.
   * @param setStateFunction The React state setter function (e.g., setTasks, setProjects).
   */
  /**
   * @brief A generic helper function to perform optimistic updates and handle persistence.
   *
   * This function applies an immediate state update (optimistic update) and then
   * attempts to persist the change to IndexedDB. If persistence fails, the state
   * is reverted to its original state.
   *
   * @template T The type of the items in the state array (e.g., Task, Project).
   * @template R The return type of the persistence logic function.
   * @param {function(T[]): T[]} updateLogic A function that takes the current state array and returns the new state array after the optimistic update.
   * @param {function(): Promise<R>} persistenceLogic An async function that performs the actual IndexedDB persistence operation. It should return a Promise resolving with the result of the persistence (e.g., the created item with its final ID).
   * @param {string} successMessage The message to display as a toast notification on successful persistence.
   * @param {string} errorMessage The message to display as a toast notification on failed persistence.
   * @param {T[]} originalState The state array before the optimistic update, used for reverting on error.
   * @param {React.Dispatch<React.SetStateAction<T[]>>} setStateFunction The React state setter function (e.g., setTasks, setProjects) for the state being updated.
   * @param {function(R, T[]): T[]} [onPersistenceSuccess] An optional function that takes the result of the persistence logic and the current optimistic state, and returns the final state to set after successful persistence. Useful for updating temporary IDs with real ones.
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
    ) => {
      // Apply optimistic update immediately
      setStateFunction(updateLogic);
      toast.success(successMessage); // Show success toast immediately

      try {
        // Attempt to persist the change
        const persistenceResult = await persistenceLogic();
        // If persistence is successful and a success handler is provided, apply the final state update
        if (onPersistenceSuccess) {
          setStateFunction((prev) =>
            onPersistenceSuccess(persistenceResult, prev),
          );
        }
      } catch (error) {
        // If persistence fails, revert the state and show an error toast
        setStateFunction(originalState); // Revert state on error
        toast.error(errorMessage); // Show error toast
        console.error('Persistence failed:', error); // Log the error for debugging
        throw error; // Re-throw the error to be caught by specific handlers if needed
      }
    },
    [],
  );

  /**
   * @brief Handles the change of a task's status (column) during a drag-and-drop operation.
   *
   * This function updates the task's status optimistically and persists the change
   * to IndexedDB. It also resets the task's order when its status changes.
   *
   * @param {Task} taskToMove The task object that is being moved.
   * @param {string} newStatus The new status (column ID) for the task. This should correspond to a value in the `TaskStatus` enum.
   * @param {Task[]} originalTasks The state of tasks before the optimistic update, used for reverting on error.
   * @returns {Promise<void>} A Promise that resolves when the optimistic update and persistence attempt are complete.
   */
  const handleTaskStatusChange = useCallback(
    async (taskToMove: Task, newStatus: string, originalTasks: Task[]) => {
      const updatedTask: Task = {
        ...taskToMove,
        status: newStatus as TaskStatus, // Cast the new status string to the TaskStatus enum type
        updatedAt: Date.now(), // Update the timestamp
        order: 0, // Reset order when changing status, Dnd-kit will re-order within the new column
      };

      await performOptimisticUpdate(
        (prevTasks) =>
          // Filter out the old task and add the updated task with the new status
          prevTasks
            .filter((task) => task.id !== taskToMove.id)
            .concat(updatedTask),
        async () => await updateTask(updatedTask), // Persistence logic: update the task in IndexedDB
        `Task "${updatedTask.title}" status updated to "${newStatus.replace(/-/g, ' ')}".`, // Success message
        `Failed to update task status. Please try again.`, // Error message
        originalTasks, // Original state for revert
        setTasks, // State setter function
        undefined, // No onPersistenceSuccess needed as ID doesn't change
      );
    },
    [performOptimisticUpdate], // Dependency array includes the helper function
  );

  /**
   * @brief Handles reordering of tasks within the same column during a drag-and-drop operation.
   *
   * This function updates the order of tasks within a specific status column
   * optimistically and persists the changes to IndexedDB.
   *
   * @param {string} activeId The ID of the task being dragged.
   * @param {string} overId The ID of the task being dragged over (the target position).
   * @param {string} containerId The ID of the column (status) where the reordering is happening.
   * @param {Task[]} originalTasks The state of tasks before the optimistic update, used for reverting on error.
   * @returns {Promise<void>} A Promise that resolves when the optimistic update and persistence attempt are complete.
   */
  const handleTaskReorder = useCallback(
    async (
      activeId: string,
      overId: string,
      containerId: string,
      originalTasks: Task[],
    ) => {
      // Filter tasks belonging to the current column and sort them by their current order
      const currentTasksInColumn = tasks
        .filter((task) => task.status === containerId)
        .sort((a, b) => (a.order || 0) - (b.order || 0)); // Ensure tasks are sorted by order before reordering

      // Find the indices of the dragged task and the target task within the column
      const oldIndex = currentTasksInColumn.findIndex(
        (task) => task.id === activeId,
      );
      const newIndex = currentTasksInColumn.findIndex(
        (task) => task.id === overId,
      );

      // If either task is not found in the column, exit
      if (oldIndex === -1 || newIndex === -1) {
        return;
      }

      // Use arrayMove from @dnd-kit/sortable to get the new order of tasks
      const newOrder = arrayMove(currentTasksInColumn, oldIndex, newIndex);

      // Apply new 'order' values to the reordered tasks and update their timestamp
      const tasksWithNewOrder = newOrder.map((task, index) => ({
        ...task,
        order: index, // Assign new order based on array position in the reordered array
        updatedAt: Date.now(), // Update the timestamp
      }));

      await performOptimisticUpdate(
        (prevTasks) => {
          // Filter out the tasks from the current column and add the reordered tasks back
          const tasksWithoutCurrentColumn = prevTasks.filter(
            (task) => task.status !== containerId,
          );
          return [...tasksWithoutCurrentColumn, ...tasksWithNewOrder];
        },
        async () => {
          // Persistence logic: update all tasks in the column with their new order
          await Promise.all(tasksWithNewOrder.map((task) => updateTask(task)));
        },
        `Task reordered successfully.`, // Success message
        `Failed to reorder task. Please try again.`, // Error message
        originalTasks, // Original state for revert
        setTasks, // State setter function
        undefined, // No onPersistenceSuccess needed as IDs don't change
      );
    },
    [tasks, performOptimisticUpdate], // Dependencies include tasks state and the helper function
  );

  /**
   * @brief Handles the end of a drag-and-drop operation for tasks.
   *
   * This function is the main handler for Dnd-kit's `onDragEnd` event.
   * It determines if a task was moved to a different column (status change)
   * or reordered within the same column, and dispatches to the appropriate
   * handler (`handleTaskStatusChange` or `handleTaskReorder`).
   *
   * @param {DragEndEvent} event The DragEndEvent object provided by Dnd-kit.
   * @returns {Promise<void>} A Promise that resolves when the drag operation handling is complete.
   */
  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;

      // If there is no 'over' target, the drag operation was cancelled or invalid
      if (!over) return;

      const activeId = active.id as string; // The ID of the draggable item (task)
      const overId = over.id as string; // The ID of the droppable container or sortable item being dragged over

      // Find the task object corresponding to the dragged item ID
      const taskToMove = tasks.find((task) => task.id === activeId);
      if (!taskToMove) {
        toast.error('Dragged task not found.');
        return;
      }

      const originalTasks = [...tasks]; // Capture current state for potential revert

      // Determine the container IDs for the active and over elements.
      // This helps distinguish between changing columns and reordering within a column.
      const activeContainerId =
        active.data.current?.sortable.containerId || taskToMove.status; // Use task status as container ID if not sortable
      const overContainerId = over.data.current?.sortable.containerId || overId; // Use overId as container ID if not sortable

      // Check if the task was moved to a different column
      if (activeContainerId !== overContainerId) {
        // Task moved to a different column (status change)
        await handleTaskStatusChange(
          taskToMove,
          overContainerId, // The new status is the ID of the target column
          originalTasks,
        );
      } else {
        // Task reordered within the same column
        await handleTaskReorder(
          activeId,
          overId,
          activeContainerId, // The container ID is the status of the column
          originalTasks,
        );
      }
    },
    [tasks, handleTaskStatusChange, handleTaskReorder], // Dependencies include tasks state and the specific handlers
  );

  /**
   * @brief Handler to update a task in the state when it's modified (e.g., comment added, subtask added).
   * This is called by child components (TaskForm, TaskDetails) to propagate changes up.
   * @param updatedTask The task object with updated properties.
   */
  const handleTaskUpdated = useCallback(
    (updatedTask: Task) => {
      setTasks((prevTasks) =>
        // Map over the previous tasks and replace the task with the matching ID
        prevTasks.map((task) =>
          task.id === updatedTask.id ? updatedTask : task,
        ),
      );
    },
    [setTasks], // Dependency array includes the setTasks setter
  );
  // This function is not used directly in the current setup,
  // as handleUpdateTask is used for persistence.
  // Keeping it for potential future use or if other components need a direct state update without persistence.

  /**
   * @brief Updates an existing task in state and IndexedDB.
   * @param updatedTask The task object with updated properties.
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
      );
    },
    [tasks, performOptimisticUpdate], // Dependencies include tasks state and the helper function
  );

  /**
   * @brief Creates a new task and persists it to IndexedDB.
   * @param taskData The data for the new task.
   * @returns The created task with ID and timestamps, or undefined if creation fails.
   */
  const handleCreateTask = useCallback(
    async (
      taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'comments'>,
    ): Promise<Task | undefined> => {
      const originalTasks = [...tasks]; // Capture current state for potential revert
      const tempId = `temp-${Date.now()}-${Math.random()}`; // Generate a temporary ID for the optimistic update
      let finalCreatedTask: Task | undefined; // Variable to store the final created task

      await performOptimisticUpdate(
        (prevTasks) => {
          // Create an optimistic task object with the temporary ID and current timestamps
          const optimisticTask: Task = {
            ...taskData,
            id: tempId,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            comments: [], // Initialize comments as an empty array
          };
          finalCreatedTask = optimisticTask; // Store the optimistic task initially
          return [...prevTasks, optimisticTask]; // Add the optimistic task to the state
        },
        async () => {
          // Persistence logic: create the task in IndexedDB
          const newTask = await createTask(taskData);
          if (!newTask) {
            throw new Error('Failed to create task in database.');
          }
          return newTask; // Return the task created in the database
        },
        `Task "${taskData.title}" created successfully!`, // Success message
        `Failed to create task "${taskData.title}". Please try again.`, // Error message
        originalTasks, // Original state for revert
        setTasks, // State setter function
        (newTaskFromDb, optimisticState) => {
          // onPersistenceSuccess handler: replace the optimistic task with the real one
          finalCreatedTask = newTaskFromDb; // Update with the real task from the database
          return optimisticState.map(
            (task) => (task.id === tempId ? newTaskFromDb : task), // Replace the task with the temporary ID
          );
        },
      );

      return finalCreatedTask; // Return the final created task
    },
    [tasks, performOptimisticUpdate], // Dependencies include tasks state and the helper function
  );

  /**
   * @brief Deletes a task from state and IndexedDB.
   * @param id The ID of the task to delete.
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
      );
    },
    [tasks, performOptimisticUpdate], // Dependencies include tasks state and the helper function
  );

  const handleCreateProject = useCallback(
    async (
      projectData: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>,
    ): Promise<string | undefined> => {
      const originalProjects = [...projects]; // Capture current state for potential revert
      const tempId = `temp-${Date.now()}-${Math.random()}`; // Generate a temporary ID for the optimistic update
      let finalCreatedProjectId: string | undefined; // Variable to store the final created project ID

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
        setProjects, // State setter function
        (realProjectIdFromDb, optimisticState) => {
          // onPersistenceSuccess handler: replace the optimistic project ID with the real one
          finalCreatedProjectId = realProjectIdFromDb; // Update with the real ID from the database
          return optimisticState.map((project) =>
            project.id === tempId
              ? { ...project, id: realProjectIdFromDb } // Replace the temporary ID with the real one
              : project,
          );
        },
      );

      return finalCreatedProjectId; // Return the final created project ID
    },
    [projects, performOptimisticUpdate],
  );

  /**
   * @brief Deletes a project from state and IndexedDB.
   * @param id The ID of the project to delete.
   */
  const handleDeleteProject = useCallback(
    async (id: string) => {
      const originalProjects = [...projects]; // Capture current projects state for potential revert
      const originalTasks = [...tasks]; // Capture original tasks state for potential revert

      await performOptimisticUpdate(
        (prevProjects) => prevProjects.filter((project) => project.id !== id), // Optimistic update: remove the project from the state
        async () => {
          await deleteProject(id); // Persistence logic: delete the project from IndexedDB
          return id; // Return the ID of the deleted project for onPersistenceSuccess
        },
        'Project deleted successfully.', // Success message
        'Failed to delete project. Please try again.', // Error message
        originalProjects, // Original projects state for revert
        setProjects, // Projects state setter function
        (deletedProjectId, optimisticProjects) => {
          // onPersistenceSuccess handler: filter out tasks associated with the deleted project
          // Also filter out tasks associated with the deleted project
          setTasks((prevTasks) =>
            prevTasks.filter((task) => task.projectId !== deletedProjectId),
          );
          // Return the updated projects state for the primary setStateFunction (setProjects)
          return optimisticProjects.filter(
            (project) => project.id !== deletedProjectId,
          );
        },
      );
    },
    [projects, tasks, setTasks, performOptimisticUpdate], // Dependencies: projects state, tasks state, setTasks setter, and performOptimisticUpdate
  );

  /**
   * @brief Updates an existing project in state and IndexedDB.
   * @param updatedProject The project object with updated properties.
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
    [projects, performOptimisticUpdate], // Dependencies include projects state and the helper function
  );

  return {
    tasks,
    setTasks,
    projects,
    setProjects,
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
