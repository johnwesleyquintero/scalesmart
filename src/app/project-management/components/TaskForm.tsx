import React, { useCallback, useEffect, useMemo } from 'react';
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
 * @property {Task | null} [task] - Optional task object for editing. If provided, the form will be pre-filled. Can be null for new tasks.
 * @property {(taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'comments'>) => Promise<Task | undefined>} [onCreateTask] - Callback function to create a new task.
 * @property {(task: Task) => Promise<void>} [onUpdateTask] - Callback function to update an existing task.
 * @property {() => void} [onCancel] - Callback function invoked when the cancel button is clicked (only visible during edit mode).
 * @property {Project[]} projects - The array of available projects to assign the task to.
 * @property {Task[]} allTasks - All tasks across all columns, used for resolving dependencies and subtasks in multi-selects.
 * @property {() => void} [onTaskSaved] - Callback function invoked after a task is successfully added or updated.
 */
interface TaskFormProps {
  task?: Task | null;
  onCreateTask?: (
    taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'comments'>,
  ) => Promise<Task | undefined>;
  onUpdateTask?: (task: Task) => Promise<void>;
  onCancel?: () => void;
  projects: Project[];
  allTasks: Task[];
  onTaskSaved?: () => void;
}

/**
 * @component TaskForm
 * @brief A form component for adding or updating task details.
 *
 * This component handles the creation and modification of task entries
 * in the IndexedDB. It provides input fields for task title, description, status,
 * assignee, due date, project assignment, priority, dependencies, and subtasks.
 * It uses `react-hook-form` and `zod` for validation and form management,
 * and supports both adding new tasks and editing existing ones.
 *
 * @param {TaskFormProps} props The props for the component.
 * @returns {JSX.Element} The TaskForm component.
 */
