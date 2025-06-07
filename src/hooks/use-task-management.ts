/* eslint-disable @typescript-eslint/no-explicit-any */
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
} from '@/lib/indexeddb/project-management-db';
import { toast } from 'sonner';
import { DragEndEvent } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { v4 as uuidv4 } from 'uuid';

/**
 * @typedef {Object} UseTaskManagementReturn
 * @property {Task[]} tasks - Array of all tasks.
 * @property {React.Dispatch<React.SetStateAction<Task[]>>} setTasks - Setter for tasks state.
 * @property {Project[]} projects - Array of all projects.
 * @property {React.Dispatch<React.SetStateAction<Project[]>>} setProjects - Setter for projects state.
 * @property {(updatedTask: Task) => Promise<void>} handleUpdateTask - Handler to update an existing task and persist it.
 * @property {(event: DragEndEvent) => Promise<void>} handleDragEnd - Handler for Dnd-kit drag end event.
 * @property {(taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'comments'>) => Promise<Task | undefined>} handleCreateTask - Handler to create a new task.
 * @property {(id: string) => Promise<void>} handleDeleteTask - Handler to delete a task.
 * @property {(projectData: Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'status'>) => Promise<string | undefined>} handleCreateProject - Handler to create a new project.
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
    async <T, K extends keyof T>(
      updateLogic: (prevState: T[]) => T[],
      persistenceLogic: () => Promise<void | any>,
      successMessage: string,
      errorMessage: string,
      originalState: T[],
      setStateFunction: React.Dispatch<React.SetStateAction<T[]>>,
      idKey: K,
    ) => {
      setStateFunction(updateLogic);
      toast.success(successMessage);

      try {
        await persistenceLogic();
      } catch (error: unknown) {
        console.error('Persistence failed:', error);
        toast.error(errorMessage);
        setStateFunction(originalState);
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
    async (
      taskToMove: Task,
      newStatus: Task['status'],
      originalTasks: Task[],
    ) => {
      const updatedTask: Task = {
        ...taskToMove,
        status: newStatus,
        updatedAt: Date.now(),
        order: 0,
      };

      await performOptimisticUpdate(
        (prevTasks: Task[]) =>
          prevTasks
            .filter((task) => task.id !== taskToMove.id)
            .concat(updatedTask),
        async () => {
          updateTask(updatedTask);
        },
        `Task "${updatedTask.title}" status updated to "${newStatus.replace(/-/g, ' ')}".`,
        `Failed to update task status. Please try again.`,
        originalTasks,
        setTasks,
        'id',
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
        .sort((a, b) => (a.order || 0) - (b.order || 0));

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

      const tasksWithNewOrder = newOrder.map((task, index) => ({
        ...task,
        order: index,
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
        'id',
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

      const originalTasks = [...tasks];

      const activeContainerId =
        active.data.current?.sortable.containerId || taskToMove.status;
      const overContainerId = over.data.current?.sortable.containerId || overId;

      if (activeContainerId !== overContainerId) {
        await handleTaskStatusChange(
          taskToMove,
          overContainerId,
          originalTasks,
        );
      } else {
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
        async () => {
          updateTask(updatedTask);
        },
        `Task "${updatedTask.title}" updated successfully!`,
        `Failed to update task "${updatedTask.title}". Please try again.`,
        originalTasks,
        setTasks,
        'id',
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
      const now = Date.now();
      const newTask: Task = {
        id: uuidv4(),
        ...taskData,
        createdAt: now,
        updatedAt: now,
      };
      let createdTask: Task | undefined;
      try {
        createdTask = await createTask(newTask);
      } catch (error: any) {
        console.error('Failed to create task:', error);
        toast.error('Failed to create task. Please try again.');
        return undefined;
      }
      if (createdTask) {
        setTasks((prev) => {
          const newTasks = [...prev, createdTask];
          return newTasks;
        });
        toast.success(`Task "${createdTask.title}" created successfully!`);
      } else {
        toast.error('Failed to create task. Please try again.');
      }
      return createdTask;
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
        'id',
      );
    },
    [tasks, performOptimisticUpdate],
  );

  /**
   * @brief Creates a new project and persists it to IndexedDB.
   * @param projectData The data for the new project.
   * @returns The created project, or undefined if creation fails.
   */
  const handleCreateProject = useCallback(
    async (
      projectData: Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'status'>,
    ): Promise<Project | undefined> => {
      const now = Date.now();
      const newProject: Project = {
        id: uuidv4(),
        status: 'active',
        ...projectData,
        createdAt: now,
        updatedAt: now,
      };
      let createdProject: Project | undefined;
      try {
        createdProject = await createProject(newProject);
      } catch (error: any) {
        console.error('Failed to create project:', error);
        toast.error('Failed to create project. Please try again.');
        return undefined;
      }
      if (createdProject) {
        setProjects((prev) => {
          const newProjects = [...prev, createdProject];
          return newProjects;
        });
        toast.success(`Project "${createdProject.name}" created successfully!`);
      } else {
        toast.error('Failed to create project. Please try again.');
      }
      return createdProject;
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
      const originalTasks = [...tasks];
      try {
        setProjects((prevProjects) =>
          prevProjects.filter((project) => project.id !== id),
        );
        toast.success('Project deleted successfully.');

        await deleteProject(id);
      } catch (error: unknown) {
        console.error('Persistence failed:', error);
        toast.error('Failed to delete project. Please try again.');
        setProjects(originalProjects);
        setTasks(originalTasks);
        return;
      }

      try {
        const updatedTasksFromDB = await getAllTasks();
        setTasks(
          updatedTasksFromDB.sort((a, b) => (a.order || 0) - (b.order || 0)),
        );
      } catch (error: any) {
        console.error('Failed to load tasks after deleting project:', error);
        toast.error(
          'Failed to load tasks after deleting project. Please try again.',
        );
      }
    },
    [projects, tasks, setTasks, setProjects],
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
        'id',
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
