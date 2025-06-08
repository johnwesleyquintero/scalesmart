// src/app/project-management/components/SortableTaskItem.tsx
import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import TaskItem from './TaskItem';
import { Task, Project } from '@/lib/indexeddb-service';

interface SortableTaskItemProps {
  task: Task;
  projects: Project[];
  onDeleteTask: (id: string) => void;
  allTasks: Task[]; // All tasks for dependency/subtask lookup
  onViewTaskDetails: (task: Task) => void;
  // Add the onTaskPersist prop
  onTaskPersist: (updatedOrNewTask: Task) => Promise<void>;
}

/**
 * @component SortableTaskItem
 * @brief A wrapper component for `TaskItem` that enables drag-and-drop sorting.
 *
 * This component integrates with `dnd-kit`'s `useSortable` hook to provide
 * drag-and-drop functionality for individual task items within a `TaskList`.
 * It passes necessary props to the underlying `TaskItem` component.
 *
 * @param {SortableTaskItemProps} props The props for the component.
 * @returns {JSX.Element} The SortableTaskItem component.
 */
const SortableTaskItem: React.FC<SortableTaskItemProps> = ({
  task,
  projects,
  onDeleteTask,
  allTasks,
  onViewTaskDetails,
  onTaskPersist,
}) => {
  console.log('Rendering SortableTaskItem for task:', task.id);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 100 : 0, // Ensure dragged item is on top
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => console.log('SortableTaskItem div clicked:', task.id)}
    >
      <TaskItem
        task={task}
        projects={projects}
        onDeleteTask={onDeleteTask}
        allTasks={allTasks} // Pass allTasks to TaskItem
        onViewTaskDetails={onViewTaskDetails} // Pass onViewTaskDetails to TaskItem
        onTaskPersist={onTaskPersist} // Pass the new prop to TaskItem
      />
    </div>
  );
};

export default SortableTaskItem;
