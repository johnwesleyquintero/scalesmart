// src/app/project-management/components/TaskList.tsx
'use client';

import React, { useMemo, useCallback } from 'react';
import { Task, Project } from '@/lib/indexeddb-service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useDroppable, DndContext } from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import SortableTaskItem from './SortableTaskItem'; // Import the new component

/**
 * @interface TaskListProps
 * @brief Props for the TaskList component.
 */
interface TaskListProps {
  /**
   * @brief The unique identifier for this task list column (e.g., 'to-do', 'in-progress', 'completed').
   */
  id: string;
  /**
   * @brief The title to display for this task list column.
   */
  title: string;
  /**
   * @brief The array of tasks to display in this column.
   */
  tasks: Task[];
  /**
   * @brief Function to update the list of tasks.
   * Accepts a functional update to prevent stale closure issues.
   */
  /**
   * @brief Callback function to be called when a task is updated or created and needs persistence.
   */
  onTaskPersist: (updatedOrNewTask: Task) => Promise<void>;
  /**
   * @brief The array of available projects, used for displaying project names associated with tasks.
   */
  projects: Project[];
  /**
   * @brief All tasks across all columns, used for resolving dependencies and subtasks.
   */
  allTasks: Task[];
  /**
   * @brief Callback function to handle task deletion.
   */
  onDeleteTask: (id: string) => Promise<void>;
  /**
   * @brief Callback function to handle viewing task details.
   */
  onViewTaskDetails: (task: Task) => void;
}

/**
 * @component TaskList
 * @brief Displays a Kanban-style board for tasks, allowing filtering, editing, and deletion.
 *
 * This component organizes tasks by status (To Do, In Progress, Completed) and provides
 * functionality to add, edit, and delete tasks. It also integrates drag-and-drop
 * capabilities (via Draggable/Droppable components) and displays associated project names.
 *
 * @param {TaskListProps} props The props for the component.
 * @returns {JSX.Element} The TaskList component.
 */

const TaskList = ({
  id,
  title,
  tasks,
  projects,
  onTaskPersist, // Renamed prop
  allTasks,
  onDeleteTask, // Destructure new prop
  onViewTaskDetails, // Destructure new prop
}: TaskListProps) => {
  // Removed unused state variables: isEditModalOpen and selectedTask

  const { setNodeRef } = useDroppable({
    id: id,
  });

  /**
   * Memoizes projects into a Map for O(1) lookup by ID.
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
   * Helper function to get project name by ID.
   * Uses a memoized Map for efficient lookup.
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
   * @param {Task} task - The task object to view details for.
   */
  const handleViewTaskDetailsClick = useCallback(
    (task: Task) => {
      onViewTaskDetails(task); // Call the prop function directly
    },
    [onViewTaskDetails],
  );

  /**
   * @brief Handles closing the edit task modal.
   * Uses `useCallback` for memoization.
   */
  // Removed handleCloseEditModal as it's no longer needed

  /**
   * @brief Handles the successful update/creation of a task from TaskForm or TaskDetails, closing the modal if it was an edit.
   * Uses `useCallback` for memoization.
   * @param {Task} updatedOrNewTask - The task object that was updated or newly created.
   */
  const handleTaskFormUpdated = useCallback(
    async (updatedOrNewTask: Task) => {
      // Propagate the update to the parent (ProjectManagementPage) to ensure the main tasks state is updated and persisted
      await onTaskPersist(updatedOrNewTask); // Await the persistence handler

      // Removed logic related to closing edit modal as it's no longer needed in TaskList
    },
    [onTaskPersist], // Dependency array updated
  );

  return (
    <Card className="flex-1">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div
          ref={setNodeRef}
          className="space-y-3 min-h-[100px] p-2 rounded-md bg-muted/40"
        >
          <SortableContext
            items={tasks.map((task) => task.id)}
            strategy={verticalListSortingStrategy}
          >
            {/* Map tasks for the current section using memoized data */}
            {tasks.length === 0 ? (
              <p className="text-muted-foreground text-center text-sm py-4">
                No tasks in this column.
              </p>
            ) : (
              tasks.map((task) => (
                <SortableTaskItem
                  key={task.id}
                  task={task}
                  projects={projects}
                  onDeleteTask={onDeleteTask} // Use the prop directly
                  allTasks={allTasks}
                  onTaskPersist={handleTaskFormUpdated} // Pass the correct prop name
                  onViewTaskDetails={handleViewTaskDetailsClick} // Use the new handler
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
