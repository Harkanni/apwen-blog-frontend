import Link from 'next/link';
import { Mark } from '@/components/site/Logo';

export default function NotFound() {
  return (
    <main className="grid min-h-dvh place-items-center px-6 text-center">
      <div>
        <Mark className="mx-auto size-14" />
        <h1 className="mt-6 text-[2.2rem] font-[720] tracking-[-0.04em]">This page isn’t here</h1>
        <p className="mx-auto mt-2 max-w-sm text-ink-soft">The story may have moved or been unpublished. The latest stories are one tap away.</p>
        <Link href="/" className="btn btn-primary mt-8">
          Go to latest stories
        </Link>
      </div>
    </main>
  );
}
