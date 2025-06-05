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

  // Memoize filtered and sorted projects for performance
  const filteredAndSortedProjects = useMemo(() => {
    let filteredProjects = projects;

    // Filter by search query (case-insensitive)
    if (searchQuery) {
      const lowerCaseQuery = searchQuery.toLowerCase();
      filteredProjects = filteredProjects.filter(
        (project) =>
          project.name.toLowerCase().includes(lowerCaseQuery) ||
          project.description?.toLowerCase().includes(lowerCaseQuery),
      );
    }

    // Sort projects based on the selected criteria
    filteredProjects.sort((a: Project, b: Project) => {
      switch (sortBy) {
        case 'nameDesc':
          return b.name.localeCompare(a.name);
        case 'dateAsc':
          // Sort by creation timestamp (oldest first)
          return (a.creationTimestamp || 0) - (b.creationTimestamp || 0);
        case 'dateDesc':
          // Sort by creation timestamp (newest first)
          return (b.creationTimestamp || 0) - (a.creationTimestamp || 0);
        case 'nameAsc':
        default:
          // Default sort by name (A-Z)
          return a.name.localeCompare(b.name);
      }
    });

    return filteredProjects;
  }, [projects, searchQuery, sortBy]); // Re-run memoization when projects, searchQuery, or sortBy changes

  // Handle project deletion
  const handleDeleteProject = async (id: string) => {
    // Use a more styled confirmation modal if available, otherwise use window.confirm
    if (
      window.confirm(
        'Are you sure you want to delete this project? This will not delete associated tasks.',
      )
    ) {
      try {
        await deleteProject(id);
        // Remove the deleted project from the projects state
        setProjects(projects.filter((project) => project.id !== id));
        toast.info('Project deleted.');
        // Close the modal if the deleted project was being edited
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

  // Handle click on the edit button
  const handleEditClick = (project: Project) => {
    setSelectedProject(project);
    setIsModalOpen(true);
  };

  // Handle closing the edit modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedProject(null);
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row gap-4 mb-8 justify-center items-center">
        {/* Search input for filtering projects */}
        <Input
          placeholder="Search projects..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-sm"
        />
        {/* Select input for sorting projects */}
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="nameAsc" label="Name (A-Z)">
              Name (A-Z)
            </SelectItem>
            <SelectItem value="nameDesc" label="Name (Z-A)">
              Name (Z-A)
            </SelectItem>
            <SelectItem value="dateDesc" label="Newest First">
              Newest First
            </SelectItem>
            <SelectItem value="dateAsc" label="Oldest First">
              Oldest First
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Display message if no projects are found */}
      {filteredAndSortedProjects.length === 0 ? (
        <p className="text-muted-foreground text-center">No projects found.</p>
      ) : (
        // Display the list of projects
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
                {/* Edit button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEditClick(project)}
                  title="Edit project"
                >
                  <Edit className="mr-2 h-4 w-4" /> Edit
                </Button>
                {/* Delete button */}
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
      {/* Modal for editing a project */}
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
