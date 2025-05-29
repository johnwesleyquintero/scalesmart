// src/app/project-management/page.tsx
'use client';

import TaskList from '@/app/project-management/components/TaskList';
import TaskForm from '@/app/project-management/components/TaskForm';
import { useState, useEffect } from 'react';
import { Task, Project } from '@/lib/indexeddb-service'; // Import Project
import { getAllTasks, getAllProjects } from '@/lib/indexeddb-service';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ProjectForm from './components/ProjectForm'; // Import ProjectForm
import ProjectList from './components/ProjectList'; // Import ProjectList

const ProjectManagementPage = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]); // State for projects

  useEffect(() => {
    const fetchData = async () => {
      const allTasks = await getAllTasks();
      setTasks(allTasks);
      const allProjects = await getAllProjects();
      setProjects(allProjects);
    };

    fetchData();
  }, []);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold text-center my-6">WesSync</h1>
      <p className="text-lg text-muted-foreground text-center mb-8">
        Manage your projects and tasks efficiently.
      </p>

      <Tabs defaultValue="tasks" className="w-full">
        <TabsList className="mb-4 flex flex-wrap h-auto justify-start">
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="projects">Projects</TabsTrigger>
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

              <Card className="flex-1">
                <CardHeader>
                  <CardTitle>Task List</CardTitle>
                </CardHeader>
                <CardContent>
                  <TaskList tasks={tasks} setTasks={setTasks} />
                </CardContent>
              </Card>
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
                  <ProjectForm setProjects={setProjects} projects={projects} />
                </CardContent>
              </Card>

              <Card className="flex-1">
                <CardHeader>
                  <CardTitle>Project List</CardTitle>
                </CardHeader>
                <CardContent>
                  <ProjectList projects={projects} setProjects={setProjects} />
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProjectManagementPage;
