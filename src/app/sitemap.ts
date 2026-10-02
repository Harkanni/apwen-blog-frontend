import type { MetadataRoute } from 'next';
import { getSitemapEntries } from '@/lib/api';
import { SITE_URL } from '@/lib/format';

export const revalidate = 300;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = await getSitemapEntries();
  return [
    { url: `${SITE_URL}/`, changeFrequency: 'daily', priority: 1 },
    { url: `${SITE_URL}/about`, changeFrequency: 'monthly', priority: 0.4 },
    ...posts.map((p) => ({ url: `${SITE_URL}/stories/${p.slug}`, lastModified: p.updated_at, priority: 0.8 })),
  ];
}
