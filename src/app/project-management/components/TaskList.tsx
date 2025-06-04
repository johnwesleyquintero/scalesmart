// src/app/project-management/components/TaskList.tsx
'use client';

import { Task } from '@/lib/indexeddb-service';
import { deleteTask } from '@/lib/indexeddb-service';
import TaskForm from './TaskForm';
import { useState } from 'react';
import Modal from '@/components/Modal';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Draggable from '@/components/ui/Draggable';
import Droppable from '@/components/ui/Droppable';
import { CalendarIcon, UserRound, Tag } from 'lucide-react';

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

  const sections = [
    { title: 'To Do', status: 'to-do', id: 'to-do' },
    { title: 'In Progress', status: 'in-progress', id: 'in-progress' },
    { title: 'Completed', status: 'completed', id: 'completed' },
  ];

  return (
    <Card className="flex-1">
      <CardHeader>
        <CardTitle className="text-foreground">Task Board</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {sections.map((section) => (
            <Droppable key={section.id} id={section.id}>
              <div className="bg-muted p-4 rounded-lg shadow-inner h-full min-h-[200px]">
                <h2 className="text-xl font-bold mb-4 flex items-center text-foreground">
                  {section.title}
                  <span className="ml-2 text-sm bg-primary/20 text-primary-foreground px-2 py-1 rounded-full">
                    {
                      tasks.filter((task) => task.status === section.status)
                        .length
                    }
                  </span>
                </h2>
                <div className="space-y-3">
                  {tasks
                    .filter((task) => task.status === section.status)
                    .map((task) => (
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
                          <div className="flex items-center text-xs text-muted-foreground mb-1">
                            <UserRound className="h-3 w-3 mr-1" />
                            <span>{task.assignee || 'Unassigned'}</span>
                          </div>
                          <div className="flex items-center text-xs text-muted-foreground mb-2">
                            <CalendarIcon className="h-3 w-3 mr-1" />
                            <span>
                              {task.dueDate
                                ? new Date(task.dueDate).toLocaleDateString()
                                : 'No due date'}
                            </span>
                          </div>
                          <div className="flex items-center text-xs text-muted-foreground mb-2">
                            <Tag className="h-3 w-3 mr-1" />
                            <span>
                              {task.projectId ? (
                                <span className="font-medium text-primary">
                                  Project:{' '}
                                  {
                                    (
                                      sections.find(
                                        (s) => s.id === task.projectId,
                                      ) || {}
                                    ).title
                                  }
                                </span>
                              ) : (
                                'No Project'
                              )}
                            </span>
                          </div>
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
      </CardContent>
    </Card>
  );
};

export default TaskList;
