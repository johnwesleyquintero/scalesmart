// src/app/project-management/components/TaskManagementSection.tsx
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import TaskList from '@/app/project-management/components/TaskList';
import TaskForm from '@/app/project-management/components/TaskForm';
import { Task, Project } from '@/lib/indexeddb-service';
import {
  DndContext,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { TASK_STATUSES } from '@/lib/constants/project-management';
import { TaskStatus } from '@/types/indexeddb';

interface TaskManagementSectionProps {
  filteredTasks: Task[];
  projects: Project[];
  allTasks: Task[]; // Pass all tasks for TaskForm
  selectedProject: string;
  setSelectedProject: (projectId: string) => void;
  NO_PROJECT_VALUE: string;
  handleUpdateTask: (task: Task) => Promise<void>;
  handleDeleteTask: (taskId: string) => Promise<void>;
  handleViewTaskDetails: (task: Task) => void;
  handleCreateTask: (
    taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'comments'>,
  ) => Promise<Task | undefined>;
  handleDragEnd: (event: DragEndEvent) => void;
}

const TaskManagementSection: React.FC<TaskManagementSectionProps> = ({
  filteredTasks,
  projects,
  allTasks,
  selectedProject,
  setSelectedProject,
  NO_PROJECT_VALUE,
  handleUpdateTask,
  handleDeleteTask,
  handleViewTaskDetails,
  handleCreateTask,
  handleDragEnd,
}) => {
  // Dnd-kit sensors - Keep sensors here as DndContext is here
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  return (
    <div className="space-y-4 mt-4">
      {/* Project Filter */}
      <div className="mb-4">
        <label htmlFor="project-filter" className="sr-only">
          Filter by Project
        </label>
        <select
          id="project-filter"
          value={selectedProject}
          onChange={(e) => setSelectedProject(e.target.value)}
          className="block w-full md:w-1/3 lg:w-1/4 p-2 border border-input rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground"
        >
          <option value={NO_PROJECT_VALUE}>All Projects</option>
          {projects.map((project: Project) => (
            <option key={project.id} value={project.id}>
              {project.name}
            </option>
          ))}
        </select>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Render TaskList for each status */}
          {TASK_STATUSES.map((statusConfig) => {
            const tasksForStatus = filteredTasks.filter(
              (task) => task.status === statusConfig.id,
            );
            return (
              <TaskList
                key={statusConfig.id}
                id={statusConfig.id}
                title={statusConfig.title}
                tasks={tasksForStatus}
                projects={projects}
                allTasks={allTasks} // Pass all tasks down
                onTaskPersist={handleUpdateTask}
                onDeleteTask={handleDeleteTask}
                onViewTaskDetails={handleViewTaskDetails}
              />
            );
          })}
        </div>
      </DndContext>
      <div className="flex flex-col gap-6 lg:flex-row">
        <div className="flex flex-col gap-6 flex-1">
          {/* Card for adding new tasks */}
          <Card className="flex-1">
            <CardHeader>
              <CardTitle className="text-foreground">Add New Task</CardTitle>
            </CardHeader>
            <CardContent>
              {/* TaskForm component for creating new tasks */}
              <TaskForm
                projects={projects}
                onCreateTask={handleCreateTask}
                allTasks={allTasks} // Pass all tasks down
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default React.memo(TaskManagementSection);
