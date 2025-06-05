import { useState, useEffect, useCallback } from 'react';
import React from 'react'; // Import React to use React.Dispatch and React.SetStateAction
import {
  Task,
  Project,
  getAllTasks,
  getAllProjects,
  updateTask,
} from '@/lib/indexeddb-service';
import { DragEndEvent } from '@dnd-kit/core';
import { toast } from 'sonner'; // Import toast

export const useProjectManagementData = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true); // Add loading state
  const [error, setError] = useState<string | null>(null); // Add error state

  // Fetch tasks and projects on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true); // Set loading to true before fetching
        const allTasks = await getAllTasks();
        setTasks(allTasks);
        const allProjects = await getAllProjects();
        setProjects(allProjects);
      } catch (err) {
        console.error('Error fetching project management data:', err);
        setError('Failed to load data.'); // Set error state
        toast.error('Failed to load project management data.'); // Show error toast
      } finally {
        setLoading(false); // Set loading to false after fetching
      }
    };

    fetchData();
  }, []); // Empty dependency array means this effect runs only once on mount

  // Handle the end of a drag operation for tasks
  const handleDragEnd = useCallback(
    async (
      event: DragEndEvent,
      currentTasks: Task[],
      setCurrentTasks: React.Dispatch<React.SetStateAction<Task[]>>,
    ) => {
      const { active, over } = event;

      // If a draggable item is dropped over a droppable area
      if (active.id && over?.id) {
        const draggedTaskId = String(active.id);
        const newStatus = String(over.id);

        // Find the task that was dragged
        const taskToUpdate = currentTasks.find(
          (task) => task.id === draggedTaskId,
        );

        // If the task exists and its status has changed
        if (taskToUpdate && taskToUpdate.status !== newStatus) {
          const updatedTask = {
            ...taskToUpdate,
            status: newStatus,
            updateTimestamp: Date.now(),
          }; // Update status and timestamp
          try {
            await updateTask(updatedTask); // Update the task in IndexedDB
            // Update the tasks state with the new status
            setCurrentTasks(
              (
                prevTasks: Task[], // Explicitly type prevTasks
              ) =>
                prevTasks.map(
                  (
                    task: Task, // Explicitly type task
                  ) => (task.id === draggedTaskId ? updatedTask : task),
                ),
            );
            toast.success(
              `Task "${updatedTask.title}" moved to "${newStatus.replace('-', ' ')}".`,
            ); // Show success toast
          } catch (err) {
            console.error('Error updating task status:', err);
            toast.error('Failed to update task status.'); // Show error toast
            // Optionally, revert the UI change if the update fails
            setCurrentTasks(currentTasks);
          }
        }
      }
    },
    [], // Dependencies: tasks and setTasks are passed as arguments now
  );

  return {
    tasks,
    setTasks,
    projects,
    setProjects,
    handleDragEnd,
    loading, // Expose loading state
    error, // Expose error state
  };
};
