import { useState, useEffect } from 'react'; // Import useEffect
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

interface TaskFormProps {
  setTasks: (tasks: Task[]) => void;
  tasks: Task[];
  task?: Task;
  onTaskUpdated?: () => void;
  projects: Project[]; // Add projects prop for project assignment
}

const TaskForm = ({
  setTasks,
  tasks,
  task: initialTask,
  onTaskUpdated,
  projects, // Destructure projects prop
}: TaskFormProps) => {
  const [title, setTitle] = useState(initialTask?.title || '');
  const [description, setDescription] = useState(
    initialTask?.description || '',
  );
  const [status, setStatus] = useState(initialTask?.status || 'to-do');
  const [assignee, setAssignee] = useState(initialTask?.assignee || '');
  const [dueDate, setDueDate] = useState<string>( // Change to string for input type="date"
    initialTask?.dueDate
      ? new Date(initialTask.dueDate).toISOString().split('T')[0]
      : '',
  );
  const [projectId, setProjectId] = useState(initialTask?.projectId || ''); // State for project assignment

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
      setProjectId(initialTask.projectId || '');
    } else {
      // Reset form for adding new task
      setTitle('');
      setDescription('');
      setStatus('to-do');
      setAssignee('');
      setDueDate('');
      setProjectId('');
    }
  }, [initialTask]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error('Task title is required.');
      return;
    }

    const taskData = {
      title: title.trim(),
      description: description.trim(),
      status,
      assignee: assignee.trim(),
      dueDate: dueDate ? new Date(dueDate).getTime() : undefined,
      projectId: projectId || '', // Assign project ID
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
        // Update the tasks state with the updated task
        setTasks(tasks.map((t) => (t.id === updatedTask.id ? updatedTask : t)));
        toast.success('Task updated successfully!');
        onTaskUpdated?.(); // Call the callback if provided
      } catch (error) {
        console.error('Error updating task:', error);
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
          // Add the new task to the tasks state
          setTasks([...tasks, newTask]);
          toast.success('Task added successfully!');
          // Clear the form fields
          setTitle('');
          setDescription('');
          setStatus('to-do');
          setAssignee('');
          setDueDate('');
          setProjectId('');
          onTaskUpdated?.(); // Call the callback if provided
        } else {
          toast.error('Failed to add task. See console for details.');
        }
      } catch (error) {
        console.error('Error adding task:', error);
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
            <SelectItem value="" label="No Project">
              No Project
            </SelectItem>
            {projects.map((project) => (
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
        {initialTask && onTaskUpdated && (
          <Button
            type="button"
            variant="outline"
            onClick={onTaskUpdated}
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
