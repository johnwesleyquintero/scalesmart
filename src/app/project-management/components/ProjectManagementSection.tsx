// src/app/project-management/components/ProjectManagementSection.tsx
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ProjectForm from '@/app/project-management/components/ProjectForm';
import ProjectList from '@/app/project-management/components/ProjectList';
import { Project } from '@/lib/indexeddb-service';

interface ProjectManagementSectionProps {
  projects: Project[];
  handleCreateProject: (
    projectData: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>,
  ) => Promise<string | undefined>;
  handleUpdateProject: (project: Project) => Promise<void>;
  handleDeleteProject: (projectId: string) => Promise<void>;
}

const ProjectManagementSection: React.FC<ProjectManagementSectionProps> = ({
  projects,
  handleCreateProject,
  handleUpdateProject,
  handleDeleteProject,
}) => {
  return (
    <div className="space-y-4 mt-4">
      <div className="flex flex-col gap-6 lg:flex-row">
        <div className="flex flex-col gap-6 flex-1">
          {/* Card for adding new projects */}
          <Card className="flex-1">
            <CardHeader>
              <CardTitle className="text-foreground">Add New Project</CardTitle>
            </CardHeader>
            <CardContent>
              {/* ProjectForm component for creating new projects */}
              <ProjectForm onCreateProject={handleCreateProject} />
            </CardContent>
          </Card>

          {/* Card for displaying the list of projects */}
          <Card className="flex-1">
            <CardHeader>
              <CardTitle className="text-foreground">Project List</CardTitle>
            </CardHeader>
            <CardContent>
              {/* ProjectList component for displaying and managing projects */}
              <ProjectList
                projects={projects}
                onDeleteProject={handleDeleteProject}
                onUpdateProject={handleUpdateProject}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ProjectManagementSection;
