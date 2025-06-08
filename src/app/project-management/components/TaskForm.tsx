import React from 'react';
import {
  useState,
  useEffect,
  useCallback,
  Dispatch,
  SetStateAction,
  useMemo,
} from 'react';
import { Task, Project } from '@/lib/indexeddb-service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { MySelectComponent } from '@/components/MySelectComponent';
import {
  TASK_STATUSES,
  NO_PROJECT_VALUE,
} from '@/lib/constants/project-management';
import { TaskStatus, TaskPriority } from '@/types/indexeddb';

/**
 * @interface TaskFormProps
 * @brief Props for the TaskForm component.
 */
interface TaskFormProps {
  /**
   * @brief Optional task object for editing. If provided, the form will be pre-filled.
   * Can be null for new tasks.
   */
  task?: Task | null;
  /**
   * @brief Callback function to create a new task.
   */
  onCreateTask?: (
    taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'comments'>,
  ) => Promise<Task | undefined>;
  /**
   * @brief Callback function to update an existing task.
   */
  onUpdateTask?: (task: Task) => Promise<void>;
  /**
   * @brief Callback function invoked when the cancel button is clicked (only visible during edit mode).
   */
  onCancel?: () => void;
  /**
   * @brief The array of available projects to assign the task to.
   */
  projects: Project[];
  /**
   * @brief All tasks across all columns, used for resolving dependencies and subtasks.
   */
  allTasks: Task[];
  /**
   * @brief Callback function invoked after a task is successfully added or updated.
   */
  onTaskSaved?: () => void;
}

/**
 * @component TaskForm
 * @brief A form component for adding or updating task details.
 *
 * This component handles the creation and modification of task entries
 * in the IndexedDB. It provides input fields for task title, description, status,
 * assignee, due date, and project assignment, with validation and error handling.
 *
 * @param {TaskFormProps} props The props for the component.
 * @returns {JSX.Element} The TaskForm component.
 */
