import type { Post, PostSummary } from '@/lib/types';
import { RichContent } from '@/components/content/RichContent';
import { categoryHref, formatDate } from '@/lib/format';

/**
 * The story layout, used by the public page and by the studio preview so both
 * are pixel-identical. Keep anything interactive out of this component.
 */
export function StoryView({ post, preview = false }: { post: Pick<Post, 'title' | 'subtitle' | 'category' | 'cover_image' | 'cover_alt' | 'content' | 'reading_minutes' | 'published_at' | 'author_name' | 'tags'>; preview?: boolean }) {
  const Category = preview ? 'span' : 'a';
  return (
    <article>
      <header className="wrap max-w-[860px] pt-8 text-left md:pt-16 md:text-center">
        <Category {...(!preview ? { href: categoryHref(post.category || 'News') } : {})} className="inline-block text-[0.95rem] font-[600] text-iris">
          {post.category || 'News'}
        </Category>
        <h1 className="mt-3 text-[2.1rem] leading-[1.05] font-[720] tracking-[-0.04em] text-balance text-ink md:text-[3.4rem] lg:text-[3.9rem]">
          {post.title || 'Untitled story'}
        </h1>
        {post.subtitle && (
          <p className="mx-auto mt-4 max-w-[640px] font-serif text-[1.15rem] leading-relaxed text-ink-soft text-pretty md:mt-5 md:text-[1.3rem]">
            {post.subtitle}
          </p>
        )}
        <div className="mx-auto mt-7 max-w-[560px] md:mt-9">
          <p className="dimension">
            <span className="whitespace-nowrap">{post.author_name}</span>
            <span aria-hidden className="opacity-40">/</span>
            <span className="whitespace-nowrap">{post.published_at ? formatDate(post.published_at) : 'Not yet published'}</span>
            <span aria-hidden className="opacity-40">/</span>
            <span className="whitespace-nowrap">{post.reading_minutes || 1} min read</span>
          </p>
        </div>
      </header>

      {post.cover_image && (
        <figure className="mx-auto mt-8 max-w-[1100px] md:mt-12 md:px-8">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={post.cover_image}
            alt={post.cover_alt || ''}
            className="aspect-[16/10] w-full bg-mist object-cover md:rounded-[var(--radius-xl)]"
            fetchPriority="high"
          />
        </figure>
      )}

      <div id="story-body" className="px-5 pt-10 md:px-8 md:pt-14">
        <RichContent doc={post.content} dropCap />
      </div>

      {post.tags?.length > 0 && (
        <div className="mx-auto mt-12 flex max-w-[680px] flex-wrap gap-2 px-5 md:px-0">
          {post.tags.map((t) => (
            <span key={t} className="rounded-full bg-mist px-3.5 py-1.5 text-[0.85rem] font-[550] text-iris-deep">
              {t}
            </span>
          ))}
        </div>
      )}
    </article>
  );
}

export type { PostSummary };
