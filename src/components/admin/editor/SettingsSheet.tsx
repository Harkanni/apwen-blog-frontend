'use client';

import { useEffect, useState } from 'react';
import { History, RotateCcw, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Sheet, Switch } from '@/components/ui/Sheet';
import { api } from '@/lib/client-api';
import type { JSONNode, Revision } from '@/lib/types';
import { cn, formatDate, timeAgo } from '@/lib/format';

export type StoryFields = {
  title: string;
  subtitle: string;
  cover_image: string | null;
  cover_alt: string;
  category: string;
  tags: string[];
  excerpt: string;
  slug: string;
  author_name: string;
  featured: boolean;
};

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  fields: StoryFields;
  onChange: (patch: Partial<StoryFields>) => void;
  categories: string[];
  postId: number | null;
  isLive: boolean;
  words: number;
  autoExcerpt: string;
  onRestore: (rev: { title: string; content: JSONNode }) => void;
};

export function SettingsSheet({ open, onOpenChange, fields, onChange, categories, postId, isLive, words, autoExcerpt, onRestore }: Props) {
  const [tagInput, setTagInput] = useState('');
  const [revisions, setRevisions] = useState<Revision[] | null>(null);
  const [restoring, setRestoring] = useState<number | null>(null);

  useEffect(() => {
    if (!open || !postId) return;
    api<{ revisions: Revision[] }>(`/api/admin/posts/${postId}/revisions`)
      .then((r) => setRevisions(r.revisions))
      .catch(() => setRevisions([]));
  }, [open, postId]);

  const addTag = (raw: string) => {
    const t = raw.trim().replace(/,$/, '');
    if (!t) return;
    if (fields.tags.some((x) => x.toLowerCase() === t.toLowerCase())) return setTagInput('');
    onChange({ tags: [...fields.tags, t].slice(0, 12) });
    setTagInput('');
  };

  const allCats = [...new Set([...(categories.length ? categories : ['News']), fields.category].filter(Boolean))];

  return (
    <Sheet open={open} onOpenChange={onOpenChange} title="Story settings" description={`${words.toLocaleString()} words, about ${Math.max(1, Math.round(words / 230))} min read`} variant="side">
      <div className="space-y-7 pb-6 pt-2">
        <section>
          <p className="label">Topic</p>
          <div className="flex flex-wrap gap-2">
            {allCats.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => onChange({ category: c })}
                aria-pressed={fields.category === c}
                className={cn('h-10 rounded-full px-4 text-[0.92rem] font-[580] transition-colors', fields.category === c ? 'bg-iris text-white' : 'bg-mist text-ink-soft hover:bg-mist-deep')}
              >
                {c}
              </button>
            ))}
          </div>
          <p className="mt-2 text-[0.8rem] text-ink-faint">Manage the list of topics in Settings.</p>
        </section>

        <section>
          <label className="label" htmlFor="tags">
            Tags
          </label>
          <div className="flex min-h-12 flex-wrap items-center gap-1.5 rounded-[var(--radius-sm)] bg-mist p-1.5 focus-within:bg-white focus-within:shadow-[0_0_0_2px_var(--color-iris)]">
            {fields.tags.map((t) => (
              <span key={t} className="inline-flex h-8 items-center gap-1 rounded-full bg-white pl-3 pr-1 text-[0.85rem] font-[560] text-iris-deep shadow-[var(--shadow-lift)]">
                {t}
                <button type="button" aria-label={`Remove tag ${t}`} className="grid size-6 place-items-center rounded-full hover:bg-mist" onClick={() => onChange({ tags: fields.tags.filter((x) => x !== t) })}>
                  <X className="size-3.5" />
                </button>
              </span>
            ))}
            <input
              id="tags"
              value={tagInput}
              onChange={(e) => (e.target.value.endsWith(',') ? addTag(e.target.value) : setTagInput(e.target.value))}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addTag(tagInput);
                }
                if (e.key === 'Backspace' && !tagInput && fields.tags.length) onChange({ tags: fields.tags.slice(0, -1) });
              }}
              onBlur={() => addTag(tagInput)}
              placeholder={fields.tags.length ? 'Add another' : 'e.g. Mentorship, Lagos'}
              enterKeyHint="done"
              className="h-9 min-w-[8rem] flex-1 bg-transparent px-2 text-base outline-none placeholder:text-ink-faint"
            />
          </div>
        </section>

        <section>
          <label className="label" htmlFor="excerpt">
            Short summary
          </label>
          <textarea
            id="excerpt"
            rows={3}
            maxLength={300}
            value={fields.excerpt}
            onChange={(e) => onChange({ excerpt: e.target.value })}
            placeholder={autoExcerpt || 'Shown on story cards and when shared on social media. Leave empty to use the first lines of the story.'}
            className="field resize-none leading-relaxed"
          />
          <p className="mt-1 flex justify-between gap-3 text-[0.78rem] text-ink-faint">
            <span>{fields.excerpt ? 'Written by you' : 'Leave empty to use the first lines of the story'}</span>
            <span className="tabular-nums">{fields.excerpt.length}/300</span>
          </p>
        </section>

        <section>
          <label className="label" htmlFor="slug">
            Web address
          </label>
          <div className="flex items-center rounded-[var(--radius-sm)] bg-mist pl-4 focus-within:bg-white focus-within:shadow-[0_0_0_2px_var(--color-iris)]">
            <span className="shrink-0 text-[0.9rem] text-ink-faint">/stories/</span>
            <input
              id="slug"
              value={fields.slug}
              onChange={(e) => onChange({ slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, '-') })}
              className="h-12 min-w-0 flex-1 bg-transparent pr-3 text-base outline-none"
              autoCapitalize="none"
              autoCorrect="off"
            />
          </div>
          {isLive && <p className="mt-1.5 text-[0.8rem] text-[#9a5f0c]">This story is live. Changing its address breaks links people have already shared.</p>}
        </section>

        <section>
          <label className="label" htmlFor="author">
            Byline
          </label>
          <input id="author" className="field" value={fields.author_name} onChange={(e) => onChange({ author_name: e.target.value })} placeholder="e.g. APWEN Editorial" />
        </section>

        <Switch checked={fields.featured} onChange={(featured) => onChange({ featured })} label="Feature on the home page" hint="Featured stories take the top spot on the blog." />

        {postId && (
          <section>
            <p className="label flex items-center gap-2">
              <History className="size-4" /> Earlier versions
            </p>
            {revisions === null ? (
              <div className="skeleton h-14" />
            ) : revisions.length === 0 ? (
              <p className="rounded-[var(--radius-sm)] bg-mist px-4 py-3 text-[0.88rem] text-ink-soft">Versions are saved automatically as you write and each time you publish.</p>
            ) : (
              <ul className="space-y-1">
                {revisions.slice(0, 12).map((r) => (
                  <li key={r.id} className="flex items-center justify-between gap-3 rounded-[var(--radius-sm)] px-3 py-2.5 hover:bg-mist">
                    <div className="min-w-0">
                      <p className="truncate text-[0.9rem] font-[580]">{r.reason === 'publish' ? 'Published version' : r.reason === 'manual' ? 'Saved version' : 'Autosaved'}</p>
                      <p className="text-[0.78rem] text-ink-faint" title={formatDate(r.created_at, { dateStyle: 'medium', timeStyle: 'short' })}>
                        {timeAgo(r.created_at)}
                      </p>
                    </div>
                    <button
                      type="button"
                      className="btn btn-soft btn-sm shrink-0"
                      disabled={restoring === r.id}
                      onClick={async () => {
                        setRestoring(r.id);
                        try {
                          const { revision } = await api<{ revision: { title: string; content: JSONNode } }>(`/api/admin/revisions/${r.id}`);
                          onRestore(revision);
                          toast('Version restored', { description: 'Review it, then save or publish when ready.' });
                          onOpenChange(false);
                        } catch (e: any) {
                          toast.error(e.message);
                        } finally {
                          setRestoring(null);
                        }
                      }}
                    >
                      {restoring === r.id ? <Loader2 className="size-4 animate-spin" /> : <RotateCcw className="size-4" />} Restore
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}
      </div>
    </Sheet>
  );
}
