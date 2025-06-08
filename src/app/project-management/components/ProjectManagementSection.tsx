// src/app/project-management/components/ProjectManagementSection.tsx
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ProjectForm from '@/app/project-management/components/ProjectForm';
import ProjectList from '@/app/project-management/components/ProjectList';
import { Project } from '@/lib/indexeddb-service';

/**
 * @interface ProjectManagementSectionProps
 * @brief Props for the ProjectManagementSection component.
 * @property {Project[]} projects - An array of project objects to be managed.
 * @property {(projectData: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string | undefined>} handleCreateProject - Callback to create a new project.
 * @property {(project: Project) => Promise<void>} handleUpdateProject - Callback to update an existing project.
 * @property {(projectId: string) => Promise<void>} handleDeleteProject - Callback to delete a project by its ID.
 */
interface ProjectManagementSectionProps {
  projects: Project[];
  handleCreateProject: (
    projectData: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>,
  ) => Promise<string | undefined>;
  handleUpdateProject: (project: Project) => Promise<void>;
  handleDeleteProject: (projectId: string) => Promise<void>;
}

/**
 * @component ProjectManagementSection
 * @brief A section component dedicated to managing projects within the Project Dashboard.
 *
 * This component aggregates the `ProjectForm` for adding new projects and the
 * `ProjectList` for displaying and managing existing projects. It acts as a
 * container for project-related UI and logic, receiving project data and
 * CRUD handlers from its parent (`ProjectManagementPage`).
 *
 * @param {ProjectManagementSectionProps} props The props for the component.
 * @returns {JSX.Element} The ProjectManagementSection component.
 */
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
              {/* ProjectForm component for creating new projects, passing the creation handler */}
              <ProjectForm onCreateProject={handleCreateProject} />
            </CardContent>
          </Card>

          {/* Card for displaying the list of projects */}
          <Card className="flex-1">
            <CardHeader>
              <CardTitle className="text-foreground">Project List</CardTitle>
            </CardHeader>
            <CardContent>
              {/* ProjectList component for displaying and managing projects, passing data and handlers */}
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
