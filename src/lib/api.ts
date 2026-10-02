import 'server-only';
import type { Post, PostList, PostSummary, Settings } from './types';

const API_URL = (process.env.API_URL || 'http://localhost:4000').replace(/\/$/, '');

/** Server-side fetch to the API with ISR caching. Pages refresh every minute,
 *  and immediately when the studio publishes (see app/revalidate/route.ts). */
async function get<T>(path: string, { revalidate = 60 } = {}): Promise<T | null> {
  try {
    const res = await fetch(`${API_URL}${path}`, { next: { revalidate, tags: ['content'] } });
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`API ${res.status} for ${path}`);
    return (await res.json()) as T;
  } catch (err) {
    console.error('[api]', (err as Error).message);
    return null;
  }
}

const EMPTY_LIST: PostList = { posts: [], page: 1, pages: 1, total: 0, limit: 12 };

export async function getPosts(params: Record<string, string | number | undefined> = {}): Promise<PostList> {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== '') qs.set(k, String(v));
  return (await get<PostList>(`/api/posts?${qs}`)) ?? EMPTY_LIST;
}

export async function getPost(slug: string) {
  return get<{ post: Post; related: PostSummary[] }>(`/api/posts/${encodeURIComponent(slug)}`);
}

export async function getCategories() {
  return (await get<{ categories: { name: string; count: number }[] }>('/api/categories'))?.categories ?? [];
}

export const FALLBACK_SETTINGS: Settings = {
  siteName: 'APWEN Blog',
  tagline: 'Stories, ideas and milestones from women engineering Nigeria’s future.',
  about: 'The Association of Professional Women Engineers of Nigeria.',
  instagram: '',
  facebook: '',
  website: 'https://apwen.org.ng',
  contactEmail: '',
  categories: [],
};

export async function getSettings(): Promise<Settings> {
  return (await get<{ settings: Settings }>('/api/settings'))?.settings ?? FALLBACK_SETTINGS;
}

export async function getSitemapEntries() {
  return (await get<{ posts: { slug: string; updated_at: string }[] }>('/api/sitemap', { revalidate: 300 }))?.posts ?? [];
}

export const API_BASE = API_URL;
