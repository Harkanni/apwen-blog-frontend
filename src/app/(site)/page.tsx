import Link from 'next/link';
import { getCategories, getPosts, getSettings } from '@/lib/api';
import { CategoryRail, EmptyState, LeadStory, StoryGrid } from '@/components/site/Stories';
import { FollowBand } from '@/components/site/Footer';
import { Pagination } from '@/components/site/Pagination';

export const revalidate = 60;

export default async function HomePage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);
  const [list, categories, settings] = await Promise.all([getPosts({ page, limit: 13 }), getCategories(), getSettings()]);
  const [lead, ...rest] = page === 1 ? list.posts : [undefined, ...list.posts];

  return (
    <>
      <div className="wrap pt-0 md:pt-10">
        {lead ? (
          <LeadStory post={lead} />
        ) : (
          <div className="pt-8">
            <EmptyState
              title="The first story is on its way"
              body="Published stories will appear here. Editors can write one in the studio."
              action={
                <Link href="/admin" className="btn btn-primary">
                  Open the studio
                </Link>
              }
            />
          </div>
        )}
      </div>

      {list.total > 0 && (
        <section className="wrap mt-14 md:mt-20" aria-labelledby="latest">
          <div className="mb-6 flex flex-col gap-4 md:mb-10 md:flex-row md:items-end md:justify-between">
            <h2 id="latest" className="text-[1.6rem] font-[680] tracking-[-0.03em] md:text-[2rem]">
              {page === 1 ? 'Latest stories' : `Stories, page ${page}`}
            </h2>
            <CategoryRail categories={categories} />
          </div>
          <StoryGrid posts={rest as typeof list.posts} />
          <Pagination page={page} pages={list.pages} base="/" />
        </section>
      )}

      <FollowBand settings={settings} />
    </>
  );
}
