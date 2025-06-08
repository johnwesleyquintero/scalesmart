// src/app/project-management/page.tsx
'use client';

// Import necessary React and UI components
import React, { useState, useMemo, useCallback } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Import custom components and hooks
import TaskManagementSection from '@/app/project-management/components/TaskManagementSection';
import ProjectManagementSection from '@/app/project-management/components/ProjectManagementSection';
import { useTaskManagement } from '@/hooks/use-task-management'; // Import the new hook
import { Task } from '@/lib/indexeddb-service';
import { ErrorBoundary } from '@/components/error-boundary';
import TaskDetails from '@/app/project-management/components/TaskDetails'; // Import TaskDetails
import { Dialog, DialogContent } from '@/components/ui/dialog'; // Import Dialog components

// Import types and constants
import { Project } from '@/lib/indexeddb-service'; // Import Project type
import { NO_PROJECT_VALUE } from '@/lib/constants/project-management'; // Import from new constants file

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
    projects,
    isLoading,
    error,
    handleUpdateTask,
    handleDragEnd,
    handleCreateTask,
    handleDeleteTask,
    handleCreateProject,
    handleUpdateProject,
    handleDeleteProject,
  } = useTaskManagement();

  // State to manage the selected project filter for tasks
  const [selectedProject, setSelectedProject] =
    useState<string>(NO_PROJECT_VALUE); // Initialized to NO_PROJECT_VALUE to show all tasks

  // State to manage the visibility and content of the Task Details modal
  const [isTaskDetailsModalOpen, setIsTaskDetailsModalOpen] = useState(false);
  const [selectedTaskForDetails, setSelectedTaskForDetails] =
    useState<Task | null>(null);

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

  /**
   * @brief Callback to open the Task Details modal and set the selected task.
   * @param task The task to display details for.
   */
  const handleViewTaskDetails = useCallback((task: Task) => {
    setSelectedTaskForDetails(task);
    setIsTaskDetailsModalOpen(true);
  }, []);

  /**
   * @brief Callback to close the Task Details modal and clear the selected task.
   */
  const handleCloseTaskDetailsModal = useCallback(() => {
    setIsTaskDetailsModalOpen(false);
    setSelectedTaskForDetails(null);
  }, []);

  // Display loading state while data is being fetched
  if (isLoading) {
    return (
      <div className="container mx-auto p-4 text-center text-foreground">
        Loading project data...
      </div>
    );
  }

  // Display error message if data loading fails
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
          {/* List of tab triggers */}
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
            {/* Render the Task Management Section component */}
            <TaskManagementSection
              filteredTasks={filteredTasks}
              projects={projects}
              allTasks={tasks}
              selectedProject={selectedProject}
              setSelectedProject={setSelectedProject}
              NO_PROJECT_VALUE={NO_PROJECT_VALUE}
              handleUpdateTask={handleUpdateTask}
              handleDeleteTask={handleDeleteTask}
              handleViewTaskDetails={handleViewTaskDetails}
              handleCreateTask={handleCreateTask}
              handleDragEnd={handleDragEnd}
            />
          </TabsContent>

          {/* Content for the Projects Tab */}
          <TabsContent value="projects" className="space-y-4 mt-4">
            {/* Render the Project Management Section component */}
            <ProjectManagementSection
              projects={projects}
              handleCreateProject={handleCreateProject}
              handleUpdateProject={handleUpdateProject}
              handleDeleteProject={handleDeleteProject}
            />
          </TabsContent>
        </Tabs>

        {/* Task Details Modal */}
        {selectedTaskForDetails && (
          <Dialog
            open={isTaskDetailsModalOpen}
            onOpenChange={setIsTaskDetailsModalOpen}
          >
            <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
              {/* Render the Task Details component within the modal */}
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
