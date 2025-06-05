// src/app/project-management/components/TaskList.tsx
'use client';

import { Task, Project } from '@/lib/indexeddb-service'; // Import Project type
import { deleteTask } from '@/lib/indexeddb-service';
import TaskForm from './TaskForm';
import { useState, useMemo, useCallback } from 'react';
import Modal from '@/components/Modal';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CalendarIcon, UserRound, Tag } from 'lucide-react';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

/**
 * @interface TaskListProps
 * @brief Props for the TaskList component.
 */
interface TaskListProps {
  /**
   * @brief The array of tasks to display.
   */
  tasks: Task[];
  /**
   * @brief Function to update the list of tasks.
   * Accepts a functional update to prevent stale closure issues.
   */
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  /**
   * @brief The array of available projects, used for displaying project names associated with tasks.
   */
  projects: Project[];
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
const TaskList = ({ tasks, setTasks, projects }: TaskListProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [taskToDeleteId, setTaskToDeleteId] = useState<string | null>(null);

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
   * @brief Handles the click event for deleting a task, opening a confirmation modal.
   * Uses `useCallback` for memoization.
   * @param {string} id - The ID of the task to be deleted.
   */
  const handleDeleteTask = useCallback((id: string) => {
    setTaskToDeleteId(id);
    setIsConfirmModalOpen(true);
  }, []);

  /**
   * @brief Confirms and proceeds with task deletion after user confirmation.
   * Uses `useCallback` for memoization.
   */
  const confirmDeleteTask = useCallback(async () => {
    if (!taskToDeleteId) {
      logger.warn('Attempted to confirm delete without a taskToDeleteId.');
      toast.error('No task selected for deletion.');
      setIsConfirmModalOpen(false);
      return;
    }

    try {
      await deleteTask(taskToDeleteId);
      setTasks((prevTasks) =>
        prevTasks.filter((task) => task.id !== taskToDeleteId),
      );
      toast.info('Task deleted successfully.');
      // Close the modal if the deleted task was being edited
      if (selectedTask?.id === taskToDeleteId) {
        setSelectedTask(null);
        setIsModalOpen(false);
      }
    } catch (error) {
      logger.error('Error deleting task:', error, {
        component: 'TaskList',
        context: 'confirmDeleteTask',
        taskId: taskToDeleteId,
      });
      toast.error('Failed to delete task. Please try again.');
    } finally {
      setIsConfirmModalOpen(false);
      setTaskToDeleteId(null);
    }
  }, [taskToDeleteId, setTasks, selectedTask?.id]);

  /**
   * @brief Handles the click event for editing a task, opening the TaskForm modal.
   * Uses `useCallback` for memoization.
   * @param {Task} task - The task object to be edited.
   */
  const handleEditClick = useCallback((task: Task) => {
    setSelectedTask(task);
    setIsModalOpen(true);
  }, []);

  /**
   * @brief Handles closing the edit task modal.
   * Uses `useCallback` for memoization.
   */
  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setSelectedTask(null);
  }, []);

  /**
   * @brief Handles the successful update/creation of a task from TaskForm, closing the modal.
   * Uses `useCallback` for memoization.
   * @param {Task} updatedOrNewTask - The task object that was updated or newly created.
   */
  const handleTaskFormUpdated = useCallback(
    (updatedOrNewTask: Task) => {
      setTasks((prevTasks) => {
        if (selectedTask) {
          // It was an update
          return prevTasks.map((t) =>
            t.id === updatedOrNewTask.id ? updatedOrNewTask : t,
          );
        } else {
          // It was a new task
          return [...prevTasks, updatedOrNewTask];
        }
      });
      handleCloseModal();
    },
    [selectedTask, setTasks, handleCloseModal],
  );

  /**
   * @brief Handles the click event for adding a new task, opening the TaskForm modal.
   * Uses `useCallback` for memoization.
   */
  const handleAddTaskClick = useCallback(() => {
    setSelectedTask(null); // Clear selected task to indicate adding a new one
    setIsModalOpen(true);
  }, []);

  return (
    <Card className="flex-1">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-foreground">Task List</CardTitle>
        <Button onClick={handleAddTaskClick} className="ml-auto">
          Add Task
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {/* Map tasks for the current section using memoized data */}
          {tasks.map((task) => (
            <div
              key={task.id}
              className="bg-card p-3 rounded-md shadow-sm border border-border"
            >
              <h3 className="font-semibold text-base mb-1 text-foreground">
                {task.title}
              </h3>
              {task.description && (
                <p className="text-sm text-muted-foreground mb-2">
                  {task.description}
                </p>
              )}
              {/* Display assignee */}
              <div className="flex items-center text-xs text-muted-foreground mb-1">
                <UserRound className="h-3 w-3 mr-1" />
                <span>{task.assignee || 'Unassigned'}</span>
              </div>
              {/* Display due date */}
              <div className="flex items-center text-xs text-muted-foreground mb-2">
                <CalendarIcon className="h-3 w-3 mr-1" />
                <span>
                  {task.dueDate
                    ? new Date(task.dueDate).toLocaleDateString()
                    : 'No due date'}
                </span>
              </div>
              {/* Display associated project name */}
              <div className="flex items-center text-xs text-muted-foreground mb-2">
                <Tag className="h-3 w-3 mr-1" />
                <span>
                  <span className="font-medium text-primary">
                    Project: {getProjectName(task.projectId)}
                  </span>
                </span>
              </div>
              {/* Display status */}
              <div className="flex items-center text-xs text-muted-foreground mb-2">
                <span className="font-medium text-primary">
                  Status: {task.status}
                </span>
              </div>
              {/* Action buttons */}
              <div className="flex space-x-2 mt-2">
                <Button
                  onClick={() => handleEditClick(task)}
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  aria-label={`Edit task ${task.title}`}
                >
                  Edit
                </Button>
                <Button
                  onClick={() => handleDeleteTask(task.id)}
                  variant="destructive"
                  size="sm"
                  className="text-xs"
                  aria-label={`Delete task ${task.title}`}
                >
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* Modal for editing/adding a task */}
        {isModalOpen && (
          <Modal
            isOpen={isModalOpen}
            onClose={handleCloseModal}
            title={selectedTask ? 'Edit Task' : 'Add New Task'}
          >
            <TaskForm
              key={isModalOpen ? 'task-form-open' : 'task-form-closed'}
              task={selectedTask}
              onTaskUpdated={handleTaskFormUpdated}
              onCancel={handleCloseModal}
              projects={projects}
              setTasks={setTasks}
            />
          </Modal>
        )}

        {/* Confirmation Modal for deleting a task */}
        <Modal
          isOpen={isConfirmModalOpen}
          onClose={() => setIsConfirmModalOpen(false)}
          title="Confirm Deletion"
        >
          <p className="mb-4 text-foreground">
            Are you sure you want to delete this task? This action cannot be
            undone.
          </p>
          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => setIsConfirmModalOpen(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDeleteTask}>
              Delete
            </Button>
          </div>
        </Modal>
      </CardContent>
    </Card>
  );
};

export default TaskList;
