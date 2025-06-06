// src/app/project-management/page.tsx
'use client';

// Import necessary React and UI components
import React, { useMemo } from 'react'; // Import useMemo
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Import custom components and hooks
import TaskList from '@/app/project-management/components/TaskList';
import TaskForm from '@/app/project-management/components/TaskForm';
import ProjectForm from '@/app/project-management/components/ProjectForm';
import ProjectList from '@/app/project-management/components/ProjectList';
import { useProjectManagementData } from '@/hooks/use-project-management-data';
import { Task } from '@/lib/indexeddb-service';
import { ErrorBoundary } from '@/components/error-boundary';

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
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { updateTask } from '@/lib/indexeddb-service'; // Import updateTask
import { toast } from 'sonner'; // Import toast for user feedback

/**
 * @component ProjectManagementPage
 * @brief The main page component for the Project Management Dashboard.
 *
 * This component orchestrates the display and interaction of project and task management
 * features. It uses Dnd-kit for drag-and-drop functionality, organizes content into tabs,
 * and integrates various sub-components for forms and lists.
 * It relies on the `useProjectManagementData` hook for state management and data operations.
 *
 * @returns {JSX.Element} The ProjectManagementPage component.
 */
const ProjectManagementPage = () => {
  // Destructure state and handlers from the custom hook for project management data
  const { tasks, setTasks, projects, setProjects } = useProjectManagementData();

  // Dnd-kit sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  // Handler to update a task in the state when it's modified (e.g., comment added)
  const handleTaskUpdated = (updatedTask: Task) => {
    setTasks(
      tasks.map((task) => (task.id === updatedTask.id ? updatedTask : task)),
    );
  };

  // Handler for drag end event
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // Find the task that was dragged
    const taskToMove = tasks.find((task) => task.id === activeId);

    if (!taskToMove) {
      console.warn(`Dragged task with ID ${activeId} not found.`);
      return;
    }

    // Determine the container (column) the task was dragged from and to
    const activeContainerId =
      active.data.current?.sortable.containerId || taskToMove.status;
    const overContainerId = over.data.current?.sortable.containerId || overId;

    // Case 1: Dragged to a different column (status change)
    if (activeContainerId !== overContainerId) {
      const updatedTask = {
        ...taskToMove,
        status: overContainerId, // Update status to the new column ID
        updateTimestamp: Date.now(),
      };

      try {
        await updateTask(updatedTask); // Persist the status change to IndexedDB
        setTasks((prevTasks) =>
          prevTasks.map((task) =>
            task.id === updatedTask.id ? updatedTask : task,
          ),
        );
        toast.success(
          `Task "${updatedTask.title}" status updated to "${overContainerId}".`,
        );
      } catch (error) {
        console.error('Failed to update task status:', error);
        toast.error(`Failed to update task status. Please try again.`);
        // TODO: Optionally, attempt to revert the state change if the DB update fails
      }
    } else {
      // Case 2: Dragged within the same column (reordering)
      const currentTasksInColumn = tasks.filter(
        (task) => task.status === activeContainerId,
      );
      const oldIndex = currentTasksInColumn.findIndex(
        (task) => task.id === activeId,
      );
      const newIndex = currentTasksInColumn.findIndex(
        (task) => task.id === overId,
      );

      if (oldIndex !== -1 && newIndex !== -1) {
        const newOrder = arrayMove(currentTasksInColumn, oldIndex, newIndex);

        // Update the order of tasks in the state
        setTasks((prevTasks) => {
          const tasksWithoutMoved = prevTasks.filter(
            (task) => task.status !== activeContainerId,
          );
          return [...tasksWithoutMoved, ...newOrder];
        });

        // Persist the new order to IndexedDB
        try {
          // Update the order of each task in the reordered list
          const updatePromises = newOrder.map((task, index) => {
            const updatedTask = {
              ...task,
              order: index,
              updateTimestamp: Date.now(),
            };
            return updateTask(updatedTask);
          });
          await Promise.all(updatePromises);
          toast.success(`Task "${taskToMove.title}" reordered successfully.`);
        } catch (error) {
          console.error('Failed to persist task reordering:', error);
          toast.error(
            `Failed to reorder task "${taskToMove.title}". Please try again.`,
          );
          // TODO: Optionally, attempt to revert the state change if the DB update fails
        }
      }
    }
  };

  // Filter tasks by status for each column
  // Memoize the filtered task lists for performance
  const todoTasks = useMemo(
    () => tasks.filter((task) => task.status === 'to-do'),
    [tasks],
  );
  const inProgressTasks = useMemo(
    () => tasks.filter((task) => task.status === 'in-progress'),
    [tasks],
  );
  const completedTasks = useMemo(
    () => tasks.filter((task) => task.status === 'completed'),
    [tasks],
  );

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
            <DndContext
              sensors={sensors}
              collisionDetection={closestCorners}
              onDragEnd={handleDragEnd}
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* To Do Column */}
                <TaskList
                  id="to-do"
                  title="To Do"
                  tasks={todoTasks}
                  setTasks={setTasks} // Pass setTasks for potential future use within column
                  projects={projects}
                  allTasks={tasks} // Pass all tasks for dependency/subtask lookup
                  onTaskUpdated={handleTaskUpdated}
                />

                {/* In Progress Column */}
                <TaskList
                  id="in-progress"
                  title="In Progress"
                  tasks={inProgressTasks}
                  setTasks={setTasks}
                  projects={projects}
                  allTasks={tasks} // Pass all tasks for dependency/subtask lookup
                  onTaskUpdated={handleTaskUpdated}
                />

                {/* Completed Column */}
                <TaskList
                  id="completed"
                  title="Completed"
                  tasks={completedTasks}
                  setTasks={setTasks}
                  projects={projects}
                  allTasks={tasks} // Pass all tasks for dependency/subtask lookup
                  onTaskUpdated={handleTaskUpdated}
                />
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
                      projects={projects} // Pass projects for assignment
                      onTaskUpdated={handleTaskUpdated} // Pass handler to update state after adding
                      allTasks={tasks} // Pass all tasks for dependency/subtask lookup
                    />
                  </CardContent>
                </Card>
                {/* TaskList component for displaying and managing tasks */}
                {/* The original TaskList is replaced by the Kanban columns above */}
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
                    <ProjectForm setProjects={setProjects} />
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
    </ErrorBoundary>
  );
};

export default ProjectManagementPage;
