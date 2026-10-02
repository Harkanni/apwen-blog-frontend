'use client';

import { useEffect, useState } from 'react';
import { Check, Link2, Share2 } from 'lucide-react';
import { toast } from 'sonner';
import { FacebookIcon } from './SocialIcons';
import { cn } from '@/lib/format';

/** Thin iris bar under the header that tracks how far through the story you are. */
export function ReadingProgress() {
  const [p, setP] = useState(0);
  useEffect(() => {
    const el = document.getElementById('story-body');
    const onScroll = () => {
      if (!el) return;
      const r = el.getBoundingClientRect();
      const total = r.height - window.innerHeight * 0.6;
      setP(Math.min(1, Math.max(0, -r.top / Math.max(total, 1))));
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);
  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-50 h-[3px]" aria-hidden>
      <div className="h-full origin-left bg-iris transition-transform duration-150 ease-out" style={{ transform: `scaleX(${p})` }} />
    </div>
  );
}

export function ShareActions({ title, className }: { title: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  const [canShare, setCanShare] = useState(false);
  useEffect(() => setCanShare(typeof navigator !== 'undefined' && !!navigator.share), []);

  const url = () => window.location.href.split('#')[0];

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url());
      setCopied(true);
      toast('Link copied');
      setTimeout(() => setCopied(false), 1800);
    } catch {
      toast('Couldn’t copy the link. Copy it from the address bar instead.');
    }
  };

  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      {canShare && (
        <button className="btn btn-primary" onClick={() => navigator.share({ title, url: url() }).catch(() => {})}>
          <Share2 className="size-[18px]" /> Share story
        </button>
      )}
      <button className="btn btn-soft" onClick={copy}>
        {copied ? <Check className="size-[18px]" /> : <Link2 className="size-[18px]" />} {copied ? 'Copied' : 'Copy link'}
      </button>
      <button
        className="btn btn-soft"
        onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url())}`, '_blank', 'noopener,width=600,height=520')}
      >
        <FacebookIcon className="size-[18px]" /> Facebook
      </button>
      <button
        className="btn btn-soft"
        onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(`${title} ${url()}`)}`, '_blank', 'noopener')}
      >
        WhatsApp
      </button>
    </div>
  );
}
