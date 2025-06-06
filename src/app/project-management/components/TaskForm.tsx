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
import { createTask, updateTask } from '@/lib/indexeddb-service';
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
  TaskStatus,
  NO_PROJECT_VALUE,
} from '@/lib/constants/project-management'; // Import TASK_STATUSES, TaskStatus, and NO_PROJECT_VALUE
import { getAllTasks } from '@/lib/indexeddb-service';

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
   * @brief Callback function invoked after a task is successfully added or updated.
   * Receives the updated/new task object.
   */
  onTaskUpdated?: (task: Task) => void;
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
  onTaskUpdated,
  onCancel,
  projects,
  allTasks,
}: TaskFormProps) => {
  const formSchema = z.object({
    title: z.string().min(1, {
      message: 'Task title is required.',
    }),
    description: z.string().optional(),
    status: z.string().optional().default('to-do'),
    assignee: z.string().optional(),
    dueDate: z.date().optional(),
    projectId: z.string().optional(),
    dependencies: z.array(z.string()).optional(),
    subtasks: z.array(z.string()).optional(),
    priority: z.enum(['low', 'medium', 'high']).optional(),
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
      assignee: initialTask?.assignee || '',
      dueDate: initialTask?.dueDate ? new Date(initialTask.dueDate) : undefined,
      projectId: initialTask?.projectId || NO_PROJECT_VALUE,
      priority: initialTask?.priority,
    },
  });

  useEffect(() => {
    if (initialTask) {
      setValue('title', initialTask.title);
      setValue('description', initialTask.description || '');
      setValue('status', initialTask.status || 'to-do');
      setValue('assignee', initialTask.assignee || '');
      setValue(
        'dueDate',
        initialTask.dueDate ? new Date(initialTask.dueDate) : undefined,
      );
      setValue('projectId', initialTask.projectId || NO_PROJECT_VALUE);
      setValue('dependencies', initialTask.dependencies || []);
      setValue('subtasks', initialTask.subtasks || []);
      setValue('priority', initialTask.priority);
    } else {
      // Reset form for new task creation when initialTask is null
      reset({
        title: '',
        description: '',
        status: 'to-do',
        assignee: '',
        dueDate: undefined,
        projectId: NO_PROJECT_VALUE,
        dependencies: [],
        subtasks: [],
        priority: undefined,
      });
    }
  }, [initialTask, setValue, reset]);

  const onSubmit = useCallback(
    async (data: FormValues) => {
      const finalProjectId =
        data.projectId === NO_PROJECT_VALUE ? '' : data.projectId;

      const taskData = {
        title: data.title.trim(),
        description: data.description?.trim() || '',
        status: data.status,
        assignee: data.assignee?.trim() || '',
        dueDate: data.dueDate ? data.dueDate.getTime() : undefined,
        projectId: finalProjectId,
        dependencies: data.dependencies,
        subtasks: data.subtasks,
        priority: data.priority,
      };

      try {
        if (initialTask) {
          const updatedTask: Task = {
            ...initialTask,
            ...taskData,
            updateTimestamp: Date.now(),
          };
          await updateTask(updatedTask);
          toast.success('Task updated successfully!');
          onTaskUpdated?.(updatedTask);
        } else {
          const newTask = await createTask({
            ...taskData,
            // creationTimestamp is added by indexeddb-service.ts
          });
          if (newTask) {
            toast.success('Task added successfully!');
            onTaskUpdated?.(newTask);
            reset(); // Reset form after successful creation
          } else {
            logger.error('createTask returned null/undefined task.', {
              component: 'TaskForm',
              context: 'handleSubmit',
              taskData,
            });
            toast.error('Failed to add task. An unexpected error occurred.');
          }
        }
      } catch (error) {
        logger.error(
          `Error ${initialTask ? 'updating' : 'adding'} task:`,
          error,
          {
            component: 'TaskForm',
            context: 'handleSubmit',
            taskTitle: data.title,
          },
        );
        toast.error(
          `Failed to ${initialTask ? 'update' : 'add'} task. Please try again.`,
        );
      }
    },
    [initialTask, onTaskUpdated, reset],
  );

  const statusValue = watch('status');
  const projectValue = watch('projectId');
  const dependenciesValue = watch('dependencies');
  const subtasksValue = watch('subtasks');
  const priorityValue = watch('priority');

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
        <Label htmlFor="assignee">Assignee (optional)</Label>
        <Input
          id="assignee"
          type="text"
          placeholder="Enter assignee name"
          {...register('assignee')}
          aria-label="Task Assignee"
        />
        {errors.assignee && (
          <p className="text-red-500 text-sm mt-1">
            {errors.assignee?.message}
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
          onValueChange={(value) =>
            setValue('priority', value as 'low' | 'medium' | 'high')
          }
        >
          <SelectTrigger id="priority" aria-label="Task Priority">
            <SelectValue placeholder="Select priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="low" label="Low">
              Low
            </SelectItem>
            <SelectItem value="medium" label="Medium">
              Medium
            </SelectItem>
            <SelectItem value="high" label="High">
              High
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
        <Label htmlFor="subtasks">Subtasks (optional)</Label>
        <MySelectComponent<true>
          options={taskOptions}
          placeholder="Select subtasks"
          onValueChange={(values: string[]) => setValue('subtasks', values)}
          defaultValue={subtasksValue}
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
