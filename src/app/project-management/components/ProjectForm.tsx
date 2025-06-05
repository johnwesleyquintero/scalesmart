'use client';

import { useState, useEffect } from 'react';
import { Project } from '@/lib/indexeddb-service';
import { createProject, updateProject } from '@/lib/indexeddb-service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { logger } from '@/lib/logger'; // Import logger for enhanced debugging

interface ProjectFormProps {
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>; // Changed to accept functional updates
  projects: Project[];
  project?: Project; // Optional: for editing existing projects
  onProjectUpdated?: () => void; // Callback after updating/adding
  onCancel?: () => void; // New prop for cancel action
}

const ProjectForm = ({
  setProjects,
  projects,
  project: initialProject,
  onProjectUpdated,
  onCancel, // Destructure new prop
}: ProjectFormProps) => {
  const [name, setName] = useState(initialProject?.name || '');
  const [description, setDescription] = useState(
    initialProject?.description || '',
  );

  // Effect to reset form when initialProject changes (for editing)
  useEffect(() => {
    if (initialProject) {
      setName(initialProject.name);
      setDescription(initialProject.description || '');
    } else {
      setName('');
      setDescription('');
    }
  }, [initialProject]);

  // Handle form submission for adding or updating a project
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error('Project name is required.');
      return;
    }

    const projectData = {
      name: name.trim(),
      description: description.trim(),
    };

    if (initialProject) {
      // Update existing project
      const updatedProject: Project = {
        ...initialProject,
        ...projectData,
        updateTimestamp: Date.now(),
      };
      try {
        await updateProject(updatedProject);
        // Addressed Stale Closure Issue: Using functional update for setProjects
        setProjects((prevProjects) =>
          prevProjects.map((p) =>
            p.id === updatedProject.id ? updatedProject : p,
          ),
        );
        toast.success('Project updated successfully!');
        onProjectUpdated?.(); // Call the callback if provided
      } catch (error) {
        logger.error('Error updating project:', error, {
          component: 'ProjectForm',
          context: 'handleSubmit',
        });
        toast.error('Failed to update project. See console for details.');
      }
    } else {
      // Create new project
      try {
        const newProjectId = await createProject({
          ...projectData,
        });
        // Rely solely on try...catch for error handling; assuming createProject throws on failure.
        // Convert newProjectId to string as Project.id is string.
        const newProject: Project = {
          ...projectData,
          id: String(newProjectId), // Ensure ID is string
          creationTimestamp: Date.now(),
          updateTimestamp: Date.now(),
        };
        // Addressed Stale Closure Issue: Using functional update for setProjects
        setProjects((prevProjects) => [...prevProjects, newProject]);
        toast.success('Project added successfully!');
        // Clear the form fields
        setName('');
        setDescription('');
        onProjectUpdated?.(); // Call the callback if provided
      } catch (error) {
        logger.error('Error adding project:', error, {
          component: 'ProjectForm',
          context: 'handleSubmit',
        });
        toast.error('Failed to add project. See console for details.');
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="projectName">Project Name *</Label>
        <Input
          id="projectName"
          type="text"
          placeholder="Project Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>
      <div>
        <Label htmlFor="projectDescription">Description (optional)</Label>
        <Textarea
          id="projectDescription"
          placeholder="Project Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
        />
      </div>
      <div className="flex justify-end">
        {/* Show cancel button only when editing */}
        {initialProject && onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel} // Use the new onCancel prop
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
