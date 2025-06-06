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
import { getAllTasks } from '@/lib/indexeddb-service';

/**
 * @constant NO_PROJECT_VALUE
 * @brief A special value used in the project selection dropdown to represent "No Project Selected".
 * This avoids using an empty string, which Radix UI's Select.Item explicitly disallows for individual items.
 */
const NO_PROJECT_VALUE = 'no-project-selected';

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
   
   */
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
    dependencies: z.array(z.string()).optional(), // Array of task IDs
    subtasks: z.array(z.string()).optional(), // Array of task IDs
  });

  type FormValues = z.infer<typeof formSchema>;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
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
    }
  }, [initialTask, setValue]);

  const onSubmit = useCallback(
    async (data: FormValues) => {
      // Convert NO_PROJECT_VALUE back to an empty string for database storage.
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
      };

      try {
        if (initialTask) {
          // Update existing task
          const updatedTask: Task = {
            ...initialTask,
            ...taskData,
            updateTimestamp: Date.now(),
          };
          await updateTask(updatedTask);
          toast.success('Task updated successfully!');
          onTaskUpdated?.(updatedTask);
        } else {
          // Create new task
          const newTaskId = await createTask({
            ...taskData,
          });
          if (newTaskId) {
            // The createTask function should return the full Task object with ID and timestamps
            // If it only returns the ID, we need to construct the full object here.
            // Assuming createTask returns the ID, and we construct the object with timestamps.
            const newTask: Task = {
              ...taskData,
              id: newTaskId,
              creationTimestamp: Date.now(),
              updateTimestamp: Date.now(),
            };
            toast.success('Task added successfully!');
            onTaskUpdated?.(newTask);
          } else {
            logger.error('createTask returned null/undefined ID.', {
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
    [initialTask, onTaskUpdated],
  );

  const statusValue = watch('status');
  const projectValue = watch('projectId');

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

  const [allTasks, setAllTasks] = useState<Task[]>([]);

  useEffect(() => {
    const fetchTasks = async () => {
      // Fetch all tasks from IndexedDB
      const tasks = await getAllTasks();
      setAllTasks(tasks);
    };

    fetchTasks();
  }, []);

  const taskOptions = useMemo(() => {
    return allTasks.map((task: Task) => ({
      label: task.title,
      value: task.id,
    }));
  }, [allTasks]);

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
            <SelectItem value="to-do" label="To Do">
              To Do
            </SelectItem>
            <SelectItem value="in-progress" label="In Progress">
              In Progress
            </SelectItem>
            <SelectItem value="completed" label="Completed">
              Completed
            </SelectItem>
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
        <Label htmlFor="dependencies">Dependencies (optional)</Label>
        <MySelectComponent
          options={taskOptions}
          placeholder="Select dependencies"
          onValueChange={(value) => setValue('dependencies', [value])}
        />
      </div>
      <div>
        <Label htmlFor="subtasks">Subtasks (optional)</Label>
        <MySelectComponent
          options={taskOptions}
          placeholder="Select subtasks"
          onValueChange={(value) => setValue('subtasks', [value])}
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
