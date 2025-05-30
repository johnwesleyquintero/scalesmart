import { useState } from 'react';
import { Task } from '@/lib/indexeddb-service';
import { createTask, updateTask } from '@/lib/indexeddb-service';
import { Button } from '@/components/ui/button';

interface TaskFormProps {
  setTasks: (tasks: Task[]) => void;
  tasks: Task[];
  task?: Task;
  onTaskUpdated?: () => void;
}

const TaskForm = ({
  setTasks,
  tasks,
  task: initialTask,
  onTaskUpdated,
}: TaskFormProps) => {
  const [title, setTitle] = useState(initialTask?.title || '');
  const [description, setDescription] = useState(
    initialTask?.description || '',
  );
  const [status, setStatus] = useState(initialTask?.status || 'to-do');
  const [assignee, setAssignee] = useState(initialTask?.assignee || '');
  const [dueDate, setDueDate] = useState<Date | null>(
    initialTask?.dueDate ? new Date(initialTask.dueDate) : null,
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newTask: Task = {
      id: initialTask?.id || '',
      title,
      description,
      status,
      assignee,
      dueDate: dueDate ? dueDate.getTime() : undefined,
      projectId: '',
      creationTimestamp: initialTask?.creationTimestamp || Date.now(),
      updateTimestamp: Date.now(),
    };

    if (initialTask) {
      const updatedTask = await updateTask(newTask);
      const mapped = tasks.map((t) => (t.id === newTask.id ? newTask : t));
      setTasks(mapped);
    } else {
      const id = await createTask(newTask);
      if (id) {
        newTask.id = id;
        setTasks([...tasks, newTask]);
      }
    }

    setTitle('');
    setDescription('');
    setStatus('to-do');
    setAssignee('');
    setDueDate(null);
    onTaskUpdated?.();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input
        type="text"
        placeholder="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
        className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <textarea
        placeholder="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        rows={3}
      />
      <select
        value={status}
        onChange={(e) => setStatus(e.target.value)}
        className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="to-do">To Do</option>
        <option value="in-progress">In Progress</option>
        <option value="completed">Completed</option>
      </select>
      <input
        type="text"
        placeholder="Assignee"
        value={assignee}
        onChange={(e) => setAssignee(e.target.value)}
        className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <input
        type="date"
        value={dueDate ? dueDate.toISOString().split('T')[0] : ''}
        onChange={(e) => setDueDate(new Date(e.target.value))}
        className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <Button type="submit">{initialTask ? 'Update Task' : 'Add Task'}</Button>
    </form>
  );
};

export default TaskForm;
