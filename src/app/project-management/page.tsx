// src/app/project-management/page.tsx
'use client';

import TaskList from '@/app/project-management/components/TaskList';
import TaskForm from '@/app/project-management/components/TaskForm';
import { useState, useEffect } from 'react';
import { Task } from '@/lib/indexeddb-service';
import { getAllTasks } from '@/lib/indexeddb-service';

const ProjectManagementPage = () => {
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    const fetchTasks = async () => {
      const allTasks = await getAllTasks();
      setTasks(allTasks);
    };

    fetchTasks();
  }, []);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold text-center my-6">WesSync Tasks</h1>
      <div className="bg-white shadow-md rounded-lg p-6 mb-8">
        <h2 className="text-2xl font-semibold mb-4">Add New Task</h2>
        <TaskForm setTasks={setTasks} tasks={tasks} />
      </div>
      <TaskList tasks={tasks} setTasks={setTasks} />
    </div>
  );
};

export default ProjectManagementPage;
