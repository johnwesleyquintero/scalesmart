'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'; // Corrected: Use import type for type-only imports
import { format } from 'date-fns'; // <--- IMPORT format HERE
import { Calendar as CalendarIcon, Check, Edit, Plus, X } from 'lucide-react';
import { useEffect, useState } from 'react';

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
  const [tasks, setTasks] = useState<Task[]>(() => {
    if (typeof window !== 'undefined') {
      const storedTasks = localStorage.getItem('projectTasks');
      if (storedTasks) {
        try {
          return JSON.parse(storedTasks);
        } catch (error) {
          console.error('Error parsing tasks from localStorage:', error);
          // Fallback to default tasks if parsing fails
        }
      }
    }
    // Default tasks if nothing in localStorage or if SSR/parsing error
    return [
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
      // Add other default tasks if needed
    ];
  });

  const [newTask, setNewTask] = useState<Omit<Task, 'id'>>({
    title: '',
    description: '',
    status: 'todo',
  });
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [isOver, setIsOver] = useState<string | null>(null);

  // Effect to save tasks to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('projectTasks', JSON.stringify(tasks));
  }, [tasks]);

  const columns: Column[] = [
    { id: 'todo', title: 'To Do', color: 'bg-blue-100' },
    { id: 'in-progress', title: 'In Progress', color: 'bg-yellow-100' },
    { id: 'done', title: 'Done', color: 'bg-green-100' },
  ];

  const handleAddTask = (e: React.FormEvent<HTMLFormElement>) => {
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

  function openEditModal(task: Task) {
    setEditTask(task);
    setShowEditModal(true);
  }

  function closeEditModal() {
    setShowEditModal(false);
    setEditTask(null);
  }

  function updateTask(updatedTask: Task) {
    const updatedTasks = tasks.map((task) =>
      task.id === updatedTask.id ? updatedTask : task,
    );
    setTasks(updatedTasks);
    closeEditModal();
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {' '}
        {/* Added space-y-6 for overall spacing */}
        <div className="text-center">
          {' '}
          {/* Centered title block */}
          <h1 className="text-3xl font-bold my-6">Project Board</h1>{' '}
          {/* Standardized title */}
          <p className="text-lg text-muted-foreground">
            Organize, track, and manage your projects and tasks using a simple
            board view.
          </p>
        </div>
        <div className="flex justify-end">
          {' '}
          {/* Button group */}
          <div className="flex justify-end w-full">
            <Button onClick={() => setShowAddForm(true)} aria-label="Add Task">
              <Plus className="mr-2 h-4 w-4" /> Add Task
            </Button>
          </div>
        </div>
        {showAddForm && (
          <Card className="mb-6">
            <CardHeader className="flex flex-row justify-between items-center">
              <CardTitle>Add New Task</CardTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowAddForm(false)}
                aria-label="Close Add Task Form"
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
                      setNewTask({
                        ...newTask,
                        title: e.target.value as string,
                      })
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
                      setNewTask({
                        ...newTask,
                        description: e.target.value as string,
                      })
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
                          status: e.target.value as
                            | 'todo'
                            | 'in-progress'
                            | 'done',
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
                      onChange={(e) => {
                        const value = e.target.value;
                        // Basic date validation
                        if (!value || /^\d{4}-\d{2}-\d{2}$/.test(value)) {
                          setNewTask({
                            ...newTask,
                            dueDate: value,
                          });
                        } else {
                          alert('Invalid date format. Please use YYYY-MM-DD.');
                        }
                      }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Assignee
                    </label>
                    <input
                      type="text"
                      className="w-full p-2 border rounded"
                      value={newTask.assignee || ''}
                      onChange={(e) =>
                        setNewTask({
                          ...newTask,
                          assignee: e.target.value as string,
                        })
                      }
                      placeholder="Assignee"
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
              className={`rounded-lg p-4 bg-background ${
                isOver === column.id ? 'bg-opacity-50' : ''
              }`}
              onDrop={() => handleDrop(column.id)}
              onDragOver={handleDragOver}
              onDragEnter={() => setIsOver(column.id)}
              onDragLeave={() => setIsOver(null)}
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="font-semibold text-lg">{column.title}</h2>
                <span className="bg-white px-2 py-1 rounded-full text-sm">
                  {tasks.filter((t) => t.status === column.id).length}
                </span>
              </div>

              <div className="space-y-3">
                {tasks.filter((task) => task.status === column.id).length ===
                0 ? (
                  <p className="text-gray-500">No tasks here yet</p>
                ) : (
                  tasks
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
                            aria-label={`Delete task ${task.title}`}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => openEditModal(task)}
                            aria-label={`Edit task ${task.title}`}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                          <div className="flex justify-between items-center text-sm">
                            {task.dueDate && (
                              <span className="inline-flex items-center">
                                <CalendarIcon className="h-4 w-4 mr-1" />
                                {task.dueDate &&
                                  format(new Date(task.dueDate), 'PPP')}
                              </span>
                            )}
                            {task.assignee && (
                              <span className="bg-secondary px-2 py-1 rounded-full">
                                {task.assignee}
                              </span>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
      {showEditModal && editTask && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Edit Task
              </h3>
              <div className="mt-2">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (editTask) {
                      updateTask(editTask);
                    }
                  }}
                  className="space-y-4"
                >
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Title *
                    </label>
                    <input
                      type="text"
                      className="w-full p-2 border rounded"
                      value={editTask?.title || ''}
                      onChange={(e) =>
                        setEditTask({
                          ...editTask,
                          title: e.target.value,
                        } as Task)
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
                      value={editTask?.description || ''}
                      onChange={(e) =>
                        setEditTask({
                          ...editTask,
                          description: e.target.value,
                        } as Task)
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
                        value={editTask?.status || 'todo'}
                        onChange={(e) =>
                          setEditTask({
                            ...editTask,
                            status: e.target.value as
                              | 'todo'
                              | 'in-progress'
                              | 'done',
                          } as Task)
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
                        value={editTask?.dueDate || ''}
                        onChange={(e) => {
                          const value = e.target.value;
                          // Basic date validation
                          if (!value || /^\d{4}-\d{2}-\d{2}$/.test(value)) {
                            setEditTask({
                              ...editTask,
                              dueDate: value,
                            } as Task);
                          } else {
                            alert(
                              'Invalid date format. Please use YYYY-MM-DD.',
                            );
                          }
                        }}
                      />
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <Button onClick={closeEditModal} variant="ghost">
                      Cancel
                    </Button>
                    <Button type="submit">Update Task</Button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
