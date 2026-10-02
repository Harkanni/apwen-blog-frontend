'use client';

import { use, useEffect, useState } from 'react';
import { AuthGate } from '@/components/admin/AuthGate';
import { StoryEditor } from '@/components/admin/editor/StoryEditor';

export default function WritePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  // A brand-new story swaps its URL from /new to /<id> after the first save.
  // Keep the same editor mounted through that swap; remount for any other story.
  const [mountKey, setMountKey] = useState(id);
  useEffect(() => {
    if (id !== mountKey && mountKey !== 'new') setMountKey(id);
  }, [id, mountKey]);
  const initial = mountKey === 'new' ? null : Number(mountKey);

  return (
    <AuthGate>
      <StoryEditor key={mountKey} initialId={Number.isFinite(initial) ? initial : null} />
    </AuthGate>
  );
}
