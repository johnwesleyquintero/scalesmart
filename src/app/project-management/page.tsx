// src/app/project-management/page.tsx
'use client';

// Import necessary React and UI components
import {
  DndContext,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Import custom components and hooks
import TaskList from '@/app/project-management/components/TaskList';
import TaskForm from '@/app/project-management/components/TaskForm';
import ProjectForm from '@/app/project-management/components/ProjectForm';
import ProjectList from '@/app/project-management/components/ProjectList';
import { useProjectManagementData } from '@/hooks/use-project-management-data';
import { Task } from '@/lib/indexeddb-service';
import { ErrorBoundary } from '@/components/error-boundary'; // Import ErrorBoundary for robust error handling

/**
 * ProjectManagementPage Component
 *
 * Serves as the main dashboard for managing projects and tasks.
 * Integrates drag-and-drop functionality and provides separate tabs for
 * task and project management.
 */
const ProjectManagementPage = () => {
  // Destructure state and handlers from the custom hook for project management data
  const { tasks, setTasks, projects, setProjects, handleDragEnd } =
    useProjectManagementData();

  // Configure Dnd-kit sensors for various input methods (pointer and keyboard)
  const sensors = useSensors(
    useSensor(PointerSensor), // Enables drag and drop with mouse or touch
    useSensor(KeyboardSensor), // Enables drag and drop with keyboard
  );

  /**
   * Handles the end of a drag operation.
   * This function is called by DndContext when a draggable item is dropped.
   * It delegates the actual state update logic to the `handleDragEnd` function
   * provided by the `useProjectManagementData` hook.
   * @param event The DragEndEvent object containing information about the drag operation.
   */
  const onDragEnd = (event: DragEndEvent) => {
    // Pass the event and state setters to the centralized handler in the hook
    handleDragEnd(event, tasks, setTasks);
  };

  return (
    <ErrorBoundary> {/* Ensures graceful handling of rendering errors within the component tree */}
      <DndContext
        sensors={sensors} // Configured sensors for pointer and keyboard interactions
        collisionDetection={closestCorners} // Optimizes drag-and-drop collision detection
        onDragEnd={onDragEnd} // Centralized handler for drag completion
      >
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
                      setTasks={setTasks}
                      tasks={tasks}
                      projects={projects} // Pass projects for assignment
                    />
                  </CardContent>
                </Card>
                {/* TaskList component for displaying and managing tasks */}
                <TaskList
                  tasks={tasks}
                  setTasks={setTasks}
                  projects={projects} // Pass projects for displaying project names
                />
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
                    <ProjectForm
                      setProjects={setProjects}
                      projects={projects}
                    />
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
                      setProjects={setProjects}
                    />
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DndContext>
    </ErrorBoundary>
  );
};

export default ProjectManagementPage;
