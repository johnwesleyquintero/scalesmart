'use client';

import { useState, useEffect } from 'react';
import { Project } from '@/lib/indexeddb-service';
import { createProject, updateProject } from '@/lib/indexeddb-service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

interface ProjectFormProps {
  setProjects: (projects: Project[]) => void;
  projects: Project[];
  project?: Project; // Optional: for editing existing projects
  onProjectUpdated?: () => void; // Callback after updating/adding
}

const ProjectForm = ({
  setProjects,
  projects,
  project: initialProject,
  onProjectUpdated,
}: ProjectFormProps) => {
  const [name, setName] = useState(initialProject?.name || '');
  const [description, setDescription] = useState(
    initialProject?.description || '',
  );

  useEffect(() => {
    if (initialProject) {
      setName(initialProject.name);
      setDescription(initialProject.description || '');
    } else {
      setName('');
      setDescription('');
    }
  }, [initialProject]);

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
        setProjects(
          projects.map((p) =>
            p.id === updatedProject.id ? updatedProject : p,
          ),
        );
        toast.success('Project updated successfully!');
        onProjectUpdated?.();
      } catch (error) {
        console.error('Error updating project:', error);
        toast.error('Failed to update project. See console for details.');
      }
    } else {
      // Create new project
      try {
        const newProjectId = await createProject(projectData);
        if (newProjectId) {
          const newProject: Project = {
            ...projectData,
            id: newProjectId,
            creationTimestamp: Date.now(),
            updateTimestamp: Date.now(),
          };
          setProjects([...projects, newProject]);
          toast.success('Project added successfully!');
          setName('');
          setDescription('');
          onProjectUpdated?.();
        } else {
          toast.error('Failed to add project. See console for details.');
        }
      } catch (error) {
        console.error('Error adding project:', error);
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
        {initialProject && onProjectUpdated && (
          <Button
            type="button"
            variant="outline"
            onClick={onProjectUpdated}
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
