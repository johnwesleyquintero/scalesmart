'use client';

import { useState, useEffect, useCallback } from 'react';
import { Project } from '@/lib/indexeddb-service';
import { createProject, updateProject } from '@/lib/indexeddb-service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

/**
 * @interface ProjectFormProps
 * @brief Props for the ProjectForm component.
 */
interface ProjectFormProps {
  /**
   * @brief Function to update the list of projects.
   * Accepts a functional update to prevent stale closure issues.
   */
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
  /**
   * @brief The current list of projects.
   * @deprecated This prop is less critical when `setProjects` uses functional updates,
   * but kept for potential external dependencies or initial state setup.
   */
  projects: Project[];
  /**
   * @brief Optional project object for editing. If provided, the form will be pre-filled.
   */
  project?: Project;
  /**
   * @brief Callback function invoked after a project is successfully added or updated.
   */
  onProjectUpdated?: () => void;
  /**
   * @brief Callback function invoked when the cancel button is clicked (only visible during edit mode).
   */
  onCancel?: () => void;
}

/**
 * @component ProjectForm
 * @brief A form component for adding or updating project details.
 *
 * This component handles the creation and modification of project entries
 * in the IndexedDB. It provides input fields for project name and description,
 * and includes basic validation and error handling.
 *
 * @param {ProjectFormProps} props The props for the component.
 * @returns {JSX.Element} The ProjectForm component.
 */
const ProjectForm = ({
  setProjects,
  project: initialProject,
  onProjectUpdated,
  onCancel,
}: ProjectFormProps) => {
  const [name, setName] = useState(initialProject?.name || '');
  const [description, setDescription] = useState(
    initialProject?.description || '',
  );

  /**
   * @brief Resets the form fields when `initialProject` changes.
   * This effect ensures the form is correctly populated when editing an existing project
   * or cleared when switching to add a new project.
   */
  useEffect(() => {
    setName(initialProject?.name || '');
    setDescription(initialProject?.description || '');
  }, [initialProject]);

  /**
   * @brief Validates the project form inputs.
   * @returns {boolean} True if inputs are valid, false otherwise.
   */
  const validateForm = useCallback((): boolean => {
    if (!name.trim()) {
      toast.error('Project name is required.');
      return false;
    }
    // Add more validation rules here if needed, e.g., minimum length, character restrictions.
    return true;
  }, [name]); // Add 'name' as a dependency

  /**
   * @brief Handles the form submission for adding or updating a project.
   * Uses `useCallback` to memoize the function, preventing unnecessary re-renders
   * if this handler were passed down to child components.
   * @param {React.FormEvent} e The form event.
   */
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!validateForm()) {
        return;
      }

      const projectData = {
        name: name.trim(),
        description: description.trim(),
      };

      try {
        if (initialProject) {
          // Update existing project
          const updatedProject: Project = {
            ...initialProject,
            ...projectData,
            updateTimestamp: Date.now(),
          };
          await updateProject(updatedProject);
          setProjects((prevProjects) =>
            prevProjects.map((p) =>
              p.id === updatedProject.id ? updatedProject : p,
            ),
          );
          toast.success('Project updated successfully!');
        } else {
          // Create new project
          const newProjectId = await createProject({
            ...projectData,
          });
          const newProject: Project = {
            ...projectData,
            id: String(newProjectId), // Ensure ID is string
            creationTimestamp: Date.now(),
            updateTimestamp: Date.now(),
          };
          setProjects((prevProjects) => [...prevProjects, newProject]);
          toast.success('Project added successfully!');
          // Clear the form fields only after successful creation
          setName('');
          setDescription('');
        }
        onProjectUpdated?.(); // Call the callback if provided for both add/update
      } catch (error) {
        logger.error(
          `Error ${initialProject ? 'updating' : 'adding'} project:`,
          error,
          {
            component: 'ProjectForm',
            context: 'handleSubmit',
            projectName: name,
          },
        );
        toast.error(
          `Failed to ${initialProject ? 'update' : 'add'} project. Please try again.`,
        );
      }
    },
    [
      name,
      description,
      initialProject,
      setProjects,
      onProjectUpdated,
      validateForm,
    ],
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="projectName">Project Name *</Label>
        <Input
          id="projectName"
          type="text"
          placeholder="Enter project name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          aria-required="true"
          aria-label="Project Name"
        />
      </div>
      <div>
        <Label htmlFor="projectDescription">Description (optional)</Label>
        <Textarea
          id="projectDescription"
          placeholder="Enter project description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          aria-label="Project Description"
        />
      </div>
      <div className="flex justify-end">
        {initialProject && onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="mr-2"
          >
            Cancel
          </Button>
        )}
        <Button type="submit">
          {initialProject ? 'Update Project' : 'Add Project'}
        </Button>
      </div>
    </form>
  );
};

export default ProjectForm;
