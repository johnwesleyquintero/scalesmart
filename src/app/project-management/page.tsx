'use client';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, Plus, X } from 'lucide-react';
import { useState } from 'react';

type Task = {
  id: string;
  title: string;
  description: string;
  status: 'todo' | 'in-progress' | 'done';
  dueDate?: string;
  assignee?: string;
};

type Column = {
  id: 'todo' | 'in-progress' | 'done';
  title: string;
  color: string;
};

export default function ProjectManagement() {
  const [tasks, setTasks] = useState<Task[]>([
    {
      id: '1',
      title: 'Design homepage',
      description: 'Create wireframes and mockups for the new homepage',
      status: 'todo',
      dueDate: '2023-11-15',
    },
    {
      id: '2',
      title: 'API integration',
      description: 'Connect frontend to the new customer API',
      status: 'in-progress',
      assignee: 'Alex',
    },
    {
      id: '3',
      title: 'User testing',
      description: 'Conduct usability tests with 5 participants',
      status: 'done',
    },
    {
      id: '4',
      title: 'Content writing',
      description: 'Write product descriptions for all items',
      status: 'todo',
      dueDate: '2023-11-20',
    },
  ]);

  const [newTask, setNewTask] = useState<Omit<Task, 'id'>>({
    title: '',
    description: '',
    status: 'todo',
  });
  const [showAddForm, setShowAddForm] = useState(false);
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);

  const columns: Column[] = [
    { id: 'todo', title: 'To Do', color: 'bg-blue-100' },
    { id: 'in-progress', title: 'In Progress', color: 'bg-yellow-100' },
    { id: 'done', title: 'Done', color: 'bg-green-100' },
  ];

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.title) return;

    const task: Task = {
      ...newTask,
      id: Date.now().toString(),
    };
    setTasks([...tasks, task]);
    setNewTask({
      title: '',
      description: '',
      status: 'todo',
    });
    setShowAddForm(false);
  };

  const handleDragStart = (task: Task) => {
    setDraggedTask(task);
  };

  const handleDrop = (status: 'todo' | 'in-progress' | 'done') => {
    if (!draggedTask) return;

    const updatedTasks = tasks.map((t) =>
      t.id === draggedTask.id ? { ...t, status } : t,
    );
    setTasks(updatedTasks);
    setDraggedTask(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const deleteTask = (id: string) => {
    setTasks(tasks.filter((task) => task.id !== id));
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Project Board</h1>
          <Button onClick={() => setShowAddForm(true)}>
            <Plus className="mr-2 h-4 w-4" /> Add Task
          </Button>
        </div>

        {showAddForm && (
          <Card className="mb-6">
            <CardHeader className="flex flex-row justify-between items-center">
              <CardTitle>Add New Task</CardTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowAddForm(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddTask} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Title *
                  </label>
                  <input
                    type="text"
                    className="w-full p-2 border rounded"
                    value={newTask.title}
                    onChange={(e) =>
                      setNewTask({ ...newTask, title: e.target.value })
                    }
                    placeholder="Task title"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Description
                  </label>
                  <textarea
                    className="w-full p-2 border rounded"
                    rows={3}
                    value={newTask.description}
                    onChange={(e) =>
                      setNewTask({ ...newTask, description: e.target.value })
                    }
                    placeholder="Task description"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Status
                    </label>
                    <select
                      className="w-full p-2 border rounded"
                      value={newTask.status}
                      onChange={(e) =>
                        setNewTask({
                          ...newTask,
                          // eslint-disable-next-line @typescript-eslint/no-explicit-any
                          status: e.target.value as any,
                        })
                      }
                    >
                      <option value="todo">To Do</option>
                      <option value="in-progress">In Progress</option>
                      <option value="done">Done</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Due Date
                    </label>
                    <input
                      type="date"
                      className="w-full p-2 border rounded"
                      value={newTask.dueDate || ''}
                      onChange={(e) =>
                        setNewTask({ ...newTask, dueDate: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button type="submit">
                    <Check className="mr-2 h-4 w-4" /> Add Task
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {columns.map((column) => (
            <div
              key={column.id}
              className={`rounded-lg p-4 ${column.color}`}
              onDrop={() => handleDrop(column.id)}
              onDragOver={handleDragOver}
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="font-semibold text-lg">{column.title}</h2>
                <span className="bg-white px-2 py-1 rounded-full text-sm">
                  {tasks.filter((t) => t.status === column.id).length}
                </span>
              </div>

              <div className="space-y-3">
                {tasks
                  .filter((task) => task.status === column.id)
                  .map((task) => (
                    <Card
                      key={task.id}
                      draggable
                      onDragStart={() => handleDragStart(task)}
                      className="cursor-move hover:shadow-md transition-shadow"
                    >
                      <CardHeader className="flex flex-row justify-between items-start p-4">
                        <div>
                          <h3 className="font-medium">{task.title}</h3>
                          {task.description && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {task.description}
                            </p>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => deleteTask(task.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </CardHeader>
                      <CardContent className="p-4 pt-0">
                        <div className="flex justify-between items-center text-sm">
                          {task.dueDate && (
                            <span className="inline-flex items-center">
                              <Calendar className="h-4 w-4 mr-1" />
                              {new Date(task.dueDate).toLocaleDateString()}
                            </span>
                          )}
                          {task.assignee && (
                            <span className="bg-gray-200 px-2 py-1 rounded-full">
                              {task.assignee}
                            </span>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
