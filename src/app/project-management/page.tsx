// src/app/project-management/page.tsx
'use client';

import TaskList from '@/app/project-management/components/TaskList';
import TaskForm from '@/app/project-management/components/TaskForm';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ProjectForm from './components/ProjectForm';
import ProjectList from './components/ProjectList';
import {
  DndContext,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import { useProjectManagementData } from '@/hooks/use-project-management-data';
import { Task } from '@/lib/indexeddb-service'; // Import Task type

const ProjectManagementPage = () => {
  const { tasks, setTasks, projects, setProjects, handleDragEnd } =
    useProjectManagementData();

  // Configure sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor),
  );

  // Handle the end of a drag operation
  const onDragEnd = (event: DragEndEvent) => {
    handleDragEnd(event, tasks, setTasks); // Pass tasks and setTasks to the hook handler
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragEnd={onDragEnd} // Use the local onDragEnd handler
    >
      <div className="container mx-auto p-4">
        <h1 className="text-3xl font-bold text-center my-6 text-foreground">
          Project Dashboard
        </h1>
        <p className="text-lg text-muted-foreground text-center mb-8">
          Manage your projects and tasks efficiently.
        </p>

        <Tabs defaultValue="tasks" className="w-full">
          <TabsList className="mb-4 flex flex-wrap h-auto justify-start bg-muted">
            <TabsTrigger
              value="tasks"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-muted-foreground"
            >
              Tasks
            </TabsTrigger>
            <TabsTrigger
              value="projects"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-muted-foreground"
            >
              Projects
            </TabsTrigger>
          </TabsList>

          <TabsContent value="tasks" className="space-y-4 mt-4">
            <div className="flex flex-col gap-6 lg:flex-row">
              <div className="flex flex-col gap-6 flex-1">
                <Card className="flex-1">
                  <CardHeader>
                    <CardTitle className="text-foreground">
                      Add New Task
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {/* Pass projects to TaskForm for project assignment */}
                    <TaskForm
                      setTasks={setTasks}
                      tasks={tasks}
                      projects={projects}
                    />
                  </CardContent>
                </Card>
                {/* Pass projects to TaskList for displaying project names */}
                <TaskList
                  tasks={tasks}
                  setTasks={setTasks}
                  projects={projects}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="projects" className="space-y-4 mt-4">
            <div className="flex flex-col gap-6 lg:flex-row">
              <div className="flex flex-col gap-6 flex-1">
                <Card className="flex-1">
                  <CardHeader>
                    <CardTitle className="text-foreground">
                      Add New Project
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ProjectForm
                      setProjects={setProjects}
                      projects={projects}
                    />
                  </CardContent>
                </Card>

                <Card className="flex-1">
                  <CardHeader>
                    <CardTitle className="text-foreground">
                      Project List
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ProjectList
                      projects={projects}
                      setProjects={setProjects}
                    />
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DndContext>
  );
};

export default ProjectManagementPage;
