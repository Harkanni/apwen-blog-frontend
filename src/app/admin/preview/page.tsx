'use client';

import { useEffect, useState } from 'react';
import { StoryView } from '@/components/site/StoryView';
import { Logo } from '@/components/site/Logo';
import type { PreviewData } from '@/components/admin/editor/PreviewOverlay';

/** Rendered inside the studio's preview iframe. Receives the draft via postMessage. */
export default function PreviewPage() {
  const [post, setPost] = useState<PreviewData | null>(null);

  useEffect(() => {
    const onMsg = (e: MessageEvent) => {
      if (e.origin !== window.location.origin || e.data?.type !== 'apwen-preview') return;
      setPost(e.data.post);
    };
    window.addEventListener('message', onMsg);
    window.parent?.postMessage({ type: 'apwen-preview-ready' }, window.location.origin);
    return () => window.removeEventListener('message', onMsg);
  }, []);

  if (!post) return <div className="grid min-h-dvh place-items-center text-ink-faint">Loading preview…</div>;

  return (
    <div className="pb-24">
      <div className="wrap flex h-16 items-center">
        <Logo href="#" />
      </div>
      <StoryView post={post} preview />
    </div>
  );
}
