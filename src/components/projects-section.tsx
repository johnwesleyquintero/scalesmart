'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ExternalLink, Github, Zap, Star } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { projects as curatedProjectsList } from '@/data/portfolio-data/projects.json';

interface GitHubRepo {
  name: string;
  description: string | null;
  html_url: string;
  homepage: string | null;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  fork: boolean;
  topics: string[];
}

interface Project {
  name: string;
  description: string;
  longDescription?: string;
  html_url?: string;
  link?: string;
  homepage?: string;
  language?: string | null;
  stargazers_count?: number;
  forks_count?: number;
  featured?: boolean;
  technologies?: string[];
  image?: string;
  topics?: string[];
}

async function getGitHubProjects(username: string): Promise<GitHubRepo[]> {
  if (!username) {
    console.error('GitHub username is empty. Cannot fetch projects.');
    return [];
  }
  try {
    const url = `https://api.github.com/users/${username}/repos?sort=pushed&direction=desc&per_page=100`;
    const response = await fetch(url, {
      headers: {
        Accept: 'application/vnd.github.mercy-preview+json', // Required for topics if using older API versions, though usually standard now
      },
    });
    if (!response.ok) return [];
    const data: GitHubRepo[] = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('Error in getGitHubProjects:', error);
    return [];
  }
}

const getLanguageColor = (language: string | null): string => {
  if (!language) return 'bg-gray-400';
  const lang = language.toLowerCase();
  switch (lang) {
    case 'typescript':
      return 'bg-blue-500';
    case 'javascript':
      return 'bg-yellow-400';
    case 'python':
      return 'bg-green-500';
    case 'tsx':
      return 'bg-sky-500';
    default:
      return 'bg-gray-400';
  }
};

export default function ProjectsSection({
  username = 'johnwesleyquintero',
}: {
  username?: string;
}) {
  const [activeTab, setActiveTab] = useState('all');
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProjects = async () => {
      setIsLoading(true);
      try {
        const fetchedRepos = await getGitHubProjects(username);
        const githubProjects: Project[] = fetchedRepos
          .filter(
            (repo) =>
              !repo.fork &&
              repo.stargazers_count > 0 &&
              repo.topics &&
              repo.topics.includes('scalesmart'),
          )
          .map((repo) => ({
            name: repo.name,
            description: repo.description || '',
            html_url: repo.html_url,
            homepage: repo.homepage || undefined,
            language: repo.language,
            stargazers_count: repo.stargazers_count,
            forks_count: repo.forks_count,
            featured: false,
            topics: repo.topics,
          }));

        const curatedProjects: Project[] = (
          curatedProjectsList as Project[]
        ).map((p) => ({ ...p, featured: true }));

        // Merge and avoid duplicates by name
        const combined = [...curatedProjects];
        githubProjects.forEach((gp) => {
          if (
            !combined.some(
              (cp) => cp.name.toLowerCase() === gp.name.toLowerCase(),
            )
          ) {
            combined.push(gp);
          }
        });

        setProjects(combined.slice(0, 12));
        setError(null);
      } catch (err) {
        console.error('Error fetching or processing projects:', err);
        setProjects([]);
        setError('Failed to load projects. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProjects();
  }, [username]);

  return (
    <section id="projects" className="container relative mx-auto px-4 py-32">
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-100/50 to-indigo-100/50 dark:from-blue-950/50 dark:to-indigo-950/50 blur-3xl"></div>
      </div>

      <div className="w-full">
        <div className="mb-12 text-center">
          <Badge variant="secondary" className="mb-4">
            Solutions & Systems
          </Badge>
          <h2 className="mb-4 text-3xl font-bold md:text-4xl">
            ScaleSmart Solutions
          </h2>
          <p className="text-xl text-muted-foreground">
            Custom automation, integrations, and operational tools.
          </p>
        </div>

        <Tabs defaultValue={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-8">
            <TabsTrigger value="all">All Solutions</TabsTrigger>
            <TabsTrigger value="featured">Featured</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-8">
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <Skeleton key={i} className="h-[200px] w-full rounded-xl" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {projects
                  .filter((p) => activeTab === 'all' || p.featured)
                  .map((project) => (
                    <Card
                      key={project.name}
                      className={cn(
                        'flex flex-col justify-between transition-all duration-300 hover:scale-[1.02] hover:shadow-xl',
                        project.featured
                          ? 'border-primary/50 bg-primary/5 dark:bg-primary/10'
                          : '',
                      )}
                    >
                      <CardHeader>
                        <div className="flex items-start justify-between gap-4">
                          <div className="space-y-1">
                            <CardTitle className="text-lg font-semibold flex items-center gap-2">
                              {project.featured ? (
                                <Zap className="h-4 w-4 text-primary" />
                              ) : (
                                <Github className="h-4 w-4 text-muted-foreground" />
                              )}
                              {project.name}
                            </CardTitle>
                            {project.featured && (
                              <Badge
                                variant="outline"
                                className="text-[10px] uppercase tracking-wider"
                              >
                                Featured Solution
                              </Badge>
                            )}
                          </div>
                          {(project.homepage || project.link) && (
                            <Button
                              variant="ghost"
                              size="icon"
                              asChild
                              className="h-8 w-8"
                            >
                              <Link
                                href={project.homepage || project.link || '#'}
                                target="_blank"
                              >
                                <ExternalLink className="h-4 w-4" />
                              </Link>
                            </Button>
                          )}
                        </div>
                        <CardDescription className="mt-2 text-sm text-muted-foreground line-clamp-3">
                          {project.description}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="pt-1 pb-4">
                        {project.technologies ? (
                          <div className="flex flex-wrap gap-1.5 mt-auto">
                            {project.technologies.slice(0, 3).map((tech) => (
                              <Badge
                                key={tech}
                                variant="secondary"
                                className="text-[10px] px-1.5 py-0"
                              >
                                {tech}
                              </Badge>
                            ))}
                          </div>
                        ) : (
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            {project.language && (
                              <span className="flex items-center gap-1">
                                <span
                                  className={cn(
                                    'h-2 w-2 rounded-full',
                                    getLanguageColor(project.language),
                                  )}
                                ></span>
                                {project.language}
                              </span>
                            )}
                            {project.stargazers_count !== undefined &&
                              project.stargazers_count > 0 && (
                                <span className="flex items-center gap-1">
                                  <Star className="h-3 w-3" />{' '}
                                  {project.stargazers_count}
                                </span>
                              )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </section>
  );
}
