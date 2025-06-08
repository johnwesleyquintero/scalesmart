// src/app/project-management/components/TaskDetails.tsx
'use client';

import React, { useCallback, useMemo, useState } from 'react';
import { Task, Project, TaskComment } from '@/lib/indexeddb-service';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/utils/date-utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  CalendarIcon,
  UserRound,
  Tag,
  Flag,
  Edit,
  CheckCircle,
} from 'lucide-react';
import { TaskStatus, TaskPriority } from '@/types/indexeddb';
import CommentList from './CommentList';
import TaskForm from './TaskForm';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { logger } from '@/lib/logger'; // Import logger for consistent error logging

/**
 * @interface TaskDetailsProps
 * @brief Props for the TaskDetails component.
 * @property {Task} task - The task object whose details are to be displayed.
 * @property {Project[]} projects - An array of all projects, used for resolving the project name associated with the task.
 * @property {Task[]} allTasks - An array of all tasks, used for resolving titles of dependent tasks and subtasks.
 * @property {(updatedTask: Task) => Promise<void>} onTaskPersist - Callback function to propagate task updates back to the parent component for persistence (e.g., when comments are added or task is marked complete).
 * @property {(id: string) => Promise<void>} onDeleteTask - Callback function to handle task deletion.
 * @property {() => void} onClose - Callback function to close the task details modal.
 */
interface TaskDetailsProps {
  task: Task;
  projects: Project[];
  allTasks: Task[];
  onTaskPersist: (updatedTask: Task) => Promise<void>;
  onDeleteTask: (id: string) => Promise<void>;
  onClose: () => void;
}

/**
 * @component TaskDetails
 * @brief Displays a comprehensive read-only view of a task, with an option to edit.
 *
 * This component presents all details of a task, including its title, description,
 * assignee, due date, project, status, priority, dependencies, subtasks, and comments.
 * It allows adding new comments, marking the task as complete, and provides an "Edit"
 * button to switch to an editable `TaskForm` view. It also includes a confirmation
 * modal for task deletion.
 *
 * @param {TaskDetailsProps} props The props for the component.
 * @returns {JSX.Element} The TaskDetails component.
 */
