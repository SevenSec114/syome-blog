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
        'Cache-Control': 'public, max-age=900, s-maxage=900, stale-while-revalidate=300'
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

    const reposResponse = await fetch("https://api.github.com/user/repos?sort=updated&per_page=100", {
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

    const ownerRepos = nonForkRepos.filter((repo: any) => repo.owner.login === GITHUB_USERNAME);
    const collaboratorRepos = nonForkRepos.filter((repo: any) => repo.owner.login !== GITHUB_USERNAME);
    
    const publicRepos = ownerRepos.filter((repo: any) => !repo.private).length;
    const privateRepos = ownerRepos.filter((repo: any) => repo.private).length;
    const collaboratorRepoCount = collaboratorRepos.length;
    
    const totalStars = nonForkRepos.reduce((sum: number, repo: any) => {
      const stars = repo.stargazers_count || 0;
      return sum + stars;
    }, 0);
    
    let totalPullRequests = 0;
    let totalIssues = 0;
    
    const repoDetailsPromises = nonForkRepos.map(async (repo: any) => {
      try {
        const prsResponse = await fetch(`${repo.url}/pulls?state=all&per_page=1`, {
          headers: {
            Authorization: `token ${GITHUB_TOKEN}`,
            "User-Agent": siteConfig.siteName
          }
        });
        
        if (prsResponse.ok) {
          const prLinkHeader = prsResponse.headers.get('Link');
          if (prLinkHeader) {
            const lastPageMatch = prLinkHeader.match(/page=(\d+)>; rel="last"/);
            if (lastPageMatch) {
              const prCount = parseInt(lastPageMatch[1]) || 0;
              totalPullRequests += prCount;
            } else {
              const prsData = await prsResponse.json();
              const prCount = Array.isArray(prsData) ? prsData.length : 0;
              totalPullRequests += prCount;
            }
          } else {
            const prsData = await prsResponse.json();
            const prCount = Array.isArray(prsData) ? prsData.length : 0;
            totalPullRequests += prCount;
          }
        } else {
        }
      } catch (error) {
      }
      
      try {
        const issuesResponse = await fetch(`${repo.url}/issues?state=all&per_page=1`, {
          headers: {
            Authorization: `token ${GITHUB_TOKEN}`,
            "User-Agent": siteConfig.siteName
          }
        });
        
        if (issuesResponse.ok) {
          const issuesLinkHeader = issuesResponse.headers.get('Link');
          if (issuesLinkHeader) {
            const lastPageMatch = issuesLinkHeader.match(/page=(\d+)>; rel="last"/);
            if (lastPageMatch) {
              const issueCount = parseInt(lastPageMatch[1]) || 0;
              totalIssues += issueCount;
            } else {
              const issuesData = await issuesResponse.json();
              const issueCount = Array.isArray(issuesData) ? issuesData.length : 0;
              totalIssues += issueCount;
            }
          } else {
            const issuesData = await issuesResponse.json();
            const issueCount = Array.isArray(issuesData) ? issuesData.length : 0;
            totalIssues += issueCount;
          }
        } else {
        }
      } catch (error) {
      }
    });
    
    await Promise.all(repoDetailsPromises);

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

    repoLanguages.forEach((langs) => {
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
        percentage: totalSize > 0 ? (bytes / totalSize) * 100 : 0
      }))
      .sort((a, b) => b.percentage - a.percentage);
    
    let otherLanguagesPercentage = 0;
    const filteredLanguages = languages.filter(lang => {
      if (lang.percentage >= 1) {
        return true;
      } else {
        otherLanguagesPercentage += lang.percentage;
        return false;
      }
    });
    
    if (otherLanguagesPercentage > 0) {
      filteredLanguages.push({
        name: "Other",
        percentage: otherLanguagesPercentage
      });
    }

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