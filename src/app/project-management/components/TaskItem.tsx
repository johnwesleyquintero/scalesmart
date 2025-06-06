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
  tasks: Task[];
}

const TaskItem: React.FC<TaskItemProps> = React.memo(
  function TaskItemComponent({
    task,
    projects,
    onEditClick,
    onDeleteTask,
    tasks,
  }: TaskItemProps) {
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
        {task.dependencies && task.dependencies.length > 0 && (
          <div className="flex items-center text-xs text-muted-foreground mb-2">
            <Tag className="h-3 w-3 mr-1" />
            <span>
              <span className="font-medium text-primary">
                Dependencies:
                {task.dependencies
                  .map((dependencyId: string) => {
                    const dependency = tasks.find(
                      (task) => task.id === dependencyId,
                    );
                    return dependency ? dependency.title : 'Unknown Task';
                  })
                  .join(', ')}
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
                    const subtask = tasks.find((task) => task.id === subtaskId);
                    return subtask ? subtask.title : 'Unknown Task';
                  })
                  .join(', ')}
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
      </div>
    );
  },
);

TaskItem.displayName = 'TaskItem';

export default TaskItem;
