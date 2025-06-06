import React, { useCallback, useMemo } from 'react';
import { Task, Project } from '@/lib/indexeddb-service';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { CalendarIcon, UserRound, Tag, Flag } from 'lucide-react';

interface TaskItemProps {
  task: Task;
  projects: Project[];
  onEditClick: (task: Task) => void;
  onDeleteTask: (id: string) => void;
  allTasks: Task[]; // All tasks for dependency/subtask lookup
  onTaskUpdated: (updatedTask: Task) => void; // New prop to signal task updates to parent
  onViewTaskDetails: (task: Task) => void; // New prop to open task details modal
}

const TaskItem: React.FC<TaskItemProps> = React.memo(
  ({
    task,
    projects,
    onEditClick,
    onDeleteTask,
    allTasks,
    onTaskUpdated,
    onViewTaskDetails,
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

    // Determine priority styling
    const priorityClass = useMemo(() => {
      switch (task.priority) {
        case 'high':
          return 'text-red-500';
        case 'medium':
          return 'text-yellow-500';
        case 'low':
          return 'text-green-500';
        default:
          return 'text-muted-foreground';
      }
    }, [task.priority]);

    return (
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
          {task.assignee && (
            <div className="flex items-center mr-3">
              <UserRound className="h-3 w-3 mr-1" />
              <span>{task.assignee}</span>
            </div>
          )}
          {task.dueDate && (
            <div className="flex items-center mr-3">
              <CalendarIcon className="h-3 w-3 mr-1" />
              <span>{format(new Date(task.dueDate), 'PPP')}</span>
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
                {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
              </span>
            </div>
          )}
        </div>

        {task.dependencies && task.dependencies.length > 0 && (
          <div className="text-xs text-muted-foreground mt-2">
            <span className="font-medium">Dependencies: </span>
            {task.dependencies
              .map((dependencyId: string) => {
                const dependency = allTasks.find((t) => t.id === dependencyId);
                return dependency ? dependency.title : 'Unknown Task';
              })
              .join(', ')}
          </div>
        )}
        {task.subtasks && task.subtasks.length > 0 && (
          <div className="text-xs text-muted-foreground mt-1">
            <span className="font-medium">Subtasks: </span>
            {task.subtasks
              .map((subtaskId: string) => {
                const subtask = allTasks.find((t) => t.id === subtaskId);
                return subtask ? subtask.title : 'Unknown Task';
              })
              .join(', ')}
          </div>
        )}

        <div className="flex space-x-2 mt-3">
          <Button
            onClick={(e) => {
              e.stopPropagation(); // Prevent opening details modal
              onEditClick(task);
            }}
            variant="outline"
            size="sm"
            className="text-xs"
            aria-label={`Edit task ${task.title}`}
          >
            Edit
          </Button>
          <Button
            onClick={(e) => {
              e.stopPropagation(); // Prevent opening details modal
              onDeleteTask(task.id);
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
    );
  },
);

TaskItem.displayName = 'TaskItem';

export default TaskItem;
