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
  onTaskUpdated: (updatedTask: Task) => void;
  onViewTaskDetails: (task: Task, initialEditMode?: boolean) => void; // New prop to open task details modal, with optional edit mode
}

const SortableTaskItem: React.FC<SortableTaskItemProps> = ({
  task,
  projects,
  onDeleteTask,
  allTasks, // Destructure allTasks
  onTaskUpdated,
  onViewTaskDetails, // Destructure onViewTaskDetails
}) => {
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
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <TaskItem
        task={task}
        projects={projects}
        onDeleteTask={onDeleteTask}
        allTasks={allTasks} // Pass allTasks to TaskItem
        onViewTaskDetails={onViewTaskDetails} // Pass onViewTaskDetails to TaskItem
      />
    </div>
  );
};

export default SortableTaskItem;
