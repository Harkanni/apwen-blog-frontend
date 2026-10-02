'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { EditorContent, useEditor, type Editor } from '@tiptap/react';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowLeft, Eye, SlidersHorizontal, Loader2, CloudOff, Check, ExternalLink, Trash2, Undo, Rocket, Save } from 'lucide-react';
import { toast } from 'sonner';
import { api, ApiError, revalidate, uploadImage } from '@/lib/client-api';
import type { JSONNode, Post } from '@/lib/types';
import { useStudio } from '@/components/admin/AuthGate';
import { ActionMenu } from '@/components/ui/ActionMenu';
import { Confirm, Sheet, StatePill, useIsDesktop } from '@/components/ui/Sheet';
import { buildExtensions } from './extensions';
import { Toolbar, LinkSheet } from './Toolbar';
import { SelectionBubble } from './SelectionBubble';
import { CoverPicker, validateImage } from './CoverPicker';
import { SettingsSheet, type StoryFields } from './SettingsSheet';
import { PublishSheet } from './PublishSheet';
import { PreviewOverlay, type PreviewData } from './PreviewOverlay';
import { uploadProgress } from './Figure';
import { cn, timeAgo } from '@/lib/format';

type SaveState = 'idle' | 'dirty' | 'saving' | 'saved' | 'error' | 'offline';
const EMPTY_DOC: JSONNode = { type: 'doc', content: [{ type: 'paragraph' }] };
const backupKey = (id: number | null) => `apwen:backup:${id ?? 'new'}`;

function fieldsFrom(post: Partial<Post> | null, fallbackAuthor: string, defaultCategory: string): StoryFields {
  return {
    title: post?.title ?? '',
    subtitle: post?.subtitle ?? '',
    cover_image: post?.cover_image ?? null,
    cover_alt: post?.cover_alt ?? '',
    category: post?.category || defaultCategory,
    tags: post?.tags ?? [],
    excerpt: post?.excerpt ?? '',
    slug: post?.slug ?? '',
    author_name: post?.author_name || fallbackAuthor,
    featured: post?.featured ?? false,
  };
}

/** Keeps the phone toolbar sitting just above the on-screen keyboard. */
function useKeyboardInset() {
  const [inset, setInset] = useState(0);
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const update = () => setInset(Math.max(0, window.innerHeight - vv.height - vv.offsetTop));
    update();
    vv.addEventListener('resize', update);
    vv.addEventListener('scroll', update);
    return () => {
      vv.removeEventListener('resize', update);
      vv.removeEventListener('scroll', update);
    };
  }, []);
  return inset;
}

function AutoTextarea({
  value,
  onChange,
  className,
  onEnter,
  inputRef,
  ...rest
}: Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'onChange'> & {
  value: string;
  onChange: (v: string) => void;
  onEnter?: () => void;
  inputRef?: React.RefObject<HTMLTextAreaElement | null>;
}) {
  const ref = useRef<HTMLTextAreaElement | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = '0px';
    el.style.height = `${el.scrollHeight}px`;
  }, [value]);
  return (
    <textarea
      ref={(el) => {
        ref.current = el;
        if (inputRef) inputRef.current = el;
      }}
      rows={1}
      value={value}
      onChange={(e) => onChange(e.target.value.replace(/\n/g, ' '))}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          onEnter?.();
        }
      }}
      className={cn('block w-full resize-none overflow-hidden bg-transparent outline-none', className)}
      {...rest}
    />
  );
}

