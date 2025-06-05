import {
  useState,
  useEffect,
  useCallback,
  Dispatch,
  SetStateAction,
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
   * @brief Function to update the list of tasks.
   * Accepts a functional update to prevent stale closure issues.
   */
  setTasks: Dispatch<SetStateAction<Task[]>>;
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
  setTasks,
}: TaskFormProps) => {
  const [title, setTitle] = useState(initialTask?.title || '');
  const [description, setDescription] = useState(
    initialTask?.description || '',
  );
  const [status, setStatus] = useState(initialTask?.status || 'to-do');
  const [assignee, setAssignee] = useState(initialTask?.assignee || '');
  const [dueDate, setDueDate] = useState<string>(
    initialTask?.dueDate
      ? new Date(initialTask.dueDate).toISOString().split('T')[0]
      : '',
  );
  const [projectId, setProjectId] = useState(
    initialTask?.projectId || NO_PROJECT_VALUE,
  );

  /**
   * @brief Resets the form fields when `initialTask` changes.
   * This effect ensures the form is correctly populated when editing an existing task
   * or cleared when switching to add a new task.
   */
  useEffect(() => {
    setTitle(initialTask?.title || '');
    setDescription(initialTask?.description || '');
    setStatus(initialTask?.status || 'to-do');
    setAssignee(initialTask?.assignee || '');
    setDueDate(
      initialTask?.dueDate
        ? new Date(initialTask.dueDate).toISOString().split('T')[0]
        : '',
    );
    setProjectId(initialTask?.projectId || NO_PROJECT_VALUE);
  }, [initialTask]);

  /**
   * @brief Validates the task form inputs.
   * @returns {boolean} True if inputs are valid, false otherwise.
   */
  const validateForm = useCallback((): boolean => {
    if (!title.trim()) {
      toast.error('Task title is required.');
      return false;
    }
    // Optional: Add more validation for dueDate, assignee format, etc.
    return true;
  }, [title]); // Add 'title' as a dependency

  /**
   * @brief Handles the form submission for adding or updating a task.
   * Uses `useCallback` to memoize the function.
   * @param {React.FormEvent} e The form event.
   */
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!validateForm()) {
        return;
      }

      // Convert NO_PROJECT_VALUE back to an empty string for database storage.
      const finalProjectId = projectId === NO_PROJECT_VALUE ? '' : projectId;

      const taskData = {
        title: title.trim(),
        description: description.trim(),
        status,
        assignee: assignee.trim(),
        dueDate: dueDate ? new Date(dueDate).getTime() : undefined,
        projectId: finalProjectId,
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
          setTasks((prevTasks) =>
            prevTasks.map((t) => (t.id === updatedTask.id ? updatedTask : t)),
          );
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
            setTasks((prevTasks) => [...prevTasks, newTask]);
            toast.success('Task added successfully!');
            // Clear the form fields only after successful creation
            setTitle('');
            setDescription('');
            setStatus('to-do');
            setAssignee('');
            setDueDate('');
            setProjectId(NO_PROJECT_VALUE);
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
            taskTitle: title,
          },
        );
        toast.error(
          `Failed to ${initialTask ? 'update' : 'add'} task. Please try again.`,
        );
      }
    },
    [
      title,
      description,
      status,
      assignee,
      dueDate,
      projectId,
      initialTask,
      onTaskUpdated,
      setTasks,
      validateForm,
    ],
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="taskTitle">Title *</Label>
        <Input
          id="taskTitle"
          type="text"
          placeholder="Enter task title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          aria-required="true"
          aria-label="Task Title"
        />
      </div>
      <div>
        <Label htmlFor="taskDescription">Description (optional)</Label>
        <Textarea
          id="taskDescription"
          placeholder="Enter task description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          aria-label="Task Description"
        />
      </div>
      <div>
        <Label htmlFor="taskStatus">Status</Label>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger id="taskStatus" aria-label="Task Status">
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
        <Label htmlFor="taskAssignee">Assignee (optional)</Label>
        <Input
          id="taskAssignee"
          type="text"
          placeholder="Enter assignee name"
          value={assignee}
          onChange={(e) => setAssignee(e.target.value)}
          aria-label="Task Assignee"
        />
      </div>
      <div>
        <Label htmlFor="taskDueDate">Due Date (optional)</Label>
        <Input
          id="taskDueDate"
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          aria-label="Task Due Date"
        />
      </div>
      <div>
        <Label htmlFor="taskProject">Project (optional)</Label>
        <Select value={projectId} onValueChange={setProjectId}>
          <SelectTrigger id="taskProject" aria-label="Assign to project">
            <SelectValue placeholder="Select project" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={NO_PROJECT_VALUE} label="No Project">
              No Project
            </SelectItem>
            {projects
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
                <SelectItem
                  key={project.id}
                  value={project.id}
                  label={project.name}
                >
                  {project.name}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
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

export default TaskForm;
