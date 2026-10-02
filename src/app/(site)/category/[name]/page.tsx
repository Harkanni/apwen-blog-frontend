import type { Metadata } from 'next';
import Link from 'next/link';
import { getCategories, getPosts } from '@/lib/api';
import { CategoryRail, EmptyState, StoryGrid } from '@/components/site/Stories';
import { Pagination } from '@/components/site/Pagination';
import { categoryFromParam } from '@/lib/format';

export const revalidate = 60;

type Props = { params: Promise<{ name: string }>; searchParams: Promise<{ page?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { name } = await params;
  const cats = await getCategories();
  const match = cats.find((c) => c.name.toLowerCase() === categoryFromParam(name).toLowerCase());
  return { title: match?.name ?? categoryFromParam(name) };
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const { name } = await params;
  const page = Math.max(1, Number((await searchParams).page) || 1);
  const wanted = categoryFromParam(name);
  const [list, cats] = await Promise.all([getPosts({ category: wanted, page, limit: 12, order: 'latest' }), getCategories()]);
  const display = cats.find((c) => c.name.toLowerCase() === wanted.toLowerCase())?.name ?? wanted.replace(/^\w/, (c) => c.toUpperCase());

  return (
    <div className="wrap pt-8 md:pt-16">
      <h1 className="text-[2.4rem] leading-none font-[720] tracking-[-0.045em] md:text-[4rem]">{display}</h1>
      <p className="mt-3 text-ink-soft">
        {list.total} {list.total === 1 ? 'story' : 'stories'}
      </p>
      <div className="mt-8 md:mt-10">
        <CategoryRail categories={cats} active={display} />
      </div>
      <div className="mt-10 md:mt-14">
        {list.posts.length ? (
          <StoryGrid posts={list.posts} />
        ) : (
          <EmptyState
            title={`No ${display.toLowerCase()} stories yet`}
            body="Check back soon, or browse everything we have published."
            action={
              <Link href="/" className="btn btn-soft">
                See all stories
              </Link>
            }
          />
        )}
      </div>
      <Pagination page={page} pages={list.pages} base={`/category/${name}`} />
    </div>
  );
}
