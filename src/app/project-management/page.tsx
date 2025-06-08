// src/app/project-management/page.tsx
'use client';

// Import necessary React and UI components
import React, { useState, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Import custom components and hooks
import TaskList from '@/app/project-management/components/TaskList';
import TaskForm from '@/app/project-management/components/TaskForm';
import ProjectForm from '@/app/project-management/components/ProjectForm';
import ProjectList from '@/app/project-management/components/ProjectList';
import { useTaskManagement } from '@/hooks/use-task-management'; // Import the new hook
import { Task } from '@/lib/indexeddb-service';
import { ErrorBoundary } from '@/components/error-boundary';
import TaskDetails from '@/app/project-management/components/TaskDetails'; // Import TaskDetails
import { Dialog, DialogContent } from '@/components/ui/dialog'; // Import Dialog components

// Import Dnd-kit components and hooks
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
import { Project } from '@/lib/indexeddb-service'; // Import Project type
import {
  TASK_STATUSES,
  NO_PROJECT_VALUE,
} from '@/lib/constants/project-management'; // Import from new constants file
import { TaskStatus } from '@/types/indexeddb';

/**
 * @component ProjectManagementPage
 * @brief The main page component for the Project Management Dashboard.
 *
 * This component orchestrates the display and interaction of project and task management
 * features. It uses Dnd-kit for drag-and-drop functionality, organizes content into tabs,
 * and integrates various sub-components for forms and lists.
 * It relies on the `useTaskManagement` hook for state management and data operations.
 *
 * @returns {JSX.Element} The ProjectManagementPage component.
 */
const ProjectManagementPage = () => {
  // Use the custom hook for project management data and handlers
  const {
    tasks,
    setTasks,
    projects,
    setProjects,
    isLoading,
    error,
    handleUpdateTask, // Destructure the handler for persisting updates
    handleDragEnd,
    handleCreateTask,
    handleDeleteTask,
    handleCreateProject,
    handleUpdateProject,
    handleDeleteProject,
  } = useTaskManagement();

  const [selectedProject, setSelectedProject] =
    useState<string>(NO_PROJECT_VALUE); // State to manage selected project filter, initialized to NO_PROJECT_VALUE
  const [isTaskDetailsModalOpen, setIsTaskDetailsModalOpen] = useState(false);
  const [selectedTaskForDetails, setSelectedTaskForDetails] =
    useState<Task | null>(null);

  // Dnd-kit sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  /**
   * @brief Memoizes the filtered task list based on the `selectedProject`.
   *
   * This ensures that the task list is only re-filtered when `tasks` or `selectedProject` changes,
   * optimizing performance by avoiding unnecessary re-renders of `TaskList` components.
   *
   * @returns {Task[]} The array of tasks filtered by the currently selected project.
   */
  const filteredTasks = useMemo(() => {
    if (selectedProject === NO_PROJECT_VALUE) {
      return tasks;
    }
    return tasks.filter((task) => task.projectId === selectedProject);
  }, [tasks, selectedProject]);

  const handleViewTaskDetails = useCallback((task: Task) => {
    setSelectedTaskForDetails(task);
    setIsTaskDetailsModalOpen(true);
  }, []);

  const handleCloseTaskDetailsModal = useCallback(() => {
    setIsTaskDetailsModalOpen(false);
    setSelectedTaskForDetails(null);
  }, []);

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 text-center text-foreground">
        Loading project data...
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4 text-center text-destructive">
        Error: {error}
      </div>
    );
  }

  return (
    <ErrorBoundary>
      {' '}
      {/* Ensures graceful handling of rendering errors within the component tree */}
      <div className="container mx-auto p-4">
        {/* Page Title and Description */}
        <h1 className="text-3xl font-bold text-center my-6 text-foreground">
          Project Dashboard
        </h1>
        <p className="text-lg text-muted-foreground text-center mb-8">
          Manage your projects and tasks efficiently.
        </p>

        {/* Tabs for switching between Task and Project management */}
        <Tabs defaultValue="tasks" className="w-full">
          <TabsList className="mb-4 flex flex-wrap h-auto justify-start bg-muted">
            {/* Tab Trigger for Tasks */}
            <TabsTrigger
              value="tasks"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-muted-foreground"
            >
              Tasks
            </TabsTrigger>
            {/* Tab Trigger for Projects */}
            <TabsTrigger
              value="projects"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-muted-foreground"
            >
              Projects
            </TabsTrigger>
          </TabsList>

          {/* Content for the Tasks Tab */}
          <TabsContent value="tasks" className="space-y-4 mt-4">
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
                      allTasks={tasks}
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
                    <CardTitle className="text-foreground">
                      Add New Task
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {/* TaskForm component for creating new tasks */}
                    <TaskForm
                      projects={projects}
                      onCreateTask={handleCreateTask} // Use handleCreateTask from hook
                      allTasks={tasks}
                    />
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Content for the Projects Tab */}
          <TabsContent value="projects" className="space-y-4 mt-4">
            <div className="flex flex-col gap-6 lg:flex-row">
              <div className="flex flex-col gap-6 flex-1">
                {/* Card for adding new projects */}
                <Card className="flex-1">
                  <CardHeader>
                    <CardTitle className="text-foreground">
                      Add New Project
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {/* ProjectForm component for creating new projects */}
                    <ProjectForm onCreateProject={handleCreateProject} />
                  </CardContent>
                </Card>

                {/* Card for displaying the list of projects */}
                <Card className="flex-1">
                  <CardHeader>
                    <CardTitle className="text-foreground">
                      Project List
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {/* ProjectList component for displaying and managing projects */}
                    <ProjectList
                      projects={projects}
                      onDeleteProject={handleDeleteProject}
                      onUpdateProject={handleUpdateProject} // Pass update handler
                    />
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Task Details Modal */}
        {selectedTaskForDetails && (
          <Dialog
            open={isTaskDetailsModalOpen}
            onOpenChange={setIsTaskDetailsModalOpen}
          >
            <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
              <TaskDetails
                task={selectedTaskForDetails}
                projects={projects}
                allTasks={tasks}
                onTaskPersist={handleUpdateTask} // Pass handleUpdateTask for persistence
                onDeleteTask={handleDeleteTask} // Pass handleDeleteTask for deletion
                onClose={handleCloseTaskDetailsModal}
              />
            </DialogContent>
          </Dialog>
        )}
      </div>
    </ErrorBoundary>
  );
};

export default ProjectManagementPage;
