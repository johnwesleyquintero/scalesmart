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
import { updateTask } from '@/lib/indexeddb-service';
import { toast } from 'sonner';
import { Project } from '@/lib/indexeddb-service'; // Import Project type
import { TaskStatus, TASK_STATUSES } from '@/lib/constants/project-management'; // Import from new constants file

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
  const [selectedProject, setSelectedProject] = React.useState<string | 'all'>(
    'all',
  ); // State to manage selected project filter

  // Dnd-kit sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  // Handler to update a task in the state when it's modified (e.g., comment added, subtask added)
  const handleTaskUpdated = (updatedTask: Task) => {
    setTasks((prevTasks) =>
      prevTasks.map((task) =>
        task.id === updatedTask.id ? updatedTask : task,
      ),
    );
  };

  /**
   * @brief Handles the change of a task's status (column).
   * @param taskToMove The task being moved.
   * @param newStatus The new status (column ID) for the task.
   * @param originalTasks The state of tasks before the optimistic update.
   */
  const handleStatusChange = async (
    taskToMove: Task,
    newStatus: string,
    originalTasks: Task[],
  ) => {
    const updatedTask = {
      ...taskToMove,
      status: newStatus,
      updateTimestamp: Date.now(),
    };

    // Optimistic update: Update UI immediately
    setTasks((prevTasks) =>
      prevTasks.map((task) =>
        task.id === updatedTask.id ? updatedTask : task,
      ),
    );
    toast.success(
      `Task "${updatedTask.title}" status updated to "${newStatus}".`,
    );

    try {
      await updateTask(updatedTask); // Persist the status change to IndexedDB
    } catch (error) {
      console.error('Failed to update task status:', error);
      toast.error(`Failed to update task status. Please try again.`);
      // Revert state on error
      setTasks(originalTasks);
    }
  };

  /**
   * @brief Handles reordering of tasks within the same column.
   * @param activeId The ID of the task being dragged.
   * @param overId The ID of the task it's being dragged over.
   * @param activeContainerId The ID of the column the tasks are in.
   * @param originalTasks The state of tasks before the optimistic update.
   */
  const handleReorder = async (
    activeId: string,
    overId: string,
    activeContainerId: string,
    originalTasks: Task[],
  ) => {
    const currentTasksInColumn = originalTasks.filter(
      (task) => task.status === activeContainerId,
    );
    const oldIndex = currentTasksInColumn.findIndex(
      (task) => task.id === activeId,
    );
    const newIndex = currentTasksInColumn.findIndex(
      (task) => task.id === overId,
    );

    if (oldIndex === -1 || newIndex === -1) return;

    const newOrder = arrayMove(currentTasksInColumn, oldIndex, newIndex);

    // Optimistic update: Update UI immediately
    setTasks((prevTasks) => {
      const tasksWithoutMoved = prevTasks.filter(
        (task) => task.status !== activeContainerId,
      );
      return [...tasksWithoutMoved, ...newOrder];
    });
    toast.success(`Task reordered successfully.`);

    try {
      // Persist the new order to IndexedDB
      const updatePromises = newOrder.map((task, index) => {
        const updatedTask = {
          ...task,
          order: index,
          updateTimestamp: Date.now(),
        };
        return updateTask(updatedTask);
      });
      await Promise.all(updatePromises);
    } catch (error) {
      console.error('Failed to persist task reordering:', error);
      toast.error(`Failed to reorder task. Please try again.`);
      // Revert state on error
      setTasks(originalTasks);
    }
  };

  // Handler for drag end event
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const taskToMove = tasks.find((task) => task.id === activeId);
    if (!taskToMove) {
      console.warn(`Dragged task with ID ${activeId} not found.`);
      return;
    }

    const originalTasks = [...tasks]; // Capture current state for potential revert

    const activeContainerId =
      active.data.current?.sortable.containerId || taskToMove.status;
    const overContainerId = over.data.current?.sortable.containerId || overId;

    if (activeContainerId !== overContainerId) {
      // Dragged to a different column (status change)
      await handleStatusChange(taskToMove, overContainerId, originalTasks);
    } else {
      // Dragged within the same column (reordering)
      await handleReorder(activeId, overId, activeContainerId, originalTasks);
    }
  };

  // Filter tasks by status and selected project for each column
  // Memoize the filtered task lists for performance
  const filteredTasks = useMemo(() => {
    if (selectedProject === 'all') {
      return tasks;
    }
    return tasks.filter((task) => task.projectId === selectedProject);
  }, [tasks, selectedProject]);

  const todoTasks = useMemo(
    () => filteredTasks.filter((task) => task.status === TaskStatus.TODO),
    [filteredTasks],
  );
  const inProgressTasks = useMemo(
    () =>
      filteredTasks.filter((task) => task.status === TaskStatus.IN_PROGRESS),
    [filteredTasks],
  );
  const completedTasks = useMemo(
    () => filteredTasks.filter((task) => task.status === TaskStatus.COMPLETED),
    [filteredTasks],
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
                <option value="all">All Projects</option>
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
                <TaskList
                  id={TaskStatus.TODO}
                  title="To Do"
                  tasks={todoTasks}
                  setTasks={setTasks}
                  projects={projects}
                  allTasks={tasks}
                  onTaskUpdated={handleTaskUpdated}
                />
                <TaskList
                  id={TaskStatus.IN_PROGRESS}
                  title="In Progress"
                  tasks={inProgressTasks}
                  setTasks={setTasks}
                  projects={projects}
                  allTasks={tasks}
                  onTaskUpdated={handleTaskUpdated}
                />
                <TaskList
                  id={TaskStatus.COMPLETED}
                  title="Completed"
                  tasks={completedTasks}
                  setTasks={setTasks}
                  projects={projects}
                  allTasks={tasks}
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
                      projects={projects}
                      onTaskUpdated={handleTaskUpdated}
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
