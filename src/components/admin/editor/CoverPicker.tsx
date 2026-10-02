'use client';

import { useRef, useState } from 'react';
import { ImagePlus, Loader2, Replace, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { uploadImage } from '@/lib/client-api';
import { cn } from '@/lib/format';

export const MAX_IMAGE_MB = 8;

export function validateImage(file: File) {
  if (!/^image\/(jpeg|png|webp|gif|avif)$/.test(file.type)) return 'Use a JPG, PNG, WebP, GIF or AVIF image.';
  if (file.size > MAX_IMAGE_MB * 1024 * 1024) return `That image is larger than ${MAX_IMAGE_MB} MB. Try a smaller one.`;
  return null;
}

/** Cover image well at the top of the editor. Click, tap or drop an image. */
export function CoverPicker({ value, alt, onChange, onAltChange }: { value: string | null; alt: string; onChange: (url: string | null) => void; onAltChange: (alt: string) => void }) {
  const input = useRef<HTMLInputElement>(null);
  const [pct, setPct] = useState<number | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [over, setOver] = useState(false);

  async function handle(file?: File | null) {
    if (!file) return;
    const problem = validateImage(file);
    if (problem) return toast.error(problem);
    const local = URL.createObjectURL(file);
    setPreview(local);
    setPct(0);
    try {
      const media = await uploadImage(file, setPct);
      onChange(media.url);
    } catch (e: any) {
      toast.error(e.message || 'Upload failed.');
    } finally {
      setPct(null);
      setPreview(null);
      URL.revokeObjectURL(local);
    }
  }

  const shown = preview || value;

  return (
    <div className="mx-auto w-full max-w-[1100px] md:px-8">
      <input ref={input} type="file" accept="image/jpeg,image/png,image/webp,image/gif,image/avif" className="hidden" onChange={(e) => (handle(e.target.files?.[0]), (e.target.value = ''))} />
      {shown ? (
        <div className="group relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={shown} alt={alt} className={cn('aspect-[16/10] w-full bg-mist object-cover md:rounded-[var(--radius-xl)]', pct !== null && 'opacity-70')} />
          {pct !== null && (
            <div className="absolute inset-0 grid place-items-center">
              <span className="flex items-center gap-2 rounded-full bg-ink/80 px-4 py-2 text-sm text-white backdrop-blur">
                <Loader2 className="size-4 animate-spin" /> Uploading {pct}%
              </span>
            </div>
          )}
          {pct === null && (
            <div className="absolute bottom-3 right-3 flex gap-2 md:opacity-0 md:transition-opacity md:group-focus-within:opacity-100 md:group-hover:opacity-100">
              <button type="button" className="btn btn-sm bg-white/90 text-ink shadow-[var(--shadow-lift)] backdrop-blur hover:bg-white" onClick={() => input.current?.click()}>
                <Replace className="size-4" /> Change
              </button>
              <button type="button" className="btn btn-sm btn-icon bg-white/90 text-danger shadow-[var(--shadow-lift)] backdrop-blur hover:bg-white" aria-label="Remove cover image" onClick={() => onChange(null)}>
                <Trash2 className="size-4" />
              </button>
            </div>
          )}
          {value && pct === null && (
            <input
              value={alt}
              onChange={(e) => onAltChange(e.target.value)}
              placeholder="Describe the cover image (helps screen readers and search)"
              aria-label="Cover image description"
              className="mt-2 w-full bg-transparent px-5 text-center text-[0.82rem] text-ink-faint outline-none placeholder:text-ink-faint/60 md:px-0"
            />
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => input.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setOver(true);
          }}
          onDragLeave={() => setOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setOver(false);
            handle(e.dataTransfer.files?.[0]);
          }}
          className={cn(
            'flex h-[132px] w-full flex-col items-center justify-center gap-2 bg-mist text-ink-soft transition-colors md:h-[180px] md:rounded-[var(--radius-xl)]',
            over ? 'bg-mist-deep text-iris' : 'hover:bg-mist-deep hover:text-iris',
          )}
        >
          <ImagePlus className="size-7" strokeWidth={1.7} />
          <span className="text-[0.95rem] font-[600]">Add a cover image</span>
          <span className="text-[0.8rem] text-ink-faint">Tap to choose, or drop an image here</span>
        </button>
      )}
    </div>
  );
}
