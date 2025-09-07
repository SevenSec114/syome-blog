import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';

export const GET: APIRoute = async () => {
  try {
    const repos = await getCollection('repos');
    const sortedRepos = repos.sort((a, b) => b.slug.localeCompare(a.slug));
    
    const serializedRepos = sortedRepos.map(repo => ({
      slug: repo.slug,
      title: repo.data.title,
      description: repo.data.description,
      tags: repo.data.tags || [],
    }));

    return new Response(JSON.stringify(serializedRepos), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      }
    });
  } catch (error) {
    console.error('Error fetching repos:', error);
    
    return new Response(JSON.stringify({ error: 'Failed to fetch repos' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
};