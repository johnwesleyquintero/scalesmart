'use client';

import React, { useMemo, useCallback } from 'react';
import { Task, Project } from '@/lib/indexeddb-service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useDroppable } from '@dnd-kit/core'; // Removed DndContext as it's in parent
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import SortableTaskItem from './SortableTaskItem';

/**
 * @interface TaskListProps
 * @brief Props for the TaskList component.
 * @property {string} id - The unique identifier for this task list column (e.g., 'to-do', 'in-progress', 'completed'). This also serves as the droppable ID.
 * @property {string} title - The title to display for this task list column (e.g., 'To Do', 'In Progress').
 * @property {Task[]} tasks - The array of tasks to display in this specific column.
 * @property {(updatedOrNewTask: Task) => Promise<void>} onTaskPersist - Callback function to be called when a task is updated or created and needs persistence (e.g., a comment is added from TaskDetails).
 * @property {Project[]} projects - The array of all available projects, used for displaying project names associated with tasks.
 * @property {Task[]} allTasks - All tasks across all columns, used for resolving dependencies and subtasks in TaskItem/TaskDetails.
 * @property {(id: string) => Promise<void>} onDeleteTask - Callback function to handle task deletion.
 * @property {(task: Task) => void} onViewTaskDetails - Callback function to handle viewing task details in a modal.
 */
interface TaskListProps {
  id: string;
  title: string;
  tasks: Task[];
  onTaskPersist: (updatedOrNewTask: Task) => Promise<void>;
  projects: Project[];
  allTasks: Task[];
  onDeleteTask: (id: string) => Promise<void>;
  onViewTaskDetails: (task: Task) => void;
}

/**
 * @component TaskList
 * @brief Displays a Kanban-style column for tasks, enabling drag-and-drop reordering and status changes.
 *
 * This component represents a single column (e.g., "To Do", "In Progress", "Completed")
 * in the Kanban board. It uses `dnd-kit`'s `useDroppable` to allow tasks to be dropped
 * into it and `SortableContext` to enable reordering of tasks within the column.
 * It renders `SortableTaskItem` components for each task.
 *
 * @param {TaskListProps} props The props for the component.
 * @returns {JSX.Element} The TaskList component, representing a Kanban column.
 */
const TaskList = ({
  id, // Unique ID for this column (e.g., 'to-do')
  title, // Display title for the column (e.g., 'To Do')
  tasks, // Tasks specific to this column
  projects, // All projects for task display
  onTaskPersist, // Handler for persisting task updates
  allTasks, // All tasks for dependency/subtask resolution
  onDeleteTask, // Handler for deleting tasks
  onViewTaskDetails, // Handler for viewing task details
}: TaskListProps) => {
  // useDroppable hook to make the column a valid drop target
  const { setNodeRef } = useDroppable({
    id: id, // The ID of the droppable container is the column's ID
  });

  /**
   * @brief Memoizes all projects into a Map for efficient O(1) lookup by ID.
   *
   * This map is used by `TaskItem` components to quickly retrieve project names
   * associated with tasks, avoiding repetitive linear searches.
   *
   * @returns {Map<string, Project>} A Map where keys are project IDs and values are Project objects.
   */
  const projectsMap = useMemo(() => {
    const map = new Map<string, Project>();
    projects.forEach((project) => {
      if (project.id) {
        map.set(project.id, project);
      }
    });
    return map;
  }, [projects]);

  /**
   * @brief Helper function to get project name by ID.
   * Uses the memoized `projectsMap` for efficient lookup.
   *
   * @param {string | undefined} projectId - The ID of the project.
   * @returns {string} The name of the project, or 'No Project'/'Unknown Project' if not found.
   */
  const getProjectName = useCallback(
    (projectId: string | undefined): string => {
      if (!projectId) return 'No Project';
      const project = projectsMap.get(projectId);
      return project ? project.name : 'Unknown Project';
    },
    [projectsMap],
  );

  /**
   * @brief Handles opening the task details modal.
   *
   * This function is a wrapper around the `onViewTaskDetails` prop, ensuring
   * that the correct task object is passed to the parent handler.
   *
   * @param {Task} task - The task object to view details for.
   */
  const handleViewTaskDetailsClick = useCallback(
    (task: Task) => {
      onViewTaskDetails(task); // Call the prop function directly
    },
    [onViewTaskDetails],
  );

  /**
   * @brief Handles the successful update/creation of a task from TaskForm or TaskDetails.
   *
   * This function is passed down to `SortableTaskItem` and subsequently to `TaskItem`
   * and `TaskDetails`. It ensures that any changes made to a task (e.g., adding a comment,
   * marking complete) are propagated up to the main state management hook (`useTaskManagement`)
   * for persistence.
   *
   * @param {Task} updatedOrNewTask - The task object that was updated or newly created.
   * @returns {Promise<void>} A promise that resolves when the task persistence is complete.
   */
  const handleTaskFormUpdated = useCallback(
    async (updatedOrNewTask: Task) => {
      // Propagate the update to the parent (ProjectManagementPage -> useTaskManagement)
      // to ensure the main tasks state is updated and persisted in IndexedDB.
      await onTaskPersist(updatedOrNewTask);
    },
    [onTaskPersist], // Dependency array includes the persistence handler
  );

  return (
    <Card className="flex-1">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div
          ref={setNodeRef} // Attach the droppable ref to this div
          className="space-y-3 min-h-[100px] p-2 rounded-md bg-muted/40"
          aria-label={`Task list for ${title} status`}
        >
          {/* SortableContext enables drag-and-drop sorting for items within this list */}
          <SortableContext
            items={tasks.map((task) => task.id)} // Provide IDs of sortable items
            strategy={verticalListSortingStrategy} // Use vertical list sorting strategy
          >
            {/* Conditional rendering: display message if no tasks, otherwise map tasks */}
            {tasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
                <p className="text-sm mb-2" role="status">
                  No tasks in this column yet.
                </p>
                {/* Optional: Add a call to action button if applicable */}
                {/* <Button variant="outline" size="sm">Add Task</Button> */}
              </div>
            ) : (
              tasks.map((task) => (
                <SortableTaskItem
                  key={task.id}
                  task={task}
                  projects={projects}
                  onDeleteTask={onDeleteTask}
                  allTasks={allTasks}
                  onTaskPersist={handleTaskFormUpdated} // Pass the handler for task updates
                  onViewTaskDetails={handleViewTaskDetailsClick} // Pass the handler for viewing details
                />
              ))
            )}
          </SortableContext>
        </div>
      </CardContent>
    </Card>
  );
};

export default TaskList;
