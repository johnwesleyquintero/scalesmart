import React, { useCallback, useMemo } from 'react';
import { Task, Project } from '@/lib/indexeddb-service';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { CalendarIcon, UserRound, Tag } from 'lucide-react';

interface TaskItemProps {
  task: Task;

  projects: Project[];
  onEditClick: (task: Task) => void;
  onDeleteTask: (id: string) => void;
}

const TaskItem: React.FC<TaskItemProps> = ({
  task,
  projects,
  onEditClick,
  onDeleteTask,
}) => {
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

  return (
    <div className="bg-card p-3 rounded-md shadow-sm border border-border">
      <h3 className="font-semibold text-base mb-1 text-foreground">
        {task.title}
      </h3>
      {task.description && (
        <p className="text-sm text-muted-foreground mb-2">{task.description}</p>
      )}
      {/* Display assignee */}
      <div className="flex items-center text-xs text-muted-foreground mb-1">
        <UserRound className="h-3 w-3 mr-1" />
        <span>{task.assignee || 'Unassigned'}</span>
      </div>
      {/* Display due date */}
      <div className="flex items-center text-xs text-muted-foreground mb-2">
        <CalendarIcon className="h-3 w-3 mr-1" />
        <span>
          {task.dueDate ? format(new Date(task.dueDate), 'PPP') : 'No due date'}
        </span>
      </div>
      {/* Display associated project name */}
      <div className="flex items-center text-xs text-muted-foreground mb-2">
        <Tag className="h-3 w-3 mr-1" />
        <span>
          <span className="font-medium text-primary">
            Project: {getProjectName(task.projectId)}
          </span>
        </span>
      </div>
      {/* Display status */}
      <div className="flex items-center text-xs text-muted-foreground mb-2">
        <span className="font-medium text-primary">Status: {task.status}</span>
      </div>
      {/* Action buttons */}
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
    </div>
  );
};

export default TaskItem;
