'use client';

import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Check, CircleAlert, CircleCheck, Copy, ExternalLink, Loader2, Rocket, CalendarClock } from 'lucide-react';
import { toast } from 'sonner';
import { Sheet, Switch } from '@/components/ui/Sheet';
import { cn, formatDate } from '@/lib/format';

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title: string;
  hasCover: boolean;
  hasBody: boolean;
  featured: boolean;
  onFeaturedChange: (v: boolean) => void;
  onPublish: (when: string | null) => Promise<string | null>; // resolves with the public slug
};

/** Publishing flow: a short pre-flight check, now-or-later, then a clear success state. */
export function PublishSheet({ open, onOpenChange, title, hasCover, hasBody, featured, onFeaturedChange, onPublish }: Props) {
  const [mode, setMode] = useState<'now' | 'later'>('now');
  const [when, setWhen] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<null | { slug: string; scheduled: boolean }>(null);

  useEffect(() => {
    if (open) {
      setDone(null);
      setMode('now');
      const d = new Date(Date.now() + 24 * 3600 * 1000);
      d.setMinutes(0, 0, 0);
      d.setHours(9);
      setWhen(toLocalInput(d));
    }
  }, [open]);

  const checks = [
    { ok: !!title.trim(), label: title.trim() ? 'Title added' : 'Add a title', required: true },
    { ok: hasBody, label: hasBody ? 'Story has content' : 'Write some of the story first', required: true },
    { ok: hasCover, label: hasCover ? 'Cover image added' : 'No cover image (recommended for sharing)', required: false },
  ];
  const blocked = checks.some((c) => c.required && !c.ok);
  const scheduleInvalid = mode === 'later' && (!when || new Date(when).getTime() < Date.now() + 60_000);

  async function go() {
    setBusy(true);
    try {
      const at = mode === 'later' ? new Date(when).toISOString() : null;
      const slug = await onPublish(at);
      if (slug) setDone({ slug, scheduled: mode === 'later' });
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    const url = typeof window !== 'undefined' ? `${window.location.origin}/stories/${done.slug}` : '';
    return (
      <Sheet open={open} onOpenChange={onOpenChange} title={done.scheduled ? 'Scheduled' : 'Published'}>
        <div className="flex flex-col items-center pb-4 pt-2 text-center">
          <motion.div
            className="grid size-20 place-items-center rounded-full bg-success-soft text-success"
            initial={{ scale: 0.4, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 380, damping: 16 }}
          >
            {done.scheduled ? <CalendarClock className="size-9" /> : <Check className="size-10" strokeWidth={2.6} />}
          </motion.div>
          <h3 className="mt-5 text-[1.4rem] font-[700] tracking-[-0.03em]">{done.scheduled ? 'Your story is scheduled' : 'Your story is live'}</h3>
          <p className="mt-1.5 max-w-xs text-ink-soft">
            {done.scheduled ? `It will appear on the blog on ${formatDate(new Date(when).toISOString(), { dateStyle: 'full', timeStyle: 'short' })}.` : 'Share it with members on Instagram and Facebook.'}
          </p>
          <div className="mt-6 flex w-full flex-col gap-2 md:flex-row md:justify-center">
            {!done.scheduled && (
              <a href={`/stories/${done.slug}`} target="_blank" className="btn btn-primary">
                <ExternalLink className="size-[18px]" /> View story
              </a>
            )}
            <button
              className="btn btn-soft"
              onClick={() => navigator.clipboard.writeText(url).then(() => toast('Link copied'), () => toast('Couldn’t copy the link'))}
            >
              <Copy className="size-[18px]" /> Copy link
            </button>
          </div>
        </div>
      </Sheet>
    );
  }

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title="Publish story"
      description="Readers will see it on the blog."
      footer={
        <button className="btn btn-primary h-12 w-full text-base" disabled={blocked || busy || scheduleInvalid} onClick={go}>
          {busy ? <Loader2 className="size-5 animate-spin" /> : mode === 'now' ? <Rocket className="size-5" /> : <CalendarClock className="size-5" />}
          {mode === 'now' ? 'Publish now' : 'Schedule'}
        </button>
      }
    >
      <ul className="space-y-1.5 pt-1">
        {checks.map((c) => (
          <li key={c.label} className="flex items-center gap-3 text-[0.95rem]">
            {c.ok ? <CircleCheck className="size-5 shrink-0 text-success" /> : <CircleAlert className={cn('size-5 shrink-0', c.required ? 'text-danger' : 'text-[#b87412]')} />}
            <span className={cn(!c.ok && c.required ? 'text-danger' : 'text-ink-soft')}>{c.label}</span>
          </li>
        ))}
      </ul>

      <div className="mt-6 grid grid-cols-2 gap-1 rounded-full bg-mist p-1" role="radiogroup" aria-label="When to publish">
        {(['now', 'later'] as const).map((m) => (
          <button
            key={m}
            role="radio"
            aria-checked={mode === m}
            onClick={() => setMode(m)}
            className={cn('relative h-10 rounded-full text-[0.92rem] font-[600] transition-colors', mode === m ? 'text-ink' : 'text-ink-soft')}
          >
            {mode === m && <motion.span layoutId="pub-mode" className="absolute inset-0 rounded-full bg-white shadow-[var(--shadow-lift)]" transition={{ type: 'spring', stiffness: 500, damping: 38 }} />}
            <span className="relative">{m === 'now' ? 'Right now' : 'Schedule'}</span>
          </button>
        ))}
      </div>

      {mode === 'later' && (
        <div className="mt-4">
          <label htmlFor="when" className="label">
            Date and time (Lagos time)
          </label>
          <input id="when" type="datetime-local" className="field" value={when} min={toLocalInput(new Date())} onChange={(e) => setWhen(e.target.value)} />
          {scheduleInvalid && <p className="mt-1.5 text-[0.82rem] text-danger">Pick a time in the future.</p>}
        </div>
      )}

      <div className="mt-4">
        <Switch checked={featured} onChange={onFeaturedChange} label="Feature on the home page" />
      </div>
    </Sheet>
  );
}

function toLocalInput(d: Date) {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
