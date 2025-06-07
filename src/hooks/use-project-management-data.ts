import { useState, useEffect } from 'react';
import React from 'react'; // Import React to use React.Dispatch and React.SetStateAction
import {
  Task,
  Project,
  getAllTasks,
  getAllProjects,
} from '@/lib/indexeddb/project-management-db';
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

  return {
    tasks,
    setTasks,
    projects,
    setProjects,
    loading, // Expose loading state
    error, // Expose error state
  };
};
