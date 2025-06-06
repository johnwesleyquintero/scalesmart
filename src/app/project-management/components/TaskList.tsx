// src/app/project-management/components/TaskList.tsx
'use client';

import React from 'react';
import { Task, Project, TaskComment } from '@/lib/indexeddb-service'; // Import Project and TaskComment types
import { deleteTask } from '@/lib/indexeddb-service';
import { default as TaskForm } from './TaskForm';
import { useState, useMemo, useCallback } from 'react';
import Modal from '@/components/Modal';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CalendarIcon, UserRound, Tag } from 'lucide-react';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';
import TaskItem from './TaskItem';
import TaskDetails from './TaskDetails'; // Import the new TaskDetails component

/**
 * @interface TaskListProps
 * @brief Props for the TaskList component.
 */
interface TaskListProps {
  /**
   * @brief The unique identifier for this task list column (e.g., 'to-do', 'in-progress', 'completed').
   */
  id: string;
  /**
   * @brief The title to display for this task list column.
   */
  title: string;
  /**
   * @brief The array of tasks to display in this column.
   */
  tasks: Task[];
  /**
   * @brief Function to update the list of tasks.
   * Accepts a functional update to prevent stale closure issues.
   */
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  /**
   * @brief Callback function to be called when a task is updated or created.
   */
  onTaskUpdated: (updatedOrNewTask: Task) => void;
  /**
   * @brief The array of available projects, used for displaying project names associated with tasks.
   */
  projects: Project[];
  /**
   * @brief All tasks across all columns, used for resolving dependencies and subtasks.
   */
  allTasks: Task[];
}

/**
 * @component TaskList
 * @brief Displays a Kanban-style board for tasks, allowing filtering, editing, and deletion.
 *
 * This component organizes tasks by status (To Do, In Progress, Completed) and provides
 * functionality to add, edit, and delete tasks. It also integrates drag-and-drop
 * capabilities (via Draggable/Droppable components) and displays associated project names.
 *
 * @param {TaskListProps} props The props for the component.
 * @returns {JSX.Element} The TaskList component.
 */
import { useDroppable } from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import SortableTaskItem from './SortableTaskItem'; // Import the new component

