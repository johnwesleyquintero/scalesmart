import React from 'react';

import { useState, useMemo, useCallback } from 'react';
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
import { logger } from '@/lib/logger';

/**
 * @interface ProjectListProps
 * @brief Props for the ProjectList component.
 */
interface ProjectListProps {
  /**
   * @brief The array of projects to display.
   */
  projects: Project[];
  /**
   * @brief Function to update the list of projects.
   * Accepts a functional update to prevent stale closure issues.
   */
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
}

/**
 * @component ProjectList
 * @brief Displays a filterable and sortable list of projects.
 *
 * This component allows users to view, search, sort, edit, and delete projects.
 * It integrates with `ProjectForm` for editing and uses a confirmation modal for deletion.
 *
 * @param {ProjectListProps} props The props for the component.
 * @returns {JSX.Element} The ProjectList component.
 */
const ProjectList = ({ projects, setProjects }: ProjectListProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('nameAsc'); // 'nameAsc', 'nameDesc', 'dateAsc', 'dateDesc'
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [projectToDeleteId, setProjectToDeleteId] = useState<string | null>(
    null,
  );

  /**
   * Memoizes filtered and sorted projects for performance.
   * Re-runs memoization when projects, searchQuery, or sortBy changes.
   * @returns {Project[]} The filtered and sorted array of projects.
   */
  const filteredAndSortedProjects = useMemo(() => {
    let currentProjects = [...projects]; // Create a shallow copy to avoid direct mutation

    // Filter by search query (case-insensitive)
    if (searchQuery) {
      const lowerCaseQuery = searchQuery.toLowerCase();
      currentProjects = currentProjects.filter(
        (project) =>
          project.name.toLowerCase().includes(lowerCaseQuery) ||
          project.description?.toLowerCase().includes(lowerCaseQuery),
      );
    }

    // Sort projects based on the selected criteria
    currentProjects.sort((a: Project, b: Project) => {
      switch (sortBy) {
        case 'nameDesc':
          return b.name.localeCompare(a.name);
        case 'dateAsc':
          // Sort by creation timestamp (oldest first), default to 0 if undefined
          return (a.creationTimestamp || 0) - (b.creationTimestamp || 0);
        case 'dateDesc':
          // Sort by creation timestamp (newest first), default to 0 if undefined
          return (b.creationTimestamp || 0) - (a.creationTimestamp || 0);
        case 'nameAsc':
        default:
          // Default sort by name (A-Z)
          return a.name.localeCompare(b.name);
      }
    });

    return currentProjects;
  }, [projects, searchQuery, sortBy]);

  /**
   * @brief Handles the click event for deleting a project, opening a confirmation modal.
   * Uses `useCallback` for memoization.
   * @param {string} id - The ID of the project to be deleted.
   */
  const handleDeleteProject = useCallback((id: string) => {
    setProjectToDeleteId(id);
    setIsConfirmModalOpen(true);
  }, []);

  /**
   * @brief Confirms and proceeds with project deletion after user confirmation.
   * Uses `useCallback` for memoization.
   */
  const confirmDeleteProject = useCallback(async () => {
    if (!projectToDeleteId) {
      logger.warn('Attempted to confirm delete without a projectToDeleteId.');
      toast.error('No project selected for deletion.');
      setIsConfirmModalOpen(false);
      return;
    }

    try {
      await deleteProject(projectToDeleteId);
      setProjects((prevProjects) =>
        prevProjects.filter((project) => project.id !== projectToDeleteId),
      );
      toast.info('Project deleted successfully.');
      // Close the modal if the deleted project was being edited
      if (selectedProject?.id === projectToDeleteId) {
        setSelectedProject(null);
        setIsModalOpen(false);
      }
    } catch (error) {
      logger.error('Error deleting project:', error, {
        component: 'ProjectList',
        context: 'confirmDeleteProject',
        projectId: projectToDeleteId,
      });
      toast.error('Failed to delete project. Please try again.');
    } finally {
      setIsConfirmModalOpen(false);
      setProjectToDeleteId(null);
    }
  }, [projectToDeleteId, setProjects, selectedProject?.id]);

  /**
   * @brief Handles the click event for editing a project, opening the ProjectForm modal.
   * Uses `useCallback` for memoization.
   * @param {Project} project - The project object to be edited.
   */
  const handleEditClick = useCallback((project: Project) => {
    setSelectedProject(project);
    setIsModalOpen(true);
  }, []);

  /**
   * @brief Handles closing the edit project modal.
   * Uses `useCallback` for memoization.
   */
  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setSelectedProject(null);
  }, []);

  return (
    <div>
      <div className="flex flex-col sm:flex-row gap-4 mb-8 justify-center items-center">
        {/* Search input for filtering projects */}
        <Input
          placeholder="Search projects..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-sm"
          aria-label="Search projects"
        />
        {/* Select input for sorting projects */}
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-[180px]" aria-label="Sort projects by">
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
        <p className="text-muted-foreground text-center" role="status">
          No projects found.
        </p>
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
                  aria-label={`Edit project ${project.name}`}
                >
                  <Edit className="mr-2 h-4 w-4" /> Edit
                </Button>
                {/* Delete button */}
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDeleteProject(project.id)}
                  title="Delete project"
                  aria-label={`Delete project ${project.name}`}
                >
                  <Trash2 className="mr-2 h-4 w-4" /> Delete
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
      {/* Modal for editing a project */}
      {isModalOpen && (
        <Modal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          title="Edit Project"
        >
          <ProjectForm
            project={selectedProject || undefined} // Ensure it's undefined if null
            setProjects={setProjects}
            onProjectUpdated={handleCloseModal}
            onCancel={handleCloseModal}
          />
        </Modal>
      )}

      {/* Confirmation Modal for deleting a project */}
      <Modal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        title="Confirm Deletion"
      >
        <p className="mb-4 text-foreground">
          Are you sure you want to delete this project? This action cannot be
          undone. Note: This will not delete associated tasks.
        </p>
        <div className="flex justify-end space-x-2">
          <Button
            variant="outline"
            onClick={() => setIsConfirmModalOpen(false)}
          >
            Cancel
          </Button>
          <Button variant="destructive" onClick={confirmDeleteProject}>
            Delete
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default React.memo(ProjectList);
