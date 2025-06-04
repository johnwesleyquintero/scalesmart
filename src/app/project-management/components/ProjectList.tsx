'use client';

import { useState, useMemo } from 'react';
import { Project } from '@/lib/indexeddb-service';
import { deleteProject } from '@/lib/indexeddb-service';
import ProjectForm from './ProjectForm';
import Modal from '@/components/Modal';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Edit, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

interface ProjectListProps {
  projects: Project[];
  setProjects: (projects: Project[]) => void;
}

const ProjectList = ({ projects, setProjects }: ProjectListProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('nameAsc'); // 'nameAsc', 'nameDesc', 'dateAsc', 'dateDesc'

  const filteredAndSortedProjects = useMemo(() => {
    let filteredProjects = projects;

    // Filter by search query
    if (searchQuery) {
      const lowerCaseQuery = searchQuery.toLowerCase();
      filteredProjects = filteredProjects.filter(
        (project) =>
          project.name.toLowerCase().includes(lowerCaseQuery) ||
          project.description?.toLowerCase().includes(lowerCaseQuery),
      );
    }

    // Sort projects
    filteredProjects.sort((a: Project, b: Project) => {
      switch (sortBy) {
        case 'nameDesc':
          return b.name.localeCompare(a.name);
        case 'dateAsc':
          // Assuming project has a creationTimestamp or similar field
          // If not, we might need to add one or sort by name
          return (a.creationTimestamp || 0) - (b.creationTimestamp || 0);
        case 'dateDesc':
          return (b.creationTimestamp || 0) - (a.creationTimestamp || 0);
        case 'nameAsc':
        default:
          return a.name.localeCompare(b.name);
      }
    });

    return filteredProjects;
  }, [projects, searchQuery, sortBy]);

  const handleDeleteProject = async (id: string) => {
    if (
      window.confirm(
        'Are you sure you want to delete this project? This will not delete associated tasks.',
      )
    ) {
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
      <div className="flex flex-col sm:flex-row gap-4 mb-8 justify-center items-center">
        <Input
          placeholder="Search projects..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-sm"
        />
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="nameAsc">Name (A-Z)</SelectItem>
            <SelectItem value="nameDesc">Name (Z-A)</SelectItem>
            <SelectItem value="dateDesc">Newest First</SelectItem>
            <SelectItem value="dateAsc">Oldest First</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filteredAndSortedProjects.length === 0 ? (
        <p className="text-muted-foreground text-center">No projects found.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAndSortedProjects.map((project) => (
            <Card key={project.id} className="w-full">
              <CardContent className="grid grid-cols-1 gap-2 p-4">
                <h3 className="text-lg font-semibold text-foreground">
                  {project.name}
                </h3>
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
      {selectedProject && isModalOpen && (
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
