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

    const reposResponse = await fetch("https://api.github.com/user/repos?sort=updated&affiliation=owner,collaborator&per_page=100", {
      headers: {
        Authorization: `token ${GITHUB_TOKEN}`,
        "User-Agent": siteConfig.siteName
      }
    });

    if (!reposResponse.ok) {
      throw new Error(`GitHub REST error: ${reposResponse.status}`);
    }

    const repos = await reposResponse.json();
    console.log("Raw repos data length:", repos.length);

    const nonForkRepos = repos.filter((repo: any) => !repo.fork);
    console.log(`Fetched ${repos.length} repositories, ${nonForkRepos.length} non-fork repositories`);

    const publicRepos = nonForkRepos.filter((repo: any) => !repo.private).length;
    const privateRepos = nonForkRepos.filter((repo: any) => repo.private).length;
    
    const totalStars = nonForkRepos.reduce((sum: number, repo: any) => {
      const stars = repo.stargazers_count || 0;
      console.log(`Repo ${repo.name} has ${stars} stars`);
      return sum + stars;
    }, 0);
    console.log(`Total stars: ${totalStars}`);
    
    let totalPullRequests = 0;
    let totalIssues = 0;
    
    const repoDetailsPromises = nonForkRepos.map(async (repo: any) => {
      console.log(`Processing repo: ${repo.name}`);
      try {
        const prsResponse = await fetch(`${repo.url}/pulls?state=all&per_page=1`, {
          headers: {
            Authorization: `token ${GITHUB_TOKEN}`,
            "User-Agent": siteConfig.siteName
          }
        });
        
        console.log(`PRs response status for ${repo.name}: ${prsResponse.status}`);
        if (prsResponse.ok) {
          const prLinkHeader = prsResponse.headers.get('Link');
          console.log(`PRs link header for ${repo.name}: ${prLinkHeader}`);
          if (prLinkHeader) {
            const lastPageMatch = prLinkHeader.match(/page=(\d+)>; rel="last"/);
            if (lastPageMatch) {
              const prCount = parseInt(lastPageMatch[1]) || 0;
              totalPullRequests += prCount;
              console.log(`Repo ${repo.name} has ${prCount} PRs (from pagination)`);
            } else {
              const prsData = await prsResponse.json();
              console.log(`PRs data for ${repo.name} (first item):`, prsData[0] || "No PRs");
              const prCount = Array.isArray(prsData) ? prsData.length : 0;
              totalPullRequests += prCount;
              console.log(`Repo ${repo.name} has ${prCount} PRs (no pagination)`);
            }
          } else {
            const prsData = await prsResponse.json();
            console.log(`PRs data for ${repo.name} (first item):`, prsData[0] || "No PRs");
            const prCount = Array.isArray(prsData) ? prsData.length : 0;
            totalPullRequests += prCount;
            console.log(`Repo ${repo.name} has ${prCount} PRs (no link header)`);
          }
        } else {
          console.warn(`Failed to fetch PRs for ${repo.name}: ${prsResponse.status}`);
        }
      } catch (error) {
        console.warn(`Error fetching PRs for ${repo.name}:`, error);
      }
      
      try {
        const issuesResponse = await fetch(`${repo.url}/issues?state=all&per_page=1`, {
          headers: {
            Authorization: `token ${GITHUB_TOKEN}`,
            "User-Agent": siteConfig.siteName
          }
        });
        
        console.log(`Issues response status for ${repo.name}: ${issuesResponse.status}`);
        if (issuesResponse.ok) {
          const issuesLinkHeader = issuesResponse.headers.get('Link');
          console.log(`Issues link header for ${repo.name}: ${issuesLinkHeader}`);
          if (issuesLinkHeader) {
            const lastPageMatch = issuesLinkHeader.match(/page=(\d+)>; rel="last"/);
            if (lastPageMatch) {
              const issueCount = parseInt(lastPageMatch[1]) || 0;
              totalIssues += issueCount;
              console.log(`Repo ${repo.name} has ${issueCount} issues (from pagination)`);
            } else {
              const issuesData = await issuesResponse.json();
              console.log(`Issues data for ${repo.name} (first item):`, issuesData[0] || "No issues");
              const issueCount = Array.isArray(issuesData) ? issuesData.length : 0;
              totalIssues += issueCount;
              console.log(`Repo ${repo.name} has ${issueCount} issues (no pagination)`);
            }
          } else {
            const issuesData = await issuesResponse.json();
            console.log(`Issues data for ${repo.name} (first item):`, issuesData[0] || "No issues");
            const issueCount = Array.isArray(issuesData) ? issuesData.length : 0;
            totalIssues += issueCount;
            console.log(`Repo ${repo.name} has ${issueCount} issues (no link header)`);
          }
        } else {
          console.warn(`Failed to fetch issues for ${repo.name}: ${issuesResponse.status}`);
        }
      } catch (error) {
        console.warn(`Error fetching issues for ${repo.name}:`, error);
      }
    });
    
    await Promise.all(repoDetailsPromises);
    console.log(`Total PRs: ${totalPullRequests}, Total Issues: ${totalIssues}`);

    const languageStats: { [key: string]: number } = {};
    let totalSize = 0;

    const languagePromises = nonForkRepos.map(async (repo: any) => {
      console.log(`Fetching languages for repo: ${repo.name}`);
      console.log(`Languages URL: ${repo.languages_url}`);
      const langResponse = await fetch(repo.languages_url, {
        headers: {
          Authorization: `token ${GITHUB_TOKEN}`,
          "User-Agent": siteConfig.siteName
        }
      });

      if (langResponse.ok) {
        const languages = await langResponse.json();
        console.log(`Languages for ${repo.name}:`, Object.keys(languages));
        return languages;
      }
      console.log(`Failed to fetch languages for ${repo.name}: ${langResponse.status}`);
      return {};
    });

    const repoLanguages = await Promise.all(languagePromises);

    repoLanguages.forEach((langs, index) => {
      const repoName = nonForkRepos[index]?.name || 'unknown';
      console.log(`Processing languages for repo ${repoName}:`, Object.keys(langs));
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

    const result = {
      contributions,
      totalRepositories: nonForkRepos.length,
      publicRepositories: publicRepos,
      privateRepositories: privateRepos,
      totalStars,
      totalPullRequests,
      totalIssues,
      languages
    };

    console.log('Final stats result:', result);

    return result;

  } catch (error) {
    console.error('Error in fetchGitHubStats:', error);
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
    console.log("User GraphQL data:", userData?.data?.user?.createdAt);
    
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
    console.log(`Contributions data for ${year}:`, result?.data?.user?.contributionsCollection?.contributionCalendar?.totalContributions);
    
    if (result.errors) {
      console.warn(`GraphQL errors for ${year}:`, result.errors);
      continue;
    }
    
    total += result.data.user.contributionsCollection.contributionCalendar.totalContributions;
  }

  console.log(`Total contributions: ${total}`);
  return total;
}