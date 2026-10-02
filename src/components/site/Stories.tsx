import Link from 'next/link';
import type { PostSummary } from '@/lib/types';
import { categoryHref, cn, formatDate, formatShortDate } from '@/lib/format';

function Cover({ post, className, sizes, priority }: { post: PostSummary; className?: string; sizes?: string; priority?: boolean }) {
  if (!post.cover_image) {
    // Branded placeholder: a truss line on lilac, so cards never look broken.
    return (
      <div className={cn('grid place-items-center bg-mist-deep', className)} aria-hidden>
        <svg viewBox="0 0 120 60" className="w-1/3 text-iris/40">
          <path d="M6 50h108M14 50 26 18l12 32 12-32 12 32 12-32 12 32 12-32 12 32M26 18h84" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" />
        </svg>
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={post.cover_image}
      alt={post.cover_alt || ''}
      className={cn('bg-mist object-cover', className)}
      loading={priority ? 'eager' : 'lazy'}
      fetchPriority={priority ? 'high' : 'auto'}
      decoding="async"
      sizes={sizes}
    />
  );
}

/** The opening story: the one big typographic moment on the home page. */
export function LeadStory({ post }: { post: PostSummary }) {
  return (
    <article className="group relative animate-rise">
      <Link href={`/stories/${post.slug}`} className="block md:grid md:grid-cols-12 md:items-center md:gap-10">
        <div className="-mx-5 overflow-hidden md:col-span-7 md:mx-0 md:rounded-[var(--radius-xl)]">
          <Cover post={post} priority className="aspect-[4/3] w-full transition-transform duration-700 ease-[var(--ease-out-quint)] group-hover:scale-[1.025] md:aspect-[5/4]" />
        </div>
        <div className="pt-6 md:col-span-5 md:pt-0">
          <p className="text-[0.9rem] font-[600] text-iris">{post.category}</p>
          <h1 className="mt-2 text-[2.15rem] leading-[1.04] font-[700] tracking-[-0.04em] text-balance text-ink md:text-[3.1rem] lg:text-[3.6rem]">
            {post.title}
          </h1>
          {(post.subtitle || post.excerpt) && (
            <p className="mt-4 text-[1.06rem] leading-relaxed text-ink-soft text-pretty md:text-[1.15rem]">{post.subtitle || post.excerpt}</p>
          )}
          <p className="dimension mt-6 max-w-sm">
            {formatDate(post.published_at)} &nbsp;/&nbsp; {post.reading_minutes} min read
          </p>
        </div>
      </Link>
    </article>
  );
}

/** Compact row on phones, tile with excerpt on larger screens. */
export function StoryCard({ post, index = 0 }: { post: PostSummary; index?: number }) {
  return (
    <article className="group" style={{ animationDelay: `${Math.min(index, 6) * 50}ms` }}>
      <Link href={`/stories/${post.slug}`} className="flex gap-4 md:flex-col md:gap-0">
        <div className="size-[104px] shrink-0 overflow-hidden rounded-[14px] md:aspect-[16/10] md:size-auto md:w-full md:rounded-[var(--radius-lg)]">
          <Cover post={post} className="size-full transition-transform duration-500 ease-[var(--ease-out-quint)] group-hover:scale-[1.04]" />
        </div>
        <div className="min-w-0 flex-1 md:pt-5">
          <p className="text-[0.8rem] font-[600] text-iris md:text-[0.85rem]">{post.category}</p>
          <h3 className="mt-1 line-clamp-3 text-[1.08rem] leading-[1.22] font-[650] tracking-[-0.02em] text-ink transition-colors group-hover:text-iris-deep md:text-[1.35rem] md:line-clamp-none">
            {post.title}
          </h3>
          <p className="mt-2 hidden text-[0.97rem] leading-relaxed text-ink-soft md:line-clamp-3 md:block">{post.subtitle || post.excerpt}</p>
          <p className="mt-1.5 text-[0.8rem] text-ink-faint md:mt-3 md:text-[0.85rem]">
            {formatShortDate(post.published_at)}<span className="mx-2 inline-block size-[3px] translate-y-[-3px] rounded-full bg-current opacity-60" />{post.reading_minutes} min read
          </p>
        </div>
      </Link>
    </article>
  );
}

export function StoryGrid({ posts, className }: { posts: PostSummary[]; className?: string }) {
  return (
    <div className={cn('grid gap-x-8 gap-y-7 md:grid-cols-2 md:gap-y-14 lg:grid-cols-3', className)}>
      {posts.map((p, i) => (
        <StoryCard key={p.id} post={p} index={i} />
      ))}
    </div>
  );
}

export function CategoryRail({ categories, active }: { categories: { name: string; count?: number }[]; active?: string }) {
  if (!categories.length) return null;
  const items = [{ name: 'All', href: '/' }, ...categories.map((c) => ({ name: c.name, href: categoryHref(c.name) }))];
  return (
    <nav aria-label="Topics" className="no-scrollbar -mx-5 overflow-x-auto px-5 md:mx-0 md:px-0">
      <ul className="flex w-max gap-2">
        {items.map((c) => {
          const isActive = (active ?? 'All').toLowerCase() === c.name.toLowerCase();
          return (
            <li key={c.href}>
              <Link
                href={c.href}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  'inline-flex h-10 items-center rounded-full px-4 text-[0.92rem] font-[560] transition-colors',
                  isActive ? 'bg-ink text-white' : 'bg-mist text-ink-soft hover:bg-mist-deep hover:text-ink',
                )}
              >
                {c.name}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export function EmptyState({ title, body, action }: { title: string; body: string; action?: React.ReactNode }) {
  return (
    <div className="rounded-[var(--radius-xl)] bg-mist px-6 py-14 text-center">
      <h2 className="text-xl font-[650] tracking-[-0.02em]">{title}</h2>
      <p className="mx-auto mt-2 max-w-sm text-ink-soft">{body}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
