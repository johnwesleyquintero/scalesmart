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
    <div>
      <h1>WesSync Tasks</h1>
      <TaskForm setTasks={setTasks} tasks={tasks} />
      <TaskList tasks={tasks} setTasks={setTasks} />
    </div>
  );
};

export default ProjectManagementPage;
