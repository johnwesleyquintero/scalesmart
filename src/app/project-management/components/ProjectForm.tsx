'use client';
import React from 'react';

import { useEffect, useCallback } from 'react';
import { Project } from '@/lib/indexeddb/project-management-db'; // Updated import path
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

/**
 * @interface ProjectFormProps
 * @brief Props for the ProjectForm component.
 */
interface ProjectFormProps {
  /**
   * @brief Callback function to create a new project.
   */
  onCreateProject?: (
    projectData: Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'status'>,
  ) => Promise<Project | undefined>;
  /**
   * @brief Callback function to update an existing project.
   */
  onUpdateProject?: (project: Project) => Promise<void>;
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
  onCreateProject,
  onUpdateProject,
  project: initialProject,
  onProjectUpdated,
  onCancel,
}: ProjectFormProps) => {
  const formSchema = z.object({
    name: z.string().min(3, {
      message: 'Project name must be at least 3 characters.',
    }),
    description: z
      .string()
      .max(200, {
        message: 'Description must be less than 200 characters.',
      })
      .optional(),
  });

  type FormValues = z.infer<typeof formSchema>;

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: initialProject?.name || '',
      description: initialProject?.description || '',
    },
  });

  useEffect(() => {
    if (initialProject) {
      setValue('name', initialProject.name);
      setValue('description', initialProject.description || '');
    }
  }, [initialProject, setValue]);

  const onSubmit = useCallback(
    async (data: FormValues) => {
      const projectData = {
        name: data.name.trim(),
        description: data.description?.trim() || '',
      };

<<<<<<< HEAD
      try {
        if (initialProject) {
          // Update existing project
          if (onUpdateProject) {
            const updatedProject: Project = {
              ...initialProject,
              ...projectData,
              updatedAt: Date.now(), // Changed to updatedAt
            };
            await onUpdateProject(updatedProject);
            toast.success('Project updated successfully!'); // Keep toast here as update is handled by hook
          }
        } else {
          // Create new project
          if (onCreateProject) {
            await onCreateProject({
              ...projectData,
            });
            // toast.success is handled by the hook (useTaskManagement)
          }
=======
      if (initialProject) {
        // Update existing project
        if (onUpdateProject) {
          const updatedProject: Project = {
            ...initialProject,
            ...projectData,
            updateTimestamp: Date.now(),
          };
          await onUpdateProject(updatedProject);
          toast.success('Project updated successfully!'); // Keep toast here as update is handled by hook
        }
      } else {
        // Create new project
        if (onCreateProject) {
          await onCreateProject({
            ...projectData,
          });
          // toast.success is handled by the hook (useTaskManagement)
>>>>>>> parent of a46766c (refactor(project-management): remove unused props and improve error handling)
        }
      }
      onProjectUpdated?.(); // Call the callback if provided for both add/update
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
          {...register('name')}
          aria-invalid={errors.name ? 'true' : 'false'}
          aria-label="Project Name"
        />
        {errors.name && (
          <p className="text-red-500 text-sm mt-1">{errors.name?.message}</p>
        )}
      </div>
      <div>
        <Label htmlFor="description">Description (optional)</Label>
        <Textarea
          id="description"
          placeholder="Enter project description"
          rows={3}
          {...register('description')}
          aria-label="Project Description"
        />
        {errors.description && (
          <p className="text-red-500 text-sm mt-1">
            {errors.description?.message}
          </p>
        )}
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

export default React.memo(ProjectForm);
