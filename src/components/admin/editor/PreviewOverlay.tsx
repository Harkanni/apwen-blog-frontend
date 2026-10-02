'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'motion/react';
import { Monitor, Smartphone, X } from 'lucide-react';
import type { Post } from '@/lib/types';
import { cn } from '@/lib/format';
import { useIsDesktop } from '@/components/ui/Sheet';

export type PreviewData = Pick<Post, 'title' | 'subtitle' | 'category' | 'cover_image' | 'cover_alt' | 'content' | 'reading_minutes' | 'published_at' | 'author_name' | 'tags'>;

/**
 * Full-screen preview. The story renders inside an iframe (/admin/preview) so
 * phone and desktop widths trigger the real responsive layout, exactly as readers see it.
 */
export function PreviewOverlay({ open, onClose, data }: { open: boolean; onClose: () => void; data: PreviewData }) {
  const desktop = useIsDesktop();
  const [device, setDevice] = useState<'phone' | 'desktop'>('phone');
  const frame = useRef<HTMLIFrameElement>(null);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  useEffect(() => setDevice(desktop ? 'desktop' : 'phone'), [desktop, open]);

  // Send the latest content whenever the frame asks for it or the data changes.
  useEffect(() => {
    if (!open) return;
    const send = () => frame.current?.contentWindow?.postMessage({ type: 'apwen-preview', post: data }, window.location.origin);
    const onMsg = (e: MessageEvent) => e.origin === window.location.origin && e.data?.type === 'apwen-preview-ready' && send();
    window.addEventListener('message', onMsg);
    send();
    return () => window.removeEventListener('message', onMsg);
  }, [open, data]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    document.documentElement.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.documentElement.style.overflow = '';
    };
  }, [open, onClose]);

  if (!mounted) return null;
  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[70] flex flex-col bg-mist-deep"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="flex h-[60px] shrink-0 items-center justify-between gap-3 bg-white px-3 pt-[env(safe-area-inset-top)] shadow-[0_1px_0_rgb(30_15_46/0.06)] md:px-5">
            <p className="pl-1 text-[0.95rem] font-[650]">Preview</p>
            {desktop && (
              <div className="flex gap-1 rounded-full bg-mist p-1" role="radiogroup" aria-label="Device">
                {(
                  [
                    ['phone', 'Phone', Smartphone],
                    ['desktop', 'Desktop', Monitor],
                  ] as const
                ).map(([key, label, Icon]) => (
                  <button
                    key={key}
                    role="radio"
                    aria-checked={device === key}
                    onClick={() => setDevice(key)}
                    className={cn('relative flex h-9 items-center gap-2 rounded-full px-3.5 text-[0.88rem] font-[600]', device === key ? 'text-ink' : 'text-ink-soft')}
                  >
                    {device === key && <motion.span layoutId="device" className="absolute inset-0 rounded-full bg-white shadow-[var(--shadow-lift)]" />}
                    <Icon className="relative size-4" /> <span className="relative">{label}</span>
                  </button>
                ))}
              </div>
            )}
            <button className="btn btn-primary btn-sm" onClick={onClose}>
              <X className="size-4" /> Close preview
            </button>
          </div>
          <div className="flex min-h-0 flex-1 items-start justify-center overflow-hidden md:p-6">
            <motion.div
              layout
              transition={{ type: 'spring', stiffness: 300, damping: 34 }}
              className={cn(
                'h-full overflow-hidden bg-white',
                device === 'phone' && desktop ? 'w-[390px] max-h-[844px] rounded-[44px] shadow-[0_0_0_10px_#1e0f2e,var(--shadow-float)]' : 'w-full md:rounded-[var(--radius-lg)] md:shadow-[var(--shadow-float)]',
              )}
            >
              <iframe ref={frame} src="/admin/preview" title="Story preview" className="size-full border-0" />
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
