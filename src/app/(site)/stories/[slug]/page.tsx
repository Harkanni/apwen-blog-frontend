import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getPost } from '@/lib/api';
import { StoryView } from '@/components/site/StoryView';
import { ReadingProgress, ShareActions } from '@/components/site/StoryChrome';
import { StoryGrid } from '@/components/site/Stories';
import { SITE_URL } from '@/lib/format';

export const revalidate = 60;

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const data = await getPost(slug);
  if (!data) return { title: 'Story not found' };
  const { post } = data;
  const description = post.subtitle || post.excerpt;
  return {
    title: post.title,
    description,
    alternates: { canonical: `/stories/${post.slug}` },
    openGraph: {
      type: 'article',
      title: post.title,
      description,
      publishedTime: post.published_at ?? undefined,
      modifiedTime: post.updated_at,
      tags: post.tags,
      images: post.cover_image ? [{ url: post.cover_image, alt: post.cover_alt }] : undefined,
    },
    twitter: { card: post.cover_image ? 'summary_large_image' : 'summary', title: post.title, description },
  };
}

export default async function StoryPage({ params }: Params) {
  const { slug } = await params;
  const data = await getPost(slug);
  if (!data) notFound();
  const { post, related } = data;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.subtitle || post.excerpt,
    image: post.cover_image ? `${SITE_URL}${post.cover_image}` : undefined,
    datePublished: post.published_at,
    dateModified: post.updated_at,
    author: { '@type': 'Organization', name: post.author_name || 'APWEN' },
    publisher: { '@type': 'Organization', name: 'Association of Professional Women Engineers of Nigeria' },
    mainEntityOfPage: `${SITE_URL}/stories/${post.slug}`,
  };

  return (
    <>
      <ReadingProgress />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />
      <StoryView post={post} />

      <div className="mx-auto mt-12 max-w-[680px] px-5 md:px-0">
        <p className="mb-3 text-sm font-[600] text-ink-soft">Share this story</p>
        <ShareActions title={post.title} />
      </div>

      {related.length > 0 && (
        <section className="mt-20 bg-mist py-14 md:py-20" aria-labelledby="related">
          <div className="wrap">
            <div className="mb-8 flex items-end justify-between gap-4">
              <h2 id="related" className="text-[1.6rem] font-[680] tracking-[-0.03em] md:text-[2rem]">
                Keep reading
              </h2>
              <Link href="/" className="text-[0.95rem] font-[600] text-iris hover:text-iris-deep">
                All stories
              </Link>
            </div>
            <StoryGrid posts={related} />
          </div>
        </section>
      )}
    </>
  );
}
