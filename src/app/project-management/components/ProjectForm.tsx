'use client';

import React, { useCallback, useEffect } from 'react';
import { Project } from '@/lib/indexeddb-service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { ProjectStatus } from '@/types/indexeddb';

/**
 * @interface ProjectFormProps
 * @brief Props for the ProjectForm component.
 * @property {(projectData: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string | undefined>} [onCreateProject] - Callback function to create a new project.
 * @property {(project: Project) => Promise<void>} [onUpdateProject] - Callback function to update an existing project.
 * @property {Project} [project] - Optional project object for editing. If provided, the form will be pre-filled.
 * @property {() => void} [onProjectUpdated] - Callback function invoked after a project is successfully added or updated.
 * @property {() => void} [onCancel] - Callback function invoked when the cancel button is clicked (only visible during edit mode).
 */
interface ProjectFormProps {
  onCreateProject?: (
    projectData: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>,
  ) => Promise<string | undefined>;
  onUpdateProject?: (project: Project) => Promise<void>;
  project?: Project;
  onProjectUpdated?: () => void;
  onCancel?: () => void;
}

/**
 * @component ProjectForm
 * @brief A form component for adding or updating project details.
 *
 * This component handles the creation and modification of project entries
 * in the IndexedDB. It provides input fields for project name and description,
 * and includes basic validation and error handling using `react-hook-form`
 * and `zod`. It supports both adding new projects and editing existing ones.
 *
 * @param {ProjectFormProps} props The props for the component.
 * @returns {JSX.Element} The ProjectForm component.
 */
const ProjectForm = ({
  onCreateProject,
  onUpdateProject,
  project: initialProject, // Renamed for clarity when editing
  onProjectUpdated,
  onCancel,
}: ProjectFormProps) => {
  // Define the validation schema for the form using Zod
  const formSchema = z.object({
    name: z.string().min(3, {
      message: 'Project name must be at least 3 characters.',
    }),
    description: z
      .string()
      .max(200, {
        message: 'Description must be less than 200 characters.',
      })
      .optional(), // Description is optional
  });

  // Infer the form values type from the schema
  type FormValues = z.infer<typeof formSchema>;

  // Initialize react-hook-form with Zod resolver
  const {
    register,
    handleSubmit,
    reset, // Added reset to clear form after submission
    formState: { errors, isSubmitSuccessful }, // isSubmitSuccessful for resetting form
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: initialProject?.name || '', // Pre-fill name if editing, otherwise empty
      description: initialProject?.description || '', // Pre-fill description if editing, otherwise empty
    },
  });

  // Effect to reset the form after successful submission when creating a new project
  useEffect(() => {
    if (isSubmitSuccessful && !initialProject) {
      // Only reset if it's a new project creation
      reset({
        name: '',
        description: '',
      });
    }
  }, [isSubmitSuccessful, reset, initialProject]);

  /**
   * @brief Handles form submission for creating or updating a project.
   *
   * This asynchronous function trims input data, constructs a project object,
   * and then calls either `onCreateProject` (for new projects) or `onUpdateProject`
   * (for existing projects). It provides user feedback via toast notifications
   * and triggers the `onProjectUpdated` callback on success.
   *
   * @param {FormValues} data - The validated form data.
   * @returns {Promise<void>} A promise that resolves when the project operation is complete.
   */
  const onSubmit = useCallback(
    async (data: FormValues) => {
      const projectData = {
        name: data.name.trim(),
        description: data.description?.trim() || '',
      };

      try {
        if (initialProject) {
          // Logic for updating an existing project
          if (onUpdateProject) {
            const updatedProject: Project = {
              ...initialProject, // Retain existing project ID and creation timestamp
              ...projectData, // Apply updated name and description
              updatedAt: Date.now(), // Update the modification timestamp
            };
            await onUpdateProject(updatedProject);
            toast.success(`Project "${data.name}" updated successfully!`);
          }
        } else {
          // Logic for creating a new project
          if (onCreateProject) {
            await onCreateProject({
              ...projectData,
              status: ProjectStatus.Active, // Set a default status for new projects
            });
            toast.success(`Project "${data.name}" added successfully!`);
          } else {
            console.warn('onCreateProject is not defined');
          }
        }
        onProjectUpdated?.(); // Call the callback if provided for both add/update
      } catch (error: any) {
        // Generic error message for persistence failures
        toast.error(
          `Failed to ${initialProject ? 'update' : 'add'} project "${data.name}": ${error.message}. Please try again.`,
        );
        console.error('Project persistence failed:', error); // Log the error for debugging
      }
    },
    [initialProject, onCreateProject, onUpdateProject, onProjectUpdated],
  );

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label htmlFor="name">Project Name *</Label>
        <Input
          id="name"
          type="text"
          placeholder="Enter project name"
          {...register('name')} // Register input with react-hook-form
          aria-invalid={errors.name ? 'true' : 'false'} // Accessibility: indicate invalid state
          aria-label="Project Name"
        />
        {errors.name && (
          <p className="text-red-500 text-sm mt-1" role="alert">
            {errors.name?.message}
          </p>
        )}
      </div>
      <div>
        <Label htmlFor="description">Description (optional)</Label>
        <Textarea
          id="description"
          placeholder="Enter project description"
          rows={3}
          {...register('description')} // Register textarea with react-hook-form
          aria-label="Project Description"
        />
        {errors.description && (
          <p className="text-red-500 text-sm mt-1" role="alert">
            {errors.description?.message}
          </p>
        )}
      </div>
      <div className="flex justify-end">
        {/* Render Cancel button only in edit mode if onCancel callback is provided */}
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

export default React.memo(ProjectForm);
