// src/app/project-management/components/TaskList.tsx
'use client';

import { Task } from '@/lib/indexeddb-service';
import { deleteTask } from '@/lib/indexeddb-service';
import TaskForm from './TaskForm';
import { useState } from 'react';

interface TaskListProps {
  tasks: Task[];
  setTasks: (tasks: Task[]) => void;
}

const TaskList = ({ tasks, setTasks }: TaskListProps) => {
  console.log('TaskList tasks prop:', tasks);
  const taskPropLog = 'TaskList tasks prop:';
  console.log(taskPropLog, tasks);
  const handleDeleteTask = async (id: string) => {
    await deleteTask(id);
    setTasks(tasks.filter((task) => task.id !== id));
  };

  const todoTasks = tasks.filter((task) => task.status === 'to-do');
  const inProgressTasks = tasks.filter((task) => task.status === 'in-progress');
  const completedTasks = tasks.filter((task) => task.status === 'completed');

  return (
    <div>
      <h2>To Do</h2>
      <ul>
        {todoTasks.map((task) => (
          <li key={task.id}>
            {task.title} - {task.assignee}
            <button onClick={() => handleDeleteTask(task.id)}>Delete</button>
            <TaskForm task={task} setTasks={setTasks} tasks={tasks} />
          </li>
        ))}
      </ul>

      <h2>In Progress</h2>
      <ul>
        {inProgressTasks.map((task) => (
          <li key={task.id}>
            {task.title} - {task.assignee}
            <button onClick={() => handleDeleteTask(task.id)}>Delete</button>
            <TaskForm task={task} setTasks={setTasks} tasks={tasks} />
          </li>
        ))}
      </ul>

      <h2>Completed</h2>
      <ul>
        {completedTasks.map((task) => (
          <li key={task.id}>
            {task.title} - {task.assignee}
            <button onClick={() => handleDeleteTask(task.id)}>Delete</button>
            <TaskForm task={task} setTasks={setTasks} tasks={tasks} />
          </li>
        ))}
      </ul>
    </div>
  );
};

export default TaskList;
