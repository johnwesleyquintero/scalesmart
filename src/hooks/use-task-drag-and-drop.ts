import { useCallback } from 'react';
import { DragEndEvent } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { Task, TaskStatus, updateTask } from '@/lib/indexeddb-service';
import { toast } from 'sonner';

type PerformOptimisticUpdate = <T, R = void>(
  updateLogic: (prevState: T[]) => T[],
  persistenceLogic: () => Promise<R>,
  successMessage: string,
  errorMessage: string,
  originalState: T[],
  setStateFunction: React.Dispatch<React.SetStateAction<T[]>>,
  onPersistenceSuccess?: (result: R, optimisticState: T[]) => T[],
) => Promise<R>;

interface UseTaskDragAndDropProps {
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  performOptimisticUpdate: PerformOptimisticUpdate;
}

export const useTaskDragAndDrop = ({
  tasks,
  setTasks,
  performOptimisticUpdate,
}: UseTaskDragAndDropProps) => {
  const handleTaskStatusChange = useCallback(
    async (taskToMove: Task, newStatus: string, originalTasks: Task[]) => {
      const updatedTask: Task = {
        ...taskToMove,
        status: newStatus as TaskStatus,
        updatedAt:
          taskToMove.status !== newStatus ? Date.now() : taskToMove.updatedAt,
        order: 0,
      };

      await performOptimisticUpdate(
        (prevTasks) =>
          prevTasks
            .filter((task) => task.id !== taskToMove.id)
            .concat(updatedTask),
        async () => await updateTask(updatedTask),
        `Task "${updatedTask.title}" status updated to "${newStatus.replace(
          /-/g,
          ' ',
        )}".`,
        `Failed to update task status. Please try again.`,
        originalTasks,
        setTasks,
        undefined,
      );
    },
    [performOptimisticUpdate, setTasks],
  );

  const handleTaskReorder = useCallback(
    async (
      activeId: string,
      overId: string,
      containerId: string,
      originalTasks: Task[],
    ) => {
      const currentTasksInColumn = tasks
        .filter((task) => task.status === containerId)
        .sort((a, b) => (a.order || 0) - (b.order || 0));

      const oldIndex = currentTasksInColumn.findIndex(
        (task) => task.id === activeId,
      );
      const newIndex = currentTasksInColumn.findIndex(
        (task) => task.id === overId,
      );

      if (oldIndex === -1 || newIndex === -1) {
        console.warn(
          `Task with ID ${activeId} or ${overId} not found in column ${containerId} during reorder.`,
        );
        return;
      }

      const newOrder = arrayMove(currentTasksInColumn, oldIndex, newIndex);

      const tasksWithNewOrder = newOrder.map((task, index) => ({
        ...task,
        order: index,
        updatedAt: Date.now(),
      }));

      await performOptimisticUpdate(
        (prevTasks) => {
          const tasksWithoutCurrentColumn = prevTasks.filter(
            (task) => task.status !== containerId,
          );
          return [...tasksWithoutCurrentColumn, ...tasksWithNewOrder];
        },
        async () => {
          const tasksToPersist = tasksWithNewOrder.filter((task, index) => {
            const originalTask = currentTasksInColumn[index];
            return (
              !originalTask ||
              originalTask.id !== task.id ||
              originalTask.order !== task.order
            );
          });
          await Promise.all(tasksToPersist.map((task) => updateTask(task)));
        },
        `Task reordered successfully.`,
        `Failed to reorder task. Please try again.`,
        originalTasks,
        setTasks,
        undefined,
      );
    },
    [tasks, performOptimisticUpdate, setTasks],
  );

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;

      if (!over) {
        console.log('Drag cancelled or invalid drop.');
        return;
      }

      const activeId = active.id as string;
      const overId = over.id as string;

      if (activeId === overId) {
        console.log('Task dropped on itself, no change.');
        return;
      }

      const taskToMove = tasks.find((task) => task.id === activeId);
      if (!taskToMove) {
        console.error(`Dragged task with ID ${activeId} not found.`);
        toast.error('Dragged task not found.');
        return;
      }

      const originalTasks = [...tasks];

      const activeContainerId =
        active.data.current?.sortable?.containerId || active.id;
      const overContainerId =
        over.data.current?.sortable?.containerId || over.id;

      if (activeContainerId !== overContainerId) {
        console.log(
          `Task ${activeId} moved from column ${activeContainerId} to ${overContainerId}.`,
        );
        await handleTaskStatusChange(
          taskToMove,
          overContainerId,
          originalTasks,
        );
      } else {
        console.log(
          `Task ${activeId} reordered within column ${activeContainerId}.`,
        );
        await handleTaskReorder(
          activeId,
          overId,
          activeContainerId,
          originalTasks,
        );
      }
    },
    [tasks, handleTaskStatusChange, handleTaskReorder],
  );

  return { handleDragEnd };
};
