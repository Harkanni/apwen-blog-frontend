'use client';

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { MoreHorizontal } from 'lucide-react';
import { Sheet, useIsDesktop } from './Sheet';
import { cn } from '@/lib/format';

export type MenuItem = { label: string; icon?: React.ComponentType<{ className?: string }>; onSelect: () => void; danger?: boolean; hidden?: boolean };

/** "More" button: dropdown on desktop, bottom sheet with large rows on phones. */
export function ActionMenu({ items, label = 'More actions', title = 'Actions', buttonClassName }: { items: MenuItem[]; label?: string; title?: string; buttonClassName?: string }) {
  const desktop = useIsDesktop();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const visible = items.filter((i) => !i.hidden);

  useEffect(() => {
    if (!open || !desktop) return;
    const close = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', esc);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', esc);
    };
  }, [open, desktop]);

  const run = (item: MenuItem) => {
    setOpen(false);
    // Let the sheet close before navigating or opening another overlay.
    setTimeout(item.onSelect, desktop ? 0 : 180);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        className={cn('btn btn-ghost btn-icon btn-sm', buttonClassName)}
      >
        <MoreHorizontal className="size-5" />
      </button>

      {desktop ? (
        <AnimatePresence>
          {open && (
            <motion.div
              role="menu"
              className="absolute right-0 top-full z-30 mt-1.5 min-w-[210px] origin-top-right rounded-[var(--radius-md)] bg-white p-1.5 shadow-[var(--shadow-float)]"
              initial={{ opacity: 0, scale: 0.95, y: -4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: -2 }}
              transition={{ duration: 0.14 }}
            >
              {visible.map((item) => (
                <button
                  key={item.label}
                  role="menuitem"
                  onClick={(e) => {
                    e.stopPropagation();
                    run(item);
                  }}
                  className={cn(
                    'flex h-10 w-full items-center gap-3 rounded-[10px] px-3 text-left text-[0.92rem] font-[550]',
                    item.danger ? 'text-danger hover:bg-danger-soft' : 'text-ink hover:bg-mist',
                  )}
                >
                  {item.icon && <item.icon className="size-[18px] opacity-80" />}
                  {item.label}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      ) : (
        <Sheet open={open} onOpenChange={setOpen} title={title}>
          <div className="space-y-1 pb-2">
            {visible.map((item) => (
              <button
                key={item.label}
                onClick={() => run(item)}
                className={cn(
                  'flex h-14 w-full items-center gap-4 rounded-[var(--radius-md)] px-4 text-left text-[1.02rem] font-[580] active:scale-[0.99]',
                  item.danger ? 'text-danger active:bg-danger-soft' : 'text-ink active:bg-mist',
                )}
              >
                {item.icon && <item.icon className="size-[21px] opacity-80" />}
                {item.label}
              </button>
            ))}
          </div>
        </Sheet>
      )}
    </div>
  );
}