const TaskForm = ({
  task: initialTask, // Renamed for clarity when editing
  onCreateTask,
  onUpdateTask,
  onCancel,
  projects,
  allTasks,
  onTaskSaved,
}: TaskFormProps) => {
  // Define the validation schema for the form using Zod
  const formSchema = z.object({
    title: z.string().min(1, {
      message: 'Task title is required.',
    }),
    description: z.string().optional(),
    status: z.string().optional().default(TASK_STATUSES[0].id), // Default status for new tasks
    assigneeId: z.string().optional(),
    dueDate: z.date().optional(), // Zod handles date objects, convert to timestamp on submit
    projectId: z.string(), // Project ID is required, but can be NO_PROJECT_VALUE
    dependencies: z.array(z.string()).optional(),
    subtaskIds: z.array(z.string()).optional(),
    priority: z.nativeEnum(TaskPriority).optional(), // Use nativeEnum for TypeScript enum
    category: z.string(),
  });

  // Infer the form values type from the schema
  type FormValues = z.infer<typeof formSchema>;

  // Initialize react-hook-form with Zod resolver and default values
  const {
    register,
    handleSubmit,
    setValue,
    watch, // Used to watch form field values for conditional rendering or memoization
    reset, // Used to reset the form after successful submission
    formState: { errors, isSubmitSuccessful }, // isSubmitSuccessful for resetting form
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: initialTask
      ? {
          title: initialTask.title || '',
          description: initialTask.description || '',
          status: initialTask.status || TASK_STATUSES[0].id,
          assigneeId: initialTask.assigneeId || '',
          // Convert timestamp to Date object for react-hook-form's date input
          dueDate: initialTask.dueDate
            ? new Date(initialTask.dueDate)
            : undefined,
          projectId: initialTask.projectId || NO_PROJECT_VALUE, // Default to 'No Project'
          priority: initialTask.priority as TaskPriority | undefined, // Ensure type compatibility
          category: initialTask.category || '',
        }
      : undefined,
  });

  /**
   * @brief Handles form submission for creating or updating a task.
   *
   * This asynchronous function processes the validated form data, converts the
   * `dueDate` to a timestamp, and adjusts `projectId` if 'No Project' is selected.
   * It then calls either `onCreateTask` or `onUpdateTask` based on whether an
   * `initialTask` was provided. It handles success/error toasts and triggers
   * the `onTaskSaved` callback.
   *
   * @param {FormValues} data - The validated form data from the form.
   * @returns {Promise<void>} A promise that resolves when the task operation is complete.
   */
  const onSubmit = useCallback(
    async (data: FormValues) => {
      // Convert NO_PROJECT_VALUE to an empty string for database storage if no project is selected
      const finalProjectId =
        data.projectId === NO_PROJECT_VALUE ? '' : data.projectId;

      // Construct the task data object, converting dueDate to a timestamp
      const taskData = {
        title: data.title.trim(),
        description: data.description?.trim() || '',
        status: data.status as TaskStatus,
        assigneeId: data.assigneeId?.trim() || '',
        dueDate: data.dueDate ? data.dueDate.getTime() : undefined, // Convert Date object to timestamp
        projectId: finalProjectId,
        dependencies: data.dependencies,
        subtaskIds: data.subtaskIds,
        priority: data.priority,
        category: data.category,
      };

      try {
        if (initialTask) {
          // Logic for updating an existing task
          if (onUpdateTask) {
            const updatedTask: Task = {
              ...initialTask, // Retain existing task ID and creation timestamp
              ...taskData, // Apply updated fields
              updatedAt: Date.now(), // Update modification timestamp
            };
            await onUpdateTask(updatedTask);
            toast.success(`Task "${updatedTask.title}" updated successfully!`);
          }
        } else {
          // Logic for creating a new task
          if (onCreateTask) {
            await onCreateTask({
              ...taskData,
            });
            toast.success(`Task "${taskData.title}" added successfully!`);
          }
        }
        onTaskSaved?.(); // Call the callback if provided (e.g., to close a modal)
      } catch (error) {
        // Handle error and provide user feedback
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        toast.error(
          `Failed to ${initialTask ? 'update' : 'add'} task. ${errorMessage}. Please try again.`,
        );
        logger.error('Task persistence failed:', error); // Keep internal logging detailed
      }
    },
    [initialTask, onCreateTask, onUpdateTask, onTaskSaved], // Dependencies for useCallback
  );

  // Watch form values to control select components and default values
  const statusValue = watch('status');
  const projectValue = watch('projectId');
  const dependenciesValue = watch('dependencies');
  const subtaskIdsValue = watch('subtaskIds');
  const priorityValue = watch('priority');

  /**
   * @brief Memoizes the project options for the project selection dropdown.
   *
   * Filters out projects with invalid or empty IDs and maps valid projects
   * to `SelectItem` components, ensuring only valid options are displayed.
   *
   * @returns {JSX.Element[]} An array of `SelectItem` components for projects.
   */
  const projectSelectItems = useMemo(() => {
    return projects
      .filter((project) => {
        // Filter out projects with invalid or empty IDs
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
   * Filters out the current task (if in edit mode) to prevent self-referencing
   * dependencies/subtasks, and maps remaining tasks to options suitable for `MySelectComponent`.
   *
   * @returns {{ label: string; value: string; }[]} An array of objects, each representing a task option.
   */
  const taskOptions = useMemo(() => {
    return allTasks
      .filter((task: Task) => task.id !== initialTask?.id) // Exclude the current task from its own dependencies/subtasks
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
          {...register('title')} // Register input with react-hook-form
          aria-invalid={errors.title ? 'true' : 'false'} // Accessibility: indicate invalid state
          aria-label="Task Title"
        />
        {errors.title && (
          <p className="text-red-500 text-sm mt-1" role="alert">
            {errors.title?.message}
          </p>
        )}
      </div>
      <div>
        <Label htmlFor="description">Description (optional)</Label>
        <Textarea
          id="description"
          placeholder="Enter task description"
          rows={3}
          {...register('description')} // Register textarea with react-hook-form
          aria-label="Task Description"
        />
        {errors.description && (
          <p className="text-red-500 text-sm mt-1" role="alert">
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
            {TASK_STATUSES.map((status) => (
              <SelectItem
                key={status.id}
                value={status.id}
                label={status.title}
              >
                {status.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="assigneeId">Assignee (optional)</Label>
        <Input
          id="assigneeId"
          type="text"
          placeholder="Enter assignee name"
          {...register('assigneeId')}
          aria-label="Task Assignee"
        />
        {errors.assigneeId && (
          <p className="text-red-500 text-sm mt-1" role="alert">
            {errors.assigneeId?.message}
          </p>
        )}
      </div>
      <div>
        <Label htmlFor="dueDate">Due Date (optional)</Label>
        <Input
          id="dueDate"
          type="date"
          {...register('dueDate', { valueAsDate: true })} // valueAsDate converts input string to Date object
          aria-label="Task Due Date"
        />
        {errors.dueDate && (
          <p className="text-red-500 text-sm mt-1" role="alert">
            {errors.dueDate?.message}
          </p>
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
          onValueChange={(values: string[]) => setValue('subtaskIds', values)}
          defaultValue={subtaskIdsValue}
          isMulti
        />
      </div>
      <div className="flex justify-end">
        {/* Render Cancel button only in edit mode if onCancel callback is provided */}
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