const TaskDetails: React.FC<TaskDetailsProps> = ({
  task,
  projects,
  allTasks,
  onTaskPersist,
  onDeleteTask,
  onClose,
}) => {
  // State to toggle between read-only details view and editable form view
  const [isEditing, setIsEditing] = useState(false);
  // State to control the visibility of the delete confirmation modal
  const [isDeleteConfirmModalOpen, setIsDeleteConfirmModalOpen] =
    useState(false);

  /**
   * @brief Memoizes the CSS class for task priority styling.
   *
   * This `useMemo` hook ensures that the priority-specific Tailwind CSS class
   * is only re-calculated when the task's `priority` changes, optimizing performance.
   * It maps `TaskPriority` enum values to corresponding text colors.
   *
   * @returns {string} The Tailwind CSS class string corresponding to the task's priority.
   */
  const priorityStyleClass = useMemo(() => {
    switch (task.priority) {
      case TaskPriority.High:
        return 'text-red-500';
      case TaskPriority.Medium:
        return 'text-yellow-500';
      case TaskPriority.Low:
        return 'text-green-500';
      case TaskPriority.Urgent: // Added styling for Urgent priority
        return 'text-purple-500';
      default:
        return 'text-muted-foreground';
    }
  }, [task.priority]);

  /**
   * @brief Memoizes all projects into a Map for efficient O(1) lookup by ID.
   *
   * This map is used to quickly retrieve project names when displaying task details,
   * avoiding linear searches through the `projects` array.
   *
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
   * @brief Memoizes all tasks into a Map for efficient O(1) lookup by ID.
   *
   * This map is used to quickly resolve task titles for displaying dependencies and subtasks,
   * avoiding linear searches through the `allTasks` array.
   *
   * @returns {Map<string, Task>} A Map where keys are task IDs and values are Task objects.
   */
  const allTasksMap = useMemo(() => {
    const map = new Map<string, Task>();
    allTasks.forEach((task) => {
      if (task.id) {
        map.set(task.id, task);
      }
    });
    return map;
  }, [allTasks]);

  /**
   * @brief Retrieves the name of a project given its ID.
   * Uses the memoized `projectsMap` for efficient lookup.
   *
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
   * @brief Handles adding a new comment to the task.
   *
   * This function updates the task's comments array by creating a new array
   * with the added comment, and then calls the `onTaskPersist` prop to save
   * the updated task object to the database. It provides toast feedback.
   *
   * @param {TaskComment} newComment - The new comment object to add.
   * @returns {Promise<void>} A promise that resolves when the comment has been added and persisted.
   */
  const handleAddComment = useCallback(
    async (newComment: TaskComment) => {
      // Ensure comments array exists before spreading
      const comments = Array.isArray(task.comments) ? task.comments : [];
      const updatedTask: Task = {
        ...task,
        comments: [...comments, newComment], // Add the new comment to the array
        updatedAt: Date.now(), // Update the task's modification timestamp
      };
      try {
        await onTaskPersist(updatedTask); // Propagate update to parent for persistence
        // toast.success('Comment added successfully!'); // Toast is now handled by CommentList
      } catch (error) {
        // toast.error('Failed to add comment. Please try again.'); // Toast is now handled by CommentList
        logger.error('Failed to add comment to task:', error); // Log the error
      }
    },
    [task, onTaskPersist],
  );

  /**
   * @brief Handles task form submission when editing a task.
   *
   * This function is called when the `TaskForm` (in edit mode) successfully
   * updates a task. It propagates the update to the parent for persistence
   * and then exits the edit mode, returning to the read-only details view.
   *
   * @param {Task} updatedTask - The task object with updated properties.
   * @returns {Promise<void>} A promise that resolves when the task has been updated and edit mode is exited.
   */
  const handleTaskFormUpdated = useCallback(
    async (updatedTask: Task) => {
      try {
        await onTaskPersist(updatedTask); // Propagate update to parent for persistence
        setIsEditing(false); // Exit edit mode
        toast.success(`Task "${updatedTask.title}" updated successfully!`); // Show success toast
      } catch (error) {
        toast.error(
          `Failed to update task "${updatedTask.title}". Please try again.`,
        );
        logger.error('Failed to update task from details form:', error); // Log the error
      }
    },
    [onTaskPersist],
  );

  /**
   * @brief Handles marking the task as complete.
   *
   * This function updates the task's status to `TaskStatus.Completed` and
   * then calls the `onTaskPersist` prop to save the updated task.
   * It provides user feedback via toasts and prevents re-marking if already complete.
   *
   * @returns {Promise<void>} A promise that resolves when the task has been marked complete and persisted.
   */
  const handleMarkComplete = useCallback(async () => {
    if (task.status === TaskStatus.Completed) {
      toast.info('Task is already completed.');
      return;
    }

    const updatedTask: Task = {
      ...task,
      status: TaskStatus.Completed, // Set status to Completed
      updatedAt: Date.now(), // Update timestamp
    };
    try {
      await onTaskPersist(updatedTask); // Propagate update to parent for persistence
      toast.success(`Task "${updatedTask.title}" marked as completed!`);
    } catch (error) {
      toast.error(
        `Failed to mark task "${task.title}" as complete. Please try again.`,
      );
      logger.error('Failed to mark task complete:', error); // Log the error
    }
  }, [task, onTaskPersist]);

  /**
   * @brief Handles confirming and proceeding with task deletion after user confirmation.
   *
   * This asynchronous function calls the `onDeleteTask` prop with the task's ID.
   * Upon successful deletion, it closes both the confirmation modal and the main
   * task details modal. It provides toast feedback for success or failure.
   * Uses `useCallback` for memoization.
   *
   * @returns {Promise<void>} A promise that resolves when the task has been deleted.
   */
  const confirmDeleteTask = useCallback(async () => {
    try {
      await onDeleteTask(task.id); // Call the parent's delete handler
      setIsDeleteConfirmModalOpen(false); // Close confirmation modal
      onClose(); // Close the main details modal
      toast.success(`Task "${task.title}" deleted successfully!`); // Show success toast
    } catch (error) {
      toast.error(`Failed to delete task "${task.title}". Please try again.`);
      logger.error('Failed to delete task from details:', error); // Log the error
      setIsDeleteConfirmModalOpen(false); // Ensure modal closes even on error
    }
  }, [onDeleteTask, task.id, task.title, onClose]);

  // If in editing mode, render the TaskForm component
  if (isEditing) {
    return (
      <TaskForm
        task={task} // Pass the current task for pre-filling and updating
        onUpdateTask={handleTaskFormUpdated} // Use the local handler for updates
        onTaskSaved={() => setIsEditing(false)} // Close edit mode on save
        onCancel={() => setIsEditing(false)} // Allow canceling edit mode
        projects={projects} // Pass available projects
        allTasks={allTasks} // Pass all tasks for dependency/subtask selection
      />
    );
  }

  // Render the read-only task details view
  return (
    <Card className="border-none shadow-none">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-2xl font-bold text-foreground">
          {task.title}
        </CardTitle>
        <div className="flex items-center space-x-2">
          {/* Mark Complete button, only visible if task is not already completed */}
          {task.status !== TaskStatus.Completed && (
            <Button
              variant="secondary"
              size="sm"
              onClick={handleMarkComplete}
              aria-label="Mark task as complete"
            >
              <CheckCircle className="h-4 w-4 mr-2" /> Mark Complete
            </Button>
          )}
          {/* Edit button to switch to TaskForm */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditing(true)}
            aria-label="Edit task"
          >
            <Edit className="h-4 w-4 mr-2" /> Edit
          </Button>
          {/* Delete button to open confirmation modal */}
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setIsDeleteConfirmModalOpen(true)}
            aria-label="Delete task"
          >
            Delete
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Task Description */}
        {task.description && (
          <div>
            <h4 className="font-semibold text-sm text-muted-foreground mb-1">
              Description
            </h4>
            <p className="text-sm text-foreground">{task.description}</p>
          </div>
        )}

        {/* Grid for task metadata (Assignee, Due Date, Project, Status, Priority) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-semibold text-sm text-muted-foreground mb-1">
              Assignee
            </h4>
            <div className="flex items-center text-sm text-foreground">
              <UserRound className="h-4 w-4 mr-2" />
              <span>{task.assigneeId || 'Unassigned'}</span>
            </div>
          </div>
          <div>
            <h4 className="font-semibold text-sm text-muted-foreground mb-1">
              Due Date
            </h4>
            <div className="flex items-center text-sm text-foreground">
              <CalendarIcon className="h-4 w-4 mr-2" />
              <span>{formatDate(task.dueDate)}</span>
            </div>
          </div>
          <div>
            <h4 className="font-semibold text-sm text-muted-foreground mb-1">
              Project
            </h4>
            <div className="flex items-center text-sm text-foreground">
              <Tag className="h-4 w-4 mr-2" />
              <span>{getProjectName(task.projectId)}</span>
            </div>
          </div>
          <div>
            <h4 className="font-semibold text-sm text-muted-foreground mb-1">
              Status
            </h4>
            <div className="flex items-center text-sm text-foreground">
              <span
                className={`px-2 py-1 rounded-full text-xs font-medium ${
                  task.status === TaskStatus.Completed
                    ? 'bg-green-500/10 text-green-500'
                    : task.status === TaskStatus.InProgress
                      ? 'bg-blue-500/10 text-blue-500'
                      : 'bg-gray-500/10 text-gray-500'
                }`}
              >
                {/* Format status string for display (e.g., "to-do" -> "To Do") */}
                {task.status.charAt(0).toUpperCase() +
                  task.status.slice(1).replace(/-/g, ' ')}
              </span>
            </div>
          </div>
          {task.priority && (
            <div>
              <h4 className="font-semibold text-sm text-muted-foreground mb-1">
                Priority
              </h4>
              <div className="flex items-center text-sm text-foreground">
                <Flag className={`h-4 w-4 mr-2 ${priorityStyleClass}`} />
                <span>
                  {/* Format priority string for display (e.g., "high" -> "High") */}
                  {task.priority.charAt(0).toUpperCase() +
                    task.priority.slice(1)}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Dependencies List */}
        {task.dependencies && task.dependencies.length > 0 && (
          <div className="border-t border-border pt-4">
            <h4 className="font-semibold text-sm text-muted-foreground mb-2">
              Dependencies
            </h4>
            <ul className="list-disc pl-5 space-y-1 text-sm text-foreground">
              {task.dependencies.map((dependencyId: string) => {
                const dependency = allTasksMap.get(dependencyId); // Use memoized map for lookup
                return (
                  <li key={dependencyId}>
                    {dependency ? dependency.title : 'Unknown Task'}
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {/* Subtasks List */}
        {task.subtaskIds && task.subtaskIds.length > 0 && (
          <div className="border-t border-border pt-4">
            <h4 className="font-semibold text-sm text-muted-foreground mb-2">
              Subtasks
            </h4>
            <ul className="list-disc pl-5 space-y-1 text-sm text-foreground">
              {task.subtaskIds.map((subtaskId: string) => {
                const subtask = allTasksMap.get(subtaskId); // Use memoized map for lookup
                return (
                  <li key={subtaskId}>
                    {subtask ? subtask.title : 'Unknown Task'}
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {/* Comments Section */}
        <div className="border-t border-border pt-4">
          <h4 className="font-semibold text-sm text-muted-foreground mb-2">
            Comments
          </h4>
          <CommentList
            taskId={task.id}
            comments={task.comments || []} // Ensure comments is an array
            onAddComment={handleAddComment} // Pass handler for adding comments
          />
        </div>
      </CardContent>
      {/* Delete Confirmation Modal */}
      <Dialog
        open={isDeleteConfirmModalOpen}
        onOpenChange={setIsDeleteConfirmModalOpen}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirm Delete Task</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the task "
              <span className="font-semibold">{task.title}</span>"? This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteConfirmModalOpen(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDeleteTask}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default TaskDetails;
