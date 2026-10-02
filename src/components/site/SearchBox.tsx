'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Search } from 'lucide-react';

export function SearchBox({ initial = '' }: { initial?: string }) {
  const router = useRouter();
  const [q, setQ] = useState(initial);
  return (
    <form
      role="search"
      className="mt-6 flex items-center gap-2 rounded-full bg-mist p-1.5 pl-5 focus-within:bg-white focus-within:shadow-[0_0_0_2px_var(--color-iris),0_0_0_6px_rgb(107_47_163/0.12)]"
      onSubmit={(e) => {
        e.preventDefault();
        router.push(`/search?q=${encodeURIComponent(q.trim())}`);
      }}
    >
      <Search className="size-5 shrink-0 text-iris" />
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search by title, topic or name"
        aria-label="Search stories"
        enterKeyHint="search"
        autoFocus={!initial}
        className="h-11 min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-ink-faint"
      />
      <button className="btn btn-primary btn-sm h-11">Search</button>
    </form>
  );
}
