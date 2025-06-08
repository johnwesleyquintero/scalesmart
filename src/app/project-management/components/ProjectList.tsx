import React, { useState, useMemo, useCallback } from 'react';
import { Project } from '@/lib/indexeddb-service';
import ProjectForm from './ProjectForm';
import Modal from '@/components/Modal';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Edit, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
 * @property {Project[]} projects - The array of projects to display.
 * @property {(id: string) => Promise<void>} onDeleteProject - Callback function to handle project deletion.
 * @property {(project: Project) => Promise<void>} onUpdateProject - Callback function to handle project updates.
 */
interface ProjectListProps {
  projects: Project[];
  onDeleteProject: (id: string) => Promise<void>;
  onUpdateProject: (project: Project) => Promise<void>;
}

/**
 * @component ProjectList
 * @brief Displays a filterable and sortable list of projects.
 *
 * This component allows users to view, search, sort, edit, and delete projects.
 * It integrates with `ProjectForm` for editing and uses a confirmation modal for deletion.
 * It provides a responsive grid layout for project cards and includes accessibility
 * features like `aria-label` for interactive elements.
 *
 * @param {ProjectListProps} props The props for the component.
 * @returns {JSX.Element} The ProjectList component.
 */
const ProjectList = ({
  projects,
  onDeleteProject,
  onUpdateProject,
}: ProjectListProps) => {
  // State for controlling the visibility of the project edit modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  // State to hold the project currently selected for editing
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  // State for the search query input
  const [searchQuery, setSearchQuery] = useState('');
  // State for the sorting criteria, default to sorting by name ascending
  const [sortBy, setSortBy] = useState('nameAsc'); // 'nameAsc', 'nameDesc', 'dateAsc', 'dateDesc'
  // State for controlling the visibility of the delete confirmation modal
  const [isDeleteConfirmModalOpen, setIsDeleteConfirmModalOpen] =
    useState(false);
  // State to hold the project object that is pending deletion
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);

  /**
   * @brief Memoizes the filtered and sorted list of projects for performance optimization.
   *
   * This `useMemo` hook ensures that the filtering and sorting logic only re-executes
   * when `projects`, `searchQuery`, or `sortBy` dependencies change, preventing
   * unnecessary re-calculations on every render.
   *
   * @returns {Project[]} The array of projects after applying search filters and sorting.
   */
  const filteredAndSortedProjects = useMemo(() => {
    let currentProjects = [...projects]; // Create a shallow copy to avoid direct mutation

    // Filter projects based on the search query (case-insensitive)
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
          return (a.createdAt || 0) - (b.createdAt || 0);
        case 'dateDesc':
          return (b.createdAt || 0) - (a.createdAt || 0);
        case 'nameAsc':
        default:
          return a.name.localeCompare(b.name);
      }
    });

    return currentProjects;
  }, [projects, searchQuery, sortBy]);

  /**
   * @brief Handles the click event for deleting a project.
   *
   * This function sets the project to be deleted and opens the confirmation modal,
   * ensuring the user confirms the action before actual deletion.
   * Uses `useCallback` for memoization to prevent unnecessary re-creations.
   *
   * @param {Project} project - The project object to be deleted.
   */
  const handleDeleteProjectClick = useCallback((project: Project) => {
    setProjectToDelete(project);
    setIsDeleteConfirmModalOpen(true);
  }, []);

  /**
   * @brief Confirms and proceeds with project deletion after user confirmation.
   *
   * This asynchronous function calls the `onDeleteProject` prop with the ID of the
   * project to be deleted. It then closes the confirmation modal and clears the
   * `projectToDelete` state.
   * Uses `useCallback` for memoization.
   *
   * @returns {Promise<void>} A promise that resolves when the project has been deleted.
   */
  const confirmDeleteProject = useCallback(async () => {
    if (projectToDelete) {
      try {
        await onDeleteProject(projectToDelete.id);
        toast.success(
          `Project "${projectToDelete.name}" deleted successfully.`,
        );
      } catch (error) {
        toast.error(`Failed to delete project "${projectToDelete.name}".`);
        logger.error('Failed to delete project:', error);
      } finally {
        setIsDeleteConfirmModalOpen(false);
        setProjectToDelete(null);
      }
    }
  }, [projectToDelete, onDeleteProject]);

  /**
   * @brief Handles closing the delete confirmation modal.
   *
   * This function resets the state related to the delete confirmation modal,
   * effectively closing it and clearing the project pending deletion.
   * Uses `useCallback` for memoization.
   */
  const handleCloseDeleteConfirmModal = useCallback(() => {
    setIsDeleteConfirmModalOpen(false);
    setProjectToDelete(null);
  }, []);

  /**
   * @brief Handles the click event for editing a project.
   *
   * This function sets the project to be edited and opens the `ProjectForm` modal.
   * Uses `useCallback` for memoization.
   *
   * @param {Project} project - The project object to be edited.
   */
  const handleEditClick = useCallback((project: Project) => {
    setSelectedProject(project);
    setIsEditModalOpen(true);
  }, []);

  /**
   * @brief Handles closing the edit project modal.
   *
   * This function resets the state related to the edit modal, effectively closing it
   * and clearing the selected project.
   * Uses `useCallback` for memoization.
   */
  const handleCloseEditModal = useCallback(() => {
    setIsEditModalOpen(false);
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
          id="searchProjects"
        />
        {/* Select input for sorting projects */}
        <Label htmlFor="sortProjects" className="sr-only">
          Sort by
        </Label>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger
            className="w-[180px]"
            aria-label="Sort projects by"
            id="sortProjects"
          >
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

      {/* Conditional rendering based on whether projects are found */}
      {filteredAndSortedProjects.length === 0 ? (
        <p className="text-muted-foreground text-center" role="status">
          No projects found.
        </p>
      ) : (
        // Display the list of projects in a responsive grid
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
                {/* Edit button for each project */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEditClick(project)}
                  title="Edit project"
                  aria-label={`Edit project ${project.name}`}
                >
                  <Edit className="mr-2 h-4 w-4" /> Edit
                </Button>
                {/* Delete button for each project */}
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDeleteProjectClick(project)}
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
      {/* Modal for editing a project, conditionally rendered */}
      {isEditModalOpen && (
        <Modal
          isOpen={isEditModalOpen}
          onClose={handleCloseEditModal}
          title="Edit Project"
        >
          <ProjectForm
            project={selectedProject || undefined} // Pass the selected project for pre-filling the form
            onProjectUpdated={handleCloseEditModal} // Close modal after successful update
            onCancel={handleCloseEditModal} // Allow canceling the edit operation
            onUpdateProject={onUpdateProject} // Pass the update handler from props
          />
        </Modal>
      )}

      {/* Delete Confirmation Modal, conditionally rendered */}
      {isDeleteConfirmModalOpen && projectToDelete && (
        <Modal
          isOpen={isDeleteConfirmModalOpen}
          onClose={handleCloseDeleteConfirmModal}
          title="Confirm Delete Project"
        >
          <div className="p-4">
            <p className="text-foreground mb-4">
              Are you sure you want to delete the project "
              <span className="font-semibold">{projectToDelete.name}</span>"?
              This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleCloseDeleteConfirmModal}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={confirmDeleteProject}>
                Delete
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default React.memo(ProjectList);
