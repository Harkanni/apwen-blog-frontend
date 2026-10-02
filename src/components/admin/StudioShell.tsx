'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'motion/react';
import { FileText, Image as ImageIcon, Settings, PenLine, ExternalLink, LogOut } from 'lucide-react';
import { useStudio } from './AuthGate';
import { Logo } from '@/components/site/Logo';
import { cn } from '@/lib/format';

const NAV = [
  { href: '/admin', label: 'Stories', icon: FileText },
  { href: '/admin/media', label: 'Images', icon: ImageIcon },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
];

export function StudioShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, signOut } = useStudio();
  const isActive = (href: string) => (href === '/admin' ? pathname === '/admin' : pathname.startsWith(href));

  return (
    <div className="min-h-dvh md:grid md:grid-cols-[248px_1fr]">
      {/* Desktop rail */}
      <aside className="sticky top-0 hidden h-dvh flex-col bg-mist px-4 py-5 md:flex">
        <Logo label="Studio" href="/admin" className="px-2" />
        <Link href="/admin/write/new" className="btn btn-primary mt-7 w-full">
          <PenLine className="size-[18px]" /> New story
        </Link>
        <nav className="mt-6 space-y-1" aria-label="Studio">
          {NAV.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              aria-current={isActive(href) ? 'page' : undefined}
              className={cn(
                'relative flex h-11 items-center gap-3 rounded-full px-4 text-[0.95rem] font-[580] transition-colors',
                isActive(href) ? 'text-iris-deep' : 'text-ink-soft hover:bg-white/70 hover:text-ink',
              )}
            >
              {isActive(href) && (
                <motion.span layoutId="rail-active" className="absolute inset-0 rounded-full bg-white shadow-[var(--shadow-lift)]" transition={{ type: 'spring', stiffness: 500, damping: 38 }} />
              )}
              <Icon className="relative size-[19px]" />
              <span className="relative">{label}</span>
            </Link>
          ))}
        </nav>
        <div className="mt-auto space-y-1">
          <a href="/" target="_blank" className="flex h-10 items-center gap-3 rounded-full px-4 text-[0.9rem] text-ink-soft hover:bg-white/70 hover:text-ink">
            <ExternalLink className="size-[18px]" /> View blog
          </a>
          <button onClick={signOut} className="flex h-10 w-full items-center gap-3 rounded-full px-4 text-[0.9rem] text-ink-soft hover:bg-white/70 hover:text-ink">
            <LogOut className="size-[18px]" /> Sign out
          </button>
          <p className="truncate px-4 pt-2 text-[0.8rem] text-ink-faint">Signed in as {user.name}</p>
        </div>
      </aside>

      <div className="min-w-0 pb-[calc(env(safe-area-inset-bottom)+88px)] md:pb-0">{children}</div>

      {/* Phone tab bar */}
      <nav
        aria-label="Studio"
        className="fixed inset-x-0 bottom-0 z-40 bg-white/90 pb-[env(safe-area-inset-bottom)] shadow-[0_-1px_0_rgb(30_15_46/0.06)] backdrop-blur-xl md:hidden"
      >
        <div className="mx-auto grid h-[68px] max-w-md grid-cols-4 items-center px-2">
          {NAV.slice(0, 2).map((item) => (
            <TabLink key={item.href} {...item} active={isActive(item.href)} />
          ))}
          <div className="grid place-items-center">
            <Link
              href="/admin/write/new"
              aria-label="Write a new story"
              className="grid size-[52px] place-items-center rounded-[18px] bg-iris text-white shadow-[0_8px_20px_-6px_rgb(107_47_163/0.7)] transition-transform active:scale-90"
            >
              <PenLine className="size-[22px]" />
            </Link>
          </div>
          <TabLink {...NAV[2]} active={isActive(NAV[2].href)} />
        </div>
      </nav>
    </div>
  );
}

function TabLink({ href, label, icon: Icon, active }: { href: string; label: string; icon: typeof FileText; active: boolean }) {
  return (
    <Link href={href} aria-current={active ? 'page' : undefined} className="relative flex flex-col items-center gap-1 py-1.5 active:scale-95">
      <Icon className={cn('size-[22px] transition-colors', active ? 'text-iris' : 'text-ink-faint')} strokeWidth={active ? 2.3 : 2} />
      <span className={cn('text-[0.7rem] font-[600] transition-colors', active ? 'text-iris' : 'text-ink-faint')}>{label}</span>
    </Link>
  );
}