export function StoryEditor({ initialId }: { initialId: number | null }) {
  const router = useRouter();
  const desktop = useIsDesktop();
  const { user, settings } = useStudio();
  const keyboard = useKeyboardInset();

  const [postId, setPostId] = useState<number | null>(initialId);
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(initialId !== null);
  const [fields, setFields] = useState<StoryFields>(() => fieldsFrom(null, user.name, settings?.categories[0] || 'News'));
  const [save, setSave] = useState<SaveState>('idle');
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [focused, setFocused] = useState(false);
  const [panel, setPanel] = useState<null | 'settings' | 'publish' | 'link' | 'video' | 'trash' | 'conflict' | 'unpublish' | 'recover'>(null);
  const [preview, setPreview] = useState(false);
  const [words, setWords] = useState(0);
  const [videoUrl, setVideoUrl] = useState('');
  const [recovery, setRecovery] = useState<null | { fields: StoryFields; content: JSONNode; at: string }>(null);
  const [, forceTick] = useState(0);

  const fileInput = useRef<HTMLInputElement>(null);
  const replacePos = useRef<number | null>(null);
  const subtitleRef = useRef<HTMLTextAreaElement>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const backupTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savingRef = useRef(false);
  const pendingRef = useRef(false);
  const updatedAtRef = useRef<string | null>(null);
  const postIdRef = useRef<number | null>(initialId);
  const fieldsRef = useRef(fields);
  fieldsRef.current = fields;
  const postRef = useRef(post);
  postRef.current = post;

  // Published stories don't change on the blog until the editor presses Update;
  // drafts save to the server automatically.
  const isLive = post?.status === 'published';
  const liveRef = useRef(isLive);
  liveRef.current = isLive;

  const editor = useEditor({
    extensions: buildExtensions(),
    content: EMPTY_DOC,
    immediatelyRender: false,
    shouldRerenderOnTransaction: false,
    editorProps: {
      attributes: {
        class: 'rich outline-none min-h-[45dvh] pb-[40dvh] md:pb-[30dvh]',
        spellcheck: 'true',
        'aria-label': 'Story text',
      },
      handleDrop: (view, event, _slice, moved) => {
        const files = Array.from(event.dataTransfer?.files || []).filter((f) => f.type.startsWith('image/'));
        if (moved || !files.length) return false;
        event.preventDefault();
        const coords = view.posAtCoords({ left: event.clientX, top: event.clientY });
        insertImagesRef.current?.(files, coords?.pos);
        return true;
      },
      handlePaste: (_view, event) => {
        const files = Array.from(event.clipboardData?.files || []).filter((f) => f.type.startsWith('image/'));
        if (!files.length) return false;
        event.preventDefault();
        insertImagesRef.current?.(files);
        return true;
      },
    },
    onUpdate: () => markDirtyRef.current?.(),
    onFocus: () => setFocused(true),
    onBlur: () => setTimeout(() => setFocused(document.activeElement?.closest('.ProseMirror') != null), 120),
  });

  // ---------------------------------------------------------------- loading
  useEffect(() => {
    if (!editor) return;
    let cancelled = false;
    (async () => {
      let server: Post | null = null;
      if (initialId !== null) {
        try {
          server = (await api<{ post: Post }>(`/api/admin/posts/${initialId}`)).post;
        } catch (e) {
          if (e instanceof ApiError && e.status === 404) {
            toast.error('That story no longer exists.');
            router.replace('/admin');
            return;
          }
          toast.error((e as Error).message);
        }
      }
      if (cancelled) return;
      if (server) {
        setPost(server);
        updatedAtRef.current = server.updated_at;
        setLastSaved(server.updated_at);
        setFields(fieldsFrom(server, user.name, settings?.categories[0] || 'News'));
        editor.commands.setContent(server.content?.content?.length ? server.content : EMPTY_DOC, { emitUpdate: false });
      }
      setWords(editor.storage.characterCount?.words?.() ?? 0);
      // Offer to recover unsaved work kept on this device.
      try {
        const raw = localStorage.getItem(backupKey(initialId));
        if (raw) {
          const b = JSON.parse(raw);
          const serverTime = server ? Date.parse(server.updated_at) : 0;
          if (Date.parse(b.at) > serverTime + 1000 && (b.fields?.title || b.content)) setRecovery(b);
          else localStorage.removeItem(backupKey(initialId));
        }
      } catch {}
      setLoading(false);
      if (!server && initialId === null) setTimeout(() => document.getElementById('story-title')?.focus(), 50);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor, initialId]);

  useEffect(() => {
    if (recovery) setPanel('recover');
  }, [recovery]);

  // ---------------------------------------------------------------- saving
  const payload = useCallback(() => {
    const f = fieldsRef.current;
    return {
      title: f.title,
      subtitle: f.subtitle,
      cover_image: f.cover_image,
      cover_alt: f.cover_alt,
      category: f.category,
      tags: f.tags,
      excerpt: f.excerpt,
      author_name: f.author_name,
      featured: f.featured,
      ...(f.slug && f.slug !== postRef.current?.slug ? { slug: f.slug } : {}),
      content: editor?.getJSON(),
    };
  }, [editor]);

  const writeBackup = useCallback(() => {
    if (backupTimer.current) clearTimeout(backupTimer.current);
    backupTimer.current = setTimeout(() => {
      try {
        localStorage.setItem(backupKey(postIdRef.current), JSON.stringify({ fields: fieldsRef.current, content: editor?.getJSON(), at: new Date().toISOString() }));
      } catch {}
    }, 400);
  }, [editor]);

  const clearBackup = () => {
    try {
      localStorage.removeItem(backupKey(postIdRef.current));
      localStorage.removeItem(backupKey(null));
    } catch {}
  };

  /** Save to the server. `extra` lets publish/unpublish piggy-back on the same request. */
  const persist = useCallback(
    async (extra: Record<string, unknown> = {}, opts: { force?: boolean; revision?: boolean } = {}): Promise<Post | null> => {
      if (!editor) return null;
      if (savingRef.current) {
        pendingRef.current = true;
        return null;
      }
      savingRef.current = true;
      setSave('saving');
      try {
        let saved: Post;
        if (postIdRef.current === null) {
          saved = (await api<{ post: Post }>('/api/admin/posts', { method: 'POST', json: { ...payload(), ...extra } })).post;
          postIdRef.current = saved.id;
          setPostId(saved.id);
          try {
            localStorage.removeItem(backupKey(null));
          } catch {}
          window.history.replaceState(null, '', `/admin/write/${saved.id}`);
        } else {
          saved = (
            await api<{ post: Post }>(`/api/admin/posts/${postIdRef.current}`, {
              method: 'PATCH',
              json: { ...payload(), ...extra, expected_updated_at: updatedAtRef.current, force: opts.force, revision: opts.revision },
            })
          ).post;
        }
        updatedAtRef.current = saved.updated_at;
        setPost(saved);
        setLastSaved(saved.updated_at);
        // Server may adjust the address (uniqueness) or derive a summary.
        setFields((f) => ({ ...f, slug: saved.slug, excerpt: f.excerpt || '' }));
        setSave('saved');
        clearBackup();
        return saved;
      } catch (e) {
        if (e instanceof ApiError && e.status === 409) {
          setSave('error');
          setPanel('conflict');
        } else if (e instanceof ApiError && e.status === 0) {
          setSave('offline');
        } else {
          setSave('error');
          toast.error((e as Error).message);
        }
        return null;
      } finally {
        savingRef.current = false;
        if (pendingRef.current) {
          pendingRef.current = false;
          if (!liveRef.current) scheduleSaveRef.current?.(400);
        }
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [editor, payload],
  );

  const scheduleSave = useCallback(
    (delay = 1100) => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => persist(), delay);
    },
    [persist],
  );
  const scheduleSaveRef = useRef(scheduleSave);
  scheduleSaveRef.current = scheduleSave;

  const markDirty = useCallback(() => {
    setSave('dirty');
    writeBackup();
    setWords(editor?.storage.characterCount?.words?.() ?? 0);
    if (!liveRef.current) scheduleSave();
  }, [editor, scheduleSave, writeBackup]);
  const markDirtyRef = useRef(markDirty);
  markDirtyRef.current = markDirty;

  const update = (patch: Partial<StoryFields>) => {
    setFields((f) => ({ ...f, ...patch }));
    fieldsRef.current = { ...fieldsRef.current, ...patch };
    markDirty();
  };

  // Retry automatically when the connection returns.
  useEffect(() => {
    const online = () => save === 'offline' && !liveRef.current && persist();
    window.addEventListener('online', online);
    return () => window.removeEventListener('online', online);
  }, [save, persist]);

  // Warn before leaving with unsaved work.
  useEffect(() => {
    const before = (e: BeforeUnloadEvent) => {
      if (save === 'dirty' || save === 'saving' || save === 'offline' || save === 'error') {
        e.preventDefault();
      }
    };
    window.addEventListener('beforeunload', before);
    return () => window.removeEventListener('beforeunload', before);
  }, [save]);

  // Relative "saved 2 minutes ago" label refresh.
  useEffect(() => {
    const t = setInterval(() => forceTick((n) => n + 1), 30_000);
    return () => clearInterval(t);
  }, []);

  // ---------------------------------------------------------------- images
  const insertImages = useCallback(
    async (files: File[], at?: number) => {
      if (!editor) return;
      for (const file of files) {
        const problem = validateImage(file);
        if (problem) {
          toast.error(problem);
          continue;
        }
        const uploadId = Math.random().toString(36).slice(2);
        const blob = URL.createObjectURL(file);
        const node = { type: 'image', attrs: { src: blob, alt: '', caption: '', layout: 'normal', uploadId } };

        if (replacePos.current !== null) {
          const pos = replacePos.current;
          replacePos.current = null;
          const current = editor.state.doc.nodeAt(pos);
          if (current?.type.name === 'image') {
            editor.view.dispatch(editor.state.tr.setNodeMarkup(pos, undefined, { ...current.attrs, src: blob, uploadId }));
          }
        } else if (typeof at === 'number') {
          editor.chain().insertContentAt(at, node).run();
        } else {
          editor.chain().focus().insertContent([node, { type: 'paragraph' }]).run();
        }

        const findPos = () => {
          let found: number | null = null;
          editor.state.doc.descendants((n, pos) => {
            if (found === null && n.type.name === 'image' && n.attrs.uploadId === uploadId) found = pos;
            return found === null;
          });
          return found;
        };

        try {
          const media = await uploadImage(file, (p) => uploadProgress.set(uploadId, p));
          const pos = findPos();
          if (pos !== null) {
            const n = editor.state.doc.nodeAt(pos)!;
            const tr = editor.state.tr.setNodeMarkup(pos, undefined, { ...n.attrs, src: media.url, width: media.width, height: media.height, uploadId: null });
            editor.view.dispatch(tr);
          }
        } catch (e) {
          toast.error((e as Error).message || 'Upload failed.');
          const pos = findPos();
          if (pos !== null) {
            const n = editor.state.doc.nodeAt(pos)!;
            editor.view.dispatch(editor.state.tr.delete(pos, pos + n.nodeSize));
          }
        } finally {
          uploadProgress.set(uploadId, null);
          URL.revokeObjectURL(blob);
        }
      }
    },
    [editor],
  );
  const insertImagesRef = useRef(insertImages);
  insertImagesRef.current = insertImages;

  useEffect(() => {
    const pick = (e: Event) => {
      replacePos.current = (e as CustomEvent).detail?.replacePos ?? null;
      fileInput.current?.click();
    };
    const video = () => {
      setVideoUrl('');
      setPanel('video');
    };
    window.addEventListener('apwen:pick-image', pick);
    window.addEventListener('apwen:embed-video', video);
    return () => {
      window.removeEventListener('apwen:pick-image', pick);
      window.removeEventListener('apwen:embed-video', video);
    };
  }, []);

  // ---------------------------------------------------------------- actions
  async function publish(when: string | null) {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    const saved = await persist({ status: 'published', published_at: when ?? new Date().toISOString() }, { force: false });
    if (saved) {
      revalidate(saved.slug);
      return saved.slug;
    }
    return null;
  }

  async function updateLive() {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    const saved = await persist({}, { revision: true });
    if (saved) {
      revalidate(saved.slug);
      toast(saved.state === 'scheduled' ? 'Scheduled story updated' : 'Changes are live', { icon: <Check className="size-4" /> });
    }
  }

  async function unpublish() {
    const saved = await persist({ status: 'draft', published_at: null });
    if (saved) {
      revalidate(saved.slug);
      toast('Moved back to drafts. It’s no longer on the blog.');
    }
  }

  async function trash() {
    if (!postIdRef.current) {
      clearBackup();
      router.push('/admin');
      return;
    }
    await api(`/api/admin/posts/${postIdRef.current}/trash`, { method: 'POST' });
    clearBackup();
    if (post?.status === 'published') revalidate(post.slug);
    const id = postIdRef.current;
    toast('Moved to trash', {
      action: { label: 'Undo', onClick: () => api(`/api/admin/posts/${id}/restore`, { method: 'POST' }).then(() => router.push(`/admin/write/${id}`)) },
    });
    router.push('/admin');
  }

  // Keyboard shortcuts: Ctrl/Cmd+S saves, Ctrl/Cmd+K adds a link.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key.toLowerCase() === 's') {
        e.preventDefault();
        if (liveRef.current) updateLive();
        else persist({}, { revision: true }).then((p) => p && toast('Saved'));
      }
      if (mod && e.key.toLowerCase() === 'k' && editor?.isFocused) {
        e.preventDefault();
        setPanel('link');
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const previewData: PreviewData = useMemo(
    () => ({
      title: fields.title,
      subtitle: fields.subtitle,
      category: fields.category,
      cover_image: fields.cover_image,
      cover_alt: fields.cover_alt,
      content: preview && editor ? (editor.getJSON() as JSONNode) : EMPTY_DOC,
      reading_minutes: Math.max(1, Math.round(words / 230)),
      published_at: post?.published_at ?? null,
      author_name: fields.author_name,
      tags: fields.tags,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [preview, fields, words, post?.published_at],
  );

  const hasBody = !!editor && !editor.isEmpty;
  const state = post?.state ?? 'draft';

  if (!editor || loading) return <EditorSkeleton />;

  return (
    <div className="min-h-dvh bg-white">
      <input
        ref={fileInput}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
        multiple
        className="hidden"
        onChange={(e) => {
          const files = Array.from(e.target.files || []);
          e.target.value = '';
          if (files.length) insertImages(files);
        }}
      />

      {/* ------------------------------------------------ Top bar */}
      <header className="sticky top-0 z-40 bg-white/88 pt-[env(safe-area-inset-top)] backdrop-blur-xl backdrop-saturate-150">
        <div className="flex h-[60px] items-center gap-1.5 px-2 md:gap-2 md:px-4">
          <Link href="/admin" className="btn btn-ghost btn-icon" aria-label="Back to stories">
            <ArrowLeft className="size-5" />
          </Link>
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <span className="hidden sm:inline-flex">
              <StatePill state={state} />
            </span>
            <SaveIndicator state={save} live={isLive} lastSaved={lastSaved} />
          </div>
          <button className="btn btn-ghost btn-icon" onClick={() => setPreview(true)} aria-label="Preview">
            <Eye className="size-5" />
          </button>
          <button className="btn btn-ghost btn-icon" onClick={() => setPanel('settings')} aria-label="Story settings">
            <SlidersHorizontal className="size-5" />
          </button>
          {isLive ? (
            <button className="btn btn-primary btn-sm h-10 px-4" onClick={updateLive} disabled={save === 'saving' || (save !== 'dirty' && save !== 'error' && save !== 'offline')}>
              {save === 'saving' ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />} Update
            </button>
          ) : (
            <button className="btn btn-primary btn-sm h-10 px-4" onClick={() => setPanel('publish')}>
              <Rocket className="size-4" /> Publish
            </button>
          )}
          <ActionMenu
            title="Story"
            buttonClassName="!size-10"
            items={[
              { label: 'View on blog', icon: ExternalLink, onSelect: () => window.open(`/stories/${post?.slug}`, '_blank'), hidden: state !== 'published' },
              { label: 'Save a version now', icon: Save, onSelect: () => persist({}, { revision: true }).then((p) => p && toast('Version saved')), hidden: isLive || !postId },
              { label: 'Unpublish', icon: Undo, onSelect: () => setPanel('unpublish'), hidden: !isLive },
              { label: 'Move to trash', icon: Trash2, onSelect: () => setPanel('trash'), danger: true },
            ]}
          />
        </div>

        {/* Desktop toolbar: a floating pill under the top bar */}
        {desktop && (
          <div className="flex justify-center px-4 pb-2">
            <div className="rounded-[18px] bg-white shadow-[var(--shadow-lift)]">
              <Toolbar editor={editor} variant="top" onPickImage={() => fileInput.current?.click()} onLink={() => setPanel('link')} />
            </div>
          </div>
        )}
      </header>

      {isLive && save === 'dirty' && (
        <div className="mx-auto mt-2 max-w-[680px] px-5">
          <p className="rounded-[var(--radius-sm)] bg-gold-soft px-4 py-2.5 text-[0.88rem] text-[#7a4b08]">
            This story is live. Your edits are kept on this device and go public when you press <strong>Update</strong>.
          </p>
        </div>
      )}

      {/* ------------------------------------------------ Canvas */}
      <main className="pb-32">
        <div className="pt-2 md:pt-6">
          <CoverPicker value={fields.cover_image} alt={fields.cover_alt} onChange={(cover_image) => update({ cover_image })} onAltChange={(cover_alt) => update({ cover_alt })} />
        </div>

        <div className="mx-auto max-w-[860px] px-5 pt-8 md:px-8 md:pt-12 md:text-center">
          <button type="button" onClick={() => setPanel('settings')} className="rounded-full text-[0.95rem] font-[600] text-iris hover:text-iris-deep">
            {fields.category || 'Choose a topic'}
          </button>
          <AutoTextarea
            id="story-title"
            value={fields.title}
            onChange={(title) => update({ title })}
            onEnter={() => subtitleRef.current?.focus()}
            placeholder="Title"
            aria-label="Title"
            maxLength={200}
            className="mt-2 text-[2.1rem] leading-[1.06] font-[720] tracking-[-0.04em] text-ink placeholder:text-ink/20 md:text-center md:text-[3.4rem]"
          />
          <AutoTextarea
            inputRef={subtitleRef}
            value={fields.subtitle}
            onChange={(subtitle) => update({ subtitle })}
            onEnter={() => editor.commands.focus('start')}
            placeholder="Add a subtitle (optional)"
            aria-label="Subtitle"
            maxLength={300}
            className="mt-3 font-serif text-[1.15rem] leading-relaxed text-ink-soft placeholder:text-ink/25 md:text-center md:text-[1.3rem]"
          />
        </div>

        <div className="px-5 pt-8 md:px-8 md:pt-12">
          <EditorContent editor={editor} />
        </div>
      </main>

      {desktop && <SelectionBubble editor={editor} onLink={() => setPanel('link')} />}

      {/* Phone toolbar pinned above the keyboard */}
      {!desktop && (
        <AnimatePresence>
          {(focused || keyboard > 0) && (
            <motion.div
              className="fixed inset-x-0 bottom-0 z-40 bg-white/95 shadow-[0_-1px_0_rgb(30_15_46/0.06),0_-8px_24px_-12px_rgb(30_15_46/0.15)] backdrop-blur-xl"
              style={{ transform: `translateY(-${keyboard}px)`, paddingBottom: keyboard > 0 ? 0 : 'env(safe-area-inset-bottom)' }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.18 }}
              onMouseDown={(e) => e.preventDefault()}
            >
              <Toolbar editor={editor} variant="bottom" onPickImage={() => fileInput.current?.click()} onLink={() => setPanel('link')} />
            </motion.div>
          )}
        </AnimatePresence>
      )}
      {!desktop && !focused && keyboard === 0 && (
        <p className="pointer-events-none fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+12px)] text-center text-[0.78rem] text-ink-faint">
          {words.toLocaleString()} words
        </p>
      )}

      {/* ------------------------------------------------ Overlays */}
      <LinkSheet editor={editor} open={panel === 'link'} onOpenChange={(v) => setPanel(v ? 'link' : null)} />

      <SettingsSheet
        open={panel === 'settings'}
        onOpenChange={(v) => setPanel(v ? 'settings' : null)}
        fields={fields}
        onChange={update}
        categories={settings?.categories ?? []}
        postId={postId}
        isLive={isLive}
        words={words}
        onRestore={(rev) => {
          editor.commands.setContent(rev.content);
          update({ title: rev.title });
        }}
      />

      <PublishSheet
        open={panel === 'publish'}
        onOpenChange={(v) => setPanel(v ? 'publish' : null)}
        title={fields.title}
        hasCover={!!fields.cover_image}
        hasBody={hasBody}
        featured={fields.featured}
        onFeaturedChange={(featured) => update({ featured })}
        onPublish={publish}
      />

      <Sheet
        open={panel === 'video'}
        onOpenChange={(v) => setPanel(v ? 'video' : null)}
        title="Add a YouTube video"
        footer={
          <button
            className="btn btn-primary w-full md:w-auto"
            disabled={!/youtu\.?be/.test(videoUrl)}
            onClick={() => {
              const ok = editor.chain().focus().setYoutubeVideo({ src: videoUrl.trim() }).run();
              if (!ok) toast.error('That doesn’t look like a YouTube link.');
              setPanel(null);
            }}
          >
            Add video
          </button>
        }
      >
        <label className="label" htmlFor="yt">
          Video link
        </label>
        <input id="yt" className="field" value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="https://www.youtube.com/watch?v=…" inputMode="url" autoFocus />
      </Sheet>

      <Confirm
        open={panel === 'trash'}
        onOpenChange={(v) => setPanel(v ? 'trash' : null)}
        danger
        title="Move this story to the trash?"
        body={isLive ? 'It will be removed from the blog straight away. You can restore it from the trash.' : 'You can restore it from the trash later.'}
        confirmLabel="Move to trash"
        onConfirm={trash}
      />

      <Confirm
        open={panel === 'unpublish'}
        onOpenChange={(v) => setPanel(v ? 'unpublish' : null)}
        title="Unpublish this story?"
        body="It will be taken off the blog and kept as a draft. Links to it will stop working until you publish again."
        confirmLabel="Unpublish"
        onConfirm={unpublish}
      />

      <Sheet
        open={panel === 'conflict'}
        onOpenChange={(v) => setPanel(v ? 'conflict' : null)}
        title="This story changed somewhere else"
        description="It was edited in another tab or by someone else since you opened it."
        footer={
          <div className="flex flex-col gap-2 md:flex-row md:justify-end">
            <button
              className="btn btn-soft"
              onClick={async () => {
                const fresh = (await api<{ post: Post }>(`/api/admin/posts/${postIdRef.current}`)).post;
                setPost(fresh);
                updatedAtRef.current = fresh.updated_at;
                setFields(fieldsFrom(fresh, user.name, 'News'));
                editor.commands.setContent(fresh.content, { emitUpdate: false });
                setSave('saved');
                setPanel(null);
              }}
            >
              Load their version
            </button>
            <button
              className="btn btn-primary"
              onClick={async () => {
                setPanel(null);
                await persist({}, { force: true });
              }}
            >
              Keep my version
            </button>
          </div>
        }
      >
        <span />
      </Sheet>

      <Sheet
        open={panel === 'recover'}
        onOpenChange={(v) => {
          if (!v) {
            setRecovery(null);
            setPanel(null);
          }
        }}
        title="Unsaved changes found"
        description={recovery ? `This device has changes from ${timeAgo(recovery.at)} that weren’t saved. Restore them?` : ''}
        footer={
          <div className="flex flex-col gap-2 md:flex-row md:justify-end">
            <button
              className="btn btn-soft"
              onClick={() => {
                clearBackup();
                setRecovery(null);
                setPanel(null);
              }}
            >
              Discard them
            </button>
            <button
              className="btn btn-primary"
              onClick={() => {
                if (recovery) {
                  setFields(recovery.fields);
                  fieldsRef.current = recovery.fields;
                  if (recovery.content) editor.commands.setContent(recovery.content);
                  markDirty();
                }
                setRecovery(null);
                setPanel(null);
              }}
            >
              Restore changes
            </button>
          </div>
        }
      >
        <span />
      </Sheet>

      <PreviewOverlay open={preview} onClose={() => setPreview(false)} data={previewData} />
    </div>
  );
}

function SaveIndicator({ state, live, lastSaved }: { state: SaveState; live: boolean; lastSaved: string | null }) {
  const content =
    state === 'saving' ? (
      <>
        <Loader2 className="size-3.5 animate-spin" /> Saving
      </>
    ) : state === 'offline' ? (
      <span className="flex items-center gap-1.5 text-[#9a5f0c]">
        <CloudOff className="size-3.5" /> Offline, kept on device
      </span>
    ) : state === 'error' ? (
      <span className="text-danger">Not saved</span>
    ) : state === 'dirty' ? (
      live ? 'Unpublished changes' : 'Editing'
    ) : state === 'saved' ? (
      <>
        <Check className="size-3.5 text-success" /> Saved
      </>
    ) : lastSaved ? (
      `Saved ${timeAgo(lastSaved)}`
    ) : (
      'New story'
    );
  return (
    <span className="flex min-w-0 items-center gap-1.5 truncate text-[0.82rem] text-ink-faint" aria-live="polite">
      {content}
    </span>
  );
}

function EditorSkeleton() {
  return (
    <div className="mx-auto max-w-[860px] px-5 pt-20" aria-busy="true" aria-label="Loading story">
      <div className="skeleton h-40 md:h-64" />
      <div className="skeleton mx-auto mt-10 h-10 w-4/5" />
      <div className="skeleton mx-auto mt-4 h-5 w-3/5" />
      <div className="mt-10 space-y-3">
        <div className="skeleton h-4" />
        <div className="skeleton h-4" />
        <div className="skeleton h-4 w-2/3" />
      </div>
    </div>
  );
}

export type { Editor };
