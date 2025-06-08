import React, { useCallback, useMemo, useState } from 'react'; // Import useState
import { Task, Project } from '@/lib/indexeddb-service';
import { TaskPriority } from '@/types/indexeddb';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/utils/date-utils'; // Import formatDate
import { CalendarIcon, UserRound, Tag, Flag } from 'lucide-react';
import {
  Dialog, // Import Dialog
  DialogContent, // Import DialogContent
  DialogHeader, // Import DialogHeader
  DialogTitle, // Import DialogTitle
  DialogFooter, // Import DialogFooter
  DialogDescription, // Import DialogDescription
} from '@/components/ui/dialog';
import { toast } from 'sonner'; // Import toast

interface TaskItemProps {
  task: Task;
  projects: Project[];
  onDeleteTask: (id: string) => void;
  allTasks: Task[]; // All tasks for dependency/subtask lookup
  onViewTaskDetails: (task: Task) => void; // Simplified prop signature
  // Add the onTaskPersist prop
  onTaskPersist: (updatedOrNewTask: Task) => Promise<void>;
}

const TaskItem: React.FC<TaskItemProps> = React.memo(
  ({
    task,
    projects,
    onDeleteTask,
    allTasks,
    onViewTaskDetails,
    onTaskPersist, // Destructure the new prop
  }: TaskItemProps) => {
    const [isDeleteConfirmModalOpen, setIsDeleteConfirmModalOpen] =
      useState(false); // State for delete confirmation modal

    const projectsMap = useMemo(() => {
      const map = new Map<string, Project>();
      projects.forEach((project) => {
        if (project.id) {
          map.set(project.id, project);
        }
      });
      return map;
    }, [projects]);

    // Memoize all tasks into a Map for O(1) lookup by ID.
    const allTasksMap = useMemo(() => {
      const map = new Map<string, Task>();
      allTasks.forEach((task) => {
        if (task.id) {
          map.set(task.id, task);
        }
      });
      return map;
    }, [allTasks]);

    const getProjectName = useCallback(
      (projectId: string | undefined): string => {
        if (!projectId) return 'No Project';
        const project = projectsMap.get(projectId);
        return project ? project.name : 'Unknown Project';
      },
      [projectsMap],
    );

    // Determine priority styling
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
     * Uses `useCallback` for memoization.
     * @returns {Promise<void>} A promise that resolves when the task has been deleted.
     */
    const confirmDeleteTask = useCallback(async () => {
      try {
        await onDeleteTask(task.id);
        setIsDeleteConfirmModalOpen(false);
        toast.success(`Task "${task.title}" deleted successfully!`); // Add success toast
      } catch (error) {
        toast.error(`Failed to delete task "${task.title}". Please try again.`); // Add error toast
        console.error('Failed to delete task:', error); // Log error
        setIsDeleteConfirmModalOpen(false); // Close modal even on error
      }
    }, [onDeleteTask, task.id, task.title]);

    return (
      <>
        <div
          className="bg-card p-3 rounded-md shadow-sm border border-border cursor-pointer hover:bg-accent/50 transition-colors duration-200"
          onClick={() => onViewTaskDetails(task)} // Make the entire card clickable
          aria-label={`View details for task ${task.title}`}
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
                <UserRound className="h-3 w-3 mr-1" />
                <span>{task.assigneeId}</span>
              </div>
            )}
            {task.dueDate && (
              <div className="flex items-center mr-3">
                <CalendarIcon className="h-3 w-3 mr-1" />
                <span>{formatDate(task.dueDate)}</span>
              </div>
            )}
            {task.projectId && (
              <div className="flex items-center mr-3">
                <Tag className="h-3 w-3 mr-1" />
                <span>Project: {getProjectName(task.projectId)}</span>
              </div>
            )}
            {task.priority && (
              <div className="flex items-center mr-3">
                <Flag className={`h-3 w-3 mr-1 ${priorityClass}`} />
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
                  const dependency = allTasksMap.get(dependencyId); // Use the map
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
                  const subtask = allTasksMap.get(subtaskId); // Use the map
                  return subtask ? subtask.title : 'Unknown Task';
                })
                .join(', ')}
            </div>
          )}

          <div className="flex space-x-2 mt-3">
            <Button
              onClick={(e) => {
                e.stopPropagation(); // Prevent opening details modal
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
                Are you sure you want to delete the task "{task.title}"? This
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
