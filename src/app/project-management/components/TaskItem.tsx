import React, { useCallback, useMemo } from 'react';
import CommentList from './CommentList';
import { updateTask } from '@/lib/indexeddb-service'; // Assuming correct path
import { Task, Project, Comment } from '@/lib/indexeddb-service'; // Import Comment type
import { format } from 'date-fns';
import { Button } from '@/components/ui/button'; // Assuming correct path
import { CalendarIcon, UserRound, Tag, Flag } from 'lucide-react'; // Import Flag icon

interface TaskItemProps {
  task: Task;
  projects: Project[];
  onEditClick: (task: Task) => void;
  onDeleteTask: (id: string) => void;
  tasks: Task[]; // Kept for dependency/subtask title lookup
  onTaskUpdated: (updatedTask: Task) => void; // New prop to signal task updates to parent
}

const TaskItem: React.FC<TaskItemProps> = React.memo(
  ({
    task,
    projects,
    onEditClick,
    onDeleteTask,
    tasks,
    onTaskUpdated, // Use the new prop
  }: TaskItemProps) => {
    const projectsMap = useMemo(() => {
      const map = new Map<string, Project>();
      projects.forEach((project) => {
        if (project.id) {
          map.set(project.id, project);
        }
      });
      return map;
    }, [projects]);

    const getProjectName = useCallback(
      (projectId: string | undefined): string => {
        if (!projectId) return 'No Project';
        const project = projectsMap.get(projectId);
        return project ? project.name : 'Unknown Project';
      },
      [projectsMap],
    );

    /**
     * Handles adding a new comment to the task.
     * This function is called by the CommentList component.
     * @param {Comment} newComment - The new comment object to add.
     */
    const handleAddComment = useCallback(
      async (newComment: Comment) => {
        // Ensure comments is an array before spreading
        const currentComments = Array.isArray(task.comments)
          ? task.comments
          : [];
        const updatedTask: Task = {
          // Explicitly type updatedTask as Task
          ...task,
          comments: [...currentComments, newComment],
        };
        try {
          await updateTask(updatedTask); // Persist the update to IndexedDB
          onTaskUpdated(updatedTask); // Notify parent component of the update
        } catch (error) {
          console.error('Failed to add comment and update task:', error);
          // TODO: Implement user feedback for error (e.g., toast notification)
        }
      },
      [task, onTaskUpdated], // Depend on task and the onTaskUpdated prop
    );

    return (
      <div className="bg-card p-3 rounded-md shadow-sm border border-border">
        <h3 className="font-semibold text-base mb-1 text-foreground">
          {task.title}
        </h3>
        {task.description && (
          <p className="text-sm text-muted-foreground mb-2">
            {task.description}
          </p>
        )}
        <div className="flex items-center text-xs text-muted-foreground mb-1">
          <UserRound className="h-3 w-3 mr-1" />
          <span>{task.assignee || 'Unassigned'}</span>
        </div>
        <div className="flex items-center text-xs text-muted-foreground mb-2">
          <CalendarIcon className="h-3 w-3 mr-1" />
          <span>
            {task.dueDate
              ? format(new Date(task.dueDate), 'PPP')
              : 'No due date'}
          </span>
        </div>
        <div className="flex items-center text-xs text-muted-foreground mb-2">
          <Tag className="h-3 w-3 mr-1" />
          <span>
            <span className="font-medium text-primary">
              Project: {getProjectName(task.projectId)}
            </span>
          </span>
        </div>
        <div className="flex items-center text-xs text-muted-foreground mb-2">
          <span className="font-medium text-primary">
            Status: {task.status}
          </span>
        </div>
        {task.priority && ( // Display priority if it exists
          <div className="flex items-center text-xs text-muted-foreground mb-2">
            <Flag
              className={`h-3 w-3 mr-1 ${task.priority === 'high' ? 'text-red-500' : task.priority === 'medium' ? 'text-yellow-500' : 'text-green-500'}`}
            />{' '}
            {/* Add Flag icon with color based on priority */}
            <span>
              <span className="font-medium text-primary">
                Priority:{' '}
                {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}{' '}
                {/* Capitalize first letter */}
              </span>
            </span>
          </div>
        )}
        {task.dependencies && task.dependencies.length > 0 && (
          <div className="flex items-center text-xs text-muted-foreground mb-2">
            <Tag className="h-3 w-3 mr-1" />
            <span>
              <span className="font-medium text-primary">
                Dependencies:
                {task.dependencies
                  .map((dependencyId: string) => {
                    const dependency = tasks.find((t) => t.id === dependencyId);
                    return dependency ? (
                      <a
                        key={dependencyId}
                        href={`#task-${dependencyId}`} // Link to the task item (assuming IDs are used as fragment identifiers)
                        className="underline hover:no-underline"
                        aria-label={`View dependency task ${dependency.title}`}
                      >
                        {dependency.title}
                      </a>
                    ) : (
                      'Unknown Task'
                    );
                  })
                  .reduce((prev: (React.ReactNode | string)[], curr, index) => {
                    if (index > 0) {
                      prev.push(', ');
                    }
                    prev.push(curr);
                    return prev;
                  }, [])}
              </span>
            </span>
          </div>
        )}
        {task.subtasks && task.subtasks.length > 0 && (
          <div className="flex items-center text-xs text-muted-foreground mb-2">
            <Tag className="h-3 w-3 mr-1" />
            <span>
              <span className="font-medium text-primary">
                Subtasks:
                {task.subtasks
                  .map((subtaskId: string) => {
                    const subtask = tasks.find((t) => t.id === subtaskId);
                    return subtask ? (
                      <a
                        key={subtaskId}
                        href={`#task-${subtaskId}`} // Link to the task item
                        className="underline hover:no-underline"
                        aria-label={`View subtask ${subtask.title}`}
                      >
                        {subtask.title}
                      </a>
                    ) : (
                      'Unknown Task'
                    );
                  })
                  .reduce((prev: (React.ReactNode | string)[], curr, index) => {
                    if (index > 0) {
                      prev.push(', ');
                    }
                    prev.push(curr);
                    return prev;
                  }, [])}
              </span>
            </span>
          </div>
        )}
        <div className="flex space-x-2 mt-2">
          <Button
            onClick={() => onEditClick(task)}
            variant="outline"
            size="sm"
            className="text-xs"
            aria-label={`Edit task ${task.title}`}
          >
            Edit
          </Button>
          <Button
            onClick={() => onDeleteTask(task.id)}
            variant="destructive"
            size="sm"
            className="text-xs"
            aria-label={`Delete task ${task.title}`}
          >
            Delete
          </Button>
        </div>
        <CommentList
          taskId={task.id}
          comments={task.comments || []} // Ensure comments is an array for CommentList
          onAddComment={handleAddComment} // Pass the refactored handler
        />
      </div>
    );
  },
);

TaskItem.displayName = 'TaskItem';

export default TaskItem;
