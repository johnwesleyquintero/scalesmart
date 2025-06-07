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
import { toast } from 'sonner';
import { DragEndEvent } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';

/**
 * @typedef {Object} UseTaskManagementReturn
 * @property {Task[]} tasks - Array of all tasks.
 * @property {React.Dispatch<React.SetStateAction<Task[]>>} setTasks - Setter for tasks state.
 * @property {Project[]} projects - Array of all projects.
 * @property {React.Dispatch<React.SetStateAction<Project[]>>} setProjects - Setter for projects state.
 * @property {(task: Task) => void} handleTaskUpdated - Handler for when a task is updated.
 * @property {(event: DragEndEvent) => Promise<void>} handleDragEnd - Handler for Dnd-kit drag end event.
 * @property {(taskData: Omit<Task, 'id' | 'creationTimestamp' | 'updateTimestamp' | 'comments'>) => Promise<Task | undefined>} handleCreateTask - Handler to create a new task.
 * @property {(id: string) => Promise<void>} handleDeleteTask - Handler to delete a task.
 * @property {(projectData: Omit<Project, 'id' | 'creationTimestamp' | 'updateTimestamp'>) => Promise<string | undefined>} handleCreateProject - Handler to create a new project.
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

  // Effect to load initial data from IndexedDB
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const loadedTasks = await getAllTasks();
        const loadedProjects = await getAllProjects();
        setTasks(loadedTasks.sort((a, b) => (a.order || 0) - (b.order || 0))); // Sort by order
        setProjects(loadedProjects);
      } catch (err) {
        console.error('Failed to load project management data:', err);
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
  const performOptimisticUpdate = useCallback(
    async <T>(
      updateLogic: (prevState: T[]) => T[],
      persistenceLogic: () => Promise<void>,
      successMessage: string,
      errorMessage: string,
      originalState: T[],
      setStateFunction: React.Dispatch<React.SetStateAction<T[]>>,
    ) => {
      setStateFunction(updateLogic);
      toast.success(successMessage);

      try {
        await persistenceLogic();
      } catch (error) {
        console.error('Persistence failed:', error);
        toast.error(errorMessage);
        setStateFunction(originalState); // Revert state on error
      }
    },
    [],
  );

  /**
   * @brief Handles the change of a task's status (column).
   * @param taskToMove The task being moved.
   * @param newStatus The new status (column ID) for the task.
   * @param originalTasks The state of tasks before the optimistic update.
   */
  const handleTaskStatusChange = useCallback(
    async (taskToMove: Task, newStatus: string, originalTasks: Task[]) => {
      const updatedTask: Task = {
        ...taskToMove,
        status: newStatus,
        updateTimestamp: Date.now(),
        order: 0, // Reset order when changing status, will be re-ordered by Dnd-kit
      };

      await performOptimisticUpdate(
        (prevTasks) =>
          prevTasks
            .filter((task) => task.id !== taskToMove.id)
            .concat(updatedTask),
        async () => await updateTask(updatedTask),
        `Task "${updatedTask.title}" status updated to "${newStatus.replace(/-/g, ' ')}".`,
        `Failed to update task status. Please try again.`,
        originalTasks,
        setTasks,
      );
    },
    [performOptimisticUpdate],
  );

  /**
   * @brief Handles reordering of tasks within the same column.
   * @param activeId The ID of the task being dragged.
   * @param overId The ID of the task being dragged over.
   * @param containerId The ID of the column (status) where reordering is happening.
   * @param originalTasks The state of tasks before the optimistic update.
   */
  const handleTaskReorder = useCallback(
    async (
      activeId: string,
      overId: string,
      containerId: string,
      originalTasks: Task[],
    ) => {
      const currentTasksInColumn = tasks
        .filter((task) => task.status === containerId)
        .sort((a, b) => (a.order || 0) - (b.order || 0)); // Ensure tasks are sorted by order before reordering

      const oldIndex = currentTasksInColumn.findIndex(
        (task) => task.id === activeId,
      );
      const newIndex = currentTasksInColumn.findIndex(
        (task) => task.id === overId,
      );

      if (oldIndex === -1 || newIndex === -1) {
        console.warn(
          'Could not find active or over task in the current column.',
        );
        return;
      }

      const newOrder = arrayMove(currentTasksInColumn, oldIndex, newIndex);

      // Apply new 'order' values to the reordered tasks
      const tasksWithNewOrder = newOrder.map((task, index) => ({
        ...task,
        order: index, // Assign new order based on array position
        updateTimestamp: Date.now(),
      }));

      await performOptimisticUpdate(
        (prevTasks) => {
          const tasksWithoutCurrentColumn = prevTasks.filter(
            (task) => task.status !== containerId,
          );
          return [...tasksWithoutCurrentColumn, ...tasksWithNewOrder];
        },
        async () => {
          await Promise.all(tasksWithNewOrder.map((task) => updateTask(task)));
        },
        `Task reordered successfully.`,
        `Failed to reorder task. Please try again.`,
        originalTasks,
        setTasks,
      );
    },
    [tasks, performOptimisticUpdate],
  );

  /**
   * @brief Handles the end of a drag-and-drop operation.
   * Dispatches to specific handlers based on whether the task changed columns or was reordered within the same column.
   * @param event The DragEndEvent from Dnd-kit.
   */
  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;

      if (!over) return;

      const activeId = active.id as string;
      const overId = over.id as string;

      const taskToMove = tasks.find((task) => task.id === activeId);
      if (!taskToMove) {
        console.warn(`Dragged task with ID ${activeId} not found.`);
        toast.error('Dragged task not found.');
        return;
      }

      const originalTasks = [...tasks]; // Capture current state for potential revert

      const activeContainerId =
        active.data.current?.sortable.containerId || taskToMove.status;
      const overContainerId = over.data.current?.sortable.containerId || overId;

      if (activeContainerId !== overContainerId) {
        // Task moved to a different column (status change)
        await handleTaskStatusChange(
          taskToMove,
          overContainerId,
          originalTasks,
        );
      } else {
        // Task reordered within the same column
        await handleTaskReorder(
          activeId,
          overId,
          activeContainerId,
          originalTasks,
        );
      }
    },
    [tasks, handleTaskStatusChange, handleTaskReorder],
  );

  /**
   * @brief Handler to update a task in the state when it's modified (e.g., comment added, subtask added).
   * This is called by child components (TaskForm, TaskDetails) to propagate changes up.
   * @param updatedTask The task object with updated properties.
   */
  const handleTaskUpdated = useCallback(
    (updatedTask: Task) => {
      setTasks((prevTasks) =>
        prevTasks.map((task) =>
          task.id === updatedTask.id ? updatedTask : task,
        ),
      );
    },
    [setTasks],
  );

  /**
   * @brief Creates a new task and persists it to IndexedDB.
   * @param taskData The data for the new task.
   * @returns The created task with ID and timestamps, or undefined if creation fails.
   */
  const handleCreateTask = useCallback(
    async (
      taskData: Omit<
        Task,
        'id' | 'creationTimestamp' | 'updateTimestamp' | 'comments'
      >,
    ): Promise<Task | undefined> => {
      const newTask = await createTask(taskData);
      if (newTask) {
        setTasks((prev) => [...prev, newTask]);
        toast.success(`Task "${newTask.title}" created successfully!`);
      } else {
        toast.error('Failed to create task. Please try again.');
      }
      return newTask;
    },
    [],
  );

  /**
   * @brief Deletes a task from state and IndexedDB.
   * @param id The ID of the task to delete.
   */
  const handleDeleteTask = useCallback(
    async (id: string) => {
      const originalTasks = [...tasks];
      await performOptimisticUpdate(
        (prevTasks) => prevTasks.filter((task) => task.id !== id),
        async () => await deleteTask(id),
        'Task deleted successfully.',
        'Failed to delete task. Please try again.',
        originalTasks,
        setTasks,
      );
    },
    [tasks, performOptimisticUpdate],
  );

  /**
   * @brief Creates a new project and persists it to IndexedDB.
   * @param projectData The data for the new project.
   * @returns The ID of the created project, or undefined if creation fails.
   */
  const handleCreateProject = useCallback(
    async (
      projectData: Omit<
        Project,
        'id' | 'creationTimestamp' | 'updateTimestamp'
      >,
    ): Promise<string | undefined> => {
      const newProjectId = await createProject(projectData);
      if (newProjectId) {
        const newProject: Project = {
          ...projectData,
          id: newProjectId,
          creationTimestamp: Date.now(),
          updateTimestamp: Date.now(),
        };
        setProjects((prev) => [...prev, newProject]);
        toast.success(`Project "${newProject.name}" created successfully!`);
      } else {
        toast.error('Failed to create project. Please try again.');
      }
      return newProjectId;
    },
    [],
  );

  /**
   * @brief Deletes a project from state and IndexedDB.
   * @param id The ID of the project to delete.
   */
  const handleDeleteProject = useCallback(
    async (id: string) => {
      const originalProjects = [...projects];
      const originalTasks = [...tasks]; // Capture original tasks state

      try {
        // Optimistically update projects state
        setProjects((prevProjects) =>
          prevProjects.filter((project) => project.id !== id),
        );
        toast.success('Project deleted successfully.');

        // Call the persistence logic which now also updates tasks in IndexedDB
        await deleteProject(id);

        // After successful deletion and task updates in DB, re-fetch tasks to ensure UI consistency
        // This is crucial because deleteProject now modifies tasks directly in IndexedDB
        const updatedTasksFromDB = await getAllTasks();
        setTasks(
          updatedTasksFromDB.sort((a, b) => (a.order || 0) - (b.order || 0)),
        );
      } catch (error) {
        console.error('Persistence failed:', error);
        toast.error('Failed to delete project. Please try again.');
        setProjects(originalProjects); // Revert projects state on error
        setTasks(originalTasks); // Revert tasks state on error
      }
    },
    [projects, tasks, setTasks, setProjects], // Add setTasks and setProjects to dependencies
  );

  /**
   * @brief Updates an existing project in state and IndexedDB.
   * @param updatedProject The project object with updated properties.
   */
  const handleUpdateProject = useCallback(
    async (updatedProject: Project) => {
      const originalProjects = [...projects];
      await performOptimisticUpdate(
        (prevProjects) =>
          prevProjects.map((project) =>
            project.id === updatedProject.id ? updatedProject : project,
          ),
        async () => await updateProject(updatedProject),
        `Project "${updatedProject.name}" updated successfully!`,
        `Failed to update project "${updatedProject.name}". Please try again.`,
        originalProjects,
        setProjects,
      );
    },
    [projects, performOptimisticUpdate],
  );

  return {
    tasks,
    setTasks,
    projects,
    setProjects,
    isLoading,
    error,
    handleTaskUpdated,
    handleDragEnd,
    handleCreateTask,
    handleDeleteTask,
    handleCreateProject,
    handleUpdateProject, // Add handleUpdateProject
    handleDeleteProject,
  };
};
