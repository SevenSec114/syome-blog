import type { APIRoute } from 'astro';

export const GET: APIRoute = async () => {
  try {
    const stats = await fetchGitHubStats();
    
    return new Response(JSON.stringify(stats), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=3600'
      }
    });
  } catch (error) {
    console.error('Error fetching GitHub stats:', error);
    
    return new Response(JSON.stringify({ error: 'Failed to fetch GitHub stats' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
};

export interface GitHubStats {
  contributions: number;
  totalRepositories: number;
  publicRepositories: number;
  privateRepositories: number;
  languages: { name: string; percentage: number }[];
}

export async function fetchGitHubStats(): Promise<GitHubStats> {
  const token = import.meta.env.GITHUB_TOKEN;

  if (!token) {
    console.warn("No GitHub token found. Using mock data.");
    return getMockData();
  }

  try {
    const contributions = await getTotalContributions(token);

    const reposResponse = await fetch("https://api.github.com/user/repos?per_page=100&sort=updated", {
      headers: {
        Authorization: `token ${token}`,
        "User-Agent": "SyomeBlog"
      }
    });

    if (!reposResponse.ok) {
      throw new Error(`GitHub REST error: ${reposResponse.status}`);
    }

    const repos = await reposResponse.json();

    const nonForkRepos = repos.filter((repo: any) => !repo.fork);

    const publicRepos = nonForkRepos.filter((repo: any) => !repo.private).length;
    const privateRepos = nonForkRepos.filter((repo: any) => repo.private).length;

    const languageStats: { [key: string]: number } = {};
    let totalSize = 0;

    const languagePromises = nonForkRepos.map(async (repo: any) => {
      const langResponse = await fetch(repo.languages_url, {
        headers: {
          Authorization: `token ${token}`,
          "User-Agent": "SyomeBlog"
        }
      });

      if (langResponse.ok) {
        const languages = await langResponse.json();
        return languages;
      }
      return {};
    });

    const repoLanguages = await Promise.all(languagePromises);

    repoLanguages.forEach(langs => {
      Object.entries(langs).forEach(([language, bytes]) => {
        if (!languageStats[language]) {
          languageStats[language] = 0;
        }
        languageStats[language] += bytes as number;
        totalSize += bytes as number;
      });
    });

    const languages = Object.entries(languageStats)
      .map(([name, bytes]) => ({
        name,
        percentage: (bytes / totalSize) * 100
      }))
      .sort((a, b) => b.percentage - a.percentage);

    return {
      contributions,
      totalRepositories: repos.length,
      publicRepositories: publicRepos,
      privateRepositories: privateRepos,
      languages
    };

  } catch (error) {
    console.error("Error fetching GitHub stats:", error);
    return getMockData();
  }
}

async function getTotalContributions(token: string): Promise<number> {
  const currentYear = new Date().getFullYear();
  let total = 0;

  for (let year = 2023; year <= currentYear; year++) {
    const from = `${year}-01-01T00:00:00Z`;
    const to = year === currentYear
      ? new Date().toISOString()
      : `${year}-12-31T23:59:59Z`;

    const query = `
      query {
        viewer {
          contributionsCollection(from: "${from}", to: "${to}") {
            contributionCalendar {
              totalContributions
            }
          }
        }
      }
    `;

    const response = await fetch("https://api.github.com/graphql", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "User-Agent": "SyomeBlog"
      },
      body: JSON.stringify({ query })
    });

    if (!response.ok) {
      console.warn(`Error fetching data for ${year}: ${response.status}`);
      continue;
    }

    const result = await response.json();
    total += result.data.viewer.contributionsCollection.contributionCalendar.totalContributions;
  }

  return total;
}

function getMockData(): GitHubStats {
  // 2025.08.02
  return {
    contributions: 806,
    totalRepositories: 17,
    publicRepositories: 1,
    privateRepositories: 16,
    languages: [
      { name: "JavaScript", percentage: 45.3 },
      { name: "Python", percentage: 27.2 },
      { name: "TypeScript", percentage: 7.7 },
      { name: "C#", percentage: 7.4 },
      { name: "HTML", percentage: 5.3 },
      { name: "Astro", percentage: 4.2 },
      { name: "Kotlin", percentage: 2.0 },
      { name: "SCSS", percentage: 0.4 },
      { name: "CSS", percentage: 0.1 },
      { name: "Batchfile", percentage: 0.0 }
    ]
  };
}