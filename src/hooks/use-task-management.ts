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
 * @typedef {Object} UseTaskManagementReturn
 * @property {Task[]} tasks - Array of all tasks.
 * @property {React.Dispatch<React.SetStateAction<Task[]>>} setTasks - Setter for tasks state.
 * @property {Project[]} projects - Array of all projects.
 * @property {React.Dispatch<React.SetStateAction<Project[]>>} setProjects - Setter for projects state.
 * @property {(updatedTask: Task) => Promise<void>} handleUpdateTask - Handler to update an existing task and persist it.
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
        status: newStatus as TaskStatus, // Cast to TaskStatus
        updatedAt: Date.now(),
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
        return;
      }

      const newOrder = arrayMove(currentTasksInColumn, oldIndex, newIndex);

      // Apply new 'order' values to the reordered tasks
      const tasksWithNewOrder = newOrder.map((task, index) => ({
        ...task,
        order: index, // Assign new order based on array position
        updatedAt: Date.now(),
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
   * @brief Updates an existing task in state and IndexedDB.
   * @param updatedTask The task object with updated properties.
   */
  const handleUpdateTask = useCallback(
    async (updatedTask: Task) => {
      const originalTasks = [...tasks];
      await performOptimisticUpdate(
        (prevTasks) =>
          prevTasks.map((task) =>
            task.id === updatedTask.id ? updatedTask : task,
          ),
        async () => await updateTask(updatedTask),
        `Task "${updatedTask.title}" updated successfully!`,
        `Failed to update task "${updatedTask.title}". Please try again.`,
        originalTasks,
        setTasks,
      );
    },
    [tasks, performOptimisticUpdate],
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
      const originalTasks = [...tasks];
      let createdTask: Task | undefined;

      await performOptimisticUpdate(
        (prevTasks) => {
          // Create a temporary ID for optimistic update
          const tempId = `temp-${Date.now()}-${Math.random()}`;
          const optimisticTask: Task = {
            ...taskData,
            id: tempId,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            comments: [],
          };
          createdTask = optimisticTask; // Store the optimistic task to return later
          return [...prevTasks, optimisticTask];
        },
        async () => {
          // The actual creation in DB will generate the final ID
          const newTask = await createTask(taskData);
          if (newTask && createdTask) {
            // Replace the optimistic task with the real one in state
            setTasks((prevTasks) =>
              prevTasks.map((task) =>
                task.id === createdTask?.id ? newTask : task,
              ),
            );
            createdTask = newTask; // Update createdTask with the real one
          } else if (createdTask) {
            // If DB creation failed but optimistic update happened, revert
            throw new Error('Failed to create task in database.');
          }
        },
        `Task "${taskData.title}" created successfully!`,
        `Failed to create task "${taskData.title}". Please try again.`,
        originalTasks,
        setTasks,
      );

      return createdTask; // Return the task with the final ID after persistence
    },
    [tasks, performOptimisticUpdate],
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
      projectData: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>,
    ): Promise<string | undefined> => {
      const originalProjects = [...projects];
      let newProjectId: string | undefined;

      await performOptimisticUpdate(
        (prevProjects) => {
          // Create a temporary ID for optimistic update
          const tempId = `temp-${Date.now()}-${Math.random()}`;
          const optimisticProject: Project = {
            ...projectData,
            id: tempId,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            status: projectData.status, // Include status from input
          };
          newProjectId = tempId; // Store the optimistic ID
          return [...prevProjects, optimisticProject];
        },
        async () => {
          // The actual creation in DB will generate the final ID
          const realProjectId = await createProject(projectData);
          if (realProjectId && newProjectId) {
            // Replace the optimistic project with the real one in state
            setProjects((prevProjects) =>
              prevProjects.map((project) =>
                project.id === newProjectId
                  ? { ...project, id: realProjectId }
                  : project,
              ),
            );
            newProjectId = realProjectId; // Update newProjectId with the real one
          } else if (newProjectId) {
            // If DB creation failed but optimistic update happened, revert
            throw new Error('Failed to create project in database.');
          }
        },
        `Project "${projectData.name}" created successfully!`,
        `Failed to create project "${projectData.name}". Please try again.`,
        originalProjects,
        setProjects,
      );

      return newProjectId; // Return the project ID after persistence
    },
    [projects, performOptimisticUpdate],
  );

  /**
   * @brief Deletes a project from state and IndexedDB.
   * @param id The ID of the project to delete.
   */
  const handleDeleteProject = useCallback(
    async (id: string) => {
      const originalProjects = [...projects];
      const originalTasks = [...tasks]; // Capture original tasks state

      await performOptimisticUpdate(
        (prevProjects) => prevProjects.filter((project) => project.id !== id),
        async () => {
          // The persistence logic now includes updating associated tasks
          await deleteProject(id);
          // After successful deletion and task updates in DB, update tasks state by filtering
          setTasks((prevTasks) =>
            prevTasks.filter((task) => task.projectId !== id),
          );
        },
        'Project deleted successfully.',
        'Failed to delete project. Please try again.',
        originalProjects,
        setProjects,
      );
    },
    [projects, tasks, setTasks, setProjects, performOptimisticUpdate],
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
    handleUpdateTask,
    handleDragEnd,
    handleCreateTask,
    handleDeleteTask,
    handleCreateProject,
    handleUpdateProject,
    handleDeleteProject,
  };
};
