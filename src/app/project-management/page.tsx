'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import {
  CalendarDays,
  Check,
  Download,
  Plus,
  Trash2,
  X,
  Edit,
} from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { useLocalStorage } from '../../hooks/use-local-storage';

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

const COLUMNS: Column[] = [
  { id: 'todo', title: 'To Do', color: 'bg-blue-100' },
  { id: 'in-progress', title: 'In Progress', color: 'bg-yellow-100' },
  { id: 'done', title: 'Done', color: 'bg-green-100' },
];

const LOCAL_STORAGE_KEY = 'projectManagementTasks_v2';

const DEFAULT_TASKS: Task[] = [
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
];

export default function ProjectManagement() {
  const [newTask, setNewTask] = useState<Omit<Task, 'id'>>({
    title: '',
    description: '',
    status: 'todo',
    dueDate: '', // Ensure all fields are initialized
  });
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingTask, setEditingTask] = useState<string | null>(null);
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [editTaskData, setEditTaskData] = useState<Omit<Task, 'id'>>({
    title: '',
    description: '',
    status: 'todo',
    dueDate: '', // Ensure all fields are initialized
  });
  const [searchTerm, setSearchTerm] = useState('');

  const [tasks, setTasks] = useLocalStorage<Task[]>(
    LOCAL_STORAGE_KEY,
    DEFAULT_TASKS,
    DEFAULT_TASKS, // Provide the third argument for serverInitial
  );

  const escapeCSVField = (field: string | undefined | null): string => {
    if (field === undefined || field === null) {
      return '';
    }
    let str = String(field);
    // If the field contains a comma, newline, or double quote, enclose it in double quotes.
    if (str.includes(',') || str.includes('\n') || str.includes('"')) {
      // Escape existing double quotes by doubling them
      str = str.replace(/"/g, '""');
      return `"${str}"`;
    }
    return str;
  };

  const exportTasksToCSV = () => {
    if ((tasks ?? []).length === 0) {
      alert('No tasks to export.');
      return;
    }

    const headers = [
      'ID',
      'Title',
      'Description',
      'Status',
      'Due Date',
      'Assignee',
    ];
    const csvRows = [
      headers.join(','), // Header row
      ...(tasks ?? []).map((task: Task) =>
        [
          escapeCSVField(task.id),
          escapeCSVField(task.title),
          escapeCSVField(task.description),
          escapeCSVField(task.status),
          escapeCSVField(task.dueDate),
          escapeCSVField(task.assignee),
        ].join(','),
      ),
    ];
    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      // Feature detection
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', 'project_tasks.csv');
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.title) {
      alert('Title is required');
      return;
    }

    const task: Task = {
      ...newTask,
      id: crypto.randomUUID(),
    };
    setTasks([...(tasks ?? []), task]);
    setNewTask({
      title: '',
      description: '',
      status: 'todo',
      dueDate: '', // Reset all fields
    });
    setShowAddForm(false);
  };

  const handleDragStart = (task: Task) => {
    setDraggedTask(task);
  };

  const handleDrop = (status: 'todo' | 'in-progress' | 'done') => {
    if (!draggedTask) return;

    const updatedTasks = (tasks ?? []).map((t: Task) =>
      t.id === draggedTask.id ? { ...t, status } : t,
    );
    setTasks(updatedTasks);
    setDraggedTask(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const deleteTask = (id: string) => {
    setTasks((tasks ?? []).filter((task: Task) => task.id !== id));
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTask) return;

    const updatedTasks = (tasks ?? []).map((task) =>
      task.id === editingTask ? { ...task, ...editTaskData } : task,
    );
    setTasks(updatedTasks);
    setEditingTask(null);
  };

  const [filteredTasks, setFilteredTasks] = useState(tasks);

  useEffect(() => {
    if (tasks) {
      const filtered = tasks.filter(
        (task) =>
          task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (task.description &&
            task.description.toLowerCase().includes(searchTerm.toLowerCase())),
      );
      setFilteredTasks(filtered);
    }
  }, [tasks, searchTerm]);

  const clearAllTasks = () => {
    if (
      window.confirm(
        'Are you sure you want to delete all tasks? This cannot be undone.',
      )
    ) {
      setTasks([]); // This will also trigger the useEffect to save the empty array to localStorage
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Centered Title and Description */}
        <h1 className="text-3xl font-bold my-6 text-center">Project Board</h1>
        <p className="text-lg text-muted-foreground text-center mb-8">
          Organize your projects, track tasks, and manage deadlines effectively
          with this Kanban-style board.
        </p>

        {/* Search Input */}
        <div className="mb-4">
          <input
            type="text"
            placeholder="Search tasks..."
            className="w-full p-2 border rounded"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Action Buttons - aligned to the right */}
        <div className="flex justify-end items-center mb-6">
          <div className="flex gap-2">
            <Button onClick={() => setShowAddForm(true)}>
              <Plus className="mr-2 h-4 w-4" /> Add Task
            </Button>
            <Button
              variant="destructive"
              onClick={clearAllTasks}
              title="Clear all tasks"
            >
              <Trash2 className="mr-2 h-4 w-4" /> Clear All
            </Button>
            <Button
              variant="outline"
              onClick={exportTasksToCSV}
              title="Export tasks to CSV"
            >
              <Download className="mr-2 h-4 w-4" /> Export CSV
            </Button>
          </div>
        </div>

        {showAddForm && (
          <Card className="mb-6">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Add New Task</CardTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowAddForm(false)}
                aria-label="Close add task form"
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
                          status: e.target.value as Task['status'],
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
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Assignee
                  </label>
                  <input
                    type="text"
                    className="w-full p-2 border rounded"
                    value={newTask.assignee || ''}
                    onChange={(e) =>
                      setNewTask({ ...newTask, assignee: e.target.value })
                    }
                    placeholder="Assignee"
                  />
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

        {editingTask && (
          <Card className="mb-6">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Edit Task</CardTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setEditingTask(null)}
                aria-label="Close edit task form"
              >
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveEdit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Title *
                  </label>
                  <input
                    type="text"
                    className="w-full p-2 border rounded"
                    value={editTaskData.title}
                    onChange={(e) =>
                      setEditTaskData({
                        ...editTaskData,
                        title: e.target.value,
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
                    value={editTaskData.description}
                    onChange={(e) =>
                      setEditTaskData({
                        ...editTaskData,
                        description: e.target.value,
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
                      value={editTaskData.status}
                      onChange={(e) =>
                        setEditTaskData({
                          ...editTaskData,
                          status: e.target.value as Task['status'],
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
                      value={editTaskData.dueDate || ''}
                      onChange={(e) =>
                        setEditTaskData({
                          ...editTaskData,
                          dueDate: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Assignee
                  </label>
                  <input
                    type="text"
                    className="w-full p-2 border rounded"
                    value={editTaskData.assignee || ''}
                    onChange={(e) =>
                      setEditTaskData({
                        ...editTaskData,
                        assignee: e.target.value,
                      })
                    }
                    placeholder="Assignee"
                  />
                </div>
                <div className="flex justify-end">
                  <Button type="submit">
                    <Check className="mr-2 h-4 w-4" /> Save Task
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {COLUMNS.map((column) => (
            <div
              key={column.id}
              className={`rounded-lg p-4 ${column.color}`}
              onDrop={() => handleDrop(column.id)}
              onDragOver={handleDragOver}
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="font-semibold text-lg">{column.title}</h2>
                <span className="bg-white px-2 py-1 rounded-full text-sm">
                  {
                    (filteredTasks ?? []).filter(
                      (t: Task) => t.status === column.id,
                    ).length
                  }
                </span>
              </div>

              <div className="space-y-3">
                {(filteredTasks ?? [])
                  .filter((task: Task) => task.status === column.id)
                  .map((task: Task) => (
                    <Card
                      key={task.id}
                      draggable
                      onDragStart={() => handleDragStart(task)}
                      className="cursor-move hover:shadow-md transition-shadow"
                    >
                      <CardHeader className="p-3 pb-2">
                        {' '}
                        {/* Adjusted padding */}
                        <div className="flex justify-between items-start">
                          <CardTitle className="text-base font-semibold">
                            {' '}
                            {/* Adjusted font size */}
                            {task.title}
                          </CardTitle>
                          <div className="flex items-center -mt-1 -mr-1">
                            {' '}
                            {/* Adjusted margins for icon buttons */}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7" // Smaller icon buttons
                              onClick={() => {
                                setEditingTask(task.id);
                                setEditTaskData({
                                  title: task.title,
                                  description: task.description,
                                  status: task.status,
                                  dueDate: task.dueDate,
                                  assignee: task.assignee,
                                });
                              }}
                              aria-label="Edit task"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7" // Smaller icon buttons
                              onClick={() => deleteTask(task.id)}
                              aria-label="Delete task"
                            >
                              <X className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="p-3 pt-0 pb-2 text-sm">
                        {' '}
                        {/* Adjusted padding */}
                        {task.description && (
                          <p className="text-muted-foreground mb-2 break-words">
                            {task.description}
                          </p>
                        )}
                        {task.dueDate && (
                          <div className="flex items-center text-xs text-muted-foreground">
                            <CalendarDays className="h-3.5 w-3.5 mr-1" />
                            <span>
                              {new Date(task.dueDate).toLocaleDateString(
                                'en-US',
                              )}
                            </span>
                          </div>
                        )}
                      </CardContent>
                      {task.assignee && (
                        <CardFooter className="p-3 pt-0 text-xs">
                          <span className="bg-gray-200 px-1.5 py-0.5 rounded-full text-gray-700">
                            {task.assignee}
                          </span>
                        </CardFooter>
                      )}
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