const TaskForm = ({
  task: initialTask,
  onCreateTask,
  onUpdateTask,
  onCancel,
  projects,
  allTasks,
  onTaskSaved,
}: TaskFormProps) => {
  const formSchema = z.object({
    title: z.string().min(1, {
      message: 'Task title is required.',
    }),
    description: z.string().optional(),
    status: z.string().optional().default('to-do'),
    assigneeId: z.string().optional(), // Changed from assignee to assigneeId
    dueDate: z.date().optional(),
    projectId: z.string(), // projectId is required in Task interface
    dependencies: z.array(z.string()).optional(),
    subtaskIds: z.array(z.string()).optional(), // Changed from subtasks to subtaskIds
    priority: z.nativeEnum(TaskPriority).optional(),
  });
  interface FormValues extends z.infer<typeof formSchema> {}

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset, // Import reset from useForm
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: initialTask?.title || '',
      description: initialTask?.description || '',
      status: initialTask?.status || 'to-do',
      assigneeId: initialTask?.assigneeId || '', // Changed from assignee to assigneeId
      dueDate: initialTask?.dueDate ? new Date(initialTask.dueDate) : undefined,
      projectId: initialTask?.projectId || NO_PROJECT_VALUE, // Ensure it's a string, default to NO_PROJECT_VALUE
      priority: initialTask?.priority as TaskPriority | undefined,
    },
  });

  /**
   * @brief Handles form submission for creating or updating a task.
   *
   * This function processes the form data, constructs a task object, and then
   * calls either `onCreateTask` or `onUpdateTask` based on whether an `initialTask`
   * is provided. It also handles success/error toasts and form resetting.
   *
   * @param {FormValues} data - The validated form data.
   * @returns {Promise<void>} A promise that resolves when the task operation is complete.
   */
  const onSubmit = useCallback(
    async (data: FormValues) => {
      const finalProjectId =
        data.projectId === NO_PROJECT_VALUE ? '' : data.projectId;

      const taskData = {
        title: data.title.trim(),
        description: data.description?.trim() || '',
        status: data.status as TaskStatus,
        assigneeId: data.assigneeId?.trim() || '',
        dueDate: data.dueDate ? data.dueDate.getTime() : undefined,
        projectId: finalProjectId,
        dependencies: data.dependencies,
        subtaskIds: data.subtaskIds,
        priority: data.priority,
      };

      try {
        if (initialTask) {
          // Update existing task
          if (onUpdateTask) {
            const updatedTask: Task = {
              ...initialTask,
              ...taskData,
              updatedAt: Date.now(),
            };
            await onUpdateTask(updatedTask);
            onTaskSaved?.();
          }
        } else {
          // Create new task
          if (onCreateTask) {
            await onCreateTask({
              ...taskData,
            });
            onTaskSaved?.();
            reset();
          }
        }
      } catch (error) {
        toast.error(
          `Failed to ${initialTask ? 'update' : 'add'} task. Please try again.`,
        );
      }
    },
    [initialTask, onCreateTask, onUpdateTask, onTaskSaved, reset],
  );

  const statusValue = watch('status');
  const projectValue = watch('projectId');
  const dependenciesValue = watch('dependencies');
  const subtaskIdsValue = watch('subtaskIds'); // Changed from subtasks to subtaskIds
  const priorityValue = watch('priority');

  /**
   * @brief Memoizes the project options for the project selection dropdown.
   *
   * Filters out projects with invalid or empty IDs and maps valid projects
   * to `SelectItem` components.
   *
   * @returns {JSX.Element[]} An array of `SelectItem` components for projects.
   */
  const projectSelectItems = useMemo(() => {
    return projects
      .filter((project) => {
        if (!project.id || project.id.trim() === '') {
          logger.warn(
            `Skipping project with invalid or empty ID: ${JSON.stringify(project)}`,
            { component: 'TaskForm', context: 'ProjectSelect' },
          );
          return false;
        }
        return true;
      })
      .map((project) => (
        <SelectItem key={project.id} value={project.id} label={project.name}>
          {project.name}
        </SelectItem>
      ));
  }, [projects]);

  /**
   * @brief Memoizes the task options for the dependencies and subtasks multi-select components.
   *
   * Filters out the current task (if in edit mode) to prevent self-referencing dependencies/subtasks.
   *
   * @returns {{ label: string; value: string; }[]} An array of objects, each representing a task option.
   */
  const taskOptions = useMemo(() => {
    return allTasks
      .filter((task: Task) => task.id !== initialTask?.id)
      .map((task: Task) => ({
        label: task.title,
        value: task.id,
      }));
  }, [allTasks, initialTask?.id]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label htmlFor="title">Title *</Label>
        <Input
          id="title"
          type="text"
          placeholder="Enter task title"
          {...register('title')}
          aria-invalid={errors.title ? 'true' : 'false'}
          aria-label="Task Title"
        />
        {errors.title && (
          <p className="text-red-500 text-sm mt-1">{errors.title?.message}</p>
        )}
      </div>
      <div>
        <Label htmlFor="description">Description (optional)</Label>
        <Textarea
          id="description"
          placeholder="Enter task description"
          rows={3}
          {...register('description')}
          aria-label="Task Description"
        />
        {errors.description && (
          <p className="text-red-500 text-sm mt-1">
            {errors.description?.message}
          </p>
        )}
      </div>
      <div>
        <Label htmlFor="status">Status</Label>
        <Select
          value={statusValue}
          onValueChange={(value) => setValue('status', value)}
        >
          <SelectTrigger id="status" aria-label="Task Status">
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectContent>
            {TASK_STATUSES.map(
              (
                status: { id: TaskStatus; title: string }, // Explicitly type status
              ) => (
                <SelectItem
                  key={status.id}
                  value={status.id}
                  label={status.title}
                >
                  {status.title}
                </SelectItem>
              ),
            )}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="assigneeId">Assignee (optional)</Label>
        <Input
          id="assigneeId" // Changed from assignee to assigneeId
          type="text"
          placeholder="Enter assignee name"
          {...register('assigneeId')} // Changed from assignee to assigneeId
          aria-label="Task Assignee"
        />
        {errors.assigneeId && (
          <p className="text-red-500 text-sm mt-1">
            {errors.assigneeId?.message}
          </p>
        )}
      </div>
      <div>
        <Label htmlFor="dueDate">Due Date (optional)</Label>
        <Input
          id="dueDate"
          type="date"
          {...register('dueDate', { valueAsDate: true })}
          aria-label="Task Due Date"
        />
        {errors.dueDate && (
          <p className="text-red-500 text-sm mt-1">{errors.dueDate?.message}</p>
        )}
      </div>
      <div>
        <Label htmlFor="projectId">Project (optional)</Label>
        <Select
          value={projectValue}
          onValueChange={(value) => setValue('projectId', value)}
        >
          <SelectTrigger id="projectId" aria-label="Assign to project">
            <SelectValue placeholder="Select project" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={NO_PROJECT_VALUE} label="No Project">
              No Project
            </SelectItem>
            {projectSelectItems}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="priority">Priority (optional)</Label>
        <Select
          value={priorityValue}
          onValueChange={(value) => setValue('priority', value as TaskPriority)}
        >
          <SelectTrigger id="priority" aria-label="Task Priority">
            <SelectValue placeholder="Select priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={TaskPriority.Low} label="Low">
              Low
            </SelectItem>
            <SelectItem value={TaskPriority.Medium} label="Medium">
              Medium
            </SelectItem>
            <SelectItem value={TaskPriority.High} label="High">
              High
            </SelectItem>
            <SelectItem value={TaskPriority.Urgent} label="Urgent">
              Urgent
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="dependencies">Dependencies (optional)</Label>
        <MySelectComponent<true>
          options={taskOptions}
          placeholder="Select dependencies"
          onValueChange={(values: string[]) => setValue('dependencies', values)}
          defaultValue={dependenciesValue}
          isMulti
        />
      </div>
      <div>
        <Label htmlFor="subtaskIds">Subtasks (optional)</Label>
        <MySelectComponent<true>
          options={taskOptions}
          placeholder="Select subtasks"
          onValueChange={(values: string[]) => setValue('subtaskIds', values)} // Changed from subtasks to subtaskIds
          defaultValue={subtaskIdsValue} // Changed from subtasksValue to subtaskIdsValue
          isMulti
        />
      </div>
      <div className="flex justify-end">
        {initialTask && onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="mr-2"
          >
            Cancel
          </Button>
        )}
        <Button type="submit">
          {initialTask ? 'Update Task' : 'Add Task'}
        </Button>
      </div>
    </form>
  );
};

export default React.memo(TaskForm);
