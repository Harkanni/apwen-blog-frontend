import { getPosts, getSettings } from '@/lib/api';
import { SITE_URL } from '@/lib/format';

export const revalidate = 300;

const esc = (s: string) => s.replace(/[<>&'"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' })[c]!);

export async function GET() {
  const [{ posts }, settings] = await Promise.all([getPosts({ limit: 30, order: 'latest' }), getSettings()]);
  const items = posts
    .map(
      (p) => `<item>
  <title>${esc(p.title)}</title>
  <link>${SITE_URL}/stories/${p.slug}</link>
  <guid isPermaLink="true">${SITE_URL}/stories/${p.slug}</guid>
  <pubDate>${new Date(p.published_at!).toUTCString()}</pubDate>
  <category>${esc(p.category)}</category>
  <description>${esc(p.subtitle || p.excerpt)}</description>
</item>`,
    )
    .join('\n');
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"><channel>
<title>${esc(settings.siteName)}</title>
<link>${SITE_URL}</link>
<description>${esc(settings.tagline)}</description>
<language>en-ng</language>
${items}
</channel></rss>`;
  return new Response(xml, { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' } });
}
