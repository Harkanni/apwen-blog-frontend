import Link from 'next/link';
import { cn } from '@/lib/format';

/** Brand mark: an "A" drawn as a truss with a hard-hat-gold apex. Replace with
 *  the official APWEN logo (public/logo.svg) when it is available. */
export function Mark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden>
      <rect width="64" height="64" rx="16" fill="var(--color-iris)" />
      <path d="M14 48 32 14l18 34" fill="none" stroke="#fff" strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M21.5 38h21M24 34l8 4 8-4" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="32" cy="14" r="3.5" fill="var(--color-gold)" />
    </svg>
  );
}

export function Logo({ className, href = '/', label = 'Blog' }: { className?: string; href?: string; label?: string }) {
  return (
    <Link href={href} className={cn('group inline-flex items-center gap-2.5', className)} aria-label={`APWEN ${label}, home`}>
      <Mark className="size-9 transition-transform duration-300 group-hover:-rotate-6 group-active:scale-95" />
      <span className="flex items-baseline gap-1.5 leading-none">
        <span className="text-[1.15rem] font-[750] tracking-[-0.03em] text-ink">APWEN</span>
        <span className="text-[1.15rem] font-[450] tracking-[-0.02em] text-iris">{label}</span>
      </span>
    </Link>
  );
}
