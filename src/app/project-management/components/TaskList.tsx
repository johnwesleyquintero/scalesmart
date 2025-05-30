// src/app/project-management/components/TaskList.tsx
'use client';

import { Task } from '@/lib/indexeddb-service';
import { deleteTask } from '@/lib/indexeddb-service';
import TaskForm from './TaskForm';
import { useState } from 'react';
import Modal from '@/components/Modal';
import { Button } from '@/components/ui/button'; // Import Button
interface TaskListProps {
  tasks: Task[];
  setTasks: (tasks: Task[]) => void;
}

const TaskList = ({ tasks, setTasks }: TaskListProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const handleDeleteTask = async (id: string) => {
    await deleteTask(id);
    setTasks(tasks.filter((task) => task.id !== id));
  };

  const handleEditClick = (task: Task) => {
    setSelectedTask(task);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedTask(null);
  };

  const renderTaskSection = (
    title: string,
    filteredTasks: Task[],
    status: string,
  ) => (
    <div key={status} className="mb-8">
      <h2 className="text-2xl font-semibold mb-4">{title}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTasks.map((task) => (
          <div
            key={task.id}
            className="bg-card shadow-md dark:shadow-lg rounded-lg p-4"
          >
            <h3 className="text-xl font-bold mb-2">{task.title}</h3>
            <p className="text-muted-foreground mb-2">{task.description}</p>
            <p className="text-muted-foreground text-sm">
              Assignee: {task.assignee}
            </p>
            <p className="text-muted-foreground text-sm">
              Status: {task.status}
            </p>
            {task.dueDate && (
              <p className="text-muted-foreground text-sm">
                Due: {new Date(task.dueDate).toLocaleDateString()}
              </p>
            )}
            <div className="mt-4 flex space-x-2">
              <Button onClick={() => handleEditClick(task)} variant="outline">
                Edit
              </Button>
              <Button
                onClick={() => handleDeleteTask(task.id)}
                variant="destructive"
              >
                Delete
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const sections = [
    { title: 'To Do', status: 'to-do' },
    { title: 'In Progress', status: 'in-progress' },
    { title: 'Completed', status: 'completed' },
  ];

  return (
    <div>
      {sections.map((section) =>
        renderTaskSection(
          section.title,
          tasks.filter((task) => task.status === section.status),
          section.status,
        ),
      )}

      {selectedTask && (
        <Modal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          title="Edit Task"
        >
          <TaskForm
            task={selectedTask}
            setTasks={setTasks}
            tasks={tasks}
            onTaskUpdated={handleCloseModal}
          />
        </Modal>
      )}
    </div>
  );
};

export default TaskList;
