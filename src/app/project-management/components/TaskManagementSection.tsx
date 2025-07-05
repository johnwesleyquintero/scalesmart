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
import { Label } from '@/components/ui/label'; // Import Label for accessibility
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'; // Import Select components for project filter
import { Input } from '@/components/ui/input'; // Import Input for search

/**
 * @interface TaskManagementSectionProps
 * @brief Props for the TaskManagementSection component.
 * @property {Task[]} filteredTasks - An array of tasks filtered by the currently selected project.
 * @property {Project[]} projects - An array of all available projects.
 * @property {Task[]} allTasks - An array of all tasks across all columns, used for dependency/subtask resolution in forms and details.
 * @property {string} selectedProject - The ID of the currently selected project for filtering tasks.
 * @property {(projectId: string) => void} setSelectedProject - Callback to update the selected project filter.
 * @property {string} NO_PROJECT_VALUE - A constant representing the "All Projects" filter value.
 * @property {string} searchQuery - The current search query.
 * @property {(query: string) => void} setSearchQuery - Callback to update the search query.
 * @property {(task: Task) => Promise<void>} handleUpdateTask - Callback to update an existing task.
 * @property {(taskId: string) => Promise<void>} handleDeleteTask - Callback to delete a task.
 * @property {(task: Task) => void} handleViewTaskDetails - Callback to open the task details modal.
 * @property {(taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'comments'>) => Promise<Task | undefined>} handleCreateTask - Callback to create a new task.
 * @property {(event: DragEndEvent) => void} handleDragEnd - Callback for Dnd-kit's `onDragEnd` event, handling task drag-and-drop.
 */
interface TaskManagementSectionProps {
  filteredTasks: Task[];
  projects: Project[];
  allTasks: Task[];
  selectedProject: string;
  setSelectedProject: (projectId: string) => void;
  NO_PROJECT_VALUE: string;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  handleUpdateTask: (task: Task) => Promise<void>;
  handleDeleteTask: (taskId: string) => Promise<void>;
  handleViewTaskDetails: (task: Task) => void;
  handleCreateTask: (
    taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'comments'>,
  ) => Promise<Task | undefined>;
  handleDragEnd: (event: DragEndEvent) => void;
}

/**
 * @component TaskManagementSection
 * @brief A section component dedicated to managing tasks within the Project Dashboard.
 *
 * This component provides the UI for filtering tasks by project, displaying tasks
 * across different status columns (Kanban board), and adding new tasks.
 * It integrates `dnd-kit` for drag-and-drop functionality between columns and
 * reordering within columns. It receives task data and CRUD handlers from its
 * parent (`ProjectManagementPage`).
 *
 * @param {TaskManagementSectionProps} props The props for the component.
 * @returns {JSX.Element} The TaskManagementSection component.
 */
const TaskManagementSection: React.FC<TaskManagementSectionProps> = ({
  filteredTasks,
  projects,
  allTasks,
  selectedProject,
  setSelectedProject,
  NO_PROJECT_VALUE,
  searchQuery,
  setSearchQuery,
  handleUpdateTask,
  handleDeleteTask,
  handleViewTaskDetails,
  handleCreateTask,
  handleDragEnd,
}) => {
  // Dnd-kit sensors configuration for drag-and-drop interactions
  const sensors = useSensors(
    useSensor(PointerSensor), // Enables drag-and-drop with mouse/touch
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates, // Enables keyboard accessibility for sorting
    }),
  );

  return (
    <div className="space-y-4 mt-4">
      {/* Project Filter Section */}
      <div className="mb-4 flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Label htmlFor="project-filter" className="text-foreground">
            Filter by Project:
          </Label>
          <Select
            value={selectedProject}
            onValueChange={setSelectedProject} // Update selected project state
          >
            <SelectTrigger
              id="project-filter"
              className="w-full md:w-auto"
              aria-label="Filter tasks by project"
            >
              <SelectValue placeholder="All Projects" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NO_PROJECT_VALUE} label="All Projects">
                All Projects
              </SelectItem>
              {/* Map through available projects to create filter options */}
              {projects.map((project: Project) => (
                <SelectItem
                  key={project.id}
                  value={project.id}
                  label={project.name}
                >
                  {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <Label htmlFor="task-search" className="text-foreground">
            Search Tasks:
          </Label>
          <Input
            id="task-search"
            type="search"
            placeholder="Search by title or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full md:w-auto"
          />
        </div>
      </div>

      {/* DndContext provides the drag-and-drop context for all children */}
      <DndContext
        sensors={sensors} // Pass configured sensors
        collisionDetection={closestCorners} // Use closestCorners algorithm for drop target detection
        onDragEnd={handleDragEnd} // Main handler for drag-and-drop completion
      >
        {/* Grid layout for Kanban-style task columns */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Render a TaskList component for each predefined task status */}
          {TASK_STATUSES.map((statusConfig) => {
            // Filter tasks relevant to the current status column
            const tasksForStatus = filteredTasks.filter(
              (task) => task.status === statusConfig.id,
            );
            return (
              <TaskList
                key={statusConfig.id}
                id={statusConfig.id} // Column ID (e.g., 'to-do')
                title={statusConfig.title} // Column title (e.g., 'To Do')
                tasks={tasksForStatus} // Tasks specific to this column
                projects={projects} // All projects for task display
                allTasks={allTasks} // All tasks for dependency/subtask resolution
                onTaskPersist={handleUpdateTask} // Handler for persisting task updates
                onDeleteTask={handleDeleteTask} // Handler for deleting tasks
                onViewTaskDetails={handleViewTaskDetails} // Handler for viewing task details
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
              {/* TaskForm component for creating new tasks, passing necessary data and handlers */}
              <TaskForm
                projects={projects}
                onCreateTask={handleCreateTask}
                allTasks={allTasks} // Pass all tasks for dependency/subtask selection
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default React.memo(TaskManagementSection);
