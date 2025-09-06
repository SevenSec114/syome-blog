import type { APIRoute } from 'astro';
import siteConfig from '../../content/site-config';

const GITHUB_USERNAME = import.meta.env.PUBLIC_GITHUB_USERNAME;
const GITHUB_TOKEN = import.meta.env.GITHUB_TOKEN;

export const GET: APIRoute = async () => {
  try {
    const stats = await fetchGitHubStats();
    
    return new Response(JSON.stringify(stats), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=900, s-maxage=900, stale-while-revalidate=300'
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
  if (!GITHUB_TOKEN) {
    throw new Error("No GitHub token found.");
  }

  if (!GITHUB_USERNAME) {
    throw new Error("No GitHub username provided.");
  }

  try {
    const contributions = await getTotalContributions(GITHUB_TOKEN, GITHUB_USERNAME);

    const reposResponse = await fetch("https://api.github.com/user/repos?sort=updated&affiliation=owner,collaborator", {
      headers: {
        Authorization: `token ${GITHUB_TOKEN}`,
        "User-Agent": siteConfig.siteName
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
          Authorization: `token ${GITHUB_TOKEN}`,
          "User-Agent": siteConfig.siteName
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
      totalRepositories: nonForkRepos.length,
      publicRepositories: publicRepos,
      privateRepositories: privateRepos,
      languages
    };

  } catch (error) {
    throw error;
  }
}

async function getTotalContributions(token: string, username: string): Promise<number> {
  const userQuery = `
    query($username: String!) {
      user(login: $username) {
        createdAt
      }
    }
  `;

  const userResponse = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "User-Agent": siteConfig.siteName
    },
    body: JSON.stringify({ 
      query: userQuery,
      variables: { username }
    })
  });
  
  const currentYear = new Date().getFullYear();

  if (!userResponse.ok) {
    console.warn(`Error fetching user data: ${userResponse.status}`);
    var startYear = currentYear;
  } else {
    const userData = await userResponse.json();
    
    if (userData.errors) {
      console.warn(`GraphQL errors fetching user data:`, userData.errors);
      var startYear = currentYear;
    } else {
      const createdAt = new Date(userData.data.user.createdAt);
      var startYear = createdAt.getFullYear();
    }
  }

  let total = 0;

  for (let year = startYear; year <= currentYear; year++) {
    const from = `${year}-01-01T00:00:00Z`;
    const to = year === currentYear
      ? new Date().toISOString()
      : `${year}-12-31T23:59:59Z`;

    const query = `
      query($username: String!) {
        user(login: $username) {
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
        "User-Agent": siteConfig.siteName
      },
      body: JSON.stringify({ 
        query,
        variables: { username }
      })
    });

    if (!response.ok) {
      console.warn(`Error fetching data for ${year}: ${response.status}`);
      continue;
    }

    const result = await response.json();
    
    if (result.errors) {
      console.warn(`GraphQL errors for ${year}:`, result.errors);
      continue;
    }
    
    total += result.data.user.contributionsCollection.contributionCalendar.totalContributions;
  }

  return total;
}