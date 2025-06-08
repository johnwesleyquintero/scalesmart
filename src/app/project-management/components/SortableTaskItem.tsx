// src/app/project-management/components/SortableTaskItem.tsx
import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import TaskItem from './TaskItem';
import { Task, Project } from '@/lib/indexeddb-service';

/**
 * @interface SortableTaskItemProps
 * @brief Props for the SortableTaskItem component.
 * @property {Task} task - The task object to be rendered and made sortable.
 * @property {Project[]} projects - An array of all projects, used for displaying project names in the TaskItem.
 * @property {(id: string) => void} onDeleteTask - Callback function to handle task deletion.
 * @property {Task[]} allTasks - An array of all tasks, used for resolving dependencies and subtasks within the TaskItem.
 * @property {(task: Task) => void} onViewTaskDetails - Callback function to open the task details modal for the given task.
 * @property {(updatedOrNewTask: Task) => Promise<void>} onTaskPersist - Callback function to persist task changes (updates or new tasks) to the database.
 */
interface SortableTaskItemProps {
  task: Task;
  projects: Project[];
  onDeleteTask: (id: string) => void;
  allTasks: Task[];
  onViewTaskDetails: (task: Task) => void;
  onTaskPersist: (updatedOrNewTask: Task) => Promise<void>;
}

/**
 * @component SortableTaskItem
 * @brief A wrapper component for `TaskItem` that enables drag-and-drop sorting.
 *
 * This component integrates with `dnd-kit`'s `useSortable` hook to provide
 * drag-and-drop functionality for individual task items within a `TaskList`.
 * It applies the necessary `dnd-kit` attributes, listeners, and styles to the
 * draggable element and passes all relevant props to the underlying `TaskItem` component.
 *
 * @param {SortableTaskItemProps} props The props for the component.
 * @returns {JSX.Element} The SortableTaskItem component, wrapping a `TaskItem`.
 */
const SortableTaskItem: React.FC<SortableTaskItemProps> = ({
  task,
  projects,
  onDeleteTask,
  allTasks,
  onViewTaskDetails,
  onTaskPersist,
}) => {
  // console.log('Rendering SortableTaskItem for task:', task.id); // Removed for cleaner console output
  const {
    attributes, // HTML attributes for accessibility and drag-and-drop
    listeners, // Event listeners for drag-and-drop interactions
    setNodeRef, // Ref to attach to the draggable DOM node
    transform, // CSS transform for positioning the dragged item
    transition, // CSS transition for smooth animations
    isDragging, // Boolean indicating if the item is currently being dragged
  } = useSortable({ id: task.id }); // Unique ID for the sortable item

  // Apply dynamic styles for drag-and-drop feedback
  const style = {
    transform: CSS.Transform.toString(transform), // Apply transform for movement
    transition, // Apply transition for smooth movement
    opacity: isDragging ? 0.5 : 1, // Reduce opacity when dragging
    zIndex: isDragging ? 100 : 0, // Ensure dragged item is on top of other elements
  };

  return (
    <div
      ref={setNodeRef} // Attach the ref for dnd-kit to manage
      style={style} // Apply the dynamic styles
      {...attributes} // Spread dnd-kit attributes
      {...listeners} // Spread dnd-kit listeners
      // onClick={() => console.log('SortableTaskItem div clicked:', task.id)} // Removed for cleaner console output
    >
      <TaskItem
        task={task}
        projects={projects}
        onDeleteTask={onDeleteTask}
        allTasks={allTasks} // Pass allTasks to TaskItem for dependency/subtask resolution
        onViewTaskDetails={onViewTaskDetails} // Pass handler to TaskItem for opening details modal
        onTaskPersist={onTaskPersist} // Pass persistence handler to TaskItem for updates from within details
      />
    </div>
  );
};

export default SortableTaskItem;
