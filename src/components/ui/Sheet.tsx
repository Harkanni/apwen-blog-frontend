'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';
import { Drawer } from 'vaul';
import { AnimatePresence, motion } from 'motion/react';
import { X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/format';

export function useMediaQuery(query: string) {
  return useSyncExternalStore(
    (cb) => {
      const m = window.matchMedia(query);
      m.addEventListener('change', cb);
      return () => m.removeEventListener('change', cb);
    },
    () => window.matchMedia(query).matches,
    () => false,
  );
}

export const useIsDesktop = () => useMediaQuery('(min-width: 768px)');

type SheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  /** Desktop presentation. Phones always get a bottom sheet. */
  variant?: 'center' | 'side';
  className?: string;
};

/**
 * One component for every overlay in the studio: a native-feeling, draggable
 * bottom sheet on phones, a centred dialog or side panel on larger screens.
 */
export function Sheet({ open, onOpenChange, title, description, children, footer, variant = 'center', className }: SheetProps) {
  const desktop = useIsDesktop();

  if (!desktop || variant === 'side') {
    const side = desktop && variant === 'side';
    return (
      <Drawer.Root open={open} onOpenChange={onOpenChange} direction={side ? 'right' : 'bottom'} repositionInputs={false}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 z-50 bg-ink/35 backdrop-blur-[2px]" />
          <Drawer.Content
            className={cn(
              'fixed z-50 flex flex-col bg-white outline-none',
              side
                ? 'inset-y-2 right-2 w-[420px] rounded-[var(--radius-lg)] shadow-[var(--shadow-float)]'
                : 'inset-x-0 bottom-0 max-h-[92dvh] rounded-t-[28px]',
              className,
            )}
            aria-describedby={description ? undefined : undefined}
          >
            {!side && <div className="mx-auto mt-2.5 h-1.5 w-11 shrink-0 rounded-full bg-ink/12" aria-hidden />}
            <div className="flex items-start justify-between gap-3 px-5 pb-2 pt-4 md:px-6 md:pt-5">
              <div>
                <Drawer.Title className="text-[1.2rem] font-[680] tracking-[-0.02em]">{title}</Drawer.Title>
                {description ? (
                  <Drawer.Description className="mt-1 text-[0.92rem] text-ink-soft">{description}</Drawer.Description>
                ) : (
                  <Drawer.Description className="sr-only">{title}</Drawer.Description>
                )}
              </div>
              <button className="btn btn-ghost btn-icon btn-sm -mr-1.5 shrink-0" onClick={() => onOpenChange(false)} aria-label="Close">
                <X className="size-5" />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-4 md:px-6">{children}</div>
            {footer && <div className="shrink-0 px-5 pb-[calc(env(safe-area-inset-bottom)+16px)] pt-3 md:px-6 md:pb-5">{footer}</div>}
            {!footer && <div className="h-[env(safe-area-inset-bottom)] shrink-0" />}
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    );
  }

  return <CenterDialog open={open} onOpenChange={onOpenChange} title={title} description={description} footer={footer} className={className}>{children}</CenterDialog>;
}

function CenterDialog({ open, onOpenChange, title, description, children, footer, className }: Omit<SheetProps, 'variant'>) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onOpenChange(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onOpenChange]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 grid place-items-center bg-ink/35 p-6 backdrop-blur-[2px]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.16 }}
          onMouseDown={(e) => e.target === e.currentTarget && onOpenChange(false)}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            className={cn('flex max-h-[86dvh] w-full max-w-[460px] flex-col rounded-[var(--radius-lg)] bg-white shadow-[var(--shadow-float)]', className)}
            initial={{ opacity: 0, y: 12, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 460, damping: 34 }}
          >
            <div className="flex items-start justify-between gap-3 px-6 pb-2 pt-5">
              <div>
                <h2 className="text-[1.2rem] font-[680] tracking-[-0.02em]">{title}</h2>
                {description && <p className="mt-1 text-[0.92rem] text-ink-soft">{description}</p>}
              </div>
              <button className="btn btn-ghost btn-icon btn-sm -mr-1.5" onClick={() => onOpenChange(false)} aria-label="Close">
                <X className="size-5" />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-4">{children}</div>
            {footer && <div className="px-6 pb-5 pt-2">{footer}</div>}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function Confirm({
  open,
  onOpenChange,
  title,
  body,
  confirmLabel,
  danger,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title: string;
  body: string;
  confirmLabel: string;
  danger?: boolean;
  onConfirm: () => Promise<void> | void;
}) {
  const [busy, setBusy] = useState(false);
  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={body}
      footer={
        <div className="flex flex-col-reverse gap-2 md:flex-row md:justify-end">
          <button className="btn btn-soft" onClick={() => onOpenChange(false)}>
            Cancel
          </button>
          <button
            className={cn('btn', danger ? 'btn-danger' : 'btn-primary')}
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              try {
                await onConfirm();
                onOpenChange(false);
              } finally {
                setBusy(false);
              }
            }}
          >
            {busy && <Loader2 className="size-4 animate-spin" />} {confirmLabel}
          </button>
        </div>
      }
    >
      <span />
    </Sheet>
  );
}

export function Switch({ checked, onChange, label, hint }: { checked: boolean; onChange: (v: boolean) => void; label: string; hint?: string }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4 rounded-[var(--radius-md)] bg-mist px-4 py-3.5">
      <span>
        <span className="block font-[600] text-ink">{label}</span>
        {hint && <span className="mt-0.5 block text-[0.85rem] text-ink-soft">{hint}</span>}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn('relative h-[30px] w-[50px] shrink-0 rounded-full transition-colors duration-200', checked ? 'bg-iris' : 'bg-ink/15')}
      >
        <span
          className={cn(
            'absolute left-[3px] top-[3px] size-6 rounded-full bg-white shadow-[0_2px_6px_rgb(30_15_46/0.25)] transition-transform duration-300 ease-[var(--ease-spring)]',
            checked && 'translate-x-5',
          )}
        />
      </button>
    </label>
  );
}

export function StatePill({ state }: { state: 'draft' | 'published' | 'scheduled' | 'trash' }) {
  const map = {
    draft: ['Draft', 'bg-ink/8 text-ink-soft'],
    published: ['Published', 'bg-success-soft text-success'],
    scheduled: ['Scheduled', 'bg-gold-soft text-[#9a5f0c]'],
    trash: ['In trash', 'bg-danger-soft text-danger'],
  } as const;
  const [label, cls] = map[state];
  return <span className={cn('inline-flex h-6 items-center rounded-full px-2.5 text-[0.75rem] font-[650]', cls)}>{label}</span>;
}
