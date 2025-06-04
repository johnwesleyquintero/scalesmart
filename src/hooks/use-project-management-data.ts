import { useState, useEffect, useCallback } from 'react';
import {
  Task,
  Project,
  getAllTasks,
  getAllProjects,
  updateTask,
} from '@/lib/indexeddb-service';
import { DragEndEvent } from '@dnd-kit/core';

export const useProjectManagementData = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const allTasks = await getAllTasks();
      setTasks(allTasks);
      const allProjects = await getAllProjects();
      setProjects(allProjects);
    };

    fetchData();
  }, []);

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;

      if (active.id && over?.id) {
        const draggedTaskId = String(active.id);
        const newStatus = String(over.id);

        const taskToUpdate = tasks.find((task) => task.id === draggedTaskId);
        if (taskToUpdate && taskToUpdate.status !== newStatus) {
          const updatedTask = { ...taskToUpdate, status: newStatus };
          await updateTask(updatedTask);

          setTasks((prevTasks) =>
            prevTasks.map((task) =>
              task.id === draggedTaskId ? updatedTask : task,
            ),
          );
        }
      }
    },
    [tasks],
  );

  return {
    tasks,
    setTasks,
    projects,
    setProjects,
    handleDragEnd,
  };
};
