'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Search, PenLine, Pencil, ExternalLink, Copy, Trash2, RotateCcw, X, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { api, revalidate } from '@/lib/client-api';
import type { PostState, PostSummary } from '@/lib/types';
import { useStudio } from '@/components/admin/AuthGate';
import { ActionMenu } from '@/components/ui/ActionMenu';
import { Confirm, StatePill } from '@/components/ui/Sheet';
import { cn, formatShortDate, timeAgo } from '@/lib/format';

type Tab = 'all' | 'draft' | 'published' | 'scheduled' | 'trash';
const TABS: { key: Tab; label: string; stat: string }[] = [
  { key: 'all', label: 'All', stat: 'all_posts' },
  { key: 'draft', label: 'Drafts', stat: 'draft' },
  { key: 'published', label: 'Published', stat: 'published' },
  { key: 'scheduled', label: 'Scheduled', stat: 'scheduled' },
  { key: 'trash', label: 'Trash', stat: 'trash' },
];

export default function StoriesPage() {
  return (
    <Suspense>
      <Stories />
    </Suspense>
  );
}

function Stories() {
  const { user } = useStudio();
  const router = useRouter();
  const params = useSearchParams();
  const tab = (params.get('state') as Tab) || 'all';
  const [q, setQ] = useState('');
  const [posts, setPosts] = useState<PostSummary[] | null>(null);
  const [stats, setStats] = useState<Record<string, number>>({});
  const [confirm, setConfirm] = useState<null | { kind: 'delete'; post: PostSummary } | { kind: 'empty' }>(null);

  const load = useCallback(async () => {
    const qs = new URLSearchParams({ state: tab });
    if (q.trim()) qs.set('q', q.trim());
    const [list, s] = await Promise.all([api<{ posts: PostSummary[] }>(`/api/admin/posts?${qs}`), api<Record<string, number>>('/api/admin/stats')]);
    setPosts(list.posts);
    setStats(s);
  }, [tab, q]);

  useEffect(() => {
    const t = setTimeout(() => load().catch((e) => toast.error(e.message)), q ? 220 : 0);
    return () => clearTimeout(t);
  }, [load, q]);

  const setTab = (t: Tab) => {
    setPosts(null);
    router.replace(t === 'all' ? '/admin' : `/admin?state=${t}`, { scroll: false });
  };

  const remove = (id: number) => setPosts((list) => list?.filter((p) => p.id !== id) ?? null);

  async function moveToTrash(post: PostSummary) {
    remove(post.id);
    setStats((s) => ({ ...s, trash: (s.trash || 0) + 1, all_posts: (s.all_posts || 1) - 1 }));
    try {
      await api(`/api/admin/posts/${post.id}/trash`, { method: 'POST' });
      if (post.state === 'published') revalidate(post.slug);
      toast('Moved to trash', {
        description: post.title || 'Untitled story',
        action: {
          label: 'Undo',
          onClick: async () => {
            await api(`/api/admin/posts/${post.id}/restore`, { method: 'POST' });
            if (post.state === 'published') revalidate(post.slug);
            load();
          },
        },
      });
    } catch (e: any) {
      toast.error(e.message);
      load();
    }
  }

  async function restore(post: PostSummary) {
    remove(post.id);
    await api(`/api/admin/posts/${post.id}/restore`, { method: 'POST' });
    if (post.status === 'published') revalidate(post.slug);
    toast('Restored', { description: post.title || 'Untitled story' });
    load();
  }

  async function duplicate(post: PostSummary) {
    const { post: copy } = await api<{ post: PostSummary }>(`/api/admin/posts/${post.id}/duplicate`, { method: 'POST' });
    toast('Copy created as a draft');
    router.push(`/admin/write/${copy.id}`);
  }

  const firstName = user.name.split(' ')[0];
  const greeting = useMemo(() => {
    const h = Number(new Intl.DateTimeFormat('en-GB', { hour: 'numeric', hour12: false, timeZone: 'Africa/Lagos' }).format(new Date()));
    return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  }, []);

  return (
    <div className="mx-auto max-w-[980px] px-5 pt-[max(20px,env(safe-area-inset-top))] md:px-10 md:pt-10">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-[0.95rem] text-ink-soft">
            {greeting}, {firstName}
          </p>
          <h1 className="mt-0.5 text-[2.1rem] font-[720] tracking-[-0.04em] md:text-[2.6rem]">Stories</h1>
        </div>
        <Link href="/admin/write/new" className="btn btn-primary hidden md:inline-flex">
          <PenLine className="size-[18px]" /> New story
        </Link>
      </div>

      {/* Tabs */}
      <div className="no-scrollbar -mx-5 mt-6 overflow-x-auto px-5 md:mx-0 md:px-0">
        <div className="flex w-max gap-1.5 rounded-full bg-mist p-1" role="tablist">
          {TABS.map((t) => (
            <button
              key={t.key}
              role="tab"
              aria-selected={tab === t.key}
              onClick={() => setTab(t.key)}
              className={cn('relative h-9 rounded-full px-3.5 text-[0.9rem] font-[600] transition-colors', tab === t.key ? 'text-ink' : 'text-ink-soft hover:text-ink')}
            >
              {tab === t.key && (
                <motion.span layoutId="tab-pill" className="absolute inset-0 rounded-full bg-white shadow-[var(--shadow-lift)]" transition={{ type: 'spring', stiffness: 500, damping: 38 }} />
              )}
              <span className="relative">
                {t.label}
                {stats[t.stat] ? <span className="ml-1.5 tabular-nums text-ink-faint">{stats[t.stat]}</span> : null}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Search */}
      <div className="mt-4 flex items-center gap-2">
        <label className="relative flex-1">
          <Search className="pointer-events-none absolute left-4 top-1/2 size-[18px] -translate-y-1/2 text-ink-faint" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search your stories"
            aria-label="Search your stories"
            className="field rounded-full pl-11"
            enterKeyHint="search"
          />
          {q && (
            <button onClick={() => setQ('')} aria-label="Clear search" className="absolute right-2 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-full text-ink-faint hover:bg-white">
              <X className="size-4" />
            </button>
          )}
        </label>
        {tab === 'trash' && (posts?.length ?? 0) > 0 && (
          <button className="btn btn-ghost text-danger hover:bg-danger-soft hover:text-danger" onClick={() => setConfirm({ kind: 'empty' })}>
            Empty trash
          </button>
        )}
      </div>

      {tab === 'trash' && <p className="mt-4 text-[0.88rem] text-ink-faint">Stories in the trash are hidden from the blog. Restore them any time, or delete them for good.</p>}

      {/* List */}
      <div className="mt-4 pb-10">
        {posts === null ? (
          <ListSkeleton />
        ) : posts.length === 0 ? (
          <Empty tab={tab} searching={!!q} />
        ) : (
          <ul className="-mx-2 md:mx-0">
            <AnimatePresence initial={false}>
              {posts.map((post) => (
                <motion.li
                  key={post.id}
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, x: -24, transition: { duration: 0.18 } }}
                  transition={{ layout: { type: 'spring', stiffness: 500, damping: 40 } }}
                >
                  <Row
                    post={post}
                    onTrash={() => moveToTrash(post)}
                    onRestore={() => restore(post)}
                    onDuplicate={() => duplicate(post)}
                    onDelete={() => setConfirm({ kind: 'delete', post })}
                  />
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        )}
      </div>

      <Confirm
        open={!!confirm}
        onOpenChange={(v) => !v && setConfirm(null)}
        danger
        title={confirm?.kind === 'empty' ? 'Empty the trash?' : 'Delete this story for good?'}
        body={
          confirm?.kind === 'empty'
            ? `All ${posts?.length ?? ''} stories in the trash will be permanently deleted. This can’t be undone.`
            : `“${confirm?.kind === 'delete' ? confirm.post.title || 'Untitled story' : ''}” will be permanently deleted. This can’t be undone.`
        }
        confirmLabel={confirm?.kind === 'empty' ? 'Empty trash' : 'Delete for good'}
        onConfirm={async () => {
          if (confirm?.kind === 'empty') {
            const r = await api<{ deleted: number }>('/api/admin/trash/empty', { method: 'POST' });
            toast(`Deleted ${r.deleted} ${r.deleted === 1 ? 'story' : 'stories'}`);
          } else if (confirm?.kind === 'delete') {
            await api(`/api/admin/posts/${confirm.post.id}`, { method: 'DELETE' });
            toast('Story deleted');
          }
          load();
        }}
      />
    </div>
  );
}

function Row({
  post,
  onTrash,
  onRestore,
  onDuplicate,
  onDelete,
}: {
  post: PostSummary;
  onTrash: () => void;
  onRestore: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}) {
  const router = useRouter();
  const trashed = post.state === 'trash';
  const when =
    post.state === 'published'
      ? `Published ${formatShortDate(post.published_at)}`
      : post.state === 'scheduled'
        ? `Goes live ${formatShortDate(post.published_at)}`
        : post.state === 'trash'
          ? `Trashed ${timeAgo(post.deleted_at)}`
          : `Edited ${timeAgo(post.updated_at)}`;

  return (
    <div
      className={cn('group flex items-center gap-3.5 rounded-[var(--radius-md)] px-2 py-2.5 transition-colors md:gap-4 md:px-3', !trashed && 'cursor-pointer hover:bg-mist active:bg-mist')}
      onClick={() => !trashed && router.push(`/admin/write/${post.id}`)}
    >
      <div className="size-14 shrink-0 overflow-hidden rounded-[12px] bg-mist-deep md:size-16">
        {post.cover_image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={post.cover_image} alt="" className="size-full object-cover" loading="lazy" />
        ) : (
          <div className="grid size-full place-items-center text-iris/40">
            <FileText className="size-6" />
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className={cn('truncate text-[1.02rem] font-[620] tracking-[-0.01em]', post.title ? 'text-ink' : 'text-ink-faint')}>{post.title || 'Untitled story'}</p>
        <div className="mt-1 flex items-center gap-2">
          <StatePill state={post.state as PostState} />
          <span className="truncate text-[0.82rem] text-ink-faint">{when}</span>
        </div>
      </div>
      {trashed ? (
        <div className="flex shrink-0 items-center gap-1">
          <button className="btn btn-soft btn-sm" onClick={onRestore}>
            <RotateCcw className="size-4" /> <span className="hidden sm:inline">Restore</span>
          </button>
          <button className="btn btn-ghost btn-icon btn-sm text-danger hover:bg-danger-soft hover:text-danger" onClick={onDelete} aria-label="Delete for good">
            <Trash2 className="size-[18px]" />
          </button>
        </div>
      ) : (
        <div onClick={(e) => e.stopPropagation()} className="shrink-0">
          <ActionMenu
            title={post.title || 'Untitled story'}
            items={[
              { label: 'Edit', icon: Pencil, onSelect: () => router.push(`/admin/write/${post.id}`) },
              { label: 'View on blog', icon: ExternalLink, onSelect: () => window.open(`/stories/${post.slug}`, '_blank'), hidden: post.state !== 'published' },
              { label: 'Duplicate', icon: Copy, onSelect: onDuplicate },
              { label: 'Move to trash', icon: Trash2, onSelect: onTrash, danger: true },
            ]}
          />
        </div>
      )}
    </div>
  );
}

function ListSkeleton() {
  return (
    <div className="space-y-2" aria-hidden>
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 py-2.5">
          <div className="skeleton size-14 shrink-0 md:size-16" />
          <div className="flex-1 space-y-2">
            <div className="skeleton h-4 w-3/5" />
            <div className="skeleton h-3 w-1/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

function Empty({ tab, searching }: { tab: Tab; searching: boolean }) {
  const copy = searching
    ? ['No stories match', 'Try a different word from the title or text.']
    : {
        all: ['Write your first story', 'Stories you start appear here, whether they’re drafts or live on the blog.'],
        draft: ['No drafts', 'Stories you’re still working on will wait here.'],
        published: ['Nothing published yet', 'When you publish a story, it shows up here and on the blog.'],
        scheduled: ['Nothing scheduled', 'Pick a future date when publishing and the story goes live by itself.'],
        trash: ['Trash is empty', 'Stories you remove stay here until you delete them for good.'],
      }[tab];
  return (
    <div className="rounded-[var(--radius-xl)] bg-mist px-6 py-14 text-center">
      <h2 className="text-lg font-[650]">{copy[0]}</h2>
      <p className="mx-auto mt-1.5 max-w-xs text-[0.95rem] text-ink-soft">{copy[1]}</p>
      {!searching && (tab === 'all' || tab === 'draft') && (
        <Link href="/admin/write/new" className="btn btn-primary mt-6">
          <PenLine className="size-[18px]" /> New story
        </Link>
      )}
    </div>
  );
}
