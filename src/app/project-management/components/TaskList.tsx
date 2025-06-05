// src/app/project-management/components/TaskList.tsx
'use client';

import { Task, Project } from '@/lib/indexeddb-service'; // Import Project type
import { deleteTask } from '@/lib/indexeddb-service';
import TaskForm from './TaskForm';
import { useState, useMemo } from 'react'; // Import useMemo
import Modal from '@/components/Modal';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Draggable from '@/components/ui/Draggable';
import Droppable from '@/components/ui/Droppable';
import { CalendarIcon, UserRound, Tag } from 'lucide-react';
import { toast } from 'sonner'; // Import toast
import { logger } from '@/lib/logger'; // Import logger for enhanced debugging

interface TaskListProps {
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>; // Changed to accept functional updates
  projects: Project[]; // Add projects prop
}

const TaskList = ({ tasks, setTasks, projects }: TaskListProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [taskToDeleteId, setTaskToDeleteId] = useState<string | null>(null);

  /**
   * Memoizes tasks grouped by status to avoid repeated filtering in render.
   * @returns {Object.<string, Task[]>} An object where keys are task statuses and values are arrays of tasks.
   */
  const tasksByStatus = useMemo(() => {
    const grouped: { [key: string]: Task[] } = {
      'to-do': [],
      'in-progress': [],
      completed: [],
    };
    tasks.forEach((task) => {
      if (grouped[task.status]) {
        grouped[task.status].push(task);
      } else {
        logger.warn(`Task with unexpected status: ${task.status}`, {
          component: 'TaskList',
          context: 'tasksByStatusMemo',
          task,
        });
      }
    });
    return grouped;
  }, [tasks]);

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
  const getProjectName = (projectId: string | undefined): string => {
    if (!projectId) return 'No Project';
    const project = projectsMap.get(projectId);
    return project ? project.name : 'Unknown Project';
  };

  /**
   * Handles the click event for deleting a task, opening a confirmation modal.
   * @param {string} id - The ID of the task to be deleted.
   */
  const handleDeleteTask = (id: string) => {
    setTaskToDeleteId(id);
    setIsConfirmModalOpen(true);
  };

  /**
   * Confirms and proceeds with task deletion after user confirmation.
   */
  const confirmDeleteTask = async () => {
    if (taskToDeleteId) {
      try {
        await deleteTask(taskToDeleteId);
        setTasks((prevTasks) =>
          prevTasks.filter((task) => task.id !== taskToDeleteId),
        );
        toast.info('Task deleted.');
        // Close the modal if the deleted task was being edited
        if (selectedTask?.id === taskToDeleteId) {
          setSelectedTask(null);
          setIsModalOpen(false);
        }
      } catch (error) {
        logger.error('Error deleting task:', error, {
          component: 'TaskList',
          context: 'confirmDeleteTask',
        });
        toast.error('Failed to delete task. See console for details.');
      } finally {
        setIsConfirmModalOpen(false);
        setTaskToDeleteId(null);
      }
    }
  };

  /**
   * Handles the click event for editing a task, opening the TaskForm modal.
   * @param {Task} task - The task object to be edited.
   */
  const handleEditClick = (task: Task) => {
    setSelectedTask(task);
    setIsModalOpen(true);
  };

  /**
   * Handles the successful update/creation of a task from TaskForm, closing the modal.
   * @param {Task} updatedOrNewTask - The task object that was updated or newly created.
   */
  const handleTaskFormUpdated = (updatedOrNewTask: Task) => {
    // This callback is now responsible for updating the parent's tasks state
    // based on the result from TaskForm.
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
  };

  /**
   * Handles closing the edit task modal.
   */
  /**
   * Handles closing the edit task modal.
   */
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedTask(null);
  };

  /**
   * Handles the click event for adding a new task, opening the TaskForm modal.
   */
  const handleAddTaskClick = () => {
    setSelectedTask(null); // Clear selected task to indicate adding a new one
    setIsModalOpen(true);
  };

  // Define task sections for the board
  const sections = [
    { title: 'To Do', status: 'to-do', id: 'to-do' },
    { title: 'In Progress', status: 'in-progress', id: 'in-progress' },
    { title: 'Completed', status: 'completed', id: 'completed' },
  ];

  return (
    <Card className="flex-1">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-foreground">Task Board</CardTitle>
        <Button onClick={handleAddTaskClick} className="ml-auto">
          Add Task
        </Button>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {sections.map((section) => (
            <Droppable key={section.id} id={section.id}>
              <div className="bg-muted p-4 rounded-lg shadow-inner h-full min-h-[200px]">
                <h2 className="text-xl font-bold mb-4 flex items-center text-foreground">
                  {section.title}
                  {/* Display the count of tasks in this section */}
                  <span className="ml-2 text-sm bg-primary/20 text-primary-foreground px-2 py-1 rounded-full">
                    {tasksByStatus[section.status]?.length || 0}
                  </span>
                </h2>
                <div className="space-y-3">
                  {/* Map tasks for the current section using memoized data */}
                  {tasksByStatus[section.status]?.map((task) => (
                    <Draggable key={task.id} id={task.id} type="task">
                      <div className="bg-card p-3 rounded-md shadow-sm border border-border">
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
                              Project: {getProjectName(task.projectId)}{' '}
                              {/* Use memoized helper function */}
                            </span>
                          </span>
                        </div>
                        {/* Action buttons */}
                        <div className="flex space-x-2 mt-2">
                          <Button
                            onClick={() => handleEditClick(task)}
                            variant="outline"
                            size="sm"
                            className="text-xs"
                          >
                            Edit
                          </Button>
                          <Button
                            onClick={() => handleDeleteTask(task.id)}
                            variant="destructive"
                            size="sm"
                            className="text-xs"
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                    </Draggable>
                  ))}
                </div>
              </div>
            </Droppable>
          ))}
        </div>

        {/* Modal for editing/adding a task */}
        {isModalOpen && (
          <Modal
            isOpen={isModalOpen}
            onClose={handleCloseModal}
            title={selectedTask ? 'Edit Task' : 'Add New Task'}
          >
            {/* Pass projects to TaskForm for project assignment during edit */}
            {/* Refactored TaskForm to use onTaskUpdated callback instead of direct setTasks/tasks props */}
            <TaskForm
              key={isModalOpen ? 'task-form-open' : 'task-form-closed'} // Add key to force re-mount on modal open/close
              task={selectedTask} // Will be null for new tasks
              onTaskUpdated={handleTaskFormUpdated} // Use the new callback
              onCancel={handleCloseModal} // Pass handleCloseModal for the cancel button
              projects={projects}
              setTasks={setTasks} // Pass setTasks prop
              tasks={tasks} // Pass tasks prop
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
