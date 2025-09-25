import { defineCollection, z } from 'astro:content';

const posts = defineCollection({
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.date(),
    tags: z.array(z.string()).optional(),
    category: z.string().optional(),
    pin: z.boolean().optional(),
  }),
});

const repos = defineCollection({
  schema: z.object({
    title: z.string(),
    description: z.string(),
    tags: z.array(z.string()).optional(),
    repoUrl: z.string().optional(),
    languages: z.array(z.string()).optional(),
    category: z.string().optional(),
    pin: z.boolean().optional(),
  }),
});

export const collections = {
  posts,
  repos
};