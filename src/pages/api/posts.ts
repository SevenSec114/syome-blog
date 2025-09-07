import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';

export const GET: APIRoute = async () => {
  try {
    const posts = await getCollection('posts');
    const sortedPosts = posts.sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());
    
    const serializedPosts = sortedPosts.map(post => ({
      slug: post.slug,
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.pubDate.toISOString(),
      tags: post.data.tags || [],
      category: post.data.category || 'Default',
    }));

    return new Response(JSON.stringify(serializedPosts), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      }
    });
  } catch (error) {
    console.error('Error fetching posts:', error);
    
    return new Response(JSON.stringify({ error: 'Failed to fetch posts' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
};