const TaskList = ({
  id,
  title,
  tasks,
  setTasks,
  projects,
  onTaskUpdated,
  allTasks,
}: TaskListProps) => {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [taskInDetailsView, setTaskInDetailsView] = useState<Task | null>(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [taskIdToDelete, setTaskIdToDelete] = useState<string | null>(null);

  const { setNodeRef } = useDroppable({
    id: id,
  });

  /**
   * Memoizes projects into a Map for O(1) lookup by ID.
   * @returns {Map<string, Project>} A Map where keys are project IDs and values are Project objects.
   */
  const projectsMap = useMemo(() => {
    const map = new Map<string, Project>();
    projects.forEach((project) => {
      if (project.id) {
        map.set(project.id, project);
      }
    });
    return map;
  }, [projects]);

  /**
   * Helper function to get project name by ID.
   * Uses a memoized Map for efficient lookup.
   * @param {string | undefined} projectId - The ID of the project.
   * @returns {string} The name of the project, or 'No Project'/'Unknown Project' if not found.
   */
  const getProjectName = useCallback(
    (projectId: string | undefined): string => {
      if (!projectId) return 'No Project';
      const project = projectsMap.get(projectId);
      return project ? project.name : 'Unknown Project';
    },
    [projectsMap],
  );

  /**
   * @brief Handles the click event for deleting a task, opening a confirmation modal.
   * Uses `useCallback` for memoization.
   * @param {string} id - The ID of the task to be deleted.
   */
  const handleDeleteTask = useCallback((id: string) => {
    setTaskIdToDelete(id);
    setIsConfirmModalOpen(true);
  }, []);

  /**
   * @brief Confirms and proceeds with task deletion after user confirmation.
   * Uses `useCallback` for memoization.
   */
  const confirmDeleteTask = useCallback(async () => {
    if (!taskIdToDelete) {
      logger.warn('Attempted to confirm delete without a taskIdToDelete.');
      toast.error('No task selected for deletion.');
      setIsConfirmModalOpen(false);
      return;
    }

    try {
      await deleteTask(taskIdToDelete);
      setTasks((prevTasks) =>
        prevTasks.filter((task) => task.id !== taskIdToDelete),
      );
      toast.info('Task deleted successfully.');
      if (selectedTask?.id === taskIdToDelete) {
        setSelectedTask(null);
        setIsEditModalOpen(false);
      }
      if (taskInDetailsView?.id === taskIdToDelete) {
        setTaskInDetailsView(null);
        setIsDetailsModalOpen(false);
      }
    } catch (error) {
      logger.error('Error deleting task:', error, {
        component: 'TaskList',
        context: 'confirmDeleteTask',
        taskId: taskIdToDelete,
      });
      toast.error('Failed to delete task. Please try again.');
    } finally {
      setIsConfirmModalOpen(false);
      setTaskIdToDelete(null);
    }
  }, [taskIdToDelete, setTasks, selectedTask?.id, taskInDetailsView?.id]);

  /**
   * @brief Handles the click event for editing a task, opening the TaskForm modal.
   * Uses `useCallback` for memoization.
   * @param {Task} task - The task object to be edited.
   */
  const handleEditClick = useCallback((task: Task) => {
    setSelectedTask(task);
    setIsEditModalOpen(true);
  }, []);

  /**
   * @brief Handles opening the task details modal.
   * @param {Task} task - The task object to view details for.
   */
  const handleViewTaskDetails = useCallback((task: Task) => {
    setTaskInDetailsView(task);
    setIsDetailsModalOpen(true);
  }, []);

  /**
   * @brief Handles closing the edit task modal.
   * Uses `useCallback` for memoization.
   */
  const handleCloseEditModal = useCallback(() => {
    setIsEditModalOpen(false);
    setSelectedTask(null);
  }, []);

  /**
   * @brief Handles closing the task details modal.
   * Uses `useCallback` for memoization.
   */
  const handleCloseDetailsModal = useCallback(() => {
    setIsDetailsModalOpen(false);
    setTaskInDetailsView(null);
  }, []);

  /**
   * @brief Handles the successful update/creation of a task from TaskForm or TaskDetails, closing the modal if it was an edit.
   * Uses `useCallback` for memoization.
   * @param {Task} updatedOrNewTask - The task object that was updated or newly created.
   */
  const handleTaskFormUpdated = useCallback(
    (updatedOrNewTask: Task) => {
      onTaskUpdated(updatedOrNewTask); // Propagate the update to the parent (ProjectManagementPage)
      // If the update came from the edit modal, close it
      if (isEditModalOpen) {
        handleCloseEditModal();
      }
      // If the update came from the details modal, ensure the task in details view is updated
      if (isDetailsModalOpen && taskInDetailsView?.id === updatedOrNewTask.id) {
        setTaskInDetailsView(updatedOrNewTask);
      }
    },
    [
      onTaskUpdated,
      isEditModalOpen,
      handleCloseEditModal,
      isDetailsModalOpen,
      taskInDetailsView?.id,
    ],
  );

  return (
    <Card className="flex-1">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div
          ref={setNodeRef}
          className="space-y-3 min-h-[100px] p-2 rounded-md bg-muted/40"
        >
          <SortableContext
            items={tasks.map((task) => task.id)}
            strategy={verticalListSortingStrategy}
          >
            {/* Map tasks for the current section using memoized data */}
            {tasks.length === 0 ? (
              <p className="text-muted-foreground text-center text-sm py-4">
                No tasks in this column.
              </p>
            ) : (
              tasks.map((task) => (
                <SortableTaskItem
                  key={task.id}
                  task={task}
                  projects={projects}
                  onEditClick={handleEditClick}
                  onDeleteTask={handleDeleteTask}
                  allTasks={allTasks}
                  onTaskUpdated={handleTaskFormUpdated}
                  onViewTaskDetails={handleViewTaskDetails}
                />
              ))
            )}
          </SortableContext>
        </div>

        {/* Modal for editing a task */}
        {isEditModalOpen && (
          <Modal
            isOpen={isEditModalOpen}
            onClose={handleCloseEditModal}
            title="Edit Task"
          >
            <TaskForm
              key={selectedTask?.id || 'new-task-form'}
              task={selectedTask}
              onTaskUpdated={handleTaskFormUpdated}
              onCancel={handleCloseEditModal}
              projects={projects}
              allTasks={allTasks}
            />
          </Modal>
        )}

        {/* Modal for viewing task details */}
        {isDetailsModalOpen && taskInDetailsView && (
          <Modal
            isOpen={isDetailsModalOpen}
            onClose={handleCloseDetailsModal}
            title={`Task Details: ${taskInDetailsView.title}`}
          >
            <TaskDetails
              task={taskInDetailsView}
              projects={projects}
              allTasks={allTasks}
              onTaskUpdated={handleTaskFormUpdated} // TaskDetails will propagate updates
              onClose={handleCloseDetailsModal}
            />
          </Modal>
        )}

        {/* Confirmation Modal for deleting a task */}
        <Modal
          isOpen={isConfirmModalOpen}
          onClose={() => setIsConfirmModalOpen(false)}
          title="Confirm Deletion"
        >
          <p className="mb-4 text-foreground">
            Are you sure you want to delete this task? This action cannot be
            undone.
          </p>
          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => setIsConfirmModalOpen(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDeleteTask}>
              Delete
            </Button>
          </div>
        </Modal>
      </CardContent>
    </Card>
  );
};
export default TaskList;
