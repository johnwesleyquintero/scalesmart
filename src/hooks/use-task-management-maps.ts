import { useMemo } from 'react';
import { Task, Project } from '@/lib/indexeddb-service';

interface UseTaskManagementMapsReturn {
  projectsMap: Map<string, Project>;
  allTasksMap: Map<string, Task>;
}

interface UseTaskManagementMapsProps {
  projects: Project[];
  allTasks: Task[];
}

export const useTaskManagementMaps = ({
  projects,
  allTasks,
}: UseTaskManagementMapsProps): UseTaskManagementMapsReturn => {
  const projectsMap = useMemo(() => {
    const map = new Map<string, Project>();
    projects.forEach((project) => {
      if (project.id) {
        map.set(project.id, project);
      }
    });
    return map;
  }, [projects]);

  const allTasksMap = useMemo(() => {
    const map = new Map<string, Task>();
    allTasks.forEach((task) => {
      if (task.id) {
        map.set(task.id, task);
      }
    });
    return map;
  }, [allTasks]);

  return { projectsMap, allTasksMap };
};
