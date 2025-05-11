'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ExternalLink } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';

interface Project {
  title: string;
  description: string;
  focus: string;
  deliverable: string;
  impact: string;
  image: string;
  github?: string | null;
  demo?: string;
}

interface ProjectsData {
  projects: Project[];
}

import projectsData from '@/data/portfolio-data/projects.json';

const projects = (projectsData as ProjectsData).projects;

export default function ProjectsSection() {
  const [activeTab, setActiveTab] = useState('all');

  const filteredProjects = projects; // Removed filtering since we're showcasing all projects

  return (
    <section id="projects" className="container relative mx-auto px-4 py-32">
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-100/50 to-blue-100/50 dark:from-purple-950/50 dark:to-blue-950/50 blur-3xl"></div>
      </div>

      <div className="mx-auto max-w-5xl">
        <div className="mb-12 text-center">
          <Badge variant="secondary" className="mb-4">
            Featured Work
          </Badge>
          <h2 className="mb-4 text-3xl font-bold md:text-4xl">Projects</h2>
          <p className="text-xl text-muted-foreground">
            A showcase of my recent projects and their impact on businesses.
          </p>
        </div>

        <Tabs defaultValue={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-8">
            <TabsTrigger value="all">All Projects</TabsTrigger>
          </TabsList>
          <TabsContent value={activeTab} className="mt-8">
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {filteredProjects.map((project) => (
                <Card
                  key={project.title}
                  className="group overflow-hidden transition-all duration-500 hover:shadow-xl hover:scale-[1.02] hover:bg-gradient-to-tr hover:from-background hover:to-muted/50 dark:hover:from-background dark:hover:to-muted/10"
                >
                  <div className="aspect-video overflow-hidden bg-muted p-4 group-hover:bg-muted/50 transition-all duration-500 group-hover:translate-y-1">
                    <Image
                      src={project.image}
                      alt={project.title}
                      width={600}
                      height={400}
                      className="h-full w-full object-contain transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                  <CardHeader>
                    <CardTitle className="text-xl font-bold text-center">
                      {project.title}
                    </CardTitle>
                    <CardDescription className="text-sm text-muted-foreground">
                      {project.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">Focus</Badge>
                        <span className="text-sm">{project.focus}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">Deliverable</Badge>
                        <span className="text-sm">{project.deliverable}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">Impact</Badge>
                        <span className="text-sm">{project.impact}</span>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex gap-4">
                    {project.github && (
                      <Button asChild>
                        <Link
                          href={project.github}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          GitHub
                        </Link>
                      </Button>
                    )}
                    {project.demo && (
                      <Button asChild>
                        <Link
                          href={project.demo}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ExternalLink className="mr-2 h-4 w-4" /> Live Demo
                        </Link>
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </section>
  );
}
