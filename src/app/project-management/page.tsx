// src/app/project-management/page.tsx
'use client';

// Import necessary React and UI components
'use client';

// Import necessary React and UI components
import React, { useState, useMemo, useCallback } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Import custom components and hooks
import TaskManagementSection from '@/app/project-management/components/TaskManagementSection';
import ProjectManagementSection from '@/app/project-management/components/ProjectManagementSection';
import { useTaskManagement } from '@/hooks/use-task-management';
import { Task } from '@/lib/indexeddb-service';
import { ErrorBoundary } from '@/components/error-boundary';
import TaskDetails from '@/app/project-management/components/TaskDetails';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';

// Import types and constants
import { Project } from '@/lib/indexeddb-service';
import { NO_PROJECT_VALUE } from '@/lib/constants/project-management';

/**
 * @component ProjectManagementPage
 * @brief The main page component for the Project Management Dashboard.
 *
 * This component orchestrates the display and interaction of project and task management
 * features. It uses Dnd-kit for drag-and-drop functionality, organizes content into tabs,
 * and integrates various sub-components for forms and lists.
 * It relies on the `useTaskManagement` hook for state management and data operations,
 * providing a centralized data flow for tasks and projects.
 *
 * @returns {JSX.Element} The ProjectManagementPage component, rendering the project dashboard UI.
 */
const ProjectManagementPage = () => {
  // Destructure state and handlers from the custom useTaskManagement hook
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

  // Wrap task update and delete handlers in useCallback for stability and to prevent unnecessary re-renders
  const memoizedHandleUpdateTask = useCallback(
    (task: Task) => handleUpdateTask(task),
    [handleUpdateTask],
  );

  const memoizedHandleDeleteTask = useCallback(
    (taskId: string) => handleDeleteTask(taskId),
    [handleDeleteTask],
  );

  // State to manage the selected project filter for tasks
  // Initialized to NO_PROJECT_VALUE to show all tasks by default
  const [selectedProject, setSelectedProject] =
    useState<string>(NO_PROJECT_VALUE);

  // State to manage the visibility and content of the Task Details modal
  const [isTaskDetailsModalOpen, setIsTaskDetailsModalOpen] = useState(false);
  const [selectedTaskForDetails, setSelectedTaskForDetails] =
    useState<Task | null>(null);

  /**
   * @brief Memoizes the filtered task list based on the `selectedProject`.
   *
   * This ensures that the task list is only re-filtered when `tasks` or `selectedProject` changes,
   * optimizing performance by avoiding unnecessary re-renders of `TaskList` components.
   * If `selectedProject` is `NO_PROJECT_VALUE`, all tasks are returned.
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
   * This function is passed down to `TaskItem` components to trigger the modal display.
   * @param {Task} task The task object to display details for.
   */
  const handleViewTaskDetails = useCallback((task: Task) => {
    setSelectedTaskForDetails(task);
    setIsTaskDetailsModalOpen(true);
  }, []);

  /**
   * @brief Callback to close the Task Details modal and clear the selected task.
   * This function is passed to the `TaskDetails` component to allow it to close itself.
   */
  const handleCloseTaskDetailsModal = useCallback(() => {
    setIsTaskDetailsModalOpen(false);
    setSelectedTaskForDetails(null);
  }, []);

  // Display loading state while data is being fetched from IndexedDB
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
    // ErrorBoundary ensures graceful handling of rendering errors within the component tree
    <ErrorBoundary>
      <div className="container mx-auto p-4">
        {/* Page Title and Description */}
        <h1 className="text-3xl font-bold text-center my-6 text-foreground">
          Project Dashboard
        </h1>
        <p className="text-lg text-muted-foreground text-center mb-8">
          Manage your projects and tasks efficiently.
        </p>

        {/* Tabs for switching between Task and Project management views */}
        <Tabs defaultValue="tasks" className="w-full">
          {/* List of tab triggers for navigation */}
          <TabsList className="mb-4 flex flex-wrap h-auto justify-start bg-muted">
            {/* Tab Trigger for Tasks view */}
            <TabsTrigger
              value="tasks"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-muted-foreground"
            >
              Tasks
            </TabsTrigger>
            {/* Tab Trigger for Projects view */}
            <TabsTrigger
              value="projects"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-muted-foreground"
            >
              Projects
            </TabsTrigger>
          </TabsList>

          {/* Content for the Tasks Tab */}
          <TabsContent value="tasks" className="space-y-4 mt-4">
            {/* Render the Task Management Section component, passing all necessary props */}
            <TaskManagementSection
              filteredTasks={filteredTasks}
              projects={projects}
              allTasks={tasks} // Pass all tasks for dependency/subtask resolution in TaskDetails/TaskForm
              selectedProject={selectedProject}
              setSelectedProject={setSelectedProject}
              NO_PROJECT_VALUE={NO_PROJECT_VALUE}
              handleUpdateTask={memoizedHandleUpdateTask}
              handleDeleteTask={memoizedHandleDeleteTask}
              handleViewTaskDetails={handleViewTaskDetails}
              handleCreateTask={handleCreateTask}
              handleDragEnd={handleDragEnd}
            />
          </TabsContent>

          {/* Content for the Projects Tab */}
          <TabsContent value="projects" className="space-y-4 mt-4">
            {/* Render the Project Management Section component, passing project-related handlers */}
            <ProjectManagementSection
              projects={projects}
              handleCreateProject={handleCreateProject}
              handleUpdateProject={handleUpdateProject}
              handleDeleteProject={handleDeleteProject}
            />
          </TabsContent>
        </Tabs>

        {/* Task Details Modal: Conditionally rendered when a task is selected for details */}
        {selectedTaskForDetails && (
          <Dialog
            open={isTaskDetailsModalOpen}
            onOpenChange={setIsTaskDetailsModalOpen} // Allows closing modal via overlay click or Escape key
          >
            <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
              {/* VisuallyHidden for accessibility: provides titles/descriptions for screen readers */}
              <VisuallyHidden>
                <DialogTitle>Task Details</DialogTitle>
                <DialogDescription>
                  Details of the selected task
                </DialogDescription>
              </VisuallyHidden>
              {/* Render the Task Details component within the modal, passing relevant task data and handlers */}
              <TaskDetails
                task={selectedTaskForDetails}
                projects={projects}
                allTasks={tasks} // Pass all tasks for resolving dependencies/subtasks within details
                onTaskPersist={memoizedHandleUpdateTask} // Pass handleUpdateTask for persistence of changes made in details view
                onDeleteTask={memoizedHandleDeleteTask} // Pass handleDeleteTask for deletion from details view
                onClose={handleCloseTaskDetailsModal} // Pass handler to close the modal from within TaskDetails
              />
            </DialogContent>
          </Dialog>
        )}
      </div>
    </ErrorBoundary>
  );
};

export default ProjectManagementPage;
