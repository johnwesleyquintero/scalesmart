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
 */
interface ProjectListProps {
  /**
   * @brief The array of projects to display.
   */
  projects: Project[];
  /**
   * @brief Callback function to handle project deletion.
   */
  onDeleteProject: (id: string) => Promise<void>;
  /**
   * @brief Callback function to handle project updates.
   */
  onUpdateProject: (project: Project) => Promise<void>;
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
const ProjectList = ({
  projects,
  onDeleteProject,
  onUpdateProject,
}: ProjectListProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('nameAsc'); // 'nameAsc', 'nameDesc', 'dateAsc', 'dateDesc'

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
    switch (sortBy) {
      case 'nameDesc':
        currentProjects.sort((a: Project, b: Project) =>
          b.name.localeCompare(a.name),
        );
        break;
      case 'dateAsc':
        currentProjects.sort(
          (a: Project, b: Project) =>
            (a.creationTimestamp || 0) - (b.creationTimestamp || 0),
        );
        break;
      case 'dateDesc':
        currentProjects.sort(
          (a: Project, b: Project) =>
            (b.creationTimestamp || 0) - (a.creationTimestamp || 0),
        );
        break;
      case 'nameAsc':
      default:
        currentProjects.sort((a: Project, b: Project) =>
          a.name.localeCompare(b.name),
        );
        break;
    }

    return currentProjects;
  }, [projects, searchQuery, sortBy]);

  /**
   * @brief Handles the click event for deleting a project, opening a confirmation modal.
   * Uses `useCallback` for memoization.
   * @param {string} id - The ID of the project to be deleted.
   */
  const handleDeleteProjectClick = useCallback(
    (id: string) => {
      onDeleteProject(id); // Call the prop function directly
    },
    [onDeleteProject],
  );

  /**
   * @brief Confirms and proceeds with project deletion after user confirmation.


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
          id="searchProjects"
        />
        {/* Select input for sorting projects */}
        <Label htmlFor="sortProjects">Sort by</Label>
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
                  onClick={() => handleDeleteProjectClick(project.id)} // Use the new handler
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
            onProjectUpdated={handleCloseModal}
            onCancel={handleCloseModal}
            onUpdateProject={onUpdateProject} // Pass the correct update handler
          />
        </Modal>
      )}
    </div>
  );
};

export default React.memo(ProjectList);
