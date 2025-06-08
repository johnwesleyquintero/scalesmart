// src/app/project-management/components/TaskDetails.tsx
'use client';

import React, { useCallback, useMemo, useState } from 'react';
import { Task, Project, TaskComment } from '@/lib/indexeddb-service';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/utils/date-utils'; // Import formatDate
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  CalendarIcon,
  UserRound,
  Tag,
  Flag,
  Edit,
  CheckCircle,
} from 'lucide-react'; // Import CheckCircle icon
import { TaskStatus, TaskPriority } from '@/types/indexeddb'; // Import TaskStatus and TaskPriority
import CommentList from './CommentList';
import TaskForm from './TaskForm'; // To allow editing within details view
import { toast } from 'sonner';

interface TaskDetailsProps {
  task: Task;
  projects: Project[];
  allTasks: Task[]; // For resolving dependencies and subtasks
  onTaskPersist: (updatedTask: Task) => Promise<void>; // To propagate updates back to parent for persistence
  onDeleteTask: (id: string) => Promise<void>; // New prop to handle task deletion
  onClose: () => void; // To close the details modal
}

/**
 * @component TaskDetails
 * @brief Displays a comprehensive read-only view of a task, with an option to edit.
 *
 * This component presents all details of a task, including its title, description,
 * assignee, due date, project, status, priority, dependencies, subtasks, and comments.
 * It allows adding new comments and provides an "Edit" button to switch to an editable form.
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
  const [isEditing, setIsEditing] = useState(false);

  /**
   * @brief Memoizes the CSS class for task priority styling.
   *
   * This memoized value ensures that the priority class is only re-calculated
   * when the task's priority changes, optimizing performance.
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
      default:
        return 'text-muted-foreground';
    }
  }, [task.priority]);

  /**
   * @brief Memoizes all projects into a Map for efficient O(1) lookup by ID.
   *
   * This map is used to quickly retrieve project names when displaying task details.
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
   * This map is used to quickly resolve task titles for dependencies and subtasks.
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
   * This function updates the task's comments array and then calls the
   * `onTaskPersist` prop to save the updated task.
   *
   * @param {TaskComment} newComment - The new comment object to add.
   * @returns {Promise<void>} A promise that resolves when the comment has been added and persisted.
   */
  const handleAddComment = useCallback(
    async (newComment: TaskComment) => {
      const comments = Array.isArray(task.comments) ? task.comments : [];
      const updatedTask: Task = {
        ...task,
        comments: [...comments, newComment],
        updatedAt: Date.now(),
      };
      // Propagate update to parent, which will handle persistence
      await onTaskPersist(updatedTask); // Await the parent's update handler
      toast.success('Comment added successfully!');
    },
    [task, onTaskPersist],
  );

  /**
   * @brief Handles task form submission when editing a task.
   *
   * This function is called when the `TaskForm` (in edit mode) successfully
   * updates a task. It propagates the update to the parent for persistence
   * and then exits the edit mode.
   *
   * @param {Task} updatedTask - The task object with updated properties.
   * @returns {Promise<void>} A promise that resolves when the task has been updated and edit mode is exited.
   */
  const handleTaskFormUpdated = useCallback(
    async (updatedTask: Task) => {
      // Propagate update to parent, which will handle persistence
      await onTaskPersist(updatedTask); // Await the parent's update handler
      setIsEditing(false); // Exit edit mode
    },
    [onTaskPersist],
  );

  /**
   * @brief Handles marking the task as complete.
   *
   * This function updates the task's status to `TaskStatus.Completed` and
   * then calls the `onTaskPersist` prop to save the updated task.
   * It also provides user feedback via toasts.
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
      status: TaskStatus.Completed,
      updatedAt: Date.now(),
    };
    // Propagate update to parent, which will handle persistence
    await onTaskPersist(updatedTask); // Await the parent's update handler
    toast.success(`Task "${updatedTask.title}" marked as completed!`);
  }, [task, onTaskPersist]);

  if (isEditing) {
    return (
      <TaskForm
        task={task} // Pass the task prop directly
        onUpdateTask={onTaskPersist} // Pass onTaskPersist as onUpdateTask
        onTaskSaved={() => setIsEditing(false)} // onTaskSaved should just close the modal
        onCancel={() => setIsEditing(false)}
        projects={projects}
        allTasks={allTasks} // Still pass allTasks to TaskForm if it needs it
      />
    );
  }

  return (
    <Card className="border-none shadow-none">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-2xl font-bold text-foreground">
          {task.title}
        </CardTitle>
        <div className="flex items-center space-x-2">
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
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditing(true)}
            aria-label="Edit task"
          >
            <Edit className="h-4 w-4 mr-2" /> Edit
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={async () => {
              if (
                window.confirm(
                  `Are you sure you want to delete "${task.title}"?`,
                )
              ) {
                await onDeleteTask(task.id);
                onClose(); // Close modal after deletion
              }
            }}
            aria-label="Delete task"
          >
            Delete
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {task.description && (
          <div>
            <h4 className="font-semibold text-sm text-muted-foreground mb-1">
              Description
            </h4>
            <p className="text-sm text-foreground">{task.description}</p>
          </div>
        )}

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
                <Flag className={`h-4 w-4 mr-2 ${priorityClass}`} />
                <span>
                  {task.priority.charAt(0).toUpperCase() +
                    task.priority.slice(1)}
                </span>
              </div>
            </div>
          )}
        </div>

        {task.dependencies && task.dependencies.length > 0 && (
          <div className="border-t border-border pt-4">
            <h4 className="font-semibold text-sm text-muted-foreground mb-2">
              Dependencies
            </h4>
            <ul className="list-disc pl-5 space-y-1 text-sm text-foreground">
              {task.dependencies.map((dependencyId: string) => {
                const dependency = allTasksMap.get(dependencyId); // Use the map
                return (
                  <li key={dependencyId}>
                    {dependency ? dependency.title : 'Unknown Task'}
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {task.subtaskIds && task.subtaskIds.length > 0 && (
          <div className="border-t border-border pt-4">
            <h4 className="font-semibold text-sm text-muted-foreground mb-2">
              Subtasks
            </h4>
            <ul className="list-disc pl-5 space-y-1 text-sm text-foreground">
              {task.subtaskIds.map((subtaskId: string) => {
                const subtask = allTasksMap.get(subtaskId); // Use the map
                return (
                  <li key={subtaskId}>
                    {subtask ? subtask.title : 'Unknown Task'}
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        <div className="border-t border-border pt-4">
          <h4 className="font-semibold text-sm text-muted-foreground mb-2">
            Comments
          </h4>
          <CommentList
            taskId={task.id}
            comments={task.comments || []}
            onAddComment={handleAddComment}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default TaskDetails;
