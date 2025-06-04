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
} from '@dnd-kit/core';
import { useProjectManagementData } from '@/hooks/use-project-management-data';

const ProjectManagementPage = () => {
  const { tasks, setTasks, projects, setProjects, handleDragEnd } =
    useProjectManagementData();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor),
  );

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragEnd={handleDragEnd}
    >
      <div className="container mx-auto p-4">
        <h1 className="text-3xl font-bold text-center my-6">Project Board</h1>
        <p className="text-lg text-muted-foreground text-center mb-8">
          Manage your projects and tasks efficiently.
        </p>

        <Tabs defaultValue="tasks" className="w-full">
          <TabsList className="mb-4 flex flex-wrap h-auto justify-start bg-gray-100 dark:bg-gray-700">
            <TabsTrigger
              value="tasks"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-gray-700 dark:text-gray-200"
            >
              Tasks
            </TabsTrigger>
            <TabsTrigger
              value="projects"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-gray-700 dark:text-gray-200"
            >
              Projects
            </TabsTrigger>
          </TabsList>

          <TabsContent value="tasks" className="space-y-4 mt-4">
            <div className="flex flex-col gap-6 lg:flex-row">
              <div className="flex flex-col gap-6 flex-1">
                <Card className="flex-1">
                  <CardHeader>
                    <CardTitle>Add New Task</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <TaskForm setTasks={setTasks} tasks={tasks} />
                  </CardContent>
                </Card>
                <TaskList tasks={tasks} setTasks={setTasks} />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="projects" className="space-y-4 mt-4">
            <div className="flex flex-col gap-6 lg:flex-row">
              <div className="flex flex-col gap-6 flex-1">
                <Card className="flex-1">
                  <CardHeader>
                    <CardTitle>Add New Project</CardTitle>
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
                    <CardTitle>Project List</CardTitle>
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
