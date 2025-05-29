'use client';

import { useState } from 'react';
import { Project } from '@/lib/indexeddb-service';
import { deleteProject } from '@/lib/indexeddb-service';
import ProjectForm from './ProjectForm';
import Modal from '@/components/Modal';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Edit, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface ProjectListProps {
  projects: Project[];
  setProjects: (projects: Project[]) => void;
}

const ProjectList = ({ projects, setProjects }: ProjectListProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  const handleDeleteProject = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this project? This will not delete associated tasks.')) {
      try {
        await deleteProject(id);
        setProjects(projects.filter((project) => project.id !== id));
        toast.info('Project deleted.');
        if (selectedProject?.id === id) {
          setSelectedProject(null);
          setIsModalOpen(false);
        }
      } catch (error) {
        console.error('Error deleting project:', error);
        toast.error('Failed to delete project. See console for details.');
      }
    }
  };

  const handleEditClick = (project: Project) => {
    setSelectedProject(project);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedProject(null);
  };

  return (
    <div>
      {projects.length === 0 ? (
        <p className="text-muted-foreground">No projects added yet.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => (
            <Card key={project.id} className="w-full">
              <CardContent className="grid grid-cols-1 gap-2 p-4">
                <h3 className="text-lg font-semibold">{project.name}</h3>
                {project.description && (
                  <p className="text-sm text-muted-foreground">
                    {project.description}
                  </p>
                )}
              </CardContent>
              <CardFooter className="flex justify-end gap-2 p-4 pt-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEditClick(project)}
                  title="Edit project"
                >
                  <Edit className="mr-2 h-4 w-4" /> Edit
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDeleteProject(project.id)}
                  title="Delete project"
                >
                  <Trash2 className="mr-2 h-4 w-4" /> Delete
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {selectedProject && (
        <Modal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          title="Edit Project"
        >
          <ProjectForm
            project={selectedProject}
            setProjects={setProjects}
            projects={projects}
            onProjectUpdated={handleCloseModal}
          />
        </Modal>
      )}
    </div>
  );
};

export default ProjectList;
