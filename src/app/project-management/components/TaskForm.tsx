import { useState, useEffect, Dispatch, SetStateAction } from 'react'; // Import useEffect, Dispatch, SetStateAction
import { Task, Project } from '@/lib/indexeddb-service'; // Import Project type
import { createTask, updateTask } from '@/lib/indexeddb-service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input'; // Import Input
import { Textarea } from '@/components/ui/textarea'; // Import Textarea
import { Label } from '@/components/ui/label'; // Import Label
import {
  Select, // Import Select components
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner'; // Import toast
import { logger } from '@/lib/logger'; // Import logger for enhanced debugging

// Debugging Improvement: Define a constant for the "no project" value
// to avoid duplicating literals and improve maintainability, addressing ESLint warning.
const NO_PROJECT_VALUE = 'no-project-selected';

interface TaskFormProps {
  task?: Task | null; // Allow null for new tasks
  onTaskUpdated?: (task: Task) => void; // Changed to accept the updated/new task
  onCancel?: () => void; // New prop for cancel action
  projects: Project[]; // Add projects prop for project assignment
  setTasks: Dispatch<SetStateAction<Task[]>>; // Add setTasks prop
  tasks: Task[]; // Add tasks prop
}

const TaskForm = ({
  task: initialTask,
  onTaskUpdated,
  onCancel, // Destructure new prop
  projects, // Destructure projects prop
  setTasks, // Destructure setTasks prop
  tasks, // Destructure tasks prop
}: TaskFormProps) => {
  const [title, setTitle] = useState(initialTask?.title || '');
  const [description, setDescription] = useState(
    initialTask?.description || '',
  );
  const [status, setStatus] = useState(initialTask?.status || 'to-do');
  const [assignee, setAssignee] = useState(initialTask?.assignee || '');
  // The due date is stored as a number (timestamp) in the Task interface,
  // but the form input uses type="date" which works with "YYYY-MM-DD" strings.
  // new Date('YYYY-MM-DD') is parsed as UTC midnight of that date.
  // If timezone-specific date logic is required, using libraries like date-fns
  // or moment.js with explicit timezone handling might be necessary.
  const [dueDate, setDueDate] = useState<string>( // Change to string for input type="date"
    initialTask?.dueDate
      ? new Date(initialTask.dueDate).toISOString().split('T')[0]
      : '',
  );
  // Debugging Improvement: Changed default projectId to NO_PROJECT_VALUE
  // to avoid the Radix UI Select.Item error for empty string values.
  // The empty string value is reserved for clearing the Select component's value.
  const [projectId, setProjectId] = useState(
    initialTask?.projectId || NO_PROJECT_VALUE,
  ); // State for project assignment

  // Effect to update form fields when initialTask changes (for editing)
  useEffect(() => {
    if (initialTask) {
      setTitle(initialTask.title);
      setDescription(initialTask.description || '');
      setStatus(initialTask.status || 'to-do');
      setAssignee(initialTask.assignee || '');
      setDueDate(
        initialTask.dueDate
          ? new Date(initialTask.dueDate).toISOString().split('T')[0]
          : '',
      );
      // Debugging Improvement: Ensure projectId is set to NO_PROJECT_VALUE if initialTask.projectId is empty,
      // preventing the Radix UI Select.Item error during edit mode.
      setProjectId(initialTask.projectId || NO_PROJECT_VALUE);
    } else {
      // Reset form for adding new task
      setTitle('');
      setDescription('');
      setStatus('to-do');
      setAssignee('');
      setDueDate('');
      setProjectId(NO_PROJECT_VALUE); // Reset to NO_PROJECT_VALUE for new tasks
    }
  }, [initialTask]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error('Task title is required.');
      return;
    }

    // Debugging Improvement: Convert NO_PROJECT_VALUE back to an empty string
    // for database storage, as an empty string typically signifies no project.
    const finalProjectId = projectId === NO_PROJECT_VALUE ? '' : projectId;

    const taskData = {
      title: title.trim(),
      description: description.trim(),
      status,
      assignee: assignee.trim(),
      dueDate: dueDate ? new Date(dueDate).getTime() : undefined,
      projectId: finalProjectId, // Assign project ID
    };

    if (initialTask) {
      // Update existing task
      const updatedTask: Task = {
        ...initialTask,
        ...taskData,
        updateTimestamp: Date.now(),
      };
      try {
        await updateTask(updatedTask);
        toast.success('Task updated successfully!');
        onTaskUpdated?.(updatedTask); // Call the callback with the updated task
      } catch (error) {
        logger.error('Error updating task:', error, {
          component: 'TaskForm',
          context: 'handleSubmit',
        });
        toast.error('Failed to update task. See console for details.');
      }
    } else {
      // Create new task
      try {
        const newTaskId = await createTask({
          ...taskData,
        });
        if (newTaskId) {
          const newTask: Task = {
            ...taskData,
            id: newTaskId,
            creationTimestamp: Date.now(),
            updateTimestamp: Date.now(),
          };
          toast.success('Task added successfully!');
          // Clear the form fields
          setTitle('');
          setDescription('');
          setStatus('to-do');
          setAssignee('');
          setDueDate('');
          setProjectId(NO_PROJECT_VALUE); // Reset to NO_PROJECT_VALUE for new tasks
          onTaskUpdated?.(newTask); // Call the callback with the new task
        } else {
          toast.error('Failed to add task. See console for details.');
        }
      } catch (error) {
        logger.error('Error adding task:', error, {
          component: 'TaskForm',
          context: 'handleSubmit',
        });
        toast.error('Failed to add task. See console for details.');
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="taskTitle">Title *</Label>
        <Input
          id="taskTitle"
          type="text"
          placeholder="Task Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
      </div>
      <div>
        <Label htmlFor="taskDescription">Description (optional)</Label>
        <Textarea
          id="taskDescription"
          placeholder="Task Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
        />
      </div>
      <div>
        <Label htmlFor="taskStatus">Status</Label>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger id="taskStatus">
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
          placeholder="Assignee"
          value={assignee}
          onChange={(e) => setAssignee(e.target.value)}
        />
      </div>
      <div>
        <Label htmlFor="taskDueDate">Due Date (optional)</Label>
        <Input
          id="taskDueDate"
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
        />
      </div>
      <div>
        <Label htmlFor="taskProject">Project (optional)</Label>
        <Select value={projectId} onValueChange={setProjectId}>
          <SelectTrigger id="taskProject">
            <SelectValue placeholder="Select project" />
          </SelectTrigger>
          <SelectContent>
            {/*
              Debugging Improvement: Changed the value for "No Project" from an empty string
              to "no-project-selected". Radix UI's Select.Item explicitly disallows empty string
              values for individual items, reserving it for the parent Select's value to clear selection.
              This change resolves the runtime error.
            */}
            <SelectItem value={NO_PROJECT_VALUE} label="No Project">
              No Project
            </SelectItem>
            {/*
              Iterate over projects to create SelectItem components.
              Added validation to ensure project.id is a non-empty string.
              This prevents rendering SelectItem with an invalid value,
              and logs a warning for easier debugging.
            */}
            {projects
              .filter((project) => {
                if (!project.id || project.id.trim() === '') {
                  logger.warn(
                    `Skipping project with invalid or empty ID: ${JSON.stringify(project)}`,
                    { component: 'TaskForm', context: 'ProjectSelect' },
                  );
                  return false; // Skip rendering this item if ID is invalid
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
        {/* Show cancel button only when editing */}
        {initialTask && onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel} // Use the new onCancel prop
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
