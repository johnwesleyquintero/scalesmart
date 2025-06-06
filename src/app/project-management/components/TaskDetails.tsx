// src/app/project-management/components/TaskDetails.tsx
'use client';

import React, { useCallback, useMemo, useState } from 'react';
import { Task, Project, TaskComment } from '@/lib/indexeddb-service';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CalendarIcon, UserRound, Tag, Flag, Edit } from 'lucide-react';
import CommentList from './CommentList';
import TaskForm from './TaskForm'; // To allow editing within details view
import { updateTask } from '@/lib/indexeddb-service';
import { toast } from 'sonner';

interface TaskDetailsProps {
  task: Task;
  projects: Project[];
  allTasks: Task[]; // For resolving dependencies and subtasks
  onTaskUpdated: (updatedTask: Task) => void; // To propagate updates back to parent
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
  onTaskUpdated,
  onClose,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [currentTask, setCurrentTask] = useState<Task>(task); // State to manage task data within details view

  // Update currentTask if the prop task changes (e.g., from parent update)
  React.useEffect(() => {
    setCurrentTask(task);
  }, [task]);

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

  const handleAddComment = useCallback(
    async (newComment: TaskComment) => {
      const comments = Array.isArray(currentTask.comments)
        ? currentTask.comments
        : [];
      const updatedTask: Task = {
        ...currentTask,
        comments: [...comments, newComment],
        updateTimestamp: Date.now(),
      };
      try {
        await updateTask(updatedTask);
        setCurrentTask(updatedTask); // Update local state
        onTaskUpdated(updatedTask); // Propagate update to parent
        toast.success('Comment added successfully.');
      } catch (error) {
        console.error('Failed to add comment and update task:', error);
        toast.error('Failed to add comment. Please try again.');
      }
    },
    [currentTask, onTaskUpdated],
  );

  const handleTaskFormUpdated = useCallback(
    (updatedTask: Task) => {
      setCurrentTask(updatedTask); // Update local state
      onTaskUpdated(updatedTask); // Propagate update to parent
      setIsEditing(false); // Exit edit mode
    },
    [onTaskUpdated],
  );

  if (isEditing) {
    return (
      <TaskForm
        task={currentTask}
        onTaskUpdated={handleTaskFormUpdated}
        onCancel={() => setIsEditing(false)}
        projects={projects}
        allTasks={allTasks}
      />
    );
  }

  return (
    <Card className="border-none shadow-none">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-2xl font-bold text-foreground">
          {currentTask.title}
        </CardTitle>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsEditing(true)}
          aria-label="Edit task"
        >
          <Edit className="h-4 w-4 mr-2" /> Edit
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {currentTask.description && (
          <div>
            <h4 className="font-semibold text-sm text-muted-foreground mb-1">
              Description
            </h4>
            <p className="text-sm text-foreground">{currentTask.description}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-semibold text-sm text-muted-foreground mb-1">
              Assignee
            </h4>
            <div className="flex items-center text-sm text-foreground">
              <UserRound className="h-4 w-4 mr-2" />
              <span>{currentTask.assignee || 'Unassigned'}</span>
            </div>
          </div>
          <div>
            <h4 className="font-semibold text-sm text-muted-foreground mb-1">
              Due Date
            </h4>
            <div className="flex items-center text-sm text-foreground">
              <CalendarIcon className="h-4 w-4 mr-2" />
              <span>
                {currentTask.dueDate
                  ? format(new Date(currentTask.dueDate), 'PPP')
                  : 'No due date'}
              </span>
            </div>
          </div>
          <div>
            <h4 className="font-semibold text-sm text-muted-foreground mb-1">
              Project
            </h4>
            <div className="flex items-center text-sm text-foreground">
              <Tag className="h-4 w-4 mr-2" />
              <span>{getProjectName(currentTask.projectId)}</span>
            </div>
          </div>
          <div>
            <h4 className="font-semibold text-sm text-muted-foreground mb-1">
              Status
            </h4>
            <div className="flex items-center text-sm text-foreground">
              <span className="px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                {currentTask.status.charAt(0).toUpperCase() +
                  currentTask.status.slice(1).replace(/-/g, ' ')}
              </span>
            </div>
          </div>
          {currentTask.priority && (
            <div>
              <h4 className="font-semibold text-sm text-muted-foreground mb-1">
                Priority
              </h4>
              <div className="flex items-center text-sm text-foreground">
                <Flag
                  className={`h-4 w-4 mr-2 ${currentTask.priority === 'high' ? 'text-red-500' : currentTask.priority === 'medium' ? 'text-yellow-500' : 'text-green-500'}`}
                />
                <span>
                  {currentTask.priority.charAt(0).toUpperCase() +
                    currentTask.priority.slice(1)}
                </span>
              </div>
            </div>
          )}
        </div>

        {currentTask.dependencies && currentTask.dependencies.length > 0 && (
          <div className="border-t border-border pt-4">
            <h4 className="font-semibold text-sm text-muted-foreground mb-2">
              Dependencies
            </h4>
            <ul className="list-disc pl-5 space-y-1 text-sm text-foreground">
              {currentTask.dependencies.map((dependencyId: string) => {
                const dependency = allTasks.find((t) => t.id === dependencyId);
                return (
                  <li key={dependencyId}>
                    {dependency ? dependency.title : 'Unknown Task'}
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {currentTask.subtasks && currentTask.subtasks.length > 0 && (
          <div className="border-t border-border pt-4">
            <h4 className="font-semibold text-sm text-muted-foreground mb-2">
              Subtasks
            </h4>
            <ul className="list-disc pl-5 space-y-1 text-sm text-foreground">
              {currentTask.subtasks.map((subtaskId: string) => {
                const subtask = allTasks.find((t) => t.id === subtaskId);
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
            taskId={currentTask.id}
            comments={currentTask.comments || []}
            onAddComment={handleAddComment}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default TaskDetails;
