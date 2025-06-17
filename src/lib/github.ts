interface GitHubRepo {
  fork: boolean;
  private: boolean;
  name: string;
  description: string | null;
  html_url: string;
  homepage: string | null;
  topics: string[];
  pushed_at: string;
  stargazers_count: number;
}

// Update the GitHub API function to properly use environment variables
export async function getGitHubProjects(): Promise<
  Array<{
    title: string;
    description: string;
    githubUrl: string;
    liveUrl: string;
    tags: string[];
    updatedAt: string;
    stars: number;
  }>
> {
  // Implement actual GitHub API call
  const githubToken = process.env.GITHUB_TOKEN;
  if (!githubToken) {
    throw new Error('GitHub token not configured');
  }

  try {
    const response = await fetch(
      'https://api.github.com/users/johnwesleyquintero/repos',
      {
        headers: {
          Authorization: `Bearer ${githubToken}`,
          Accept: 'application/vnd.github+json',
        },
      },
    );

    if (!response.ok) {
      throw new Error(
        `GitHub API error: ${response.status} ${response.statusText}`,
      );
    }

    const repos = (await response.json()) as GitHubRepo[];

    return repos
      .filter((repo: GitHubRepo) => !repo.fork && !repo.private)
      .map((repo: GitHubRepo) => ({
        title: repo.name,
        description: repo.description || 'No description',
        githubUrl: repo.html_url,
        liveUrl: repo.homepage || '',
        tags: repo.topics || [],
        updatedAt: repo.pushed_at,
        stars: repo.stargazers_count,
      }));
  } catch (error: Error | unknown) {
    console.error('Failed to fetch GitHub projects:', error instanceof Error ? error.message : error);
    // Re-throw the error to be handled by the caller
    throw error;
  }
}
