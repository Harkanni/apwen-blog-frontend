import Link from 'next/link';
import { ArrowLeft, ArrowRight } from 'lucide-react';

export function Pagination({ page, pages, base }: { page: number; pages: number; base: string }) {
  if (pages <= 1) return null;
  const href = (p: number) => {
    const [path, qs = ''] = base.split('?');
    const params = new URLSearchParams(qs);
    if (p > 1) params.set('page', String(p));
    else params.delete('page');
    const s = params.toString();
    return s ? `${path}?${s}` : path;
  };
  return (
    <nav className="mt-14 flex items-center justify-between gap-3" aria-label="Pages">
      {page > 1 ? (
        <Link href={href(page - 1)} className="btn btn-soft">
          <ArrowLeft className="size-4" /> Newer
        </Link>
      ) : (
        <span />
      )}
      <span className="text-sm text-ink-faint">
        Page {page} of {pages}
      </span>
      {page < pages ? (
        <Link href={href(page + 1)} className="btn btn-soft">
          Older <ArrowRight className="size-4" />
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );
}
