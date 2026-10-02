import type { Metadata } from 'next';
import { getPosts } from '@/lib/api';
import { EmptyState, StoryGrid } from '@/components/site/Stories';
import { Pagination } from '@/components/site/Pagination';
import { SearchBox } from '@/components/site/SearchBox';

export const metadata: Metadata = { title: 'Search', robots: { index: false } };

type Props = { searchParams: Promise<{ q?: string; page?: string }> };

export default async function SearchPage({ searchParams }: Props) {
  const { q = '', page: p } = await searchParams;
  const page = Math.max(1, Number(p) || 1);
  const list = q.trim() ? await getPosts({ q: q.trim(), page, limit: 12, order: 'latest' }) : null;

  return (
    <div className="wrap max-w-[900px] pt-8 md:pt-16">
      <h1 className="text-[2.2rem] font-[720] tracking-[-0.04em] md:text-[3rem]">Search</h1>
      <SearchBox initial={q} />
      {list && (
        <p className="mt-6 text-ink-soft" aria-live="polite">
          {list.total === 0 ? 'No stories match that search.' : `${list.total} ${list.total === 1 ? 'story matches' : 'stories match'} “${q}”`}
        </p>
      )}
      <div className="mt-8">
        {list && list.posts.length > 0 && <StoryGrid posts={list.posts} className="lg:grid-cols-2" />}
        {list && list.posts.length === 0 && <EmptyState title="Nothing found" body="Try a shorter phrase, or a topic like ‘outreach’ or ‘energy’." />}
      </div>
      {list && <Pagination page={page} pages={list.pages} base={`/search?q=${encodeURIComponent(q)}`} />}
    </div>
  );
}
