import type { APIRoute } from 'astro';
import siteConfig from '../../custom/site-config';

const GITHUB_USERNAME = import.meta.env.PUBLIC_GITHUB_USERNAME;
const GITHUB_TOKEN = import.meta.env.GITHUB_TOKEN;

export const GET: APIRoute = async () => {
  try {
    const stats = await fetchGitHubStats();

    return new Response(JSON.stringify(stats), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      }
    });
  } catch (error) {

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
  collaboratorRepositories: number;
  totalStars: number;
  totalPullRequests: number;
  totalIssues: number;
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

    const query = `
      query($login: String!, $after: String) {
        user(login: $login) {
          repositories(first: 100, after: $after, orderBy: {field: UPDATED_AT, direction: DESC}) {
            totalCount
            pageInfo { hasNextPage endCursor }
            nodes {
              name
              owner { login }
              isFork
              isPrivate
              stargazerCount
              languages(first: 10) {
                edges { size node { name } }
              }
            }
          }
        }
      }
    `;

    const headers = {
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      'Content-Type': 'application/json',
      'User-Agent': siteConfig.siteName
    };

    let repos: any[] = [];
    let after: string | null = null;
    let hasNext = true;
    while (hasNext) {
      const res: Response = await fetch('https://api.github.com/graphql', {
        method: 'POST',
        headers,
        body: JSON.stringify({ query, variables: { login: GITHUB_USERNAME, after } })
      });

      if (!res.ok) {
        throw new Error(`GitHub GraphQL error: ${res.status}`);
      }

      const data: any = await res.json();
      if (data.errors) {
        throw new Error(`GitHub GraphQL error: ${JSON.stringify(data.errors)}`);
      }

      const reposBlock: any = data.data.user?.repositories;
      if (!reposBlock) break;

      repos = repos.concat(reposBlock.nodes || []);
      hasNext = reposBlock.pageInfo?.hasNextPage;
      after = reposBlock.pageInfo?.endCursor || null;
      if (repos.length >= 300) break;
    }

    const nonForkRepos = repos.filter(r => !r.isFork);

    const ownerRepos = nonForkRepos.filter((repo: any) => repo.owner.login === GITHUB_USERNAME);
    const collaboratorRepos = nonForkRepos.filter((repo: any) => repo.owner.login !== GITHUB_USERNAME);

    const publicRepos = ownerRepos.filter((repo: any) => !repo.isPrivate).length;
    const privateRepos = ownerRepos.filter((repo: any) => repo.isPrivate).length;
    const collaboratorRepoCount = collaboratorRepos.length;

    const totalStars = nonForkRepos.reduce((sum: number, repo: any) => sum + (repo.stargazerCount || 0), 0);

    let totalPullRequests = 0;
    let totalIssues = 0;
    try {
      const [prRes, issueRes] = await Promise.all([
        fetch(`https://api.github.com/search/issues?q=type:pr+author:${GITHUB_USERNAME}&per_page=1`, { headers: { Authorization: `token ${GITHUB_TOKEN}`, 'User-Agent': siteConfig.siteName } }),
        fetch(`https://api.github.com/search/issues?q=type:issue+author:${GITHUB_USERNAME}&per_page=1`, { headers: { Authorization: `token ${GITHUB_TOKEN}`, 'User-Agent': siteConfig.siteName } })
      ]);

      if (prRes.ok) {
        const prData = await prRes.json();
        totalPullRequests = prData.total_count || 0;
      } else {
        console.warn(`Failed to fetch PRs: ${prRes.status}`);
      }

      if (issueRes.ok) {
        const issueData = await issueRes.json();
        totalIssues = issueData.total_count || 0;
      } else {
        console.warn(`Failed to fetch issues: ${issueRes.status}`);
      }
    } catch (error) {
      console.error(`Error fetching PR/issue counts:`, error);
    }

    const languageStats: { [key: string]: number } = {};
    let totalSize = 0;

    nonForkRepos.forEach((repo: any) => {
      const langEdges = repo.languages?.edges || [];
      langEdges.forEach((edge: any) => {
        const name = edge.node?.name;
        const size = edge.size || 0;
        if (!name) return;
        languageStats[name] = (languageStats[name] || 0) + size;
        totalSize += size;
      });
    });

    const languages = Object.entries(languageStats)
      .map(([name, bytes]) => ({ name, percentage: totalSize > 0 ? (bytes / totalSize) * 100 : 0 }))
      .sort((a, b) => b.percentage - a.percentage);

    let otherLanguagesPercentage = 0;
    const filteredLanguages = languages.filter(lang => {
      if (lang.percentage >= 1) return true;
      otherLanguagesPercentage += lang.percentage;
      return false;
    });

    if (otherLanguagesPercentage > 0) filteredLanguages.push({ name: 'Other', percentage: otherLanguagesPercentage });

    const result = {
      contributions,
      totalRepositories: nonForkRepos.length,
      publicRepositories: publicRepos,
      privateRepositories: privateRepos,
      collaboratorRepositories: collaboratorRepoCount,
      totalStars,
      totalPullRequests,
      totalIssues,
      languages: filteredLanguages
    };

    return result;

  } catch (error) {
    throw error;
  }
}

async function getTotalContributions(token: string, username: string): Promise<number> {
  const currentYear = new Date().getFullYear();
  const startYear = 2008; // GitHub was founded in 2008 lol

  let contributionsQueryFields = '';

  for (let year = startYear; year <= currentYear; year++) {
    const from = `${year}-01-01T00:00:00Z`;
    const to = year === currentYear
      ? new Date().toISOString()
      : `${year}-12-31T23:59:59Z`;

    contributionsQueryFields += `
        contributions${year}: contributionsCollection(from: "${from}", to: "${to}") {
          contributionCalendar {
            totalContributions
          }
        }
    `;
  }

  const query = `
    query($username: String!) {
      user(login: $username) {
        ${contributionsQueryFields}
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
    throw new Error(`GitHub GraphQL error: ${response.status}`);
  }

  const result = await response.json();

  if (result.errors) {
    throw new Error(`GitHub GraphQL error: ${JSON.stringify(result.errors)}`);
  }

  let total = 0;
  for (let year = startYear; year <= currentYear; year++) {
    if (result.data.user[`contributions${year}`]) {
      total += result.data.user[`contributions${year}`].contributionCalendar.totalContributions;
    }
  }

  return total;
}