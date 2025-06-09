import { useState, useEffect } from 'react';
import {
  Task,
  Project,
  getAllTasks,
  getAllProjects,
} from '@/lib/indexeddb-service';
import { toast } from 'sonner';

interface UseTaskManagementDataReturn {
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  projects: Project[];
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
  isLoading: boolean;
  error: string | null;
}

export const useTaskManagementData = (): UseTaskManagementDataReturn => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const loadedTasks = await getAllTasks();
        const loadedProjects = await getAllProjects();
        // Sort tasks by order for consistent display within columns
        setTasks(loadedTasks.sort((a, b) => (a.order || 0) - (b.order || 0)));
        setProjects(loadedProjects);
      } catch (err) {
        console.error('Failed to load initial data:', err);
        setError('Failed to load data. Please refresh the page.');
        toast.error(
          `Failed to load project management data: ${(err as Error).message}`,
        );
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  return { tasks, setTasks, projects, setProjects, isLoading, error };
};
