'use client';

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
import { ExternalLink, GitFork, Github, Star, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

interface GitHubRepo {
  name: string;
  description: string | null;
  html_url: string;
  homepage: string | null;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  fork: boolean;
}

// Removed redundant RawGitHubRepoFromAPI interface; it's identical to GitHubRepo

async function getGitHubProjects(username: string): Promise<GitHubRepo[]> {
  if (!username) {
    console.error('GitHub username is empty. Cannot fetch projects.');
    return [];
  }
  try {
    const url = `https://api.github.com/users/${username}/repos?sort=pushed&direction=desc&per_page=100`;
    console.log('Fetching GitHub projects from URL:', url);
    const response = await fetch(url);
    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        `Failed to fetch GitHub projects for user ${username}:`,
        `Status: ${response.status}`,
        `Error: ${errorText}`,
      );
      if (response.status === 404) {
        console.warn(
          `GitHub user '${username}' not found. Returning empty projects list.`,
        );
        return [];
      }
      throw new Error(
        `GitHub API responded with status ${response.status}: ${errorText}`,
      );
    }
    const data: GitHubRepo[] = await response.json(); // Use GitHubRepo directly
    if (!Array.isArray(data)) {
      console.error('GitHub API did not return an array:', data);
      return [];
    }
    //Simplified data mapping - no need for default values as they're already handled in the component
    return data;
  } catch (error) {
    console.error('Error in getGitHubProjects:', error);
    return [];
  }
}

// Helper function to get a color based on language (can be expanded)
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
    case 'html':
      return 'bg-orange-500';
    case 'css':
      return 'bg-purple-500';
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
  //Added prop for username
  const [activeTab, setActiveTab] = useState('all');
  const [projects, setProjects] = useState<GitHubRepo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProjects = async () => {
      setIsLoading(true);
      try {
        const fetchedProjects = await getGitHubProjects(username);
        const curatedProjects = fetchedProjects
          .filter((repo) => {
            const hasRealDescription =
              repo.description &&
              repo.description.length >= 20 &&
              repo.description !== 'No description provided.'; //Simplified condition
            const hasHomepage = !!repo.homepage;
            return !repo.fork && (hasRealDescription || hasHomepage);
          })
          .sort((a, b) => b.stargazers_count - a.stargazers_count)
          .slice(0, 10);
        setProjects(curatedProjects);
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
  }, [username]); // Added username to dependency array

  const filteredProjects = projects; //Filtering logic not implemented yet

  return (
    <section id="projects" className="container relative mx-auto px-4 py-32">
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-100/50 to-blue-100/50 dark:from-purple-950/50 dark:to-blue-950/50 blur-3xl"></div>
      </div>

      <div className="w-full">
        <div className="mb-12 text-center">
          <Badge variant="secondary" className="mb-4">
            GitHub Projects
          </Badge>
          <h2 className="mb-4 text-3xl font-bold md:text-4xl">
            GitHub Projects
          </h2>
          <p className="text-xl text-muted-foreground">
            My recent public repositories on GitHub.
          </p>
        </div>
        <Tabs defaultValue={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-8">
            <TabsTrigger value="all">All Projects</TabsTrigger>
          </TabsList>
          <TabsContent value={activeTab} className="mt-8">
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[...Array(6)].map((_, i) => (
                  <Card key={i}>
                    <CardHeader>
                      <Skeleton className="h-6 w-3/4 mb-2" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-5/6 mt-1" />
                    </CardHeader>
                    <CardContent className="pt-2 pb-4">
                      <div className="flex items-center gap-4">
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-4 w-16" />
                        <Skeleton className="h-4 w-16" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center p-12 text-center bg-muted/20 rounded-xl border border-dashed">
                <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">
                  Projects temporarily unavailable
                </h3>
                <p className="text-muted-foreground max-w-md">
                  {error.includes('rate limit')
                    ? 'GitHub API rate limit reached. Please try again in a few minutes or visit my GitHub profile directly.'
                    : error}
                </p>
                <Button asChild variant="outline" className="mt-6">
                  <Link href={`https://github.com/${username}`} target="_blank">
                    View on GitHub
                  </Link>
                </Button>
              </div>
            ) : filteredProjects.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 text-center bg-muted/10 rounded-xl border border-dashed">
                <Github className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">
                  No projects found
                </h3>
                <p className="text-muted-foreground">
                  I haven&apos;t added any public projects to this category yet.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredProjects.map((project) => (
                  <Card
                    key={project.name}
                    className="flex flex-col justify-between transition-colors hover:bg-muted/30 dark:hover:bg-muted/20"
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between gap-4">
                        <CardTitle className="text-lg font-semibold flex items-center gap-2">
                          <Github className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                          <Link
                            href={project.html_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:underline"
                          >
                            {project.name}
                          </Link>
                        </CardTitle>
                        {project.homepage && (
                          <Button variant="outline" size="sm" asChild>
                            <Link
                              href={project.homepage}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <ExternalLink className="mr-2 h-3 w-3" /> Live
                            </Link>
                          </Button>
                        )}
                      </div>
                      <CardDescription className="mt-2 text-sm text-muted-foreground line-clamp-2">
                        {project.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-1 pb-4 text-xs text-muted-foreground">
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                        {project.language && (
                          <span className="flex items-center gap-1.5">
                            <span
                              className={`h-2.5 w-2.5 rounded-full ${getLanguageColor(project.language)}`}
                            ></span>
                            {project.language}
                          </span>
                        )}
                        {project.stargazers_count > 0 && (
                          <span className="flex items-center gap-1">
                            <Star className="h-3.5 w-3.5" />
                            {project.stargazers_count.toLocaleString()}
                          </span>
                        )}
                        {project.forks_count > 0 && (
                          <span className="flex items-center gap-1">
                            <GitFork className="h-3.5 w-3.5" />
                            {project.forks_count.toLocaleString()}
                          </span>
                        )}
                      </div>
                    </CardContent>
                    {/* Footer can be used for main action buttons if preferred over header placement */}
                    {/* <CardFooter className="pt-2">
                      <Link
                        href={project.html_url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        GitHub
                      </Link>
                    </CardFooter> */}
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
