'use client';

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Upload, Copy, Trash2, Loader2, ImageOff } from 'lucide-react';
import { toast } from 'sonner';
import { api, uploadImage } from '@/lib/client-api';
import type { Media } from '@/lib/types';
import { Sheet } from '@/components/ui/Sheet';
import { validateImage } from '@/components/admin/editor/CoverPicker';
import { cn, formatDate } from '@/lib/format';

export default function MediaPage() {
  const [items, setItems] = useState<Media[] | null>(null);
  const [uploading, setUploading] = useState<{ name: string; pct: number }[]>([]);
  const [open, setOpen] = useState<Media | null>(null);
  const [over, setOver] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  const load = () =>
    api<{ media: Media[] }>('/api/admin/media')
      .then((r) => setItems(r.media))
      .catch((e) => toast.error(e.message));
  useEffect(() => {
    load();
  }, []);

  async function upload(files: File[]) {
    for (const file of files) {
      const problem = validateImage(file);
      if (problem) {
        toast.error(`${file.name}: ${problem}`);
        continue;
      }
      setUploading((u) => [...u, { name: file.name, pct: 0 }]);
      try {
        const m = await uploadImage(file, (pct) => setUploading((u) => u.map((x) => (x.name === file.name ? { ...x, pct } : x))));
        setItems((list) => [m, ...(list ?? [])]);
      } catch (e: any) {
        toast.error(e.message);
      } finally {
        setUploading((u) => u.filter((x) => x.name !== file.name));
      }
    }
  }

  return (
    <div
      className="mx-auto max-w-[1100px] px-5 pt-[max(20px,env(safe-area-inset-top))] md:px-10 md:pt-10"
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={(e) => e.currentTarget === e.target && setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        upload(Array.from(e.dataTransfer.files));
      }}
    >
      <input ref={input} type="file" multiple accept="image/jpeg,image/png,image/webp,image/gif,image/avif" className="hidden" onChange={(e) => (upload(Array.from(e.target.files || [])), (e.target.value = ''))} />
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-[2.1rem] font-[720] tracking-[-0.04em] md:text-[2.6rem]">Images</h1>
          <p className="mt-1 text-[0.95rem] text-ink-soft">Every photo uploaded to the blog. Drop images anywhere on this page to upload.</p>
        </div>
        <button className="btn btn-primary shrink-0" onClick={() => input.current?.click()}>
          <Upload className="size-[18px]" /> <span className="hidden sm:inline">Upload</span>
        </button>
      </div>

      <div className={cn('mt-8 rounded-[var(--radius-xl)] transition-colors', over && 'bg-mist ring-2 ring-iris ring-offset-4')}>
        {items === null ? (
          <div className="grid grid-cols-3 gap-1.5 md:grid-cols-5 md:gap-3">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="skeleton aspect-square" />
            ))}
          </div>
        ) : items.length === 0 && uploading.length === 0 ? (
          <div className="rounded-[var(--radius-xl)] bg-mist px-6 py-16 text-center">
            <ImageOff className="mx-auto size-8 text-iris/50" />
            <h2 className="mt-3 text-lg font-[650]">No images yet</h2>
            <p className="mx-auto mt-1 max-w-xs text-[0.95rem] text-ink-soft">Images you add to stories appear here too.</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-1.5 md:grid-cols-5 md:gap-3">
            {uploading.map((u) => (
              <div key={u.name} className="grid aspect-square place-items-center rounded-[12px] bg-mist text-[0.8rem] text-ink-soft">
                <span className="flex items-center gap-1.5">
                  <Loader2 className="size-4 animate-spin" /> {u.pct}%
                </span>
              </div>
            ))}
            <AnimatePresence initial={false}>
              {items.map((m) => (
                <motion.button
                  key={m.id}
                  layout
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  onClick={() => setOpen(m)}
                  className="group relative aspect-square overflow-hidden rounded-[12px] bg-mist"
                  aria-label={`Image ${m.original_name || m.filename}`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={m.url} alt="" loading="lazy" className="size-full object-cover transition-transform duration-500 group-hover:scale-105" />
                </motion.button>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      <Sheet open={!!open} onOpenChange={(v) => !v && setOpen(null)} title={open?.original_name || 'Image'}>
        {open && (
          <div className="pb-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={open.url} alt="" className="max-h-[50dvh] w-full rounded-[var(--radius-md)] bg-mist object-contain" />
            <dl className="mt-4 grid grid-cols-2 gap-y-1.5 text-[0.88rem]">
              <dt className="text-ink-faint">Size</dt>
              <dd>
                {open.width && open.height ? `${open.width} × ${open.height} px, ` : ''}
                {(open.size / 1024 / 1024).toFixed(1)} MB
              </dd>
              <dt className="text-ink-faint">Uploaded</dt>
              <dd>{formatDate(open.created_at)}</dd>
            </dl>
            <div className="mt-5 flex flex-col gap-2 md:flex-row">
              <button
                className="btn btn-soft"
                onClick={() =>
                  navigator.clipboard.writeText(`${window.location.origin}${open.url}`).then(
                    () => toast('Image link copied'),
                    () => toast('Couldn’t copy the link'),
                  )
                }
              >
                <Copy className="size-[18px]" /> Copy link
              </button>
              <button
                className="btn btn-ghost text-danger hover:bg-danger-soft hover:text-danger"
                onClick={async () => {
                  try {
                    await api(`/api/admin/media/${open.id}`, { method: 'DELETE' });
                    setItems((list) => list?.filter((x) => x.id !== open.id) ?? null);
                    setOpen(null);
                    toast('Image deleted');
                  } catch (e: any) {
                    toast.error(e.message);
                  }
                }}
              >
                <Trash2 className="size-[18px]" /> Delete image
              </button>
            </div>
          </div>
        )}
      </Sheet>
    </div>
  );
}
