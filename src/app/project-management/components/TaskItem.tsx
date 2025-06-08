import React, { useCallback, useMemo, useState } from 'react';
import { Task, Project } from '@/lib/indexeddb-service';
import { TaskPriority } from '@/types/indexeddb';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/utils/date-utils';
import { CalendarIcon, UserRound, Tag, Flag } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { logger } from '@/lib/logger'; // Import logger for consistent error logging

/**
 * @interface TaskItemProps
 * @brief Props for the TaskItem component.
 * @property {Task} task - The task object to be displayed.
 * @property {Project[]} projects - An array of all projects, used for resolving the project name associated with the task.
 * @property {(id: string) => void} onDeleteTask - Callback function to handle task deletion.
 * @property {Task[]} allTasks - An array of all tasks, used for resolving titles of dependent tasks and subtasks.
 * @property {(task: Task) => void} onViewTaskDetails - Callback function to open the task details modal for the given task.
 * @property {(updatedOrNewTask: Task) => Promise<void>} onTaskPersist - Callback function to persist task changes (updates or new tasks) to the database.
 */
interface TaskItemProps {
  task: Task;
  projects: Project[];
  onDeleteTask: (id: string) => void;
  allTasks: Task[];
  onViewTaskDetails: (task: Task) => void;
  onTaskPersist: (updatedOrNewTask: Task) => Promise<void>;
}

/**
 * @component TaskItem
 * @brief Displays a single task item with its key details and actions.
 *
 * This component renders a task card, showing its title, description, assignee,
 * due date, associated project, and priority. It provides functionality to
 * view full task details (via a modal) and to delete the task (with a confirmation).
 * It uses memoization for performance and includes accessibility attributes.
 *
 * @param {TaskItemProps} props The props for the component.
 * @returns {JSX.Element} The TaskItem component.
 */
const TaskItem: React.FC<TaskItemProps> = React.memo(
  ({
    task,
    projects,
    onDeleteTask,
    allTasks,
    onViewTaskDetails,
    // onTaskPersist, // This prop is not directly used in TaskItem, but passed to TaskDetails
  }: TaskItemProps) => {
    // State to control the visibility of the delete confirmation modal
    const [isDeleteConfirmModalOpen, setIsDeleteConfirmModalOpen] =
      useState(false);

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
     * @brief Memoizes the CSS class for task priority styling.
     *
     * This `useMemo` hook ensures that the priority-specific Tailwind CSS class
     * is only re-calculated when the task's `priority` changes, optimizing performance.
     * It maps `TaskPriority` enum values to corresponding text colors.
     *
     * @returns {string} The Tailwind CSS class string corresponding to the task's priority.
     */
    const priorityClass = useMemo(() => {
      switch (task.priority) {
        case TaskPriority.High:
          return 'text-red-500';
        case TaskPriority.Medium:
          return 'text-yellow-500';
        case TaskPriority.Low:
          return 'text-green-500';
        case TaskPriority.Urgent:
          return 'text-purple-500'; // Assuming a color for Urgent priority
        default:
          return 'text-muted-foreground';
      }
    }, [task.priority]);

    /**
     * @brief Handles confirming and proceeding with task deletion after user confirmation.
     *
     * This asynchronous function calls the `onDeleteTask` prop with the task's ID.
     * Upon successful deletion, it closes the confirmation modal and provides toast feedback.
     * Uses `useCallback` for memoization.
     *
     * @returns {Promise<void>} A promise that resolves when the task has been deleted.
     */
    const confirmDeleteTask = useCallback(async () => {
      try {
        await onDeleteTask(task.id); // Call the parent's delete handler
        setIsDeleteConfirmModalOpen(false); // Close confirmation modal
        toast.success(`Task "${task.title}" deleted successfully!`); // Show success toast
      } catch (error: any) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        toast.error(
          `Failed to delete task "${task.title}": ${errorMessage}. Please try again.`,
        );
        logger.error('Failed to delete task:', error); // Log the error
        setIsDeleteConfirmModalOpen(false); // Ensure modal closes even on error
      }
    }, [onDeleteTask, task.id, task.title]);

    return (
      <>
        <div
          className="bg-card p-3 rounded-md shadow-sm border border-border cursor-pointer hover:bg-accent/50 transition-colors duration-200"
          onClick={() => {
            // console.log('Task item clicked:', task.id); // Removed for cleaner console output
            onViewTaskDetails(task); // Trigger the details modal
          }}
          aria-label={`View details for task ${task.title}`}
          role="button" // Indicate that the div is interactive
          tabIndex={0} // Make the div focusable
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              onViewTaskDetails(task); // Allow opening details with keyboard
            }
          }}
        >
          <h3 className="font-semibold text-base mb-1 text-foreground">
            {task.title}
          </h3>
          {task.description && (
            <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
              {task.description}
            </p>
          )}
          <div className="flex flex-wrap items-center text-xs text-muted-foreground gap-y-1">
            {task.assigneeId && (
              <div className="flex items-center mr-3">
                <UserRound className="h-3 w-3 mr-1" aria-hidden="true" />
                <span>{task.assigneeId}</span>
              </div>
            )}
            {task.dueDate && (
              <div className="flex items-center mr-3">
                <CalendarIcon className="h-3 w-3 mr-1" aria-hidden="true" />
                <span>{formatDate(task.dueDate)}</span>
              </div>
            )}
            {task.projectId && (
              <div className="flex items-center mr-3">
                <Tag className="h-3 w-3 mr-1" aria-hidden="true" />
                <span>Project: {getProjectName(task.projectId)}</span>
              </div>
            )}
            {task.priority && (
              <div className="flex items-center mr-3">
                <Flag
                  className={`h-3 w-3 mr-1 ${priorityClass}`}
                  aria-hidden="true"
                />
                <span>
                  Priority:{' '}
                  {task.priority.charAt(0).toUpperCase() +
                    task.priority.slice(1)}
                </span>
              </div>
            )}
          </div>

          {task.dependencies && task.dependencies.length > 0 && (
            <div className="text-xs text-muted-foreground mt-2">
              <span className="font-medium">Dependencies: </span>
              {task.dependencies
                .map((dependencyId: string) => {
                  const dependency = allTasksMap.get(dependencyId); // Use memoized map for lookup
                  return dependency ? dependency.title : 'Unknown Task';
                })
                .join(', ')}
            </div>
          )}
          {task.subtaskIds && task.subtaskIds.length > 0 && (
            <div className="text-xs text-muted-foreground mt-1">
              <span className="font-medium">Subtasks: </span>
              {task.subtaskIds
                .map((subtaskId: string) => {
                  const subtask = allTasksMap.get(subtaskId); // Use memoized map for lookup
                  return subtask ? subtask.title : 'Unknown Task';
                })
                .join(', ')}
            </div>
          )}

          <div className="flex space-x-2 mt-3">
            <Button
              onClick={(e) => {
                e.stopPropagation(); // Prevent the parent div's onClick from firing
                // console.log('Delete button clicked for task:', task.id); // Removed for cleaner console output
                setIsDeleteConfirmModalOpen(true); // Open the delete confirmation modal
              }}
              variant="destructive"
              size="sm"
              className="text-xs"
              aria-label={`Delete task ${task.title}`}
            >
              Delete
            </Button>
          </div>
        </div>

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
                <span className="font-semibold">{task.title}</span>"? This
                action cannot be undone.
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
      </>
    );
  },
);

TaskItem.displayName = 'TaskItem';

export default TaskItem;